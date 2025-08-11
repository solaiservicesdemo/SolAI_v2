/**
 * Conversation Aggregate Root
 * Represents a complete conversation session with proper business rules
 */

const { v4: uuidv4 } = require('uuid');

class Conversation {
  constructor(sessionId, userId = null, metadata = {}) {
    this.id = uuidv4();
    this.sessionId = sessionId;
    this.userId = userId;
    this.metadata = metadata;
    
    // Conversation state
    this.status = 'active';
    this.turns = [];
    this.context = new ConversationContext();
    this.preferences = new UserPreferences();
    
    // Analytics
    this.analytics = new ConversationAnalytics();
    
    // Timestamps
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.lastActivityAt = new Date();
    
    // Domain events
    this.domainEvents = [];
  }

  // Business Methods
  
  addTurn(userMessage, analysisResult, toolResults, assistantResponse) {
    const turn = new ConversationTurn(
      userMessage,
      analysisResult,
      toolResults,
      assistantResponse
    );
    
    this.turns.push(turn);
    this.updateContext(turn);
    this.updateAnalytics(turn);
    this.lastActivityAt = new Date();
    this.updatedAt = new Date();
    
    // Domain event
    this.addDomainEvent('ConversationTurnAdded', {
      conversationId: this.id,
      turnId: turn.id,
      intent: analysisResult?.primaryIntent,
      timestamp: turn.timestamp
    });
    
    return turn;
  }

  updatePreferences(newPreferences) {
    this.preferences.update(newPreferences);
    this.updatedAt = new Date();
    
    this.addDomainEvent('UserPreferencesUpdated', {
      conversationId: this.id,
      preferences: newPreferences,
      timestamp: new Date()
    });
  }

  updateContext(turn) {
    this.context.addTurn(turn);
    
    // Update conversation-level context
    if (turn.analysisResult) {
      this.context.setLastIntent(turn.analysisResult.primaryIntent);
      this.context.setEmotionalState(turn.analysisResult.emotionalContext);
    }
  }

  updateAnalytics(turn) {
    this.analytics.recordTurn(turn);
  }

  getRecentTurns(count = 5) {
    return this.turns.slice(-count);
  }

  getConversationSummary() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      status: this.status,
      turnCount: this.turns.length,
      duration: this.lastActivityAt - this.createdAt,
      primaryIntents: this.analytics.getTopIntents(),
      toolsUsed: this.analytics.getToolsUsed(),
      satisfactionScore: this.analytics.getSatisfactionScore()
    };
  }

  // Business Rules

  canAddTurn() {
    return this.status === 'active' && this.turns.length < 1000; // Conversation limit
  }

  shouldArchive() {
    const inactiveTime = Date.now() - this.lastActivityAt.getTime();
    const maxInactiveTime = 24 * 60 * 60 * 1000; // 24 hours
    return inactiveTime > maxInactiveTime;
  }

  isHighValue() {
    return this.analytics.getTotalToolUsage() > 5 || 
           this.analytics.getSatisfactionScore() > 0.8 ||
           this.turns.length > 20;
  }

  // Domain Events
  
  addDomainEvent(eventType, data) {
    this.domainEvents.push({
      id: uuidv4(),
      type: eventType,
      data,
      aggregateId: this.id,
      timestamp: new Date()
    });
  }

  clearDomainEvents() {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  // Persistence support
  
  toSnapshot() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      userId: this.userId,
      metadata: this.metadata,
      status: this.status,
      turns: this.turns.map(turn => turn.toSnapshot()),
      context: this.context.toSnapshot(),
      preferences: this.preferences.toSnapshot(),
      analytics: this.analytics.toSnapshot(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastActivityAt: this.lastActivityAt
    };
  }

  static fromSnapshot(snapshot) {
    const conversation = new Conversation(snapshot.sessionId, snapshot.userId, snapshot.metadata);
    conversation.id = snapshot.id;
    conversation.status = snapshot.status;
    conversation.turns = snapshot.turns.map(turnSnapshot => ConversationTurn.fromSnapshot(turnSnapshot));
    conversation.context = ConversationContext.fromSnapshot(snapshot.context);
    conversation.preferences = UserPreferences.fromSnapshot(snapshot.preferences);
    conversation.analytics = ConversationAnalytics.fromSnapshot(snapshot.analytics);
    conversation.createdAt = new Date(snapshot.createdAt);
    conversation.updatedAt = new Date(snapshot.updatedAt);
    conversation.lastActivityAt = new Date(snapshot.lastActivityAt);
    return conversation;
  }
}

