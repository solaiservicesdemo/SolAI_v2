/**
 * Conversation Analytics and Learning Service
 * Enterprise-grade analytics, learning, and continuous improvement system
 */

const Logger = require('../../../core/logger');
const { v4: uuidv4 } = require('uuid');

class ConversationAnalyticsService {
  constructor() {
    this.logger = new Logger('ConversationAnalyticsService');
    this.initialized = false;
    
    // Analytics storage
    this.conversationMetrics = new Map();
    this.performanceMetrics = new Map();
    this.learningData = new Map();
    
    // Real-time analytics
    this.realtimeMetrics = {
      activeConversations: 0,
      avgResponseTime: 0,
      successfulInteractions: 0,
      totalInteractions: 0,
      intentAccuracy: 0,
      toolEffectiveness: new Map(),
      userSatisfactionScore: 0
    };
    
    // Learning algorithms
    this.learningEngines = {
      intentImprovement: new IntentLearningEngine(),
      responseOptimization: new ResponseOptimizationEngine(),
      flowOptimization: new FlowOptimizationEngine(),
      personalityAdaptation: new PersonalityLearningEngine()
    };
    
    // Performance baselines and targets
    this.performanceBaselines = {
      responseTime: { target: 3000, baseline: 5000 }, // milliseconds
      intentAccuracy: { target: 0.90, baseline: 0.75 },
      userSatisfaction: { target: 0.85, baseline: 0.70 },
      taskCompletion: { target: 0.80, baseline: 0.60 },
      toolEfficiency: { target: 0.85, baseline: 0.70 }
    };
    
    // Anomaly detection
    this.anomalyDetector = new ConversationAnomalyDetector();
    
    // Reporting intervals
    this.reportingIntervals = {
      realtime: 30000,      // 30 seconds
      hourly: 3600000,      // 1 hour  
      daily: 86400000,      // 24 hours
      weekly: 604800000     // 7 days
    };
    
    this.setupAnalyticsFramework();
  }

  async initialize() {
    this.logger.info('📊 Initializing conversation analytics service...');
    
    try {
      await this.initializeLearningEngines();
      await this.setupPerformanceMonitoring();
      await this.initializeAnomalyDetection();
      await this.startReportingSchedules();
      
      this.initialized = true;
      this.logger.info('✅ Conversation analytics service initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize conversation analytics service', error);
      throw error;
    }
  }

  setupAnalyticsFramework() {
    // Conversation quality metrics
    this.qualityMetrics = {
      relevance: new QualityMetric('relevance', 0.8),
      completeness: new QualityMetric('completeness', 0.75),
      efficiency: new QualityMetric('efficiency', 0.70),
      accuracy: new QualityMetric('accuracy', 0.85),
      helpfulness: new QualityMetric('helpfulness', 0.80)
    };
    
    // Business impact metrics
    this.businessMetrics = {
      leadGeneration: new BusinessMetric('leadGeneration', 'count'),
      clientOnboarding: new BusinessMetric('clientOnboarding', 'success_rate'),
      propertyMatches: new BusinessMetric('propertyMatches', 'relevance_score'),
      taskAutomation: new BusinessMetric('taskAutomation', 'efficiency_gain'),
      timeToResolution: new BusinessMetric('timeToResolution', 'duration')
    };
    
    // User experience metrics
    this.uxMetrics = {
      conversationFlow: new UXMetric('conversationFlow', 'smoothness'),
      responseRelevance: new UXMetric('responseRelevance', 'accuracy'),
      toolIntegration: new UXMetric('toolIntegration', 'seamlessness'),
      personalityFit: new UXMetric('personalityFit', 'alignment'),
      overallSatisfaction: new UXMetric('overallSatisfaction', 'rating')
    };
  }

