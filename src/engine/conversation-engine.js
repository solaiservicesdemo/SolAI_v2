/**
 * 🧠 SolAI Conversation Engine
 * Advanced conversational intelligence with memory and personality
 */

const Logger = require('../core/logger');
const { v4: uuidv4 } = require('uuid');

class ConversationEngine {
  constructor(memoryManager, personalityEngine, toolOrchestrator) {
    this.memoryManager = memoryManager;
    this.personalityEngine = personalityEngine;
    this.toolOrchestrator = toolOrchestrator;
    this.logger = new Logger('ConversationEngine');
    
    this.conversationStates = new Map();
    this.setupConversationPatterns();
  }

  async initialize() {
    this.logger.info('🧠 Initializing conversation engine...');
    
    try {
      // Initialize conversation state management
      this.setupStateManagement();
      
      // Load conversation patterns and templates
      await this.loadConversationTemplates();
      
      this.logger.info('✅ Conversation engine initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize conversation engine', error);
      throw error;
    }
  }

  setupConversationPatterns() {
    // Conversation flow patterns for natural dialogue
    this.conversationPatterns = {
      greeting: {
        patterns: [/^(hi|hello|hey|good morning|good afternoon)/i],
        response: 'personalized_greeting',
        followUp: true
      },
      
      task_request: {
        patterns: [
          /help me (with|manage|organize)/i,
          /can you (help|assist|do)/i,
          /i need (to|help with)/i
        ],
        response: 'task_coordination',
        requiresTools: true
      },
      
      memory_reference: {
        patterns: [
          /remember (that|when)/i,
          /you (said|told|mentioned)/i,
          /last time we/i,
          /as we discussed/i
        ],
        response: 'memory_retrieval',
        requiresContext: true
      },
      
      question: {
        patterns: [
          /^(what|how|when|where|why|who)/i,
          /\?$/,
          /can you tell me/i
        ],
        response: 'informational_response',
        requiresReasoning: true
      },
      
      appreciation: {
        patterns: [/^(thank|thanks|appreciate)/i],
        response: 'gracious_acknowledgment',
        followUp: 'offer_assistance'
      }
    };
  }

  setupStateManagement() {
    // Conversation state machine
    this.conversationStates = new Map();
    
    // Default conversation state
    this.defaultState = {
      phase: 'listening',
      context: {},
      history: [],
      preferences: {},
      activeTools: [],
      lastActivity: new Date()
    };
  }

  async loadConversationTemplates() {
    // Load response templates for different conversation types
    this.responseTemplates = {
      personalized_greeting: [
        "Hello! Great to see you again. What can I help you with today?",
        "Hi there! How can I assist you with your real estate business today?",
        "Good to chat with you! What's on your agenda?"
      ],
      
      task_coordination: [
        "I'd be happy to help you with that. Let me coordinate the right tools for your needs.",
        "Absolutely! Let me organize the best approach for what you're looking to accomplish.",
        "I can definitely assist with that. Give me a moment to set everything up."
      ],
      
      memory_retrieval: [
        "Yes, I remember our conversation about that. Let me pull up the details.",
        "Of course! I have that information from our previous discussion.",
        "That's right - I recall we covered that topic. Let me find the specifics."
      ],
      
      gracious_acknowledgment: [
        "You're very welcome! I'm here whenever you need assistance.",
        "My pleasure! Is there anything else I can help you with?",
        "Happy to help! Let me know if you need anything else."
      ]
    };
  }

  async processMessage(request) {
    const timer = this.logger.startTimer('message-processing');
    
    try {
      const { message, sessionId, context = {} } = request;
      
      this.logger.conversation(sessionId, 'message-received', {
        messageLength: message.length,
        hasContext: Object.keys(context).length > 0
      });

      // Step 1: Get or create conversation state
      const conversationState = await this.getConversationState(sessionId);
      
      // Step 2: Analyze message and determine intent
      const messageAnalysis = await this.analyzeMessage(message, conversationState, context);
      
      // Step 3: Retrieve relevant memory and context
      const enhancedContext = await this.enhanceWithMemory(messageAnalysis, sessionId);
      
      // Step 4: Determine response strategy
      const responseStrategy = await this.planResponse(messageAnalysis, enhancedContext);
      
      // Step 5: Execute tools if needed
      const toolResults = await this.executeTools(responseStrategy, enhancedContext);
      
      // Step 6: Generate personalized response
      const response = await this.generateResponse(responseStrategy, enhancedContext, toolResults);
      
      // Step 7: Update conversation state and memory
      await this.updateConversationState(sessionId, {
        message,
        analysis: messageAnalysis,
        response: response.content,
        toolResults,
        timestamp: new Date()
      });
      
      timer.end('Conversation processing completed');
      
      return {
        success: true,
        content: response.content,
        sessionId,
        conversationId: response.conversationId,
        personalityInsights: response.personalityInsights,
        toolsUsed: toolResults.toolsUsed || [],
        confidence: messageAnalysis.confidence,
        responseTime: response.processingTime,
        metadata: {
          intent: messageAnalysis.primaryIntent,
          emotionalContext: messageAnalysis.emotionalContext,
          memoryRetrieved: enhancedContext.memoryRetrieved,
          toolCoordination: toolResults.coordination
        }
      };

    } catch (error) {
      timer.end('Conversation processing failed');
      this.logger.error('❌ Message processing failed', error, { sessionId: request.sessionId });
      
      return {
        success: false,
        error: 'Processing failed',
        content: "I apologize, but I encountered an issue processing your message. Could you please try again?",
        sessionId: request.sessionId,
        fallback: true
      };
    }
  }