class ConversationTurn {
  constructor(userMessage, analysisResult, toolResults, assistantResponse) {
    this.id = uuidv4();
    this.userMessage = userMessage;
    this.analysisResult = analysisResult;
    this.toolResults = toolResults;
    this.assistantResponse = assistantResponse;
    this.timestamp = new Date();
    this.processingTime = 0;
  }

  toSnapshot() {
    return {
      id: this.id,
      userMessage: this.userMessage,
      analysisResult: this.analysisResult,
      toolResults: this.toolResults,
      assistantResponse: this.assistantResponse,
      timestamp: this.timestamp,
      processingTime: this.processingTime
    };
  }

  static fromSnapshot(snapshot) {
    const turn = new ConversationTurn(
      snapshot.userMessage,
      snapshot.analysisResult,
      snapshot.toolResults,
      snapshot.assistantResponse
    );
    turn.id = snapshot.id;
    turn.timestamp = new Date(snapshot.timestamp);
    turn.processingTime = snapshot.processingTime;
    return turn;
  }
}

class ConversationContext {
  constructor() {
    this.lastIntent = null;
    this.emotionalState = { tone: 'neutral', intensity: 'normal' };
    this.activeTopics = [];
    this.conversationPhase = 'initial';
    this.clientContext = {}; // Real estate specific context
    this.temporalContext = {}; // Time-based context
  }

  addTurn(turn) {
    // Update active topics based on intent and content
    if (turn.analysisResult?.topics) {
      this.updateActiveTopics(turn.analysisResult.topics);
    }
    
    // Update conversation phase
    this.updatePhase(turn);
    
    // Extract client context for real estate scenarios
    this.updateClientContext(turn);
  }

  updateActiveTopics(topics) {
    // Add new topics and decay old ones
    topics.forEach(topic => {
      const existing = this.activeTopics.find(t => t.name === topic.name);
      if (existing) {
        existing.relevance = Math.max(existing.relevance, topic.relevance);
        existing.lastMention = new Date();
      } else {
        this.activeTopics.push({
          ...topic,
          lastMention: new Date()
        });
      }
    });
    
    // Remove old topics (older than 30 minutes with low relevance)
    const cutoff = Date.now() - (30 * 60 * 1000);
    this.activeTopics = this.activeTopics.filter(
      topic => topic.lastMention.getTime() > cutoff || topic.relevance > 0.7
    );
  }

  updatePhase(turn) {
    const phases = ['initial', 'exploration', 'specification', 'execution', 'completion'];
    const currentIndex = phases.indexOf(this.conversationPhase);
    
    // Simple phase progression logic
    if (turn.analysisResult?.primaryIntent === 'greeting' && currentIndex === 0) {
      this.conversationPhase = 'exploration';
    } else if (turn.toolResults?.toolsUsed?.length > 0 && currentIndex < 3) {
      this.conversationPhase = 'execution';
    }
  }

  updateClientContext(turn) {
    // Extract real estate specific context
    if (turn.analysisResult?.entities) {
      const entities = turn.analysisResult.entities;
      
      if (entities.location) this.clientContext.location = entities.location;
      if (entities.budget) this.clientContext.budget = entities.budget;
      if (entities.propertyType) this.clientContext.propertyType = entities.propertyType;
      if (entities.timeline) this.clientContext.timeline = entities.timeline;
    }
  }

  setLastIntent(intent) {
    this.lastIntent = intent;
  }

  setEmotionalState(emotionalState) {
    this.emotionalState = emotionalState;
  }

  toSnapshot() {
    return {
      lastIntent: this.lastIntent,
      emotionalState: this.emotionalState,
      activeTopics: this.activeTopics,
      conversationPhase: this.conversationPhase,
      clientContext: this.clientContext,
      temporalContext: this.temporalContext
    };
  }

