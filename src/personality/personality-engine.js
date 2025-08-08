/**
 * 🎭 SolAI Personality Engine
 * Adaptive communication styles and intelligent response generation
 */

const Logger = require('../core/logger');
const axios = require('axios');

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
        professionalism: 0.85,     // Professional but approachable
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
        emotionalIntelligence: 'high', // Low, medium, high
        creativitySeminar: 'moderate', // Conservative, moderate, creative
        assertiveness: 'moderate'     // Passive, moderate, assertive
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
          "Hello! Great to connect with you. How can I support your work today?",
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
          "Absolutely! I can see exactly what you need. Let me organize the best approach for you.",
          "Perfect timing - I can handle that for you. Let me set up everything to make this seamless."
        ],
        supportive: [
          "I'm here to support you with that. Let me work through the details and coordinate what's needed.",
          "Of course I can help! Let me organize this so it's as smooth as possible for you.",
          "I'd be happy to assist with that. Let me coordinate the right resources for your needs."
        ]
      },
      
      explanation: {
        detailed: [
          "Let me walk you through this step by step so you have complete clarity.",
          "Here's what's happening and why it matters for your situation:",
          "I'll explain this thoroughly so you can make the best decision:"
        ],
        concise: [
          "Here's the key information you need:",
          "Bottom line - here's what matters most:",
          "The essential details are:"
        ]
      },
      
      problem_solving: {
        analytical: [
          "Let me analyze this situation and identify the best solutions for you.",
          "I can see several ways to approach this. Let me break down your options:",
          "Here's how we can solve this systematically:"
        ],
        creative: [
          "This is an interesting challenge! Let me suggest some creative approaches:",
          "I have some ideas that might work really well for this situation:",
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
          "Would it be helpful if I also looked into related areas that might impact this?",
          "What other aspects of this situation should we consider together?"
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
    // For now, use defaults - in Story 2 we'll add custom config files
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

  async generateResponse(params) {
    const timer = this.logger.startTimer('response-generation');
    
    try {
      const { strategy, context, toolResults, timestamp } = params;
      
      // Analyze user communication style for adaptation
      const userStyle = this.analyzeUserStyle(context);
      
      // Apply personality adaptations based on context
      const adaptedPersonality = this.adaptPersonality(strategy, userStyle, context);
      
      // Generate response using AI model
      const response = await this.generateAIResponse(strategy, context, toolResults, adaptedPersonality);
      
      // Apply personality styling to response
      const styledResponse = this.applyPersonalityStyling(response, adaptedPersonality, userStyle);
      
      timer.end('Response generation completed');
      
      return {
        content: styledResponse.content,
        personalityApplication: {
          adaptations: adaptedPersonality.adaptations,
          userStyleDetected: userStyle,
          templateUsed: styledResponse.template,
          confidence: styledResponse.confidence
        },
        processingTime: timer.duration || 0
      };
      
    } catch (error) {
      timer.end('Response generation failed');
      this.logger.error('❌ Response generation failed', error);
      
      // Return safe fallback
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

    if (!context || !context.conversationHistory) {
      return style;
    }

    const recentMessages = context.conversationHistory.slice(-3);
    
    for (const turn of recentMessages) {
      if (!turn.message) continue;
      
      const message = turn.message.toLowerCase();
      
      // Detect formality level
      if (message.includes('please') || message.includes('thank you') || message.includes('appreciate')) {
        style.formality = 'high';
      } else if (message.includes('hey') || message.includes('yeah') || message.includes('cool')) {
        style.formality = 'low';
      }
      
      // Detect detail preference
      if (message.includes('details') || message.includes('explain') || message.includes('how')) {
        style.detail_preference = 'high';
      } else if (message.includes('quick') || message.includes('brief') || message.includes('summary')) {
        style.detail_preference = 'low';
      }
      
      // Detect emotional state
      if (turn.analysis?.emotionalContext) {
        style.emotional_state = turn.analysis.emotionalContext.primaryEmotion;
      }
      
      // Detect business context
      if (message.includes('client') || message.includes('property') || message.includes('business')) {
        style.business_context = true;
      }
    }

    return style;
  }

  adaptPersonality(strategy, userStyle, context) {
    const adaptations = [];
    let adaptedPersonality = { ...this.activePersonality };

    // Adapt based on user's emotional state
    if (userStyle.emotional_state !== 'neutral') {
      const emotionalRule = this.adaptationRules.emotional_responses[userStyle.emotional_state];
      if (emotionalRule) {
        adaptations.push(`emotional_${userStyle.emotional_state}`);
        // Apply emotional adaptations
        if (emotionalRule.tone) adaptedPersonality.tone = emotionalRule.tone;
        if (emotionalRule.structure) adaptedPersonality.structure = emotionalRule.structure;
      }
    }

    // Adapt based on formality level
    if (userStyle.formality === 'high') {
      adaptedPersonality.traits.professionalism = Math.min(0.95, adaptedPersonality.traits.professionalism + 0.1);
      adaptations.push('increased_professionalism');
    } else if (userStyle.formality === 'low') {
      adaptedPersonality.traits.warmth = Math.min(0.95, adaptedPersonality.traits.warmth + 0.15);
      adaptations.push('increased_warmth');
    }

    // Adapt based on detail preference
    if (userStyle.detail_preference === 'high') {
      adaptedPersonality.responseCharacteristics.averageLength = 'detailed';
      adaptedPersonality.responseCharacteristics.technicalDetail = 'high';
      adaptations.push('detailed_responses');
    } else if (userStyle.detail_preference === 'low') {
      adaptedPersonality.responseCharacteristics.averageLength = 'brief';
      adaptations.push('concise_responses');
    }

    // Adapt based on business context
    if (userStyle.business_context) {
      const businessProfile = this.adaptationProfiles.business_focused;
      adaptedPersonality.traits.professionalism = businessProfile.professionalism;
      adaptedPersonality.responseCharacteristics.efficiency = businessProfile.efficiency;
      adaptations.push('business_focused');
    }

    return {
      ...adaptedPersonality,
      adaptations
    };
  }

  async generateAIResponse(strategy, context, toolResults, personality) {
    this.totalRequests++;
    
    try {
      const prompt = this.constructPersonalityPrompt(strategy, context, toolResults, personality);
      
      // PERFORMANCE: Check cache first
      const cacheKey = this.generateCacheKey(strategy, prompt, personality);
      if (this.responseCache.has(cacheKey)) {
        this.cacheHitRate = ((this.cacheHitRate * (this.totalRequests - 1)) + 1) / this.totalRequests;
        this.logger.debug('Cache hit', { hitRate: (this.cacheHitRate * 100).toFixed(1) + '%' });
        
        const cached = this.responseCache.get(cacheKey);
        return {
          ...cached,
          cached: true
        };
      }

      // LAZY LOADING: Initialize model on first use
      if (!this.aiConfig.primaryModel.initialized) {
        await this.initializeModel('primary');
      }
      
      const response = await axios.post(this.aiConfig.primaryModel.endpoint, {
        model: this.aiConfig.primaryModel.model,
        messages: [
          {
            role: 'system',
            content: prompt.systemPrompt
          },
          {
            role: 'user',
            content: prompt.userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9
      }, {
        headers: {
          'Authorization': `Bearer ${this.aiConfig.primaryModel.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const result = {
        content: response.data.choices[0]?.message?.content || '',
        model: this.aiConfig.primaryModel.name,
        success: true,
        cached: false
      };

      // Cache the response
      this.cacheResponse(cacheKey, result);
      
      return result;
      
    } catch (error) {
      this.logger.error('❌ AI response generation failed', error);
      
      // Try fallback model
      if (!this.aiConfig.fallbackModel.initialized) {
        try {
          await this.initializeModel('fallback');
          return this.generateFallbackAIResponse(strategy, context, toolResults, personality);
        } catch (fallbackError) {
          this.logger.error('❌ Fallback model also failed', fallbackError);
        }
      }
      
      // Return template-based response
      return this.generateTemplateResponse(strategy, personality);
    }
  }

  async initializeModel(modelType) {
    const modelConfig = modelType === 'primary' ? this.aiConfig.primaryModel : this.aiConfig.fallbackModel;
    
    try {
      // Simple connection test
      const testResponse = await axios.post(modelConfig.endpoint, {
        model: modelConfig.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      }, {
        headers: {
          'Authorization': `Bearer ${modelConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      modelConfig.initialized = true;
      this.logger.debug(`✅ ${modelConfig.name} initialized and tested`);
      
    } catch (error) {
      this.logger.warn(`⚠️ ${modelConfig.name} initialization failed, will retry on next use`, error.message);
      // Don't throw - allow system to continue with templates
    }
  }

  generateCacheKey(strategy, prompt, personality) {
    // Create hash-like key for similar requests
    const keyData = {
      responseType: strategy.responseType,
      personalityAdjustment: strategy.personalityAdjustment,
      promptHash: prompt.userPrompt.substring(0, 100), // First 100 chars
      traits: {
        professionalism: personality.traits.professionalism,
        warmth: personality.traits.warmth
      }
    };
    
    return JSON.stringify(keyData).replace(/\s/g, '');
  }

  cacheResponse(key, result) {
    // Implement LRU cache
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
    // Similar to primary but uses fallback model
    try {
      const prompt = this.constructPersonalityPrompt(strategy, context, toolResults, personality);
      
      const response = await axios.post(this.aiConfig.fallbackModel.endpoint, {
        model: this.aiConfig.fallbackModel.model,
        messages: [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: prompt.userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.aiConfig.fallbackModel.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // Longer timeout for fallback
      });

      return {
        content: response.data.choices[0]?.message?.content || '',
        model: this.aiConfig.fallbackModel.name,
        success: true,
        fallback: true
      };
    } catch (error) {
      this.logger.error('❌ Fallback AI response failed', error);
      return this.generateTemplateResponse(strategy, personality);
    }
  }

  constructPersonalityPrompt(strategy, context, toolResults, personality) {
    const systemPrompt = `You are SolAI, an intelligent AI assistant for real estate professionals. Your personality traits:

- Professionalism: ${personality.traits.professionalism} (0-1 scale)
- Helpfulness: ${personality.traits.helpfulness} (0-1 scale)
- Warmth: ${personality.traits.warmth} (0-1 scale)
- Proactivity: ${personality.traits.proactivity} (0-1 scale)

Communication Style:
- Response length: ${personality.responseCharacteristics.averageLength}
- Technical detail: ${personality.responseCharacteristics.technicalDetail}
- Always maintain context from previous conversations
- Ask thoughtful follow-up questions when appropriate
- Be transparent about your reasoning and limitations
- Offer alternatives and multiple approaches when helpful

Current strategy: ${strategy.responseType}
Emotional adjustment: ${strategy.personalityAdjustment}

${toolResults.toolsUsed?.length ? `Tool results available: ${toolResults.toolsUsed.join(', ')}` : 'No tools were used.'}`;

    const userPrompt = this.constructUserContextPrompt(context, strategy);

    return { systemPrompt, userPrompt };
  }

  constructUserContextPrompt(context, strategy) {
    let prompt = '';

    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      prompt += 'Recent conversation context:\n';
      context.conversationHistory.slice(-2).forEach(turn => {
        if (turn.message) prompt += `User: ${turn.message}\n`;
        if (turn.response) prompt += `Assistant: ${turn.response}\n`;
      });
      prompt += '\n';
    }

    // Add current context
    if (context.enhanced && context.relevantMemory) {
      prompt += 'Relevant information from previous conversations:\n';
      if (context.relevantMemory.discussions) {
        context.relevantMemory.discussions.forEach(discussion => {
          prompt += `- ${discussion.user_message || discussion.message}\n`;
        });
      }
      prompt += '\n';
    }

    prompt += `Please respond according to the strategy "${strategy.responseType}" and apply the personality adjustments for "${strategy.personalityAdjustment}".`;

    return prompt;
  }

  generateTemplateResponse(strategy, personality) {
    // Fallback to template-based responses when AI generation fails
    const templates = this.responseTemplates[strategy.responseType] || this.responseTemplates.task_coordination;
    
    let templateCategory = 'supportive';
    if (personality.traits.proactivity > 0.8) templateCategory = 'proactive';
    if (personality.responseCharacteristics.averageLength === 'detailed') templateCategory = 'detailed';
    
    const availableTemplates = templates[templateCategory] || templates.supportive || templates[Object.keys(templates)[0]];
    const selectedTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    
    return {
      content: this.personalizeTemplate(selectedTemplate, personality),
      model: 'template',
      success: true
    };
  }

  personalizeTemplate(template, personality) {
    // Replace placeholders and adjust tone
    let personalized = template;
    
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    if (hour >= 17) timeOfDay = 'evening';
    
    personalized = personalized.replace(/{timeOfDay}/g, timeOfDay);
    
    // Apply personality adjustments to tone
    if (personality.traits.warmth > 0.8) {
      personalized = personalized.replace(/I'd/g, "I'd really");
      personalized = personalized.replace(/help/g, "love to help");
    }
    
    return personalized;
  }

  applyPersonalityStyling(response, personality, userStyle) {
    let styledContent = response.content;
    let confidence = 0.8;
    let template = 'ai_generated';

    // Adjust response length based on personality
    if (personality.responseCharacteristics.averageLength === 'brief' && styledContent.length > 300) {
      // Summarize for brief preference
      const sentences = styledContent.split('. ');
      styledContent = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
      template = 'shortened';
    }

    // Add follow-up question if personality is curious
    if (personality.traits.curiosity > 0.8 && !styledContent.includes('?')) {
      const followUps = [
        " What would be most helpful for you to focus on next?",
        " Is there a particular aspect of this you'd like me to dive deeper into?",
        " How does this align with what you were thinking?"
      ];
      styledContent += followUps[Math.floor(Math.random() * followUps.length)];
      template = 'with_followup';
    }

    return {
      content: styledContent,
      template,
      confidence
    };
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
      // Update personality settings for this session
      // In Story 2, we'll add persistent personality profiles
      this.logger.debug('Personality configuration updated', { 
        sessionId: sessionId.substring(0, 8),
        config: Object.keys(personalityConfig)
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