  async getConversationState(sessionId) {
    // Get existing state or create new one
    let state = this.conversationStates.get(sessionId);
    
    if (!state) {
      // Try to restore from memory
      const savedState = await this.memoryManager.getConversationState(sessionId);
      
      state = savedState || {
        ...this.defaultState,
        sessionId,
        createdAt: new Date()
      };
      
      this.conversationStates.set(sessionId, state);
    }
    
    return state;
  }

  async analyzeMessage(message, conversationState, context) {
    const analysisTimer = this.logger.startTimer('message-analysis');
    
    try {
      // Pattern matching for quick intent detection
      const patternMatch = this.performPatternMatching(message);
      
      // Contextual analysis
      const contextAnalysis = this.analyzeContext(message, conversationState, context);
      
      // Emotional context detection
      const emotionalContext = this.detectEmotionalContext(message);
      
      // Combine analyses
      const analysis = {
        primaryIntent: patternMatch.intent || 'general_conversation',
        confidence: patternMatch.confidence || 0.7,
        emotionalContext,
        contextualFactors: contextAnalysis,
        requiresTools: patternMatch.requiresTools || false,
        requiresMemory: patternMatch.requiresContext || false,
        urgency: this.assessUrgency(message, emotionalContext),
        conversationTurn: conversationState.history.length + 1
      };
      
      analysisTimer.end('Message analysis completed');
      return analysis;
      
    } catch (error) {
      analysisTimer.end('Message analysis failed');
      this.logger.error('❌ Message analysis failed', error);
      
      // Return safe fallback analysis
      return {
        primaryIntent: 'general_conversation',
        confidence: 0.5,
        emotionalContext: { tone: 'neutral', urgency: 'normal' },
        contextualFactors: {},
        requiresTools: false,
        requiresMemory: false,
        urgency: 'normal',
        conversationTurn: 1
      };
    }
  }

  performPatternMatching(message) {
    for (const [intentType, config] of Object.entries(this.conversationPatterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(message)) {
          return {
            intent: intentType,
            confidence: 0.9,
            requiresTools: config.requiresTools || false,
            requiresContext: config.requiresContext || false,
            responseType: config.response
          };
        }
      }
    }
    