  static fromSnapshot(snapshot) {
    const context = new ConversationContext();
    Object.assign(context, snapshot);
    return context;
  }
}

class UserPreferences {
  constructor() {
    this.communicationStyle = 'professional'; // professional, casual, technical
    this.responseLength = 'medium'; // brief, medium, detailed
    this.questionBudget = 1; // Number of follow-up questions allowed
    this.noFollowups = false;
    this.conciseMode = false;
    this.maxSections = 3;
    this.maxBullets = 5;
    this.targetWordLimit = 200;
    this.preferredTools = [];
    this.updatedAt = new Date();
  }

  update(newPreferences) {
    Object.assign(this, newPreferences);
    this.updatedAt = new Date();
  }

  toSnapshot() {
    return { ...this };
  }

  static fromSnapshot(snapshot) {
    const preferences = new UserPreferences();
    Object.assign(preferences, snapshot);
    return preferences;
  }
}

class ConversationAnalytics {
  constructor() {
    this.intentCounts = new Map();
    this.toolUsageCounts = new Map();
    this.avgResponseTime = 0;
    this.totalTurns = 0;
    this.satisfactionScore = 0;
    this.qualityMetrics = {
      relevance: 0,
      completeness: 0,
      efficiency: 0
    };
  }

  recordTurn(turn) {
    this.totalTurns++;
    
    // Track intent frequency
    if (turn.analysisResult?.primaryIntent) {
      const intent = turn.analysisResult.primaryIntent;
      this.intentCounts.set(intent, (this.intentCounts.get(intent) || 0) + 1);
    }
    
    // Track tool usage
    if (turn.toolResults?.toolsUsed) {
      turn.toolResults.toolsUsed.forEach(tool => {
        this.toolUsageCounts.set(tool, (this.toolUsageCounts.get(tool) || 0) + 1);
      });
    }
    
    // Update response time
    if (turn.processingTime) {
      this.avgResponseTime = (this.avgResponseTime * (this.totalTurns - 1) + turn.processingTime) / this.totalTurns;
    }
  }

  getTopIntents(limit = 5) {
    return Array.from(this.intentCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([intent, count]) => ({ intent, count }));
  }

  getToolsUsed() {
    return Array.from(this.toolUsageCounts.keys());
  }

  getTotalToolUsage() {
    return Array.from(this.toolUsageCounts.values()).reduce((sum, count) => sum + count, 0);
  }

  getSatisfactionScore() {
    // Simple heuristic based on conversation metrics
    const intentDiversity = this.intentCounts.size / Math.max(this.totalTurns, 1);
    const toolEfficiency = this.getTotalToolUsage() / Math.max(this.totalTurns, 1);
    const responseSpeed = Math.max(0, 1 - (this.avgResponseTime / 5000)); // 5s baseline
    
    return (intentDiversity * 0.3 + toolEfficiency * 0.4 + responseSpeed * 0.3);
  }

  toSnapshot() {
    return {
      intentCounts: Array.from(this.intentCounts.entries()),
      toolUsageCounts: Array.from(this.toolUsageCounts.entries()),
      avgResponseTime: this.avgResponseTime,
      totalTurns: this.totalTurns,
      satisfactionScore: this.satisfactionScore,
      qualityMetrics: this.qualityMetrics
    };
  }

  static fromSnapshot(snapshot) {
    const analytics = new ConversationAnalytics();
    analytics.intentCounts = new Map(snapshot.intentCounts || []);
    analytics.toolUsageCounts = new Map(snapshot.toolUsageCounts || []);
    analytics.avgResponseTime = snapshot.avgResponseTime || 0;
    analytics.totalTurns = snapshot.totalTurns || 0;
    analytics.satisfactionScore = snapshot.satisfactionScore || 0;
    analytics.qualityMetrics = snapshot.qualityMetrics || analytics.qualityMetrics;
    return analytics;
  }
}

module.exports = {
  Conversation,
  ConversationTurn,
  ConversationContext,
  UserPreferences,
  ConversationAnalytics
};