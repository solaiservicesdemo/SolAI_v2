/**
 * Enterprise Conversational Intelligence Engine
 * Domain-driven, event-sourced conversation engine with semantic understanding
 */

const Logger = require('../../core/logger');
const { v4: uuidv4 } = require('uuid');

// Domain entities and value objects
const { Conversation } = require('./entities/Conversation');
const Intent = require('./valueObjects/Intent');
const MessageAnalysis = require('./valueObjects/MessageAnalysis');

// Domain services
const IntentClassificationService = require('./services/IntentClassificationService');
const SemanticMemoryService = require('./services/SemanticMemoryService');
const ConversationFlowManager = require('./services/ConversationFlowManager');
const ConversationAnalyticsService = require('./services/ConversationAnalyticsService');

class EnterpriseConversationEngine {
  constructor(memoryManager, personalityEngine, toolOrchestrator) {
    this.logger = new Logger('EnterpriseConversationEngine');
    this.initialized = false;
    
    // Legacy dependencies (for backward compatibility)
    this.memoryManager = memoryManager;
    this.personalityEngine = personalityEngine;
    this.toolOrchestrator = toolOrchestrator;
    
    // Enterprise domain services
    this.intentClassifier = new IntentClassificationService();
    this.semanticMemory = new SemanticMemoryService(memoryManager);
    this.flowManager = new ConversationFlowManager();
    this.analyticsService = new ConversationAnalyticsService();
    
    // Domain aggregates
    this.activeConversations = new Map(); // sessionId -> Conversation
    
    // Event handling
    this.eventHandlers = new Map();
    this.domainEvents = [];
    
    // Performance monitoring
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      lastErrorTime: null
    };
    