    return { intent: 'general_conversation', confidence: 0.6 };
  }

  analyzeContext(message, conversationState, additionalContext) {
    return {
      hasConversationHistory: conversationState.history.length > 0,
      conversationLength: conversationState.history.length,
      recentContext: conversationState.history.slice(-3), // Last 3 turns
      userPreferences: conversationState.preferences || {},
      activeSession: true,
      additionalContext: Object.keys(additionalContext).length > 0
    };
  }

  detectEmotionalContext(message) {
    const emotionalMarkers = {
      urgent: /urgent|asap|immediately|quickly|rush|emergency/i,
      frustrated: /annoying|frustrated|problem|issue|wrong|broken/i,
      pleased: /great|excellent|perfect|wonderful|amazing|love/i,
      concerned: /worried|concerned|nervous|anxious|unsure/i,
      excited: /excited|thrilled|fantastic|awesome|can't wait/i
    };
    
    for (const [emotion, pattern] of Object.entries(emotionalMarkers)) {
      if (pattern.test(message)) {
        return {
          primaryEmotion: emotion,
          tone: emotion,
          intensity: 'moderate',
          responseAdjustment: this.getEmotionalResponseAdjustment(emotion)
        };
      }
    }
    
    return {
      primaryEmotion: 'neutral',
      tone: 'professional',
      intensity: 'normal',
      responseAdjustment: 'standard'
    };
  }

  getEmotionalResponseAdjustment(emotion) {
    const adjustments = {
      urgent: 'prioritize_speed',
      frustrated: 'extra_helpful',
      pleased: 'maintain_positive',
      concerned: 'reassuring_tone',
      excited: 'match_enthusiasm'
    };
    
    return adjustments[emotion] || 'standard';
  }

  assessUrgency(message, emotionalContext) {
    if (emotionalContext.primaryEmotion === 'urgent') return 'high';
    if (/today|now|soon/i.test(message)) return 'medium';
    return 'normal';
  }

  async enhanceWithMemory(messageAnalysis, sessionId) {
    if (!messageAnalysis.requiresMemory && messageAnalysis.conversationTurn <= 2) {
      return { enhanced: false, memoryRetrieved: false };
    }
    
    try {
      // Get relevant conversation history
      const conversationHistory = await this.memoryManager.getRecentConversations(sessionId, 5);
      
      // Get relevant knowledge and preferences
      const relevantMemory = await this.memoryManager.searchRelevantMemory(sessionId, messageAnalysis);
      
      return {
        enhanced: true,
        memoryRetrieved: true,
        conversationHistory,
        relevantMemory,
        context: {
          previousDiscussions: relevantMemory.discussions || [],
          userPreferences: relevantMemory.preferences || {},
          importantFacts: relevantMemory.facts || []
        }
      };
      
    } catch (error) {
      this.logger.error('❌ Memory enhancement failed', error);
      return { enhanced: false, memoryRetrieved: false, error: error.message };
    }
  }

  async planResponse(messageAnalysis, enhancedContext) {
    return {
      responseType: messageAnalysis.primaryIntent,
      personalityAdjustment: messageAnalysis.emotionalContext.responseAdjustment,
      requiresTools: messageAnalysis.requiresTools,
      priority: messageAnalysis.urgency,
      contextualResponse: enhancedContext.enhanced,
      strategy: this.selectResponseStrategy(messageAnalysis, enhancedContext)
    };
  }

  selectResponseStrategy(messageAnalysis, enhancedContext) {
    if (messageAnalysis.requiresTools) {
      return 'tool_coordinated_response';
    } else if (enhancedContext.enhanced) {
      return 'context_aware_response';
    } else if (messageAnalysis.primaryIntent === 'greeting') {
      return 'personalized_greeting';
    } else {
      return 'conversational_response';
    }
  }

  async executeTools(responseStrategy, enhancedContext) {
    if (!responseStrategy.requiresTools) {
      return { toolsUsed: [], coordination: 'none' };
    }
    
    try {
      const toolResults = await this.toolOrchestrator.coordinateTools({
        intent: responseStrategy.responseType,
        context: enhancedContext,
        priority: responseStrategy.priority
      });
      
      return {
        toolsUsed: toolResults.toolsExecuted || [],
        results: toolResults.results || {},
        coordination: toolResults.coordinationType || 'single',
        executionTime: toolResults.executionTime || 0
      };
      
    } catch (error) {
      this.logger.error('❌ Tool execution failed', error);
      return {
        toolsUsed: [],
        coordination: 'failed',
        error: error.message
      };
    }
  }

  async generateResponse(responseStrategy, enhancedContext, toolResults) {
    const responseTimer = this.logger.startTimer('response-generation');
    
    try {
      // Generate response based on strategy and personality
      const baseResponse = await this.personalityEngine.generateResponse({
        strategy: responseStrategy,
        context: enhancedContext,
        toolResults,
        timestamp: new Date()
      });
      
      responseTimer.end('Response generation completed');
      
      return {
        content: baseResponse.content,
        conversationId: uuidv4(),
        personalityInsights: baseResponse.personalityApplication,
        processingTime: baseResponse.processingTime || 0
      };
      
    } catch (error) {
      responseTimer.end('Response generation failed');
      this.logger.error('❌ Response generation failed', error);
      
      // Return safe fallback response
      return {
        content: "I understand what you're asking. Let me help you with that in the best way I can.",
        conversationId: uuidv4(),
        personalityInsights: { fallback: true },
        processingTime: 0
      };
    }
  }

  async updateConversationState(sessionId, conversationData) {
    try {
      // Update in-memory state
      const state = this.conversationStates.get(sessionId);
      if (state) {
        state.history.push({
          message: conversationData.message,
          response: conversationData.response,
          analysis: conversationData.analysis,
          timestamp: conversationData.timestamp
        });
        state.lastActivity = conversationData.timestamp;
      }
      
      // Persist to memory manager
      await this.memoryManager.storeConversationTurn(sessionId, conversationData);
      
    } catch (error) {
      this.logger.error('❌ Failed to update conversation state', error);
    }
  }
}

module.exports = ConversationEngine;