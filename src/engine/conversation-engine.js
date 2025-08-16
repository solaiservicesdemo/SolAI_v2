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
 
       // ENTERPRISE PROPERTY SEARCH & SCRAPING
       property_search: {
         patterns: [
           /show me (properties|listings|homes|condos)/i,
           /find (properties|listings|homes)/i,
           /search for (properties|listings)/i,
           /listings in (coronado|downtown|la jolla)/i,
           /under (\$?\d+(\.\d+)?)?\s*(million|mil|k)/i,
           /properties under/i,
           /show me.*coronado.*under.*million/i
         ],
         response: 'property_search_response',
         requiresTools: true,
         primaryTool: 'web_scraper',
         supportingTools: ['market_analyzer', 'document_processor']
       },

       // ENTERPRISE LEAD GENERATION
       lead_generation: {
         patterns: [
           /generate leads/i,
           /find prospects/i,
           /lead generation/i,
           /leads for.*luxury/i,
           /prospect.*downtown/i,
           /find buyers/i,
           /potential clients/i
         ],
         response: 'lead_generation_response',
         requiresTools: true,
         primaryTool: 'lead_generator',
         supportingTools: ['crm', 'web_scraper', 'email_processor']
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
 
       // EMAIL & COMMUNICATION AUTOMATION
       email_automation: {
         patterns: [
           /send (an email|email)/i,
           /email (blast|campaign)/i,
           /follow up (with|email)/i,
           /create (email|template)/i,
           /schedule email/i,
           /mass email/i
         ],
         response: 'email_automation_response',
         requiresTools: true,
         primaryTool: 'gmail',
         supportingTools: ['crm', 'template_engine']
       },

       // SMS & COMMUNICATION
       sms_communication: {
         patterns: [
           /send (sms|text)/i,
           /text message/i,
           /sms (blast|campaign)/i,
           /call.*client/i,
           /phone.*follow up/i
         ],
         response: 'sms_communication_response',
         requiresTools: true,
         primaryTool: 'twilio',
         supportingTools: ['crm', 'calendar']
       },

       // CALENDAR & SCHEDULING
       calendar_management: {
         patterns: [
           /schedule (meeting|appointment)/i,
           /book.*appointment/i,
           /calendar/i,
           /meeting.*tomorrow/i,
           /appointment.*client/i,
           /reschedule/i
         ],
         response: 'calendar_management_response',
         requiresTools: true,
         primaryTool: 'calendar',
         supportingTools: ['gmail', 'twilio']
       },

       // CRM & CLIENT MANAGEMENT
       client_management: {
         patterns: [
           /add.*client/i,
           /update.*crm/i,
           /client.*profile/i,
           /contact.*information/i,
           /client.*status/i,
           /lead.*status/i
         ],
         response: 'client_management_response',
         requiresTools: true,
         primaryTool: 'crm',
         supportingTools: ['document_processor', 'gmail']
       },

       // DOCUMENT PROCESSING & CONTRACTS
       document_processing: {
         patterns: [
           /review.*contract/i,
           /analyze.*document/i,
           /process.*pdf/i,
           /extract.*information/i,
           /generate.*report/i,
           /create.*document/i
         ],
         response: 'document_processing_response',
         requiresTools: true,
         primaryTool: 'document_processor',
         supportingTools: ['file_processor', 'template_engine']
       },

       // MARKET ANALYSIS & RESEARCH
       market_analysis: {
         patterns: [
           /market.*analysis/i,
           /property.*valuation/i,
           /comparable.*sales/i,
           /market.*trends/i,
           /analyze.*market/i,
           /property.*value/i
         ],
         response: 'market_analysis_response',
         requiresTools: true,
         primaryTool: 'market_analyzer',
         supportingTools: ['web_scraper', 'data_processor']
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
         "Hello! Great to see you again. I have access to 93 enterprise tools to help with your real estate business. What can I help you with today?",
         "Hi there! Ready to assist you with property search, lead generation, client management, and more using my full suite of tools.",
         "Good to chat with you! I can handle everything from web scraping to workflow automation. What's on your agenda?"
       ],

       // ENTERPRISE PROPERTY SEARCH RESPONSES
       property_search_response: [
         "🏠 I'll search for properties matching your criteria using web scraping and market analysis tools. Let me gather that information for you.",
         "🔍 Searching properties now - I'll scrape multiple listing sources and analyze market data to find the best matches.",
         "🏡 Property search initiated! I'm using advanced web scraping tools to find listings that meet your requirements."
       ],

       // ENTERPRISE LEAD GENERATION RESPONSES  
       lead_generation_response: [
         "🎯 Starting lead generation process using web scraping, CRM integration, and automated outreach tools.",
         "📊 I'll generate qualified leads using my enterprise toolkit - web scraping, data processing, and CRM automation.",
         "🚀 Lead generation workflow activated! Using 87 MCP tools to identify and qualify potential clients."
       ],

       // EMAIL AUTOMATION RESPONSES
       email_automation_response: [
         "📧 Setting up email automation using Gmail integration and CRM data. I'll create personalized campaigns.",
         "✉️ Email workflow initiated - I'm coordinating Gmail tools with your CRM for automated follow-ups.",
         "📨 Creating email automation sequence with personalized templates and automated scheduling."
       ],

       // SMS & COMMUNICATION RESPONSES
       sms_communication_response: [
         "📱 Setting up SMS communication using Twilio integration and CRM data for targeted outreach.",
         "💬 SMS campaign initiated - I'll coordinate text messaging with your calendar and client data.",
         "📲 Creating automated SMS sequences with personalized messaging based on client profiles."
       ],

       // CALENDAR MANAGEMENT RESPONSES
       calendar_management_response: [
         "📅 Managing your calendar - I'll coordinate scheduling with Gmail notifications and client communications.",
         "⏰ Calendar workflow activated - scheduling appointments with automated confirmations and reminders.",
         "🗓️ Setting up calendar automation with integrated client communications and follow-up sequences."
       ],

       // CLIENT MANAGEMENT RESPONSES
       client_management_response: [
         "👥 Updating client information using CRM integration and document processing tools.",
         "📋 Client management workflow started - I'll coordinate CRM updates with communication tools.",
         "🔄 Processing client data with automated CRM updates and communication triggers."
       ],

       // DOCUMENT PROCESSING RESPONSES
       document_processing_response: [
         "📄 Processing documents using advanced analysis tools - extracting key information and generating reports.",
         "📋 Document workflow initiated - I'll analyze, extract data, and create comprehensive reports.",
         "🔍 Advanced document processing active - analyzing content and generating actionable insights."
       ],

       // MARKET ANALYSIS RESPONSES
       market_analysis_response: [
         "📈 Conducting market analysis using web scraping and data processing tools for comprehensive insights.",
         "🏘️ Market research workflow started - I'll gather data from multiple sources and generate analysis.",
         "💹 Advanced market analysis initiated - combining web data with analytical tools for market insights."
       ],
 
       task_coordination: [
         "I'd be happy to help you with that. Let me coordinate the right tools from my 93-tool enterprise suite.",
         "Absolutely! Let me organize the best approach using super-tools and Claude Flow MCP automation.",
         "I can definitely assist with that. Give me a moment to coordinate the optimal tool combination."
       ],
 
       memory_retrieval: [
         'Yes, I remember our conversation about that. Let me pull up the details from my persistent memory.',
         'Of course! I have that information from our previous discussion stored in my memory system.',
         "That's right - I recall we covered that topic. Let me find the specifics from our conversation history."
       ],
 
       gracious_acknowledgment: [
         "You're very welcome! I'm here with 93 enterprise tools whenever you need assistance.",
         'My pleasure! Is there anything else I can help you with using my full automation suite?',
         'Happy to help! Let me know if you need any other enterprise workflows or automation.'
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
         message, // current text available downstream
         primaryTool: patternMatch.primaryTool,
         supportingTools: patternMatch.supportingTools || [],
         toolConfig: patternMatch.toolConfig
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
             responseType: config.response,
             primaryTool: config.primaryTool,
             supportingTools: config.supportingTools || [],
             toolConfig: config
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
       // MCP-FIRST APPROACH: Direct tool execution using Claude Flow MCP standards
       const intent = responseStrategy.responseType;
       const message = enhancedContext.currentUserMessage || '';
       
       this.logger.debug('🔧 Executing MCP tools', {
         intent,
         message: message.substring(0, 100) + '...'
       });

       const mcpResults = await this.executeMCPTools(intent, message, enhancedContext);
       
       return {
         toolsUsed: mcpResults.toolsUsed || [],
         results: mcpResults.results || {},
         coordination: 'mcp_direct',
         executionTime: mcpResults.executionTime || 0,
         mcpCompliant: true
       };
       
     } catch (error) {
       this.logger.error('❌ MCP tool execution failed', error);
       
       // Fallback to legacy orchestrator if MCP fails
       try {
         this.logger.warn('🔄 Falling back to legacy tool orchestrator');
         const toolRequest = {
           intent: responseStrategy.responseType,
           context: enhancedContext,
           priority: responseStrategy.priority
         };
         const fallbackResults = await this.toolOrchestrator.coordinateTools(toolRequest);
         
         return {
           toolsUsed: fallbackResults.toolsExecuted || [],
           results: fallbackResults.results || {},
           coordination: 'legacy_fallback',
           error: error.message
         };
       } catch (fallbackError) {
         return {
           toolsUsed: [],
           coordination: 'failed',
           error: `MCP failed: ${error.message}, Fallback failed: ${fallbackError.message}`
         };
       }
     }
   }

   async executeMCPTools(intent, message, context) {
     const startTime = Date.now();
     const MCPClient = require('../tools/mcp-client');
     const mcpClient = new MCPClient();
     
     const results = [];
     const toolsUsed = [];
     
     // Intent-based tool mapping following Claude Flow MCP patterns
     switch (intent) {
       case 'email_automation':
         const emailResult = await this.handleEmailAutomation(mcpClient, message, context);
         results.push(emailResult);
         toolsUsed.push('email_processor');
         break;
         
       case 'task_request':
         const taskResult = await this.handleTaskRequest(mcpClient, message, context);
         results.push(taskResult);
         toolsUsed.push('task_manager');
         break;
         
       case 'lead_generation':
         const leadResult = await this.handleLeadGeneration(mcpClient, message, context);
         results.push(leadResult);
         toolsUsed.push('neural_analyzer');
         break;
         
       default:
         // General analysis for unknown intents
         const analysisResult = await mcpClient.analyzeContent(message, intent);
         results.push(analysisResult);
         toolsUsed.push('neural_analyzer');
     }
     
     return {
       toolsUsed,
       results,
       executionTime: Date.now() - startTime,
       mcpCompliant: true
     };
   }

   async handleEmailAutomation(mcpClient, message, context) {
     // Extract email details from message
     const emailMatch = message.match(/send.*email.*to\s+([^\s]+)/i);
     const subjectMatch = message.match(/subject\s+(.+)/i);
     
     const recipient = emailMatch ? emailMatch[1] : 'unknown@example.com';
     const subject = subjectMatch ? subjectMatch[1] : 'Message from SolAI';
     const body = `Hello,\n\nThis is an automated message generated by SolAI v2.\n\nOriginal request: ${message}\n\nBest regards,\nSolAI Team`;
     
     return await mcpClient.sendEmail(recipient, subject, body);
   }

   async handleTaskRequest(mcpClient, message, context) {
     const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
     return await mcpClient.createTask(title, message, 'medium');
   }

   async handleLeadGeneration(mcpClient, message, context) {
     return await mcpClient.analyzeContent(message, 'lead_qualification');
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