  async recordConversationTurn(sessionId, turnData, analysisResult, toolResults, response) {
    try {
      const turnMetrics = {
        id: uuidv4(),
        sessionId,
        timestamp: new Date(),
        
        // Input analysis
        userMessage: turnData.userMessage,
        messageLength: turnData.userMessage?.length || 0,
        intentClassification: analysisResult?.intent,
        sentimentAnalysis: analysisResult?.sentiment,
        entities: analysisResult?.intent?.entities || {},
        
        // Processing metrics
        analysisTime: analysisResult?.processingTime || 0,
        toolExecutionTime: toolResults?.executionTime || 0,
        responseGenerationTime: response?.processingTime || 0,
        totalProcessingTime: 0,
        
        // Tool usage
        toolsUsed: toolResults?.toolsUsed || [],
        toolEffectiveness: this.calculateToolEffectiveness(toolResults),
        toolCoordination: toolResults?.coordinationType || 'none',
        
        // Response quality
        responseLength: response?.content?.length || 0,
        responseRelevance: this.assessResponseRelevance(turnData, response),
        responseCompleteness: this.assessResponseCompleteness(analysisResult, response),
        
        // User feedback indicators
        followUpQuestions: this.detectFollowUpQuestions(response?.content),
        userSatisfactionIndicators: this.detectSatisfactionIndicators(turnData.userMessage),
        
        // Performance indicators
        intentConfidence: analysisResult?.intent?.confidence || 0,
        responseConfidence: response?.confidence || 0
      };
      
      turnMetrics.totalProcessingTime = 
        turnMetrics.analysisTime + 
        turnMetrics.toolExecutionTime + 
        turnMetrics.responseGenerationTime;
      
      // Store turn metrics
      if (!this.conversationMetrics.has(sessionId)) {
        this.conversationMetrics.set(sessionId, {
          sessionId,
          turns: [],
          sessionMetrics: {},
          startTime: new Date(),
          lastActivity: new Date()
        });
      }
      
      const sessionData = this.conversationMetrics.get(sessionId);
      sessionData.turns.push(turnMetrics);
      sessionData.lastActivity = new Date();
      
      // Update real-time metrics
      this.updateRealtimeMetrics(turnMetrics);
      
      // Feed learning engines
      await this.feedLearningEngines(turnMetrics, analysisResult, response);
      
      // Check for anomalies
      const anomalies = await this.anomalyDetector.detectAnomalies(turnMetrics);
      if (anomalies.length > 0) {
        this.logger.warn('Conversation anomalies detected', { anomalies, sessionId });
      }
      
      // Update session-level metrics
      this.updateSessionMetrics(sessionId);
      
      this.logger.debug('Conversation turn recorded', {
        sessionId: sessionId.substring(0, 8),
        processingTime: turnMetrics.totalProcessingTime,
        intentAccuracy: turnMetrics.intentConfidence,
        toolsUsed: turnMetrics.toolsUsed.length
      });
      
    } catch (error) {
      this.logger.error('❌ Failed to record conversation turn', error);
    }
  }

  calculateToolEffectiveness(toolResults) {
    if (!toolResults?.toolsUsed?.length) {
      return 0;
    }
    
    // Basic effectiveness calculation based on success and relevance
    const baseScore = toolResults.results ? 0.7 : 0.3;
    const coordinationBonus = toolResults.coordinationType === 'parallel' ? 0.1 : 0.05;
    const timelyBonus = toolResults.executionTime < 5000 ? 0.1 : 0;
    
    return Math.min(baseScore + coordinationBonus + timelyBonus, 1.0);
  }

  assessResponseRelevance(turnData, response) {
    // Simple relevance assessment based on keyword overlap and length appropriateness
    const userWords = (turnData.userMessage || '').toLowerCase().split(/\s+/);
    const responseWords = (response?.content || '').toLowerCase().split(/\s+/);
    
    const commonWords = userWords.filter(word => 
      word.length > 3 && responseWords.includes(word)
    );
    
    const keywordRelevance = commonWords.length / Math.max(userWords.length, 1);
    const lengthAppropriate = response?.content?.length > 50 && response?.content?.length < 2000;
    
    return Math.min(keywordRelevance * 0.7 + (lengthAppropriate ? 0.3 : 0.1), 1.0);
  }

  assessResponseCompleteness(analysisResult, response) {
    // Assess if response addresses the user's intent and entities
    let completeness = 0.5; // Base completeness
    
    // Intent addressing
    const intent = analysisResult?.intent?.primaryIntent;
    if (intent && response?.content) {
      const responseContent = response.content.toLowerCase();
      
      // Check if response mentions key intent-related terms
      if (intent.includes('search') && responseContent.includes('search')) completeness += 0.2;
      if (intent.includes('property') && responseContent.includes('property')) completeness += 0.2;
      if (intent.includes('client') && responseContent.includes('client')) completeness += 0.2;
    }
    
    // Entity addressing
    const entities = analysisResult?.intent?.entities || {};
    const entityKeys = Object.keys(entities);
    
    if (entityKeys.length > 0) {
      const entitiesAddressed = entityKeys.filter(entity => 
        response?.content?.toLowerCase().includes(entity.toLowerCase())
      );
      completeness += (entitiesAddressed.length / entityKeys.length) * 0.3;
    }
    
    return Math.min(completeness, 1.0);
  }

  detectFollowUpQuestions(responseContent) {
    if (!responseContent) return 0;
    
    const questionMarkers = responseContent.match(/\?/g);
    return questionMarkers ? Math.min(questionMarkers.length, 3) : 0;
  }

  detectSatisfactionIndicators(userMessage) {
    if (!userMessage) return 0.5;
    
    const positive = /\b(great|good|perfect|excellent|thanks|appreciate|helpful|amazing|love)\b/gi;
    const negative = /\b(bad|wrong|frustrated|annoying|useless|terrible|hate|disappointed)\b/gi;
    
    const positiveMatches = (userMessage.match(positive) || []).length;
    const negativeMatches = (userMessage.match(negative) || []).length;
    
    if (positiveMatches > negativeMatches) return 0.8;
    if (negativeMatches > positiveMatches) return 0.2;
    return 0.5;
  }

  updateRealtimeMetrics(turnMetrics) {
    // Update counters
    this.realtimeMetrics.totalInteractions++;
    
    // Update averages
    const total = this.realtimeMetrics.totalInteractions;
    this.realtimeMetrics.avgResponseTime = 
      (this.realtimeMetrics.avgResponseTime * (total - 1) + turnMetrics.totalProcessingTime) / total;
    
    this.realtimeMetrics.intentAccuracy = 
      (this.realtimeMetrics.intentAccuracy * (total - 1) + turnMetrics.intentConfidence) / total;
    
    this.realtimeMetrics.userSatisfactionScore = 
      (this.realtimeMetrics.userSatisfactionScore * (total - 1) + turnMetrics.userSatisfactionIndicators) / total;
    
    // Update tool effectiveness
    turnMetrics.toolsUsed.forEach(tool => {
      const currentEffectiveness = this.realtimeMetrics.toolEffectiveness.get(tool) || 0;
      const newEffectiveness = 
        (currentEffectiveness + turnMetrics.toolEffectiveness) / 2;
      this.realtimeMetrics.toolEffectiveness.set(tool, newEffectiveness);
    });
    
    // Success indicators
    if (turnMetrics.responseRelevance > 0.7 && turnMetrics.intentConfidence > 0.8) {
      this.realtimeMetrics.successfulInteractions++;
    }
  }

  updateSessionMetrics(sessionId) {
    const sessionData = this.conversationMetrics.get(sessionId);
    if (!sessionData) return;
    
    const turns = sessionData.turns;
    if (turns.length === 0) return;
    
    // Calculate session-level metrics
    sessionData.sessionMetrics = {
      totalTurns: turns.length,
      sessionDuration: sessionData.lastActivity - sessionData.startTime,
      avgProcessingTime: this.calculateAverage(turns, 'totalProcessingTime'),
      avgIntentAccuracy: this.calculateAverage(turns, 'intentConfidence'),
      avgResponseRelevance: this.calculateAverage(turns, 'responseRelevance'),
      avgResponseCompleteness: this.calculateAverage(turns, 'responseCompleteness'),
      totalToolsUsed: this.sumArrayLengths(turns, 'toolsUsed'),
      uniqueToolsUsed: this.countUniqueTools(turns),
      conversationFlow: this.assessConversationFlow(turns),
      userEngagement: this.assessUserEngagement(turns),
      problemResolution: this.assessProblemResolution(turns)
    };
  }

  calculateAverage(turns, field) {
    if (turns.length === 0) return 0;
    return turns.reduce((sum, turn) => sum + (turn[field] || 0), 0) / turns.length;
  }

  sumArrayLengths(turns, field) {
    return turns.reduce((sum, turn) => sum + (turn[field]?.length || 0), 0);
  }

  countUniqueTools(turns) {
    const tools = new Set();
    turns.forEach(turn => {
      (turn.toolsUsed || []).forEach(tool => tools.add(tool));
    });
    return tools.size;
  }

  assessConversationFlow(turns) {
    if (turns.length < 2) return 0.8; // Single turn conversations are considered smooth
    
    // Analyze turn-to-turn coherence
    let flowScore = 0;
    let validTransitions = 0;
    
    for (let i = 1; i < turns.length; i++) {
      const prevTurn = turns[i - 1];
      const currTurn = turns[i];
      
      // Check intent progression
      const intentCoherence = this.assessIntentCoherence(
        prevTurn.intentClassification, 
        currTurn.intentClassification
      );
      
      // Check response time consistency
      const responseTimeScore = this.assessResponseTimeConsistency(
        prevTurn.totalProcessingTime,
        currTurn.totalProcessingTime
      );
      
      flowScore += (intentCoherence + responseTimeScore) / 2;
      validTransitions++;
    }
    
    return validTransitions > 0 ? flowScore / validTransitions : 0.5;
  }

