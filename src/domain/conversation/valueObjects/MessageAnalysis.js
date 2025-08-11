/**
 * MessageAnalysis Value Object
 * Represents the complete analysis result of a user message
 */

const Intent = require('./Intent');

class MessageAnalysis {
  constructor(message, intent, sentiment, entities, topics, metadata = {}) {
    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }
    
    if (!(intent instanceof Intent)) {
      throw new Error('Intent must be an instance of Intent');
    }

    this.message = message;
    this.intent = intent;
    this.sentiment = this.validateSentiment(sentiment);
    this.entities = entities || {};
    this.topics = this.validateTopics(topics || []);
    this.metadata = metadata;
    this.timestamp = new Date();
    
    // Derived analysis
    this.emotionalContext = this.analyzeEmotionalContext();
    this.urgencyLevel = this.analyzeUrgency();
    this.complexity = this.analyzeComplexity();
    this.requiresContextMemory = this.determineMemoryRequirement();
    this.responseStrategy = this.determineResponseStrategy();
  }

  validateSentiment(sentiment) {
    const defaultSentiment = {
      polarity: 0,    // -1 to 1
      subjectivity: 0.5, // 0 to 1
      emotion: 'neutral',
      confidence: 0.5
    };
    
    if (!sentiment || typeof sentiment !== 'object') {
      return defaultSentiment;
    }
    
    return {
      polarity: this.clamp(sentiment.polarity || 0, -1, 1),
      subjectivity: this.clamp(sentiment.subjectivity || 0.5, 0, 1),
      emotion: sentiment.emotion || 'neutral',
      confidence: this.clamp(sentiment.confidence || 0.5, 0, 1)
    };
  }

  validateTopics(topics) {
    return topics.map(topic => {
      if (typeof topic === 'string') {
        return {
          name: topic,
          relevance: 0.5,
          category: 'general'
        };
      }
      
      return {
        name: topic.name || 'unknown',
        relevance: this.clamp(topic.relevance || 0.5, 0, 1),
        category: topic.category || 'general',
        keywords: topic.keywords || []
      };
    });
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  analyzeEmotionalContext() {
    const emotion = this.sentiment.emotion;
    const polarity = this.sentiment.polarity;
    
    // Map emotions to response adjustments
    const emotionMap = {
      'angry': { tone: 'extra_supportive', urgency: 'high', patience: 'increased' },
      'frustrated': { tone: 'extra_supportive', urgency: 'medium', patience: 'increased' },
      'excited': { tone: 'match_enthusiasm', urgency: 'normal', energy: 'elevated' },
      'worried': { tone: 'reassuring', urgency: 'medium', detail: 'comprehensive' },
      'satisfied': { tone: 'maintain_positive', urgency: 'normal', energy: 'normal' },
      'confused': { tone: 'clarifying', urgency: 'medium', detail: 'step_by_step' },
      'urgent': { tone: 'focused_efficient', urgency: 'high', speed: 'prioritize' }
    };
    
    const baseContext = emotionMap[emotion] || {
      tone: 'professional',
      urgency: 'normal',
      energy: 'normal'
    };
    
    // Adjust based on polarity
    if (polarity > 0.3) {
      baseContext.positivity = 'high';
    } else if (polarity < -0.3) {
      baseContext.positivity = 'low';
      baseContext.tone = 'extra_supportive';
    }
    
    return {
      primaryEmotion: emotion,
      polarity: polarity,
      intensity: this.calculateIntensity(),
      responseAdjustment: baseContext
    };
  }

  calculateIntensity() {
    const subjectivity = this.sentiment.subjectivity;
    const confidence = this.sentiment.confidence;
    const intensity = (subjectivity + confidence) / 2;
    
    if (intensity > 0.7) return 'high';
    if (intensity > 0.4) return 'moderate';
    return 'low';
  }

  analyzeUrgency() {
    // Start with intent priority
    let urgency = this.intent.priority;
    
    // Emotional context can escalate urgency
    if (this.emotionalContext.primaryEmotion === 'urgent') {
      urgency = 'high';
    } else if (['angry', 'frustrated', 'worried'].includes(this.emotionalContext.primaryEmotion)) {
      if (urgency === 'normal') urgency = 'medium';
      if (urgency === 'medium') urgency = 'medium-high';
    }
    
    // Temporal expressions in message
    const temporalUrgent = /\b(now|immediately|asap|urgent|emergency|right away)\b/i;
    const temporalSoon = /\b(soon|quickly|today|this morning|this afternoon)\b/i;
    
    if (temporalUrgent.test(this.message)) {
      urgency = 'high';
    } else if (temporalSoon.test(this.message)) {
      if (urgency === 'normal') urgency = 'medium';
    }
    
    return urgency;
  }

  analyzeComplexity() {
    let complexity = this.intent.complexity;
    
    // Multiple topics increase complexity
    if (this.topics.length > 2) {
      complexity = this.escalateComplexity(complexity);
    }
    
    // Rich entities increase complexity
    const entityCount = Object.keys(this.entities).length;
    if (entityCount > 3) {
      complexity = this.escalateComplexity(complexity);
    }
    
    // Long messages often indicate complexity
    if (this.message.length > 500) {
      complexity = this.escalateComplexity(complexity);
    }
    
    // Questions increase complexity
    const questionCount = (this.message.match(/\?/g) || []).length;
    if (questionCount > 1) {
      complexity = this.escalateComplexity(complexity);
    }
    
    return complexity;
  }

  escalateComplexity(current) {
    if (current === 'low') return 'medium';
    if (current === 'medium') return 'high';
    return current; // Already high
  }

  determineMemoryRequirement() {
    // Check for memory reference patterns
    const memoryPatterns = [
      /\b(remember|recall|mentioned|discussed|said|told)\b/i,
      /\b(last time|previously|before|earlier)\b/i,
      /\b(you (said|told|mentioned)|we (talked|discussed))\b/i,
      /\b(as (discussed|mentioned)|like (before|earlier))\b/i
    ];
    
    const hasMemoryReference = memoryPatterns.some(pattern => pattern.test(this.message));
    
    // Complex intents often benefit from context
    const contextBeneficialIntents = [
      'property_search', 'client_management', 'market_analysis', 'follow_up'
    ];
    
    const benefitsFromContext = contextBeneficialIntents.some(intent => 
      this.intent.primaryIntent.includes(intent)
    );
    
    // Multiple turns in conversation benefit from memory
    const conversationalIndicators = /\b(also|and|additionally|furthermore|moreover)\b/i;
    const hasConversationalIndicators = conversationalIndicators.test(this.message);
    
    return hasMemoryReference || benefitsFromContext || hasConversationalIndicators;
  }

  determineResponseStrategy() {
    const strategy = {
      type: 'informational_response',
      approach: 'direct',
      toolCoordination: 'none',
      personalityAdjustment: this.emotionalContext.responseAdjustment.tone || 'professional'
    };
    
    // Determine response type based on intent category
    const strategyMap = {
      'communication': 'conversational_response',
      'search': 'tool_coordinated_response',
      'transaction': 'guided_workflow_response',
      'analysis': 'analytical_response',
      'management': 'action_oriented_response',
      'automation': 'workflow_coordination_response',
      'support': 'supportive_response'
    };
    
    strategy.type = strategyMap[this.intent.category] || 'informational_response';
    
    // Determine approach based on complexity and urgency
    if (this.complexity === 'high' && this.urgencyLevel === 'high') {
      strategy.approach = 'prioritized_breakdown';
    } else if (this.complexity === 'high') {
      strategy.approach = 'systematic_breakdown';
    } else if (this.urgencyLevel === 'high') {
      strategy.approach = 'direct_action';
    }
    
    // Determine tool coordination
    if (this.intent.requiresTools()) {
      strategy.toolCoordination = this.complexity === 'high' ? 'parallel' : 'sequential';
    }
    
    return strategy;
  }

  // Scoring and ranking methods
  
  getOverallConfidence() {
    return (this.intent.confidence + this.sentiment.confidence) / 2;
  }

  getProcessingPriority() {
    const priorities = {
      'high': 4,
      'medium-high': 3,
      'medium': 2,
      'normal': 1,
      'low': 0
    };
    
    return priorities[this.urgencyLevel] || 1;
  }

  requiresImmedateAttention() {
    return this.urgencyLevel === 'high' || 
           this.emotionalContext.primaryEmotion === 'angry' ||
           this.intent.requiresImmediateResponse();
  }

  // Utility methods
  
  getSummary() {
    return {
      message: this.message.substring(0, 100) + (this.message.length > 100 ? '...' : ''),
      primaryIntent: this.intent.primaryIntent,
      confidence: this.getOverallConfidence(),
      emotion: this.emotionalContext.primaryEmotion,
      urgency: this.urgencyLevel,
      complexity: this.complexity,
      requiresTools: this.intent.requiresTools(),
      requiresMemory: this.requiresContextMemory,
      processingPriority: this.getProcessingPriority()
    };
  }

  toJSON() {
    return {
      message: this.message,
      intent: this.intent.toJSON(),
      sentiment: this.sentiment,
      entities: this.entities,
      topics: this.topics,
      emotionalContext: this.emotionalContext,
      urgencyLevel: this.urgencyLevel,
      complexity: this.complexity,
      requiresContextMemory: this.requiresContextMemory,
      responseStrategy: this.responseStrategy,
      metadata: this.metadata,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    const intent = Intent.fromJSON(json.intent);
    
    const analysis = new MessageAnalysis(
      json.message,
      intent,
      json.sentiment,
      json.entities,
      json.topics,
      json.metadata
    );
    
    if (json.timestamp) {
      analysis.timestamp = new Date(json.timestamp);
    }
    
    return analysis;
  }

  equals(other) {
    return other instanceof MessageAnalysis &&
           this.message === other.message &&
           this.intent.equals(other.intent) &&
           Math.abs(this.timestamp.getTime() - other.timestamp.getTime()) < 1000;
  }

  toString() {
    return `MessageAnalysis(intent=${this.intent.primaryIntent}, emotion=${this.emotionalContext.primaryEmotion}, urgency=${this.urgencyLevel})`;
  }
}

module.exports = MessageAnalysis;