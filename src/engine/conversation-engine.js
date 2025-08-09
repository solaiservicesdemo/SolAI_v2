/**
 * 🧠 SolAI Conversation Engine
 * Advanced conversational intelligence with memory and personality
 */

 const Logger = require('../core/logger');
 const { v4: uuidv4 } = require('uuid');
 
 const NOQ_PATTERNS = [
   /just answer/i,
   /no questions/i,
   /stop asking/i,
   /\bbro\b/i,
   /pls gimme ans/i,
   /don['’]t ask/i
 ];
 
 const SHORT_PATTERNS = [
   /too long/i,
   /\bshort(er)?\b/i,
   /\btl;dr\b/i,
   /no long messages/i,
   /low attention/i,
   /attention span/i
 ];
 
 function wantsNoQuestions(userText = '') {
   return NOQ_PATTERNS.some(rx => rx.test(userText));
 }
 function wantsShort(userText = '') {
   return SHORT_PATTERNS.some(rx => rx.test(userText));
 }
 
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
       this.setupStateManagement();
       await this.loadConversationTemplates();
       this.logger.info('✅ Conversation engine initialized successfully');
     } catch (error) {
       this.logger.error('❌ Failed to initialize conversation engine', error);
       throw error;
     }
   }
 
   setupConversationPatterns() {
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
 
       // Real estate purchase intent
       real_estate_buy: {
         patterns: [
           /\b(1|2|3|4)\s*-?\s*br\b/i,
           /\b(bed|bedroom)s?\b/i,
           /\bcondo\b/i,
           /\bhoa\b/i,
           /\bocean ?view\b/i,
           /\bcoronado\b/i,
           /\bvacation home\b/i,
           /\brent( out)?\b/i,
           /\bpet-?friendly\b/i,
           /\bcovered parking\b/i,
           /\bwalk(ing)? distance\b/i,
           /\b(pre|pre-)?qual(ified|ification)?\b/i
         ],
         response: 'informational_response',
         requiresReasoning: true
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
     this.conversationStates = new Map();
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
         'Yes, I remember our conversation about that. Let me pull up the details.',
         'Of course! I have that information from our previous discussion.',
         "That's right - I recall we covered that topic. Let me find the specifics."
       ],
 
       gracious_acknowledgment: [
         "You're very welcome! I'm here whenever you need assistance.",
         'My pleasure! Is there anything else I can help you with?',
         'Happy to help! Let me know if you need anything else.'
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
 
       // Persist "no questions" preference if user asked for it
       if (wantsNoQuestions(message)) {
         await this.memoryManager.updateUserPreferences(sessionId, { no_questions: true, no_followups: true });
       }
       // Persist concise preference if the user asks for brevity
       if (wantsShort(message)) {
         await this.memoryManager.updateUserPreferences(sessionId, {
           concise_mode: true,
           prefers_brief_responses: true,
           no_followups: true,
           max_sections: 2,
           max_bullets: 5,
           target_word_limit: 120
         });
       }
 
       // 1) Get or create conversation state
       const conversationState = await this.getConversationState(sessionId);
 
       // 2) Analyze message & intent
       const messageAnalysis = await this.analyzeMessage(message, conversationState, context);
 
       // 3) Retrieve relevant memory and context (pass current message)
       const enhancedContext = await this.enhanceWithMemory(messageAnalysis, sessionId, message);
 
       // 4) Determine response strategy
       const responseStrategy = await this.planResponse(messageAnalysis, enhancedContext);
 
       // 5) Execute tools if needed
       const toolResults = await this.executeTools(responseStrategy, enhancedContext);
 
       // 6) Generate personalized response
       const response = await this.generateResponse(responseStrategy, enhancedContext, toolResults);
 
       // 7) Update conversation state and memory
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
     let state = this.conversationStates.get(sessionId);
     if (!state) {
       const savedState = await this.memoryManager.getConversationState(sessionId);
       state = savedState || { ...this.defaultState, sessionId, createdAt: new Date() };
       this.conversationStates.set(sessionId, state);
     }
     return state;
   }
 
   async analyzeMessage(message, conversationState, context) {
     const analysisTimer = this.logger.startTimer('message-analysis');
     try {
       const patternMatch = this.performPatternMatching(message);
       const contextAnalysis = this.analyzeContext(message, conversationState, context);
       const emotionalContext = this.detectEmotionalContext(message);
 
       const analysis = {
         primaryIntent: patternMatch.intent || 'general_conversation',
         confidence: patternMatch.confidence || 0.7,
         emotionalContext,
         contextualFactors: contextAnalysis,
         requiresTools: patternMatch.requiresTools || false,
         requiresMemory: patternMatch.requiresContext || false,
         urgency: this.assessUrgency(message, emotionalContext),
         conversationTurn: conversationState.history.length + 1,
         message // current text available downstream
       };
 
       analysisTimer.end('Message analysis completed');
       return analysis;
     } catch (error) {
       analysisTimer.end('Message analysis failed');
       this.logger.error('❌ Message analysis failed', error);
 
       return {
         primaryIntent: 'general_conversation',
         confidence: 0.5,
         emotionalContext: { tone: 'neutral', urgency: 'normal' },
         contextualFactors: {},
         requiresTools: false,
         requiresMemory: false,
         urgency: 'normal',
         conversationTurn: 1,
         message
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
       recentContext: conversationState.history.slice(-3),
       userPreferences: conversationState.preferences || {},
       activeSession: true,
       additionalContext: Object.keys(additionalContext || {}).length > 0
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
 
   async enhanceWithMemory(messageAnalysis, sessionId, currentMessage) {
     try {
       const prefs = await this.memoryManager.getUserPreferences(sessionId);
 
       const needHistory = messageAnalysis.requiresMemory || messageAnalysis.conversationTurn > 2;
       const rawHistory = needHistory
         ? await this.memoryManager.getRecentConversations(sessionId, 5)
         : [];
 
       // Normalize history to {message, response, created_at}
       const conversationHistory = (rawHistory || []).map(r => ({
         message: r.user_message ?? r.message ?? '',
         response: r.assistant_response ?? r.response ?? '',
         created_at: r.created_at ?? r.timestamp ?? null
       }));
 
       const relevantMemory = await this.memoryManager.searchRelevantMemory(sessionId, {
         ...messageAnalysis,
         message: messageAnalysis.message || currentMessage || ''
       });
 
       return {
         enhanced: needHistory || (relevantMemory?.discussions?.length > 0),
         memoryRetrieved: true,
         conversationHistory,
         relevantMemory,
         preferences: prefs || {},
         currentUserMessage: currentMessage,
         context: {
           previousDiscussions: relevantMemory.discussions || [],
           userPreferences: { ...(relevantMemory.preferences || {}), ...(prefs || {}) },
           importantFacts: relevantMemory.facts || []
         }
       };
     } catch (error) {
       this.logger.error('❌ Memory enhancement failed', error);
       return {
         enhanced: false,
         memoryRetrieved: false,
         error: error.message,
         preferences: {},
         currentUserMessage
       };
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
     }
     return 'conversational_response';
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
       const baseResponse = await this.personalityEngine.generateResponse({
         strategy: responseStrategy,
         context: {
           ...enhancedContext,
           preferences: enhancedContext.preferences || {}
         },
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
       await this.memoryManager.storeConversationTurn(sessionId, conversationData);
     } catch (error) {
       this.logger.error('❌ Failed to update conversation state', error);
     }
   }
 }
 
 module.exports = ConversationEngine;
 