  assessIntentCoherence(prevIntent, currIntent) {
    if (!prevIntent || !currIntent) return 0.5;
    
    // Related intents indicate good flow
    const relatedIntents = {
      'property_search': ['property_details', 'market_analysis', 'client_management'],
      'client_management': ['property_search', 'communication_automation'],
      'market_analysis': ['property_search', 'property_valuation']
    };
    
    const prevPrimary = prevIntent.primaryIntent || '';
    const currPrimary = currIntent.primaryIntent || '';
    
    // Same category is good
    if (prevIntent.category === currIntent.category) return 0.8;
    
    // Related intents are good
    const related = relatedIntents[prevPrimary] || [];
    if (related.some(rel => currPrimary.includes(rel))) return 0.7;
    
    // Different but high confidence is acceptable
    if (currIntent.confidence > 0.8) return 0.6;
    
    return 0.4;
  }

  assessResponseTimeConsistency(prevTime, currTime) {
    const ratio = Math.min(prevTime, currTime) / Math.max(prevTime, currTime);
    return ratio; // Higher ratio means more consistent times
  }

  assessUserEngagement(turns) {
    if (turns.length === 0) return 0;
    
    const engagement = {
      messageLength: this.calculateAverage(turns, 'messageLength'),
      questionAsking: turns.filter(t => t.followUpQuestions > 0).length / turns.length,
      entityProviding: turns.filter(t => Object.keys(t.entities).length > 0).length / turns.length,
      satisfactionIndicators: this.calculateAverage(turns, 'userSatisfactionIndicators')
    };
    
    // Normalize and weight engagement factors
    const lengthScore = Math.min(engagement.messageLength / 100, 1.0) * 0.2;
    const questionScore = engagement.questionAsking * 0.3;
    const entityScore = engagement.entityProviding * 0.3;
    const satisfactionScore = engagement.satisfactionIndicators * 0.2;
    
    return lengthScore + questionScore + entityScore + satisfactionScore;
  }

  assessProblemResolution(turns) {
    if (turns.length === 0) return 0;
    
    // Look for resolution indicators in the conversation
    const toolUsageSuccess = turns.filter(t => t.toolEffectiveness > 0.7).length / turns.length;
    const highConfidenceResponses = turns.filter(t => t.responseConfidence > 0.8).length / turns.length;
    const relevantResponses = turns.filter(t => t.responseRelevance > 0.7).length / turns.length;
    
    return (toolUsageSuccess + highConfidenceResponses + relevantResponses) / 3;
  }

  async feedLearningEngines(turnMetrics, analysisResult, response) {
    try {
      // Intent improvement learning
      await this.learningEngines.intentImprovement.learn({
        userMessage: turnMetrics.userMessage,
        predictedIntent: analysisResult?.intent,
        actualOutcome: this.inferActualOutcome(turnMetrics, response),
        confidence: turnMetrics.intentConfidence,
        entities: turnMetrics.entities
      });
      
      // Response optimization learning
      await this.learningEngines.responseOptimization.learn({
        context: analysisResult,
        response: response,
        effectiveness: turnMetrics.responseRelevance,
        userFeedback: turnMetrics.userSatisfactionIndicators,
        toolResults: turnMetrics.toolsUsed
      });
      
      // Personality adaptation learning
      await this.learningEngines.personalityAdaptation.learn({
        userMessage: turnMetrics.userMessage,
        sentiment: analysisResult?.sentiment,
        personalityApplication: response?.personalityInsights,
        satisfaction: turnMetrics.userSatisfactionIndicators
      });
      
    } catch (error) {
      this.logger.error('❌ Failed to feed learning engines', error);
    }
  }

  inferActualOutcome(turnMetrics, response) {
    // Infer if the intent classification was correct based on response effectiveness
    if (turnMetrics.responseRelevance > 0.8 && turnMetrics.toolEffectiveness > 0.7) {
      return 'correct';
    } else if (turnMetrics.responseRelevance < 0.5 || turnMetrics.toolEffectiveness < 0.3) {
      return 'incorrect';
    }
    return 'uncertain';
  }

  async initializeLearningEngines() {
    for (const [name, engine] of Object.entries(this.learningEngines)) {
      await engine.initialize();
      this.logger.debug(`${name} learning engine initialized`);
    }
  }