    this.setupEventHandlers();
  }

  async initialize() {
    this.logger.info('🚀 Initializing Enterprise Conversation Engine...');
    
    try {
      // Initialize domain services in dependency order
      await this.intentClassifier.initialize();
      await this.semanticMemory.initialize();
      await this.flowManager.initialize();
      await this.analyticsService.initialize();
      
      // Initialize legacy components
      if (this.personalityEngine && typeof this.personalityEngine.initialize === 'function') {
        await this.personalityEngine.initialize();
      }
      
      if (this.toolOrchestrator && typeof this.toolOrchestrator.initialize === 'function') {
        await this.toolOrchestrator.initialize();
      }
      
      this.initialized = true;
      this.logger.info('✅ Enterprise Conversation Engine initialized successfully');
      
      // Emit initialization event
      this.emitDomainEvent('ConversationEngineInitialized', {
        timestamp: new Date(),
        version: '2.0.0',
        features: [
          'semantic_intent_classification',
          'conversation_flows',
          'semantic_memory',
          'real_time_analytics',
          'domain_driven_architecture'
        ]
      });
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize Enterprise Conversation Engine', error);
      throw error;
    }
  }

  setupEventHandlers() {
    // Handle conversation events
    this.eventHandlers.set('ConversationStarted', this.handleConversationStarted.bind(this));
    this.eventHandlers.set('ConversationTurnAdded', this.handleConversationTurnAdded.bind(this));
    this.eventHandlers.set('ConversationFlowStarted', this.handleConversationFlowStarted.bind(this));
    this.eventHandlers.set('UserPreferencesUpdated', this.handleUserPreferencesUpdated.bind(this));
  }

  async processMessage(request) {
    const processingStartTime = Date.now();
    this.performanceMetrics.totalRequests++;
    
    try {
      const { message, sessionId, context = {} } = request;
      
      this.logger.conversation(sessionId, 'message-received', {
        messageLength: message.length,
        hasContext: Object.keys(context).length > 0
      });

      // 1. Get or create conversation aggregate
      const conversation = await this.getOrCreateConversation(sessionId, request.userId);
      
      // 2. Perform deep message analysis using semantic understanding
      const messageAnalysis = await this.analyzeMessage(message, conversation, context);
      
      // 3. Check for conversation flow triggers or continuations
      const flowResult = await this.processConversationFlow(sessionId, messageAnalysis);
      
      // 4. Enhance context with semantic memory
      const enhancedContext = await this.enhanceWithSemanticMemory(
        messageAnalysis, 
        conversation, 
        message
      );
      
      // 5. Determine response strategy using business rules
      const responseStrategy = this.determineResponseStrategy(
        messageAnalysis, 
        enhancedContext, 
        flowResult
      );
      
      // 6. Execute tools if needed (enterprise coordination)
      const toolResults = await this.executeToolCoordination(
        responseStrategy, 
        enhancedContext, 
        messageAnalysis
      );
      
      // 7. Generate intelligent response with personality adaptation
      const response = await this.generateIntelligentResponse(
        responseStrategy, 
        enhancedContext, 
        toolResults,
        messageAnalysis
      );
      
      // 8. Create conversation turn and update aggregate
      const conversationTurn = conversation.addTurn(
        message,
        messageAnalysis,
        toolResults,
        response.content
      );
      
      // 9. Store semantic memory and update context
      await this.updateSemanticMemory(conversation, conversationTurn, messageAnalysis);
      
      // 10. Record analytics and learning data
      await this.recordAnalytics(
        sessionId, 
        conversationTurn, 
        messageAnalysis, 
        toolResults, 
        response
      );
      
      // 11. Process domain events
      await this.processDomainEvents(conversation);
      
      const processingTime = Date.now() - processingStartTime;
      this.updatePerformanceMetrics(processingTime, true);
      
      this.logger.info('Message processed successfully', {
        sessionId: sessionId.substring(0, 8),
        intent: messageAnalysis.intent.primaryIntent,
        confidence: messageAnalysis.intent.confidence,
        processingTime,
        toolsUsed: toolResults.toolsUsed?.length || 0
      });
      
      return {
        success: true,
        content: response.content,
        sessionId,
        conversationId: conversation.id,
        
        // Enhanced metadata
        messageAnalysis: messageAnalysis.getSummary(),
        responseStrategy: responseStrategy,
        toolCoordination: toolResults.coordination,
        flowStatus: flowResult?.status,
        semanticContext: enhancedContext.memoryRetrieved,
        
        // Performance metrics
        processingTime,
        confidence: messageAnalysis.getOverallConfidence(),
        
        // Business intelligence
        conversationInsights: conversation.getConversationSummary(),
        personalityInsights: response.personalityInsights
      };
      
    } catch (error) {
      const processingTime = Date.now() - processingStartTime;
      this.updatePerformanceMetrics(processingTime, false);
      
      this.logger.error('❌ Message processing failed', error, { 
        sessionId: request.sessionId,
        processingTime
      });
      
      // Emit error event for monitoring
      this.emitDomainEvent('MessageProcessingFailed', {
        sessionId: request.sessionId,
        error: error.message,
        timestamp: new Date(),
        processingTime
      });
      
      return {
        success: false,
        error: 'Processing failed',
        content: this.generateFallbackResponse(request.message),
        sessionId: request.sessionId,
        fallback: true,
        processingTime
      };
    }
  }

  async getOrCreateConversation(sessionId, userId = null) {
    let conversation = this.activeConversations.get(sessionId);
    
    if (!conversation) {
      // Try to load from persistent storage
      const existingState = await this.memoryManager.getConversationState?.(sessionId);
      
      if (existingState && existingState.conversationSnapshot) {
        // Restore conversation from snapshot
        conversation = Conversation.fromSnapshot(existingState.conversationSnapshot);
      } else {
        // Create new conversation
        conversation = new Conversation(sessionId, userId);
        
        this.emitDomainEvent('ConversationStarted', {
          conversationId: conversation.id,
          sessionId,
          userId,
          timestamp: conversation.createdAt
        });
      }
      
      this.activeConversations.set(sessionId, conversation);
    }
    
    return conversation;
  }

  async analyzeMessage(message, conversation, context) {
    const analysisStartTime = Date.now();
    
    try {
      // 1. Classify intent using semantic analysis
      const intent = await this.intentClassifier.classifyIntent(message, {
        conversationHistory: conversation.getRecentTurns(5),
        conversationPhase: conversation.context.conversationPhase,
        recentIntents: conversation.turns.slice(-3).map(turn => 
          turn.analysisResult?.intent?.primaryIntent
        ).filter(Boolean)
      });
      
      // 2. Analyze sentiment and emotional context
      const sentiment = await this.analyzeSentiment(message);
      
      // 3. Extract and validate entities
      const entities = intent.entities;
      
      // 4. Identify topics and themes
      const topics = await this.extractTopics(message, intent, conversation.context);
      
      // 5. Create comprehensive message analysis
      const messageAnalysis = new MessageAnalysis(
        message,
        intent,
        sentiment,
        entities,
        topics,
        {
          processingTime: Date.now() - analysisStartTime,
          classificationMethod: intent.metadata?.classificationMethod,
          conversationContext: {
            turnNumber: conversation.turns.length + 1,
            conversationPhase: conversation.context.conversationPhase,
            activeTopics: conversation.context.activeTopics
          }
        }
      );
      
      this.logger.debug('Message analysis completed', {
        intent: intent.primaryIntent,
        confidence: intent.confidence,
        sentiment: sentiment.emotion,
        complexity: messageAnalysis.complexity,
        processingTime: messageAnalysis.metadata.processingTime
      });
      
      return messageAnalysis;
      
    } catch (error) {
      this.logger.error('❌ Message analysis failed', error);
      
      // Create fallback analysis
      return new MessageAnalysis(
        message,
        new Intent('general_conversation', 0.5, [], {}, { fallback: true }),
        { polarity: 0, emotion: 'neutral', confidence: 0.5 },
        {},
        [],
        { fallback: true, error: error.message }
      );
    }
  }

  async analyzeSentiment(message) {
    // Simple sentiment analysis (in production, would use NLP service)
    const positiveWords = /\b(good|great|excellent|perfect|amazing|love|wonderful|fantastic|awesome|happy)\b/gi;
    const negativeWords = /\b(bad|terrible|awful|hate|horrible|frustrated|annoying|disappointed|angry)\b/gi;
    
    const positiveMatches = (message.match(positiveWords) || []).length;
    const negativeMatches = (message.match(negativeWords) || []).length;
    
    let polarity = 0;
    let emotion = 'neutral';
    
    if (positiveMatches > negativeMatches) {
      polarity = Math.min(positiveMatches * 0.2, 1.0);
      emotion = positiveMatches > 2 ? 'excited' : 'pleased';
    } else if (negativeMatches > positiveMatches) {
      polarity = Math.max(-negativeMatches * 0.2, -1.0);
      emotion = negativeMatches > 2 ? 'angry' : 'frustrated';
    }
    
    // Detect urgency
    if (/\b(urgent|asap|immediately|emergency|now|right away)\b/i.test(message)) {
      emotion = 'urgent';
      polarity = Math.abs(polarity); // Urgency overrides negative sentiment
    }
    
    return {
      polarity,
      subjectivity: 0.5, // Default subjectivity
      emotion,
      confidence: Math.min(Math.abs(polarity) * 2 + 0.3, 1.0)
    };
  }

  async extractTopics(message, intent, conversationContext) {
    const topics = [];
    
    // Extract topics based on intent and entities
    if (intent.category === 'property_search') {
      topics.push({
        name: 'real_estate_search',
        relevance: 0.9,
        category: 'business_process',
        keywords: ['property', 'search', 'listing', 'home']
      });
    }
    
    if (intent.category === 'client_management') {
      topics.push({
        name: 'client_relationship',
        relevance: 0.8,
        category: 'business_process',
        keywords: ['client', 'customer', 'relationship']
      });
    }
    
    // Extract location topics
    if (intent.entities.location) {
      topics.push({
        name: `location_${intent.entities.location.normalized}`,
        relevance: 0.7,
        category: 'location',
        keywords: [intent.entities.location.raw]
      });
    }
    
    // Extract budget/price topics
    if (intent.entities.budget) {
      topics.push({
        name: 'pricing_discussion',
        relevance: 0.6,
        category: 'financial',
        keywords: ['budget', 'price', 'cost', 'money']
      });
    }
    
    return topics;
  }

  async processConversationFlow(sessionId, messageAnalysis) {
    try {
      // Check if there's an active flow
      const activeFlow = this.flowManager.getActiveFlow(sessionId);
      
      if (activeFlow) {
        // Continue existing flow
        return await this.flowManager.processFlowMessage(
          sessionId, 
          messageAnalysis, 
          this.toolOrchestrator
        );
      }
      
      // Check if message should trigger a new flow
      const flowTriggers = {
        'property_search': ['property_search_search_properties', 'property_search_property_details'],
        'client_onboarding': ['client_management_add_client', 'client_management_follow_up'],
        'market_analysis': ['market_analysis_market_research', 'market_analysis_property_valuation']
      };
      
      const intentKey = `${messageAnalysis.intent.category}_${messageAnalysis.intent.primaryIntent.split('_').slice(-1)[0]}`;
      
      for (const [flowType, triggers] of Object.entries(flowTriggers)) {
        if (triggers.some(trigger => intentKey.includes(trigger.split('_').slice(-1)[0]))) {
          this.logger.info(`Starting conversation flow: ${flowType}`, {
            sessionId: sessionId.substring(0, 8),
            trigger: messageAnalysis.intent.primaryIntent
          });
          
          return await this.flowManager.startFlow(
            flowType, 
            sessionId, 
            messageAnalysis.intent.entities, 
            messageAnalysis
          );
        }
      }
      
      return null; // No flow triggered
      
    } catch (error) {
      this.logger.error('❌ Flow processing failed', error);
      return { success: false, error: error.message };
    }
  }

  async enhanceWithSemanticMemory(messageAnalysis, conversation, currentMessage) {
    try {
      // Search for relevant memories using semantic similarity
      const searchQuery = this.buildSemanticSearchQuery(messageAnalysis, currentMessage);
      
      const memoryResults = await this.semanticMemory.searchRelevantMemories(
        conversation.sessionId,
        searchQuery,
        messageAnalysis,
        {
          similarityThreshold: 0.7,
          maxResults: 5,
          includeSessionContext: true,
          categoryFilter: this.getCategoryFilter(messageAnalysis.intent.category)
        }
      );
      
      // Get user preferences from conversation aggregate
      const preferences = conversation.preferences.toSnapshot();
      
      // Get conversation history
      const conversationHistory = conversation.getRecentTurns(3).map(turn => ({
        message: turn.userMessage,
        response: turn.assistantResponse,
        created_at: turn.timestamp
      }));
      
      return {
        enhanced: memoryResults.memories.length > 0 || conversationHistory.length > 0,
        memoryRetrieved: true,
        
        // Semantic memory results
        semanticMemories: memoryResults.memories,
        searchStats: memoryResults.searchStats,
        
        // Traditional context
        conversationHistory,
        preferences,
        currentUserMessage: currentMessage,
        
        // Enhanced context
        context: {
          relevantDiscussions: memoryResults.memories.map(memory => ({
            content: memory.searchableContent,
            relevance: memory.similarity,
            timestamp: memory.timestamp,
            category: memory.category
          })),
          userPreferences: preferences,
          conversationPhase: conversation.context.conversationPhase,
          activeTopics: conversation.context.activeTopics,
          clientContext: conversation.context.clientContext
        }
      };
      
    } catch (error) {
      this.logger.error('❌ Semantic memory enhancement failed', error);
      
      // Fallback to basic context
      return {
        enhanced: false,
        memoryRetrieved: false,
        error: error.message,
        preferences: conversation.preferences.toSnapshot(),
        currentUserMessage: currentMessage,
        conversationHistory: conversation.getRecentTurns(3).map(turn => ({
          message: turn.userMessage,
          response: turn.assistantResponse,
          created_at: turn.timestamp
        }))
      };
    }
  }

  buildSemanticSearchQuery(messageAnalysis, currentMessage) {
    const queryParts = [currentMessage];
    
    // Add intent information
    queryParts.push(messageAnalysis.intent.primaryIntent.replace(/_/g, ' '));
    
    // Add key entities
    Object.entries(messageAnalysis.intent.entities).forEach(([key, value]) => {
      if (typeof value === 'string') {
        queryParts.push(value);
      } else if (value.normalized) {
        queryParts.push(value.normalized);
      }
    });
    
    // Add topics
    messageAnalysis.topics.forEach(topic => {
      queryParts.push(topic.name.replace(/_/g, ' '));
    });
    
    return queryParts.join(' ').substring(0, 500); // Limit query length
  }

  getCategoryFilter(intentCategory) {
    const categoryMap = {
      'property_search': 'property_preferences',
      'client_management': 'client_information',
      'market_analysis': 'market_insights',
      'communication': 'conversation_context'
    };
    
    return categoryMap[intentCategory] || null;
  }

  determineResponseStrategy(messageAnalysis, enhancedContext, flowResult) {
    const strategy = {
      type: 'intelligent_response',
      approach: 'semantic_aware',
      personalityAdjustment: messageAnalysis.emotionalContext.responseAdjustment?.tone || 'professional',
      requiresTools: messageAnalysis.intent.requiresTools(),
      priority: messageAnalysis.urgencyLevel,
      contextualResponse: enhancedContext.enhanced,
      
      // Flow-aware strategy
      flowActive: !!flowResult?.success,
      flowType: flowResult?.flowId ? this.flowManager.getActiveFlow(messageAnalysis.sessionId)?.type : null,
      
      // Semantic context integration
      semanticContext: enhancedContext.semanticMemories?.length > 0,
      memoryIntegration: enhancedContext.memoryRetrieved,
      
      // Advanced features
      proactiveGuidance: this.shouldProvideProactiveGuidance(messageAnalysis, enhancedContext),
      personalizationLevel: this.determinePersonalizationLevel(enhancedContext),
      responseComplexity: messageAnalysis.complexity
    };
    
    // Adjust strategy based on conversation context
    if (enhancedContext.context?.conversationPhase === 'initial') {
      strategy.approach = 'welcoming_informative';
    } else if (enhancedContext.context?.conversationPhase === 'execution') {
      strategy.approach = 'action_oriented';
    }
    
    return strategy;
  }

  shouldProvideProactiveGuidance(messageAnalysis, enhancedContext) {
    // Provide guidance for complex requests or when user seems uncertain
    return messageAnalysis.complexity === 'high' ||
           messageAnalysis.sentiment.emotion === 'confused' ||
           enhancedContext.context?.activeTopics?.length > 2;
  }

  determinePersonalizationLevel(enhancedContext) {
    const preferences = enhancedContext.preferences || {};
    const historyLength = enhancedContext.conversationHistory?.length || 0;
    const memoryDepth = enhancedContext.semanticMemories?.length || 0;
    
    if (memoryDepth > 3 && historyLength > 5) return 'high';
    if (memoryDepth > 1 || historyLength > 2) return 'medium';
    return 'low';
  }

  async executeToolCoordination(responseStrategy, enhancedContext, messageAnalysis) {
    if (!responseStrategy.requiresTools) {
      return { toolsUsed: [], coordination: 'none' };
    }
    
    try {
      // Enhanced tool coordination with semantic context
      const toolRequest = {
        intent: messageAnalysis.intent.primaryIntent,
        category: messageAnalysis.intent.category,
        entities: messageAnalysis.intent.entities,
        
        // Enhanced context
        context: enhancedContext,
        semanticContext: enhancedContext.semanticMemories,
        conversationPhase: enhancedContext.context?.conversationPhase,
        
        // Processing directives
        priority: responseStrategy.priority,
        complexity: messageAnalysis.complexity,
        urgency: messageAnalysis.urgencyLevel,
        
        // Tool selection guidance
        primaryTool: messageAnalysis.intent.metadata?.toolsRequired?.[0],
        supportingTools: messageAnalysis.intent.metadata?.toolsRequired?.slice(1) || [],
        
        // Execution strategy
        workflowType: 'semantic_enhanced',
        executionMode: responseStrategy.priority === 'high' ? 'parallel' : 'sequential',
        
        // User context
        userMessage: enhancedContext.currentUserMessage,
        userPreferences: enhancedContext.preferences
      };
      
      this.logger.debug('Executing enhanced tool coordination', {
        intent: toolRequest.intent,
        priority: toolRequest.priority,
        toolsRequired: toolRequest.primaryTool ? [toolRequest.primaryTool, ...toolRequest.supportingTools] : [],
        hasSemanticContext: !!toolRequest.semanticContext?.length
      });
      
      const toolResults = await this.toolOrchestrator.coordinateTools(toolRequest);
      
      return {
        toolsUsed: toolResults.toolsExecuted || [],
        results: toolResults.results || {},
        coordination: toolResults.coordinationType || 'single',
        executionTime: toolResults.executionTime || 0,
        success: !!toolResults.results,
        
        // Enhanced metadata
        semanticEnhanced: true,
        contextAware: true,
        workflowType: toolRequest.workflowType,
        userPersonalized: !!enhancedContext.preferences
      };
      
    } catch (error) {
      this.logger.error('❌ Tool coordination failed', error);
      
      return {
        toolsUsed: [],
        coordination: 'failed',
        error: error.message,
        fallback: true
      };
    }
  }

  async generateIntelligentResponse(responseStrategy, enhancedContext, toolResults, messageAnalysis) {
    const responseStartTime = Date.now();
    
    try {
      // Use enhanced personality engine with semantic context
      const enhancedPersonalityContext = {
        ...enhancedContext,
        messageAnalysis: messageAnalysis,
        toolResults: toolResults,
        responseStrategy: responseStrategy,
        
        // Semantic enhancements
        semanticMemories: enhancedContext.semanticMemories,
        conversationInsights: this.extractConversationInsights(enhancedContext),
        userProfile: this.buildUserProfile(enhancedContext),
        
        // Advanced context
        businessContext: this.extractBusinessContext(messageAnalysis, enhancedContext),
        temporalContext: this.extractTemporalContext(messageAnalysis)
      };
      
      const response = await this.personalityEngine.generateResponse({
        strategy: responseStrategy,
        context: enhancedPersonalityContext,
        toolResults: toolResults,
        timestamp: new Date()
      });
      
      const processingTime = Date.now() - responseStartTime;
      
      return {
        content: response.content,
        confidence: this.calculateResponseConfidence(response, toolResults, messageAnalysis),
        personalityInsights: response.personalityApplication,
        processingTime: response.processingTime + processingTime,
        
        // Enhanced metadata
        semanticallyEnhanced: !!enhancedContext.semanticMemories?.length,
        contextAware: true,
        personalizationLevel: responseStrategy.personalizationLevel,
        businessIntelligence: this.extractBusinessIntelligence(toolResults, messageAnalysis)
      };
      
    } catch (error) {
      this.logger.error('❌ Intelligent response generation failed', error);
      
      return {
        content: this.generateFallbackResponse(messageAnalysis.message),
        confidence: 0.5,
        personalityInsights: { fallback: true },
        processingTime: Date.now() - responseStartTime,
        error: error.message
      };
    }
  }

  extractConversationInsights(enhancedContext) {
    const insights = [];
    
    // Analyze conversation patterns
    if (enhancedContext.conversationHistory?.length > 2) {
      insights.push({
        type: 'conversation_depth',
        value: 'established_dialogue',
        confidence: 0.8
      });
    }
    
    // Analyze user preferences
    if (enhancedContext.preferences?.concise_mode) {
      insights.push({
        type: 'communication_preference',
        value: 'prefers_concise_responses',
        confidence: 0.9
      });
    }
    
    // Analyze semantic patterns
    if (enhancedContext.semanticMemories?.length > 0) {
      const categories = enhancedContext.semanticMemories.map(m => m.category);
      const mostCommon = this.findMostCommon(categories);
      
      insights.push({
        type: 'topic_focus',
        value: mostCommon,
        confidence: 0.7
      });
    }
    
    return insights;
  }

  buildUserProfile(enhancedContext) {
    return {
      communicationStyle: enhancedContext.preferences?.communicationStyle || 'professional',
      expertise_level: this.inferExpertiseLevel(enhancedContext),
      business_focus: this.inferBusinessFocus(enhancedContext),
      interaction_patterns: this.analyzeInteractionPatterns(enhancedContext)
    };
  }

  inferExpertiseLevel(enhancedContext) {
    // Analyze technical language usage and question complexity
    const recentMessages = enhancedContext.conversationHistory || [];
    const technicalIndicators = recentMessages.filter(msg => 
      /\b(market analysis|cma|roi|cap rate|appreciation|equity)\b/i.test(msg.message || '')
    );
    
    if (technicalIndicators.length > 1) return 'expert';
    if (technicalIndicators.length > 0) return 'intermediate';
    return 'beginner';
  }

  inferBusinessFocus(enhancedContext) {
    const memories = enhancedContext.semanticMemories || [];
    const categories = memories.map(m => m.category);
    
    if (categories.includes('client_information')) return 'client_focused';
    if (categories.includes('property_preferences')) return 'transaction_focused';
    if (categories.includes('market_insights')) return 'analysis_focused';
    return 'general';
  }

  analyzeInteractionPatterns(enhancedContext) {
    const history = enhancedContext.conversationHistory || [];
    
    return {
      avg_message_length: this.calculateAverageLength(history.map(h => h.message)),
      question_frequency: this.calculateQuestionFrequency(history),
      response_time_preference: enhancedContext.preferences?.quick_responses ? 'fast' : 'thorough'
    };
  }

  extractBusinessContext(messageAnalysis, enhancedContext) {
    return {
      real_estate_domain: true,
      transaction_stage: this.inferTransactionStage(messageAnalysis, enhancedContext),
      client_type: this.inferClientType(enhancedContext),
      urgency_level: messageAnalysis.urgencyLevel,
      business_impact: this.calculateBusinessImpact(messageAnalysis)
    };
  }

  inferTransactionStage(messageAnalysis, enhancedContext) {
    const intent = messageAnalysis.intent.primaryIntent;
    
    if (intent.includes('search')) return 'property_search';
    if (intent.includes('valuation') || intent.includes('market')) return 'evaluation';
    if (intent.includes('client') || intent.includes('onboard')) return 'relationship_building';
    if (intent.includes('schedule') || intent.includes('appointment')) return 'active_engagement';
    
    return 'discovery';
  }

  inferClientType(enhancedContext) {
    const preferences = enhancedContext.preferences || {};
    const entities = enhancedContext.context?.clientContext || {};
    
    if (entities.budget?.numeric > 1000000) return 'luxury_client';
    if (entities.timeline?.urgency === 'urgent') return 'motivated_buyer';
    if (preferences.detailed_analysis) return 'analytical_client';
    
    return 'standard_client';
  }

  calculateBusinessImpact(messageAnalysis) {
    const intent = messageAnalysis.intent;
    
    // Revenue-generating activities have high impact
    if (intent.category === 'property_search' || intent.category === 'client_management') {
      return 'high';
    }
    
    // Support activities have medium impact
    if (intent.category === 'market_analysis' || intent.category === 'communication_automation') {
      return 'medium';
    }
    
    return 'low';
  }

  extractTemporalContext(messageAnalysis) {
    const now = new Date();
    
    return {
      time_of_day: this.getTimeOfDay(now),
      business_hours: this.isBusinessHours(now),
      urgency_temporal: this.extractTemporalUrgency(messageAnalysis.message),
      seasonal_context: this.getSeasonalContext(now)
    };
  }

  calculateResponseConfidence(response, toolResults, messageAnalysis) {
    let confidence = 0.7; // Base confidence
    
    // Boost confidence for successful tool execution
    if (toolResults.success && toolResults.toolsUsed.length > 0) {
      confidence += 0.15;
    }
    
    // Boost confidence for high intent classification confidence
    if (messageAnalysis.intent.confidence > 0.8) {
      confidence += 0.1;
    }
    
    // Boost confidence for semantic enhancement
    if (toolResults.semanticEnhanced) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 1.0);
  }

  extractBusinessIntelligence(toolResults, messageAnalysis) {
    return {
      tools_effectiveness: toolResults.toolsUsed?.length > 0 ? 'effective' : 'minimal',
      intent_clarity: messageAnalysis.intent.confidence > 0.8 ? 'clear' : 'ambiguous',
      complexity_handled: messageAnalysis.complexity,
      automation_level: toolResults.coordination !== 'none' ? 'high' : 'low'
    };
  }

  async updateSemanticMemory(conversation, conversationTurn, messageAnalysis) {
    try {
      const memoryId = await this.semanticMemory.storeConversationMemory(
        conversation.sessionId,
        conversationTurn,
        messageAnalysis
      );
      
      if (memoryId) {
        this.logger.debug('Semantic memory updated', {
          sessionId: conversation.sessionId.substring(0, 8),
          memoryId: memoryId.substring(0, 8),
          importance: messageAnalysis.intent.priority
        });
      }
      
    } catch (error) {
      this.logger.error('❌ Failed to update semantic memory', error);
    }
  }

  async recordAnalytics(sessionId, conversationTurn, messageAnalysis, toolResults, response) {
    try {
      await this.analyticsService.recordConversationTurn(
        sessionId,
        conversationTurn,
        messageAnalysis,
        toolResults,
        response
      );
      
    } catch (error) {
      this.logger.error('❌ Failed to record analytics', error);
    }
  }

  async processDomainEvents(conversation) {
    try {
      const events = conversation.clearDomainEvents();
      
      for (const event of events) {
        const handler = this.eventHandlers.get(event.type);
        if (handler) {
          await handler(event);
        }
      }
      
    } catch (error) {
      this.logger.error('❌ Failed to process domain events', error);
    }
  }

  // Event handlers
  
  async handleConversationStarted(event) {
    this.logger.info('Conversation started', {
      conversationId: event.data.conversationId,
      sessionId: event.data.sessionId
    });
  }

  async handleConversationTurnAdded(event) {
    this.logger.debug('Conversation turn added', {
      conversationId: event.data.conversationId,
      intent: event.data.intent
    });
  }

  async handleConversationFlowStarted(event) {
    this.logger.info('Conversation flow started', event.data);
  }

  async handleUserPreferencesUpdated(event) {
    this.logger.debug('User preferences updated', {
      conversationId: event.data.conversationId
    });
  }

  // Utility methods

  emitDomainEvent(eventType, data) {
    const event = {
      id: uuidv4(),
      type: eventType,
      data: data,
      timestamp: new Date()
    };
    
    this.domainEvents.push(event);
    
    // Process immediately for critical events
    const handler = this.eventHandlers.get(eventType);
    if (handler) {
      setTimeout(() => handler(event), 0);
    }
  }

  updatePerformanceMetrics(processingTime, success) {
    const total = this.performanceMetrics.totalRequests;
    
    this.performanceMetrics.averageProcessingTime = 
      (this.performanceMetrics.averageProcessingTime * (total - 1) + processingTime) / total;
    
    if (success) {
      this.performanceMetrics.successfulRequests++;
    } else {
      this.performanceMetrics.lastErrorTime = new Date();
    }
    
    this.performanceMetrics.errorRate = 
      1 - (this.performanceMetrics.successfulRequests / this.performanceMetrics.totalRequests);
  }

  generateFallbackResponse(message) {
    const fallbacks = [
      "I understand what you're asking. Let me help you with that using my enterprise tools and knowledge.",
      "I'm processing your request. I have access to comprehensive real estate tools and can assist you effectively.",
      "I can help you with that. Let me coordinate the right resources to provide you with the best assistance."
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Utility helper methods
  
  findMostCommon(array) {
    const counts = {};
    array.forEach(item => counts[item] = (counts[item] || 0) + 1);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '');
  }

  calculateAverageLength(messages) {
    if (!messages.length) return 0;
    return messages.reduce((sum, msg) => sum + (msg?.length || 0), 0) / messages.length;
  }

  calculateQuestionFrequency(history) {
    if (!history.length) return 0;
    const questions = history.filter(item => (item.message || '').includes('?'));
    return questions.length / history.length;
  }

  getTimeOfDay(date) {
    const hour = date.getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  isBusinessHours(date) {
    const hour = date.getHours();
    const day = date.getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
  }

  extractTemporalUrgency(message) {
    if (/\b(now|immediately|asap|urgent|today)\b/i.test(message)) return 'immediate';
    if (/\b(soon|quickly|this week|tomorrow)\b/i.test(message)) return 'soon';
    return 'normal';
  }

  getSeasonalContext(date) {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring_market';
    if (month >= 6 && month <= 8) return 'summer_market';
    if (month >= 9 && month <= 11) return 'fall_market';
    return 'winter_market';
  }

  // Public API methods

  async getConversationStatus(sessionId) {
    const conversation = this.activeConversations.get(sessionId);
    if (!conversation) {
      return { exists: false };
    }
    
    return {
      exists: true,
      summary: conversation.getConversationSummary(),
      activeFlow: this.flowManager.getActiveFlow(sessionId),
      analytics: await this.analyticsService.getConversationAnalytics(sessionId)
    };
  }

  async getSystemHealth() {
    return {
      initialized: this.initialized,
      activeConversations: this.activeConversations.size,
      performanceMetrics: this.performanceMetrics,
      
      // Component health
      intentClassifierHealth: this.intentClassifier.getHealthStatus(),
      semanticMemoryHealth: this.semanticMemory.getHealthStatus(),
      flowManagerHealth: this.flowManager.getHealthStatus(),
      analyticsHealth: this.analyticsService.getHealthStatus(),
      
      // System capabilities
      capabilities: [
        'semantic_intent_classification',
        'conversation_flows',
        'semantic_memory_retrieval',
        'real_time_analytics',
        'enterprise_tool_coordination',
        'personality_adaptation',
        'domain_driven_architecture'
      ]
    };
  }

  async exportConversationData(sessionId, format = 'json') {
    const conversation = this.activeConversations.get(sessionId);
    if (!conversation) {
      return null;
    }
    
    const data = {
      conversation: conversation.toSnapshot(),
      analytics: await this.analyticsService.getConversationAnalytics(sessionId),
      semanticMemory: {}, // Would include semantic memory data
      exportTimestamp: new Date()
    };
    
    return format === 'json' ? data : this.convertToFormat(data, format);
  }

  convertToFormat(data, format) {
    // Placeholder for format conversion
    return data;
  }
}

module.exports = EnterpriseConversationEngine;