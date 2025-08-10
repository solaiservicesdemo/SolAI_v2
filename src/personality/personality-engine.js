/**
 * 🎭 SolAI Personality Engine
 * Adaptive communication styles and intelligent response generation
 */

 const Logger = require('../core/logger');
 const axios = require('axios');
 
 // === Answer-first baseline system prompt ===
 const BASE_SYSTEM_PROMPT = `
 You are SolAI. You are intelligent and can answer any kind of questions, not only real estate. Default to ANSWER-FIRST: provide a concrete, helpful answer immediately.
 Use clarifying questions only if absolutely necessary to avoid a wrong action.
 
 Rules:
 - Question budget: You may ask at most 1 clarifying question if truly needed.
 - If the user says "just answer", "no questions", "stop asking", "pls gimme ans", or "bro" (in frustration), question budget = 0.
 - Do not repeat the user's constraints back verbatim. Summarize once, briefly (<=1 line), only if it helps.
 - Synthesize: propose a plan, 3–5 concrete options with pros/cons, then next steps.
 - If assumptions are needed, state them in one short line and proceed.
 - Be concise. Use bullets for lists. No filler.

 CRITICAL APPOINTMENT RULES:
 - NEVER promise or confirm appointments on behalf of the realtor without explicit approval
 - NEVER say "I'll schedule you for..." or "You're confirmed for..." 
 - ALWAYS use: "I'd be happy to check [Name]'s availability for [time/date]. Let me reach out to them and get back to you within 30 minutes with confirmation."
 - For appointment changes: Create notification for realtor with counter-offer options
 - Only confirm appointments after BOTH parties have explicitly agreed
 `.trim();
 
 // === Real-estate buyer template (domain-specific structure) ===
 const RE_BUY_TEMPLATE = `
 When the user asks for a Coronado (or similar) 2BR condo search, answer with this structure:
 
 1) Snapshot (one line): price band, key must-haves, timing.
 2) Top Picks (3–5 buildings/areas): for each include:
    - Why it fits the brief
    - Typical 2BR price range
    - HOA notes (pet policy, covered parking)
    - Walkability / beach distance (approx)
 3) Rental Reality: short-term policy (e.g., 30-day rules), expected occupancy for occasional rental,
    conservative nightly/weekly revenue range (mark as estimate).
 4) Risks & Trade-offs: inventory scarcity, HOA restrictions, seasonality, assessments.
 5) Estimated Monthly Cost (ballpark): P&I (assume 20–25% down at current rate), HOA range, taxes, insurance.
 6) Next 3 steps: shortlist 3 buildings, schedule tours, lender pre-qual/proof-of-funds checklist.
 
 If information is uncertain, mark "to verify" and proceed. Only ask a follow-up if question_budget>0.
 `.trim();
 
 // Phrases that flip the assistant into "no questions" mode
 const NOQ_PATTERNS = [
   /just answer/i,
   /no questions/i,
   /stop asking/i,
   /\bbro\b/i,
   /pls gimme ans/i,
   /don['’]t ask/i
 ];
 
 class PersonalityEngine {
   constructor() {
     this.logger = new Logger('PersonalityEngine');
     this.initialized = false;
 
     this.setupPersonalityProfiles();
     this.setupResponseTemplates();
     this.setupAdaptationRules();
   }
 
   async initialize() {
     this.logger.info('🎭 Initializing personality engine...');
     try {
       await this.loadPersonalityConfiguration();
       await this.setupAIModelIntegration();
       this.initialized = true;
       this.logger.info('✅ Personality engine initialized successfully');
     } catch (error) {
       this.logger.error('❌ Failed to initialize personality engine', error);
       throw error;
     }
   }
 
   setupPersonalityProfiles() {
     // Core personality configuration
     this.basePersonality = {
       traits: {
         professionalism: 0.85,    // Professional but approachable
         curiosity: 0.9,           // Ask follow-up questions
         helpfulness: 0.95,        // Always try to help
         transparency: 0.9,        // Explain reasoning clearly
         adaptability: 0.85,       // Adjust to user style
         proactivity: 0.8,         // Take initiative appropriately
         warmth: 0.75,             // Friendly but not overly casual
         intelligence: 0.9         // Demonstrate understanding and insight
       },
 
       communicationStyle: {
         explainReasoning: true,
         askFollowUps: true,
         admitUncertainty: true,
         offerAlternatives: true,
         maintainContext: true,
         showPersonality: true,
         professionalTone: true,
         adaptToUser: true
       },
 
       responseCharacteristics: {
         averageLength: 'medium',      // Brief, medium, detailed
         technicalDetail: 'moderate',  // Low, moderate, high
         emotionalIntelligence: 'high',
         creativitySeminar: 'moderate',
         assertiveness: 'moderate'
       }
     };
 
     // Adaptation profiles for different user types
     this.adaptationProfiles = {
       business_focused: {
         professionalism: 0.95,
         directness: 0.85,
         efficiency: 0.9,
         detailLevel: 'concise'
       },
 
       relationship_focused: {
         warmth: 0.9,
         personalTouch: 0.85,
         patience: 0.95,
         detailLevel: 'comprehensive'
       },
 
       technical_focused: {
         technicalDetail: 'high',
         precision: 0.95,
         systematicApproach: 0.9,
         detailLevel: 'detailed'
       },
 
       casual_friendly: {
         warmth: 0.95,
         informality: 0.7,
         humor: 0.6,
         detailLevel: 'medium'
       }
     };
   }
 
   setupResponseTemplates() {
     this.responseTemplates = {
       greeting: {
         professional: [
           "Good {timeOfDay}! I'm here to help you with your real estate business today. What can I assist you with?",
           'Hello! Great to connect with you. How can I support your work today?',
           "Hi there! I'm ready to help you tackle whatever's on your agenda. What would you like to focus on?"
         ],
         warm: [
           "Hey! So good to chat with you again! What's happening in your world today?",
           "Hello! I've been looking forward to our conversation. What can we dive into?",
           "Hi! Hope you're having a great day. What can I help you accomplish?"
         ]
       },
 
       task_coordination: {
         proactive: [
           "I'd love to help you with that! Let me coordinate everything needed to get this done efficiently.",
           'Absolutely! I can see exactly what you need. Let me organize the best approach for you.',
           'Perfect timing - I can handle that for you. Let me set up everything to make this seamless.'
         ],
         supportive: [
           "I'm here to support you with that. Let me work through the details and coordinate what's needed.",
           "Of course I can help! Let me organize this so it's as smooth as possible for you.",
           "I'd be happy to assist with that. Let me coordinate the right resources for your needs."
         ]
       },
 
       explanation: {
         detailed: [
           'Let me walk you through this step by step so you have complete clarity.',
           "Here's what's happening and why it matters for your situation:",
           "I'll explain this thoroughly so you can make the best decision:"
         ],
         concise: [
           "Here's the key information you need:",
           "Bottom line - here's what matters most:",
           'The essential details are:'
         ]
       },
 
       problem_solving: {
         analytical: [
           'Let me analyze this situation and identify the best solutions for you.',
           'I can see several ways to approach this. Let me break down your options:',
           "Here's how we can solve this systematically:"
         ],
         creative: [
           'This is an interesting challenge! Let me suggest some creative approaches:',
           'I have some ideas that might work really well for this situation:',
           "Here are some solutions you might not have considered:"
         ]
       },
 
       follow_up: {
         checking_in: [
           "How does this approach sound to you? Is there anything you'd like me to adjust?",
           "Does this align with what you were thinking? I'm happy to refine the approach.",
           "What's your take on this? I can modify the plan based on your feedback."
         ],
         offering_more: [
           "Is there anything else I can help you with while we're discussing this?",
           'Would it be helpful if I also looked into related areas that might impact this?',
           'What other aspects of this situation should we consider together?'
         ]
       }
     };
   }
 
   setupAdaptationRules() {
     this.adaptationRules = {
       // Emotional state adaptations
       emotional_responses: {
         urgent: {
           responseSpeed: 'prioritize',
           tone: 'focused_efficient',
           structure: 'direct_actionable'
         },
         frustrated: {
           tone: 'extra_supportive',
           patience: 'increased',
           structure: 'step_by_step'
         },
         excited: {
           tone: 'match_enthusiasm',
           energy: 'elevated',
           structure: 'momentum_building'
         },
         concerned: {
           tone: 'reassuring',
           detail: 'comprehensive',
           structure: 'confidence_building'
         }
       },
 
       // Communication style adaptations
       style_adaptations: {
         technical_language_detected: {
           technicalDetail: 'increase',
           vocabulary: 'professional',
           structure: 'systematic'
         },
         casual_language_detected: {
           formality: 'decrease',
           warmth: 'increase',
           structure: 'conversational'
         },
         business_context_detected: {
           professionalism: 'increase',
           efficiency: 'prioritize',
           structure: 'results_focused'
         }
       },
 
       // Learning adaptations
       preference_learning: {
         prefers_brief_responses: {
           responseLength: 'shorten',
           structure: 'bullet_points'
         },
         prefers_detailed_explanations: {
           responseLength: 'expand',
           structure: 'comprehensive'
         },
         asks_many_followups: {
           anticipateQuestions: 'increase',
           proactivity: 'increase'
         }
       }
     };
   }
 
   async loadPersonalityConfiguration() {
     // Load any custom personality configurations
     this.activePersonality = { ...this.basePersonality };
     this.logger.debug('Base personality configuration loaded');
   }
 
   async setupAIModelIntegration() {
     // LAZY LOADING: Initialize AI model configs without testing connections
     this.aiConfig = {
       primaryModel: {
         name: 'Gemini-2.5-Flash',
         endpoint: 'https://openrouter.ai/api/v1/chat/completions',
         model: 'google/gemini-2.5-flash',
         apiKey: process.env.OPENROUTER_API_KEY,
         initialized: false
       },
       fallbackModel: {
         name: 'Claude-3.5-Haiku',
         endpoint: 'https://openrouter.ai/api/v1/chat/completions',
         model: 'anthropic/claude-3.5-haiku:beta',
         apiKey: process.env.OPENROUTER_API_KEY,
         initialized: false
       }
     };
 
     if (!this.aiConfig.primaryModel.apiKey) {
       throw new Error('OpenRouter API key required for personality engine');
     }
 
     // Response cache for performance optimization
     this.responseCache = new Map();
     this.maxCacheSize = 100;
     this.cacheHitRate = 0;
     this.totalRequests = 0;
 
     this.logger.debug('AI model integration configured (lazy loading enabled)');
   }
 
   // ===== helpers to control question budget & detect intent =====
   _lastUserMessage(context) {
     if (context?.currentUserMessage) return String(context.currentUserMessage);
     const hist = context?.conversationHistory || [];
     for (let i = hist.length - 1; i >= 0; i--) {
       if (hist[i]?.message) return String(hist[i].message);
     }
     return '';
   }
 
   _computeQuestionBudget(context) {
     const last = this._lastUserMessage(context);
     if (NOQ_PATTERNS.some(rx => rx.test(last))) return 0;
     if (context?.preferences?.no_followups) return 0;
     return 1; // default
   }
 
   _looksLikeRealEstateBuy(context) {
     const msg = (this._lastUserMessage(context) || '').toLowerCase();
     const hints = [
       'condo', '2br', '2-br', '2 bedroom', '2-bedroom', 'ocean view', 'hoa',
       'coronado', 'vacation home', 'rent out', 'pet-friendly', 'covered parking',
       'walking distance', 'budget', '$', 'price', 'timeline', 'months'
     ];
     return hints.some(h => msg.includes(h));
   }
 
   async generateResponse(params) {
     const timer = this.logger.startTimer('response-generation');
     try {
       const { strategy, context, toolResults } = params;
 
       // Analyze user style & adapt
       const userStyle = this.analyzeUserStyle(context);
       const adaptedPersonality = this.adaptPersonality(strategy, userStyle, context);
 
       // question budget & domain template
       const questionBudget = this._computeQuestionBudget(context);
       const useReBuyTemplate = this._looksLikeRealEstateBuy(context);
 
       // Force concise mode if preference set
       if (context?.preferences?.concise_mode || context?.preferences?.prefers_brief_responses) {
         adaptedPersonality.responseCharacteristics.averageLength = 'brief';
         adaptedPersonality.responseCharacteristics.technicalDetail = 'low';
       }
 
       // Generate response
       const response = await this.generateAIResponse(
         strategy,
         context,
         toolResults,
         adaptedPersonality,
         { questionBudget, useReBuyTemplate }
       );
 
       // Apply final styling (de-parrot, caps, follow-up control)
       const styledResponse = this.applyPersonalityStyling(
         response,
         adaptedPersonality,
         userStyle,
         { questionBudget, preferences: (context?.preferences || {}), context }
       );
 
       timer.end('Response generation completed');
 
       return {
         content: styledResponse.content,
         personalityApplication: {
           adaptations: adaptedPersonality.adaptations,
           userStyleDetected: userStyle,
           templateUsed: styledResponse.template,
           confidence: styledResponse.confidence,
           questionBudget
         },
         processingTime: timer.duration || 0
       };
     } catch (error) {
       timer.end('Response generation failed');
       this.logger.error('❌ Response generation failed', error);
 
       return {
         content: this.generateFallbackResponse(params.strategy),
         personalityApplication: { fallback: true },
         processingTime: 0
       };
     }
   }
 
   analyzeUserStyle(context) {
     const style = {
       formality: 'medium',
       detail_preference: 'medium',
       communication_pace: 'medium',
       emotional_state: 'neutral',
       business_context: false,
       technical_level: 'medium'
     };
 
     if (!context || !context.conversationHistory) return style;
 
     const recent = context.conversationHistory.slice(-3);
     for (const turn of recent) {
       if (!turn.message) continue;
       const message = turn.message.toLowerCase();
 
       if (message.includes('please') || message.includes('thank you') || message.includes('appreciate')) {
         style.formality = 'high';
       } else if (message.includes('hey') || message.includes('yeah') || message.includes('cool') || message.includes('bro')) {
         style.formality = 'low';
       }
 
       if (message.includes('details') || message.includes('explain') || message.includes('how')) {
         style.detail_preference = 'high';
       } else if (message.includes('quick') || message.includes('brief') || message.includes('summary')) {
         style.detail_preference = 'low';
       }
 
       if (turn.analysis?.emotionalContext) {
         style.emotional_state = turn.analysis.emotionalContext.primaryEmotion;
       }
 
       if (message.includes('client') || message.includes('property') || message.includes('business') || message.includes('condo')) {
         style.business_context = true;
       }
     }
 
     return style;
   }
 
   adaptPersonality(strategy, userStyle) {
     const adaptations = [];
     let adaptedPersonality = { ...this.activePersonality };
 
     if (userStyle.emotional_state !== 'neutral') {
       const emotionalRule = this.adaptationRules.emotional_responses[userStyle.emotional_state];
       if (emotionalRule) {
         adaptations.push(`emotional_${userStyle.emotional_state}`);
         if (emotionalRule.tone) adaptedPersonality.tone = emotionalRule.tone;
         if (emotionalRule.structure) adaptedPersonality.structure = emotionalRule.structure;
       }
     }
 
     if (userStyle.formality === 'high') {
       adaptedPersonality.traits.professionalism = Math.min(0.95, adaptedPersonality.traits.professionalism + 0.1);
       adaptations.push('increased_professionalism');
     } else if (userStyle.formality === 'low') {
       adaptedPersonality.traits.warmth = Math.min(0.95, adaptedPersonality.traits.warmth + 0.15);
       adaptations.push('increased_warmth');
     }
 
     if (userStyle.detail_preference === 'high') {
       adaptedPersonality.responseCharacteristics.averageLength = 'detailed';
       adaptedPersonality.responseCharacteristics.technicalDetail = 'high';
       adaptations.push('detailed_responses');
     } else if (userStyle.detail_preference === 'low') {
       adaptedPersonality.responseCharacteristics.averageLength = 'brief';
       adaptations.push('concise_responses');
     }
 
     if (userStyle.business_context) {
       const businessProfile = this.adaptationProfiles.business_focused;
       adaptedPersonality.traits.professionalism = businessProfile.professionalism;
       adaptedPersonality.responseCharacteristics.efficiency = businessProfile.efficiency;
       adaptations.push('business_focused');
     }
 
     return { ...adaptedPersonality, adaptations };
   }
 
   async generateAIResponse(strategy, context, toolResults, personality, opts = {}) {
     this.totalRequests++;
     try {
       const { questionBudget = 1, useReBuyTemplate = false } = opts;
 
       const prompt = this.constructPersonalityPrompt(
         strategy,
         context,
         toolResults,
         personality,
         { questionBudget, useReBuyTemplate }
       );
 
       // Cache
       const cacheKey = this.generateCacheKey(strategy, prompt, personality);
       if (this.responseCache.has(cacheKey)) {
         this.cacheHitRate = ((this.cacheHitRate * (this.totalRequests - 1)) + 1) / this.totalRequests;
         this.logger.debug('Cache hit', { hitRate: `${(this.cacheHitRate * 100).toFixed(1)}%` });
         const cached = this.responseCache.get(cacheKey);
         return { ...cached, cached: true };
       }
 
       // Lazy init
       if (!this.aiConfig.primaryModel.initialized) {
         await this.initializeModel('primary');
       }
 
       const response = await axios.post(
         this.aiConfig.primaryModel.endpoint,
         {
           model: this.aiConfig.primaryModel.model,
           messages: [
             { role: 'system', content: prompt.systemPrompt },
             ...(prompt.domainTemplate ? [{ role: 'system', content: prompt.domainTemplate }] : []),
             { role: 'user', content: prompt.userPrompt }
           ],
           temperature: 0.5,
           top_p: 0.9,
           max_tokens: 1100,
           frequency_penalty: 0.2
         },
         {
           headers: {
             Authorization: `Bearer ${this.aiConfig.primaryModel.apiKey}`,
             'Content-Type': 'application/json',
             ...(process.env.OPENROUTER_SITE && { 'HTTP-Referer': process.env.OPENROUTER_SITE }),
             ...(process.env.OPENROUTER_TITLE && { 'X-Title': process.env.OPENROUTER_TITLE })
           },
           timeout: 15000
         }
       );
 
       const result = {
         content: response.data.choices?.[0]?.message?.content || '',
         model: this.aiConfig.primaryModel.name,
         success: true,
         cached: false
       };
 
       this.cacheResponse(cacheKey, result);
       return result;
     } catch (error) {
       this.logger.error('❌ AI response generation failed', error);
 
       if (!this.aiConfig.fallbackModel.initialized) {
         try {
           await this.initializeModel('fallback');
           return this.generateFallbackAIResponse(strategy, context, toolResults, personality);
         } catch (fallbackError) {
           this.logger.error('❌ Fallback model also failed', fallbackError);
         }
       }
       return this.generateTemplateResponse(strategy, personality);
     }
   }
 
   async initializeModel(modelType) {
     const modelConfig = modelType === 'primary' ? this.aiConfig.primaryModel : this.aiConfig.fallbackModel;
     try {
       await axios.post(
         modelConfig.endpoint,
         {
           model: modelConfig.model,
           messages: [{ role: 'user', content: 'test' }],
           max_tokens: 5
         },
         {
           headers: {
             Authorization: `Bearer ${modelConfig.apiKey}`,
             'Content-Type': 'application/json',
             ...(process.env.OPENROUTER_SITE && { 'HTTP-Referer': process.env.OPENROUTER_SITE }),
             ...(process.env.OPENROUTER_TITLE && { 'X-Title': process.env.OPENROUTER_TITLE })
           },
           timeout: 5000
         }
       );
 
       modelConfig.initialized = true;
       this.logger.debug(`✅ ${modelConfig.name} initialized and tested`);
     } catch (error) {
       this.logger.warn(
         `⚠️ ${modelConfig.name} initialization failed, will retry on next use`,
         error.message
       );
     }
   }
 
   generateCacheKey(strategy, prompt, personality) {
     const keyData = {
       responseType: strategy.responseType,
       personalityAdjustment: strategy.personalityAdjustment,
       promptHash: prompt.userPrompt.substring(0, 100),
       traits: {
         professionalism: personality.traits.professionalism,
         warmth: personality.traits.warmth
       }
     };
     return JSON.stringify(keyData).replace(/\s/g, '');
   }
 
   cacheResponse(key, result) {
     if (this.responseCache.size >= this.maxCacheSize) {
       const firstKey = this.responseCache.keys().next().value;
       this.responseCache.delete(firstKey);
     }
     this.responseCache.set(key, {
       content: result.content,
       model: result.model,
       success: result.success,
       timestamp: Date.now()
     });
   }
 
   async generateFallbackAIResponse(strategy, context, toolResults, personality) {
     try {
       const prompt = this.constructPersonalityPrompt(
         strategy,
         context,
         toolResults,
         personality,
         { questionBudget: 1, useReBuyTemplate: this._looksLikeRealEstateBuy(context) }
       );
 
       const response = await axios.post(
         this.aiConfig.fallbackModel.endpoint,
         {
           model: this.aiConfig.fallbackModel.model,
           messages: [
             { role: 'system', content: prompt.systemPrompt },
             ...(prompt.domainTemplate ? [{ role: 'system', content: prompt.domainTemplate }] : []),
             { role: 'user', content: prompt.userPrompt }
           ],
           temperature: 0.5,
           top_p: 0.9,
           max_tokens: 900,
           frequency_penalty: 0.2
         },
         {
           headers: {
             Authorization: `Bearer ${this.aiConfig.fallbackModel.apiKey}`,
             'Content-Type': 'application/json',
             ...(process.env.OPENROUTER_SITE && { 'HTTP-Referer': process.env.OPENROUTER_SITE }),
             ...(process.env.OPENROUTER_TITLE && { 'X-Title': process.env.OPENROUTER_TITLE })
           },
           timeout: 20000
         }
       );
 
       return {
         content: response.data.choices?.[0]?.message?.content || '',
         model: this.aiConfig.fallbackModel.name,
         success: true,
         fallback: true
       };
     } catch (error) {
       this.logger.error('❌ Fallback AI response failed', error);
       return this.generateTemplateResponse(strategy, personality);
     }
   }
 
   constructPersonalityPrompt(strategy, context, toolResults, personality, opts = {}) {
     const { questionBudget = 1, useReBuyTemplate = false } = opts;
 
     const systemPrompt = [
       BASE_SYSTEM_PROMPT,
       `Current constraints: question_budget=${questionBudget}. If 0, do not ask questions.`,
       'You are SolAI, an intelligent AI assistant for real estate professionals.',
       `Personality: professionalism=${personality.traits.professionalism}, helpfulness=${personality.traits.helpfulness}, warmth=${personality.traits.warmth}, proactivity=${personality.traits.proactivity}.`,
       `Communication: length=${personality.responseCharacteristics.averageLength}, technical=${personality.responseCharacteristics.technicalDetail}.`,
       `${toolResults?.toolsUsed?.length ? `Tools available: ${toolResults.toolsUsed.join(', ')}` : 'No tools used this turn.'}`
     ].join('\n');
 
     // Concise prefs (defaults)
     const prefs = context?.preferences || {};
     const concise = !!prefs.concise_mode || !!prefs.prefers_brief_responses;
     const maxBullets = Number(prefs.max_bullets || 5);
     const maxSections = Number(prefs.max_sections || 2);
     const wordLimit = Number(prefs.target_word_limit || (concise ? 120 : 220));
 
     const outputRules =
       `\nOUTPUT RULES:\n` +
       `- ${concise ? 'CONCISE MODE ON' : 'Concise mode off'}\n` +
       `- Hard limit: <= ${wordLimit} words total.\n` +
       `- Max sections: ${maxSections}. Max bullets per section: ${maxBullets}.\n` +
       `- No chit-chat. No repetition. If lists exceed limits, summarize.\n` +
       `${prefs.no_followups ? '- Do NOT add a follow-up question.\n' : ''}`;
 
     const domainTemplate = useReBuyTemplate ? (RE_BUY_TEMPLATE + outputRules) : outputRules;
 
     // Build minimal user prompt
     let prompt = '';
 
     if (context?.conversationHistory?.length) {
       prompt += 'Recent conversation (condensed):\n';
       const lastTwo = context.conversationHistory.slice(-2);
       for (const turn of lastTwo) {
         const um = turn.message || '';
         const ar = turn.response || '';
         if (um) prompt += `User: ${um}\n`;
         if (ar) prompt += `Assistant: ${ar}\n`;
       }
       prompt += '\n';
     }
 
     if (context?.currentUserMessage) {
       prompt += `Current user request: ${context.currentUserMessage}\n\n`;
     }
 
     prompt += `Please respond according to the strategy "${strategy.responseType}" with adjustment "${strategy.personalityAdjustment}".\n`;
     prompt += `Do not ask questions if question_budget=0.\n`;
 
     return { systemPrompt, userPrompt: prompt, domainTemplate };
   }
 
   generateTemplateResponse(strategy, personality) {
     const templates = this.responseTemplates[strategy.responseType] || this.responseTemplates.task_coordination;
 
     let templateCategory = 'supportive';
     if (personality.traits.proactivity > 0.8) templateCategory = 'proactive';
     if (personality.responseCharacteristics.averageLength === 'detailed') templateCategory = 'detailed';
 
     const availableTemplates =
       templates[templateCategory] ||
       templates.supportive ||
       templates[Object.keys(templates)[0]];
 
     const selectedTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
 
     return {
       content: this.personalizeTemplate(selectedTemplate, personality),
       model: 'template',
       success: true
     };
   }
 
   personalizeTemplate(template, personality) {
     let personalized = template;
 
     const now = new Date();
     const hour = now.getHours();
     let timeOfDay = 'morning';
     if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
     if (hour >= 17) timeOfDay = 'evening';
 
     personalized = personalized.replace(/{timeOfDay}/g, timeOfDay);
 
     if (personality.traits.warmth > 0.8) {
       personalized = personalized.replace(/I'd/g, "I'd really");
       personalized = personalized.replace(/help/g, 'love to help');
     }
 
     return personalized;
   }
 
   applyPersonalityStyling(response, personality, userStyle, opts = {}) {
     let styledContent = response.content || '';
     let confidence = 0.85;
     let template = 'ai_generated';
     const { questionBudget = 1, preferences = {}, context } = opts;
 
     // Strip any leading "ANSWER-FIRST:" noise
     styledContent = styledContent.replace(/^\s*ANSWER-FIRST:\s*/i, '');
 
     // Trim parroting (use the *actual* last user message from context)
     const lastUserMsg = context ? this._lastUserMessage(context) : '';
     styledContent = this._deParrot(styledContent, lastUserMsg);
 
     // Enforce concise preferences
     const DEFAULTS = {
       concise_mode: false,
       max_bullets: 5,
       max_sections: 2,
       target_word_limit: 120,
       no_followups: false
     };
     const mergedPrefs = { ...DEFAULTS, ...preferences };
 
     styledContent = this._capWords(styledContent, mergedPrefs.target_word_limit);
     styledContent = this._capSectionsAndBullets(styledContent, mergedPrefs.max_sections, mergedPrefs.max_bullets);
 
     // Optional follow-up (respect no_followups & question budget)
     if (!mergedPrefs.no_followups && questionBudget > 0 && personality.traits.curiosity > 0.8 && !/\?\s*$/.test(styledContent)) {
       const followUps = [
         ' What would you like me to do next—shortlist buildings, set tour dates, or run a rental estimate?',
         ' Want me to shortlist 3 buildings and line up tours?',
         ' Should I pull HOA rules for pet policy and parking on the top picks?'
       ];
       styledContent += followUps[Math.floor(Math.random() * followUps.length)];
       template = 'with_followup';
     }
 
     return { content: styledContent, template, confidence };
   }
 
   _capWords(text, maxWords = 120) {
     const words = (text || '').trim().split(/\s+/);
     if (words.length <= maxWords) return text;
     return `${words.slice(0, maxWords).join(' ')} …`;
   }
 
   _capSectionsAndBullets(text, maxSections = 2, maxBullets = 5) {
     if (!text) return text;
     // Split on headings or horizontal rules (crude but effective)
     const parts = text.split(/\n-{3,}\n|(?=^\s*#{1,3}\s+)/m);
     let pruned = parts.slice(0, Math.max(1, maxSections)).join('\n');
     pruned = this._capBulletsInEach(pruned, maxBullets);
     return pruned;
   }
 
   _capBulletsInEach(text, maxBullets = 5) {
     const lines = text.split('\n');
     const out = [];
     let currentBullets = [];
     let inBullets = false;
 
     const flush = () => {
       if (!inBullets) return;
       if (currentBullets.length > maxBullets) {
         out.push(...currentBullets.slice(0, maxBullets));
         out.push('- …');
       } else {
         out.push(...currentBullets);
       }
       currentBullets = [];
       inBullets = false;
     };
 
     for (const line of lines) {
       if (/^\s*[-*•]\s/.test(line)) {
         inBullets = true;
         currentBullets.push(line);
       } else {
         flush();
         out.push(line);
       }
     }
     flush();
     return out.join('\n');
   }
 
   _deParrot(text = '', userMsg = '') {
     const a = (text || '').trim();
     const b = (userMsg || '').trim();
     if (!a || !b) return a;
     // If the first sentence/lines repeat the user's opening, drop that line
     const head = a.slice(0, 220).toLowerCase();
     const probe = b.slice(0, 120).toLowerCase();
     if (probe && head.includes(probe)) {
       const parts = a.split('\n');
       return parts.slice(1).join('\n').trim() || a;
     }
     return a;
   }
 
   // Kept for compatibility if used elsewhere
   constructUserContextPrompt(context, strategy) {
     let prompt = '';
 
     if (context?.conversationHistory?.length) {
       prompt += 'Recent conversation context:\n';
       context.conversationHistory.slice(-2).forEach(turn => {
         if (turn.message) prompt += `User: ${turn.message}\n`;
         if (turn.response) prompt += `Assistant: ${turn.response}\n`;
       });
       prompt += '\n';
     }
 
     prompt += `Please respond according to the strategy "${strategy.responseType}" and apply the personality adjustments for "${strategy.personalityAdjustment}".`;
     return prompt;
   }
 
   generateFallbackResponse(strategy) {
     const fallbacks = {
       greeting: "Hello! I'm here to help you with whatever you need today. What can I assist you with?",
       task_coordination: "I understand you'd like help with that. Let me coordinate the best approach for you.",
       general_conversation: "I understand what you're asking about. Let me help you with that in the best way I can.",
       problem_solving: "That's an interesting challenge. Let me think through some solutions for you."
     };
     return fallbacks[strategy.responseType] || fallbacks.general_conversation;
   }
 
   async configurePersonality(sessionId, personalityConfig) {
     try {
       this.logger.debug('Personality configuration updated', {
         sessionId: sessionId?.substring ? sessionId.substring(0, 8) : String(sessionId || ''),
         config: Object.keys(personalityConfig || {})
       });
       return { success: true };
     } catch (error) {
       this.logger.error('❌ Failed to configure personality', error);
       return { success: false, error: error.message };
     }
   }
 
   async getPersonalityStatus() {
     return {
       initialized: this.initialized,
       currentPersonality: {
         professionalism: this.activePersonality.traits.professionalism,
         helpfulness: this.activePersonality.traits.helpfulness,
         warmth: this.activePersonality.traits.warmth,
         proactivity: this.activePersonality.traits.proactivity
       },
       aiModelStatus: {
         primary: this.aiConfig.primaryModel.name,
         fallback: this.aiConfig.fallbackModel.name,
         available: !!this.aiConfig.primaryModel.apiKey
       }
     };
   }
 }
 
 module.exports = PersonalityEngine;
 