  async setupPerformanceMonitoring() {
    // Initialize performance tracking
    setInterval(() => {
      this.generatePerformanceReport();
    }, this.reportingIntervals.hourly);
  }

  async initializeAnomalyDetection() {
    await this.anomalyDetector.initialize();
  }

  async startReportingSchedules() {
    // Real-time dashboard updates
    setInterval(() => {
      this.generateRealtimeDashboard();
    }, this.reportingIntervals.realtime);
    
    // Daily performance reports
    setInterval(() => {
      this.generateDailyReport();
    }, this.reportingIntervals.daily);
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date(),
      period: 'hourly',
      metrics: {
        conversations: {
          total: this.conversationMetrics.size,
          active: this.realtimeMetrics.activeConversations,
          avgDuration: this.calculateAverageSessionDuration(),
          completionRate: this.calculateCompletionRate()
        },
        performance: {
          avgResponseTime: this.realtimeMetrics.avgResponseTime,
          intentAccuracy: this.realtimeMetrics.intentAccuracy,
          userSatisfaction: this.realtimeMetrics.userSatisfactionScore,
          toolEffectiveness: Object.fromEntries(this.realtimeMetrics.toolEffectiveness)
        },
        quality: this.generateQualityMetrics(),
        business: this.generateBusinessMetrics(),
        learning: this.generateLearningProgress()
      }
    };
    
    this.logger.info('Performance report generated', { 
      totalConversations: report.metrics.conversations.total,
      avgResponseTime: Math.round(report.metrics.performance.avgResponseTime),
      intentAccuracy: report.metrics.performance.intentAccuracy.toFixed(3)
    });
    
    return report;
  }

  calculateAverageSessionDuration() {
    let totalDuration = 0;
    let sessions = 0;
    
    for (const sessionData of this.conversationMetrics.values()) {
      if (sessionData.sessionMetrics?.sessionDuration) {
        totalDuration += sessionData.sessionMetrics.sessionDuration;
        sessions++;
      }
    }
    
    return sessions > 0 ? totalDuration / sessions : 0;
  }

  calculateCompletionRate() {
    let completedSessions = 0;
    let totalSessions = 0;
    
    for (const sessionData of this.conversationMetrics.values()) {
      totalSessions++;
      if (sessionData.sessionMetrics?.problemResolution > 0.7) {
        completedSessions++;
      }
    }
    
    return totalSessions > 0 ? completedSessions / totalSessions : 0;
  }

  generateQualityMetrics() {
    const metrics = {};
    
    for (const [name, metric] of Object.entries(this.qualityMetrics)) {
      metrics[name] = {
        current: metric.getCurrentValue(),
        target: metric.target,
        trend: metric.getTrend(),
        status: metric.getStatus()
      };
    }
    
    return metrics;
  }

  generateBusinessMetrics() {
    const metrics = {};
    
    for (const [name, metric] of Object.entries(this.businessMetrics)) {
      metrics[name] = {
        current: metric.getCurrentValue(),
        period: 'hourly',
        trend: metric.getTrend(),
        impact: metric.calculateBusinessImpact()
      };
    }
    
    return metrics;
  }

  generateLearningProgress() {
    const progress = {};
    
    for (const [name, engine] of Object.entries(this.learningEngines)) {
      progress[name] = {
        samplesProcessed: engine.getSamplesProcessed(),
        accuracy: engine.getCurrentAccuracy(),
        confidence: engine.getConfidenceLevel(),
        lastImprovement: engine.getLastImprovementDate()
      };
    }
    
    return progress;
  }

  generateRealtimeDashboard() {
    const dashboard = {
      timestamp: new Date(),
      live: true,
      activeConversations: this.realtimeMetrics.activeConversations,
      responseTime: this.realtimeMetrics.avgResponseTime,
      intentAccuracy: this.realtimeMetrics.intentAccuracy,
      successRate: this.realtimeMetrics.totalInteractions > 0 ? 
        this.realtimeMetrics.successfulInteractions / this.realtimeMetrics.totalInteractions : 0,
      topPerformingTools: this.getTopPerformingTools(),
      recentAnomalies: this.anomalyDetector.getRecentAnomalies(),
      systemHealth: this.getSystemHealthIndicators()
    };
    
    // Emit dashboard update (in production, would use WebSocket or similar)
    this.logger.debug('Real-time dashboard updated', {
      activeConversations: dashboard.activeConversations,
      avgResponseTime: Math.round(dashboard.responseTime),
      successRate: dashboard.successRate.toFixed(3)
    });
    
    return dashboard;
  }

  getTopPerformingTools(limit = 5) {
    return Array.from(this.realtimeMetrics.toolEffectiveness.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([tool, effectiveness]) => ({ tool, effectiveness }));
  }

  getSystemHealthIndicators() {
    return {
      overallHealth: this.calculateOverallSystemHealth(),
      responseTimeHealth: this.realtimeMetrics.avgResponseTime < this.performanceBaselines.responseTime.target,
      intentAccuracyHealth: this.realtimeMetrics.intentAccuracy > this.performanceBaselines.intentAccuracy.target,
      userSatisfactionHealth: this.realtimeMetrics.userSatisfactionScore > this.performanceBaselines.userSatisfaction.target,
      learningSystemHealth: this.checkLearningSystemHealth()
    };
  }

  calculateOverallSystemHealth() {
    const indicators = this.getSystemHealthIndicators();
    if (!indicators.responseTimeHealth) return false; // Circular reference protection
    
    const healthChecks = [
      this.realtimeMetrics.avgResponseTime < this.performanceBaselines.responseTime.target,
      this.realtimeMetrics.intentAccuracy > this.performanceBaselines.intentAccuracy.target,
      this.realtimeMetrics.userSatisfactionScore > this.performanceBaselines.userSatisfaction.target
    ];
    
    return healthChecks.filter(check => check).length >= 2;
  }

  checkLearningSystemHealth() {
    return Object.values(this.learningEngines).every(engine => engine.isHealthy());
  }

  async generateDailyReport() {
    const report = {
      date: new Date().toISOString().split('T')[0],
      summary: {
        totalConversations: this.conversationMetrics.size,
        totalTurns: Array.from(this.conversationMetrics.values())
          .reduce((sum, session) => sum + session.turns.length, 0),
        avgSessionDuration: this.calculateAverageSessionDuration(),
        successfulSessions: Array.from(this.conversationMetrics.values())
          .filter(session => session.sessionMetrics?.problemResolution > 0.7).length
      },
      performance: this.generatePerformanceReport(),
      insights: await this.generateInsights(),
      recommendations: await this.generateRecommendations()
    };
    
    this.logger.info('Daily report generated', {
      totalConversations: report.summary.totalConversations,
      successfulSessions: report.summary.successfulSessions,
      avgSessionDuration: Math.round(report.summary.avgSessionDuration / 1000)
    });
    
    return report;
  }

  async generateInsights() {
    const insights = [];
    
    // Intent accuracy insights
    if (this.realtimeMetrics.intentAccuracy < this.performanceBaselines.intentAccuracy.target) {
      insights.push({
        type: 'performance_issue',
        category: 'intent_accuracy',
        message: `Intent accuracy (${this.realtimeMetrics.intentAccuracy.toFixed(2)}) is below target (${this.performanceBaselines.intentAccuracy.target})`,
        severity: 'medium',
        actionable: true
      });
    }
    
    // Response time insights
    if (this.realtimeMetrics.avgResponseTime > this.performanceBaselines.responseTime.target) {
      insights.push({
        type: 'performance_issue',
        category: 'response_time',
        message: `Average response time (${Math.round(this.realtimeMetrics.avgResponseTime)}ms) exceeds target (${this.performanceBaselines.responseTime.target}ms)`,
        severity: 'high',
        actionable: true
      });
    }
    
    // Tool effectiveness insights
    const lowPerformingTools = Array.from(this.realtimeMetrics.toolEffectiveness.entries())
      .filter(([, effectiveness]) => effectiveness < 0.6);
    
    if (lowPerformingTools.length > 0) {
      insights.push({
        type: 'tool_performance',
        category: 'tool_effectiveness',
        message: `${lowPerformingTools.length} tools showing low effectiveness`,
        details: lowPerformingTools.map(([tool, eff]) => `${tool}: ${eff.toFixed(2)}`),
        severity: 'medium',
        actionable: true
      });
    }
    
    return insights;
  }

  async generateRecommendations() {
    const recommendations = [];
    
    // Based on learning engine feedback
    for (const [engineName, engine] of Object.entries(this.learningEngines)) {
      const engineRecommendations = await engine.getRecommendations();
      recommendations.push(...engineRecommendations.map(rec => ({
        ...rec,
        source: engineName
      })));
    }
    
    // Based on performance metrics
    if (this.realtimeMetrics.avgResponseTime > this.performanceBaselines.responseTime.target) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        category: 'performance',
        title: 'Optimize Response Time',
        description: 'Consider parallelizing tool execution or caching frequent responses',
        expectedImpact: 'Reduce response time by 20-30%',
        source: 'performance_analysis'
      });
    }
    
    return recommendations;
  }

  // Public API methods
  
  getConversationAnalytics(sessionId) {
    const sessionData = this.conversationMetrics.get(sessionId);
    if (!sessionData) {
      return null;
    }
    
    return {
      sessionId,
      metrics: sessionData.sessionMetrics,
      turnCount: sessionData.turns.length,
      duration: sessionData.lastActivity - sessionData.startTime,
      qualityScore: this.calculateSessionQualityScore(sessionData),
      insights: this.generateSessionInsights(sessionData)
    };
  }

  calculateSessionQualityScore(sessionData) {
    if (!sessionData.sessionMetrics) return 0.5;
    
    const metrics = sessionData.sessionMetrics;
    const weights = {
      avgIntentAccuracy: 0.3,
      avgResponseRelevance: 0.25,
      avgResponseCompleteness: 0.2,
      conversationFlow: 0.15,
      problemResolution: 0.1
    };
    
    return Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + (metrics[metric] || 0) * weight;
    }, 0);
  }

  generateSessionInsights(sessionData) {
    const insights = [];
    const metrics = sessionData.sessionMetrics;
    
    if (metrics?.avgIntentAccuracy < 0.7) {
      insights.push({
        type: 'accuracy_issue',
        message: 'Intent classification accuracy was low in this session',
        suggestion: 'Consider providing more explicit intent signals'
      });
    }
    
    if (metrics?.conversationFlow < 0.6) {
      insights.push({
        type: 'flow_issue',
        message: 'Conversation flow was choppy',
        suggestion: 'Work on smoother transitions between topics'
      });
    }
    
    if (metrics?.problemResolution > 0.8) {
      insights.push({
        type: 'success',
        message: 'Successfully resolved user needs',
        details: `Used ${metrics.uniqueToolsUsed} different tools effectively`
      });
    }
    
    return insights;
  }

  getRealtimeMetrics() {
    return { ...this.realtimeMetrics };
  }

  getPerformanceBaselines() {
    return { ...this.performanceBaselines };
  }

  async exportAnalyticsData(timeRange, format = 'json') {
    // Export analytics data for external analysis
    const data = {
      metadata: {
        exportDate: new Date(),
        timeRange,
        format,
        version: '1.0'
      },
      conversations: Array.from(this.conversationMetrics.values()),
      realTimeMetrics: this.realtimeMetrics,
      performanceBaselines: this.performanceBaselines,
      learningProgress: this.generateLearningProgress()
    };
    
    if (format === 'csv') {
      return this.convertToCSV(data);
    }
    
    return data;
  }

  convertToCSV(data) {
    // Simple CSV conversion for session metrics
    const headers = [
      'sessionId', 'totalTurns', 'sessionDuration', 'avgProcessingTime',
      'avgIntentAccuracy', 'avgResponseRelevance', 'conversationFlow', 'problemResolution'
    ];
    
    const rows = data.conversations.map(session => [
      session.sessionId,
      session.sessionMetrics?.totalTurns || 0,
      session.sessionMetrics?.sessionDuration || 0,
      session.sessionMetrics?.avgProcessingTime || 0,
      session.sessionMetrics?.avgIntentAccuracy || 0,
      session.sessionMetrics?.avgResponseRelevance || 0,
      session.sessionMetrics?.conversationFlow || 0,
      session.sessionMetrics?.problemResolution || 0
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  getHealthStatus() {
    return {
      initialized: this.initialized,
      totalConversationsTracked: this.conversationMetrics.size,
      realTimeMetricsActive: !!this.realtimeMetrics,
      learningEnginesStatus: Object.fromEntries(
        Object.entries(this.learningEngines).map(([name, engine]) => [
          name, engine.isHealthy()
        ])
      ),
      anomalyDetectionActive: this.anomalyDetector.isActive(),
      systemHealth: this.getSystemHealthIndicators()
    };
  }
}

// Helper classes for different types of learning engines

class IntentLearningEngine {
  constructor() {
    this.samplesProcessed = 0;
    this.accuracy = 0.75;
    this.improvements = [];
  }
  
  async initialize() {
    // Initialize intent learning model
  }
  
  async learn(data) {
    this.samplesProcessed++;
    // Process learning sample
    if (data.actualOutcome === 'correct' && data.confidence > 0.8) {
      // Positive reinforcement
    } else if (data.actualOutcome === 'incorrect') {
      // Learn from mistakes
      this.improvements.push({
        message: data.userMessage,
        incorrectIntent: data.predictedIntent,
        timestamp: new Date()
      });
    }
  }
  
  getSamplesProcessed() { return this.samplesProcessed; }
  getCurrentAccuracy() { return this.accuracy; }
  getConfidenceLevel() { return 0.85; }
  getLastImprovementDate() { return new Date(); }
  isHealthy() { return this.accuracy > 0.7; }
  
  async getRecommendations() {
    const recommendations = [];
    
    if (this.improvements.length > 10) {
      recommendations.push({
        type: 'training_data',
        priority: 'medium',
        title: 'Expand Intent Training Data',
        description: 'Recent misclassifications suggest need for more training examples',
        expectedImpact: 'Improve intent accuracy by 5-10%'
      });
    }
    
    return recommendations;
  }
}

class ResponseOptimizationEngine {
  constructor() {
    this.samplesProcessed = 0;
    this.effectivenessScores = [];
  }
  
  async initialize() {}
  async learn(data) { 
    this.samplesProcessed++; 
    this.effectivenessScores.push(data.effectiveness);
  }
  getSamplesProcessed() { return this.samplesProcessed; }
  getCurrentAccuracy() { return 0.8; }
  getConfidenceLevel() { return 0.9; }
  getLastImprovementDate() { return new Date(); }
  isHealthy() { return true; }
  async getRecommendations() { return []; }
}

class FlowOptimizationEngine {
  constructor() {
    this.samplesProcessed = 0;
  }
  
  async initialize() {}
  async learn(data) { this.samplesProcessed++; }
  getSamplesProcessed() { return this.samplesProcessed; }
  getCurrentAccuracy() { return 0.75; }
  getConfidenceLevel() { return 0.8; }
  getLastImprovementDate() { return new Date(); }
  isHealthy() { return true; }
  async getRecommendations() { return []; }
}

class PersonalityLearningEngine {
  constructor() {
    this.samplesProcessed = 0;
    this.personalityScores = new Map();
  }
  
  async initialize() {}
  async learn(data) { 
    this.samplesProcessed++;
    // Learn personality preferences based on user satisfaction
  }
  getSamplesProcessed() { return this.samplesProcessed; }
  getCurrentAccuracy() { return 0.85; }
  getConfidenceLevel() { return 0.8; }
  getLastImprovementDate() { return new Date(); }
  isHealthy() { return true; }
  async getRecommendations() { return []; }
}

// Helper classes for metrics

class QualityMetric {
  constructor(name, target) {
    this.name = name;
    this.target = target;
    this.currentValue = 0;
    this.history = [];
  }
  
  getCurrentValue() { return this.currentValue; }
  getTrend() { 
    if (this.history.length < 2) return 'stable';
    const recent = this.history.slice(-5);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    return avgRecent > this.currentValue ? 'improving' : 'declining';
  }
  getStatus() {
    if (this.currentValue >= this.target) return 'excellent';
    if (this.currentValue >= this.target * 0.9) return 'good';
    if (this.currentValue >= this.target * 0.8) return 'acceptable';
    return 'needs_improvement';
  }
}

class BusinessMetric {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.currentValue = 0;
    this.history = [];
  }
  
  getCurrentValue() { return this.currentValue; }
  getTrend() { return 'stable'; }
  calculateBusinessImpact() { return 'positive'; }
}

class UXMetric {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.currentValue = 0;
  }
  
  getCurrentValue() { return this.currentValue; }
}

class ConversationAnomalyDetector {
  constructor() {
    this.anomalies = [];
    this.thresholds = {
      responseTime: 10000, // 10 seconds
      intentConfidence: 0.3, // Below 30%
      consecutiveErrors: 3
    };
  }
  
  async initialize() {}
  
  async detectAnomalies(turnMetrics) {
    const anomalies = [];
    
    // Response time anomaly
    if (turnMetrics.totalProcessingTime > this.thresholds.responseTime) {
      anomalies.push({
        type: 'response_time',
        severity: 'high',
        value: turnMetrics.totalProcessingTime,
        threshold: this.thresholds.responseTime
      });
    }
    
    // Intent confidence anomaly
    if (turnMetrics.intentConfidence < this.thresholds.intentConfidence) {
      anomalies.push({
        type: 'intent_confidence',
        severity: 'medium',
        value: turnMetrics.intentConfidence,
        threshold: this.thresholds.intentConfidence
      });
    }
    
    this.anomalies.push(...anomalies);
    return anomalies;
  }
  
  getRecentAnomalies(limit = 10) {
    return this.anomalies.slice(-limit);
  }
  
  isActive() { return true; }
}

module.exports = ConversationAnalyticsService;