/**
 * Intent Classification Service
 * Enterprise-grade intent classification using semantic analysis and machine learning
 */

const axios = require('axios');
const Logger = require('../../../core/logger');
const Intent = require('../valueObjects/Intent');

class IntentClassificationService {
  constructor() {
    this.logger = new Logger('IntentClassificationService');
    this.initialized = false;
    
    // Classification models and confidence thresholds
    this.models = {
      primary: {
        name: 'Semantic Intent Classifier',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'google/gemini-2.5-flash',
        confidence_threshold: 0.7
      },
      fallback: {
        name: 'Pattern-based Classifier',
        confidence_threshold: 0.6
      }
    };
    
    // Intent taxonomy for real estate domain
    this.intentTaxonomy = this.buildIntentTaxonomy();
    
    // Semantic embeddings for similarity matching
    this.intentEmbeddings = new Map();
    this.embeddingService = {
      endpoint: 'https://openrouter.ai/api/v1/embeddings',
      model: 'text-embedding-3-small',
      cache: new Map(),
      maxCacheSize: 1000
    };
    
    // Performance metrics
    this.metrics = {
      totalClassifications: 0,
      accurateClassifications: 0,
      avgConfidence: 0,
      modelUsage: new Map()
    };
  }

  async initialize() {
    this.logger.info('🎯 Initializing intent classification service...');
    
    try {
      await this.validateApiAccess();
      await this.precomputeIntentEmbeddings();
      this.setupEntityRecognition();
      this.initialized = true;
      
      this.logger.info('✅ Intent classification service initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize intent classification service', error);
      throw error;
    }
  }

  async validateApiAccess() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key required for intent classification');
    }
    
    // Test API connection
    try {
      await axios.post(
        this.models.primary.endpoint,
        {
          model: this.models.primary.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      
      this.logger.debug('API connection validated');
    } catch (error) {
      if (error.response?.status === 400) {
        // Expected error for test payload, but API is accessible
        this.logger.debug('API accessible (test payload rejected as expected)');
      } else {
        throw new Error(`API validation failed: ${error.message}`);
      }
    }
  }

  buildIntentTaxonomy() {
    return {
      // Communication intents
      communication: {
        greeting: {
          aliases: ['hello', 'hi', 'good_morning', 'good_afternoon', 'hey'],
          patterns: ['greeting', 'salutation', 'introduction'],
          confidence_boost: 0.1,
          entities: []
        },
        farewell: {
          aliases: ['goodbye', 'bye', 'see_you', 'talk_soon'],
          patterns: ['farewell', 'departure', 'closing'],
          confidence_boost: 0.1,
          entities: []
        },
        appreciation: {
          aliases: ['thank_you', 'thanks', 'appreciate'],
          patterns: ['gratitude', 'acknowledgment', 'appreciation'],
          confidence_boost: 0.1,
          entities: []
        }
      },

      // Real estate specific intents
      property_search: {
        search_properties: {
          aliases: ['find_properties', 'property_search', 'listing_search', 'show_properties'],
          patterns: ['search', 'find', 'show', 'properties', 'listings', 'homes'],
          confidence_boost: 0.2,
          entities: ['location', 'propertyType', 'budget', 'bedrooms', 'bathrooms'],
          tools_required: ['web_scraper', 'market_analyzer']
        },
        property_details: {
          aliases: ['property_info', 'listing_details', 'more_info'],
          patterns: ['details', 'information', 'specs', 'features'],
          confidence_boost: 0.15,
          entities: ['property_address', 'mls_number'],
          tools_required: ['document_processor', 'web_scraper']
        }
      },

      client_management: {
        add_client: {
          aliases: ['new_client', 'client_registration', 'add_contact'],
          patterns: ['add', 'new', 'register', 'client', 'contact'],
          confidence_boost: 0.2,
          entities: ['client_name', 'phone', 'email', 'budget'],
          tools_required: ['crm']
        },
        follow_up: {
          aliases: ['client_follow_up', 'check_in', 'follow_up_call'],
          patterns: ['follow up', 'check in', 'contact', 'reach out'],
          confidence_boost: 0.15,
          entities: ['client_name', 'timeline'],
          tools_required: ['crm', 'calendar']
        }
      },

      market_analysis: {
        market_research: {
          aliases: ['market_analysis', 'market_trends', 'area_analysis'],
          patterns: ['market', 'trends', 'analysis', 'research', 'statistics'],
          confidence_boost: 0.2,
          entities: ['location', 'propertyType', 'timeline'],
          tools_required: ['market_analyzer', 'web_scraper']
        },
        property_valuation: {
          aliases: ['home_value', 'property_value', 'appraisal', 'cma'],
          patterns: ['value', 'worth', 'appraisal', 'valuation', 'price'],
          confidence_boost: 0.2,
          entities: ['property_address', 'propertyType'],
          tools_required: ['market_analyzer', 'document_processor']
        }
      },

      communication_automation: {
        send_email: {
          aliases: ['email_client', 'send_message', 'email_blast'],
          patterns: ['email', 'send', 'message', 'communicate'],
          confidence_boost: 0.2,
          entities: ['recipient', 'email_type', 'template'],
          tools_required: ['gmail', 'crm']
        },
        schedule_appointment: {
          aliases: ['book_appointment', 'schedule_meeting', 'calendar_booking'],
          patterns: ['schedule', 'book', 'appointment', 'meeting', 'showing'],
          confidence_boost: 0.2,
          entities: ['client_name', 'date_time', 'property_address'],
          tools_required: ['calendar', 'gmail']
        }
      },

      // General support
      support: {
        help_request: {
          aliases: ['help', 'assist', 'support', 'how_to'],
          patterns: ['help', 'assist', 'support', 'how', 'can you'],
          confidence_boost: 0.1,
          entities: ['topic', 'specific_need']
        },
        question: {
          aliases: ['inquiry', 'question', 'ask'],
          patterns: ['what', 'how', 'when', 'where', 'why', 'question'],
          confidence_boost: 0.05,
          entities: ['topic']
        }
      }
    };
  }

  async precomputeIntentEmbeddings() {
    this.logger.info('Computing intent embeddings for semantic matching...');
    
    const intentDescriptions = [];
    
    // Build comprehensive descriptions for each intent
    for (const [category, intents] of Object.entries(this.intentTaxonomy)) {
      for (const [intentName, intentConfig] of Object.entries(intents)) {
        const description = this.buildIntentDescription(intentName, intentConfig);
        intentDescriptions.push({
          category,
          intent: intentName,
          description,
          config: intentConfig
        });
      }
    }
    
    // Generate embeddings for all intent descriptions
    try {
      for (const intentData of intentDescriptions) {
        const embedding = await this.generateEmbedding(intentData.description);
        if (embedding) {
          this.intentEmbeddings.set(`${intentData.category}.${intentData.intent}`, {
            embedding,
            ...intentData
          });
        }
        
        // Rate limiting
        await this.sleep(100);
      }
      
      this.logger.info(`✅ Generated embeddings for ${this.intentEmbeddings.size} intents`);
    } catch (error) {
      this.logger.warn('⚠️ Failed to precompute some intent embeddings, falling back to pattern matching', error);
    }
  }

  buildIntentDescription(intentName, intentConfig) {
    const parts = [];
    
    // Add intent name
    parts.push(intentName.replace(/_/g, ' '));
    
    // Add aliases
    if (intentConfig.aliases?.length) {
      parts.push(intentConfig.aliases.join(' '));
    }
    
    // Add patterns
    if (intentConfig.patterns?.length) {
      parts.push(intentConfig.patterns.join(' '));
    }
    
    // Add context based on required tools
    if (intentConfig.tools_required?.length) {
      const toolContext = intentConfig.tools_required.map(tool => {
        if (tool === 'crm') return 'client relationship management';
        if (tool === 'web_scraper') return 'online data retrieval';
        if (tool === 'market_analyzer') return 'real estate market analysis';
        return tool.replace(/_/g, ' ');
      }).join(' ');
      parts.push(toolContext);
    }
    
    return parts.join(' ');
  }

  async generateEmbedding(text) {
    try {
      const cacheKey = `embedding_${text.substring(0, 50)}`;
      
      if (this.embeddingService.cache.has(cacheKey)) {
        return this.embeddingService.cache.get(cacheKey);
      }
      
      const response = await axios.post(
        this.embeddingService.endpoint,
        {
          model: this.embeddingService.model,
          input: text
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      const embedding = response.data.data[0].embedding;
      
      // Cache the result
      if (this.embeddingService.cache.size >= this.embeddingService.maxCacheSize) {
        const firstKey = this.embeddingService.cache.keys().next().value;
        this.embeddingService.cache.delete(firstKey);
      }
      
      this.embeddingService.cache.set(cacheKey, embedding);
      return embedding;
      
    } catch (error) {
      this.logger.error('❌ Failed to generate embedding', error);
      return null;
    }
  }

  setupEntityRecognition() {
    this.entityPatterns = {
      location: {
        patterns: [
          /\b(coronado|downtown|la jolla|del mar|encinitas|carlsbad|san diego|pacific beach|mission beach)\b/gi,
          /\b(village|bay|beach|hills|park)\s+(area|district|neighborhood)?\b/gi,
          /\bin\s+([A-Za-z\s]+?)(?:\s+area|\s+district|\s*,|\s*$)/g
        ],
        normalize: (match) => match.trim().toLowerCase()
      },
      
      budget: {
        patterns: [
          /\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|mil|k|thousand))?/gi,
          /under\s*\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|mil|k))?/gi,
          /between\s*\$?\d+.*?and\s*\$?\d+/gi,
          /budget.*?\$?\d{1,3}(?:,\d{3})*/gi
        ],
        normalize: (match) => match.replace(/[$,]/g, '').trim()
      },
      
      propertyType: {
        patterns: [
          /\b(condo|condominium|townhouse|townhome|house|home|apartment|single family|multi-family)\b/gi,
          /\b\d+\s*(?:bed|bedroom|br)\b/gi
        ],
        normalize: (match) => match.toLowerCase().trim()
      },
      
      bedrooms: {
        patterns: [/\b(\d+)\s*(?:bed|bedroom|br)\b/gi],
        normalize: (match) => parseInt(match) || null
      },
      
      bathrooms: {
        patterns: [/\b(\d+(?:\.\d+)?)\s*(?:bath|bathroom|ba)\b/gi],
        normalize: (match) => parseFloat(match) || null
      },
      
      timeline: {
        patterns: [
          /\b(?:within|in)\s+(\d+)\s+(?:days?|weeks?|months?)\b/gi,
          /\b(asap|immediately|urgent|soon|next week|next month)\b/gi,
          /\bby\s+(january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2})\b/gi
        ],
        normalize: (match) => match.toLowerCase().trim()
      }
    };
  }

  async classifyIntent(message, conversationContext = {}) {
    this.metrics.totalClassifications++;
    
    try {
      // First, try semantic classification
      const semanticResult = await this.classifyUsingSemantic(message, conversationContext);
      
      if (semanticResult && semanticResult.confidence >= this.models.primary.confidence_threshold) {
        this.recordMetrics('semantic', semanticResult.confidence);
        return semanticResult;
      }
      
      // Fallback to pattern-based classification
      const patternResult = await this.classifyUsingPatterns(message, conversationContext);
      
      if (patternResult && patternResult.confidence >= this.models.fallback.confidence_threshold) {
        this.recordMetrics('pattern', patternResult.confidence);
        return patternResult;
      }
      
      // Final fallback - general conversation
      this.recordMetrics('fallback', 0.5);
      return this.createFallbackIntent(message);
      
    } catch (error) {
      this.logger.error('❌ Intent classification failed', error);
      return this.createFallbackIntent(message);
    }
  }

  async classifyUsingSemantic(message, context) {
    if (!this.intentEmbeddings.size) {
      this.logger.debug('Intent embeddings not available, skipping semantic classification');
      return null;
    }
    
    try {
      // Generate embedding for the user message
      const messageEmbedding = await this.generateEmbedding(message);
      if (!messageEmbedding) {
        return null;
      }
      
      // Find most similar intent
      let bestMatch = null;
      let bestSimilarity = 0;
      
      for (const [intentKey, intentData] of this.intentEmbeddings.entries()) {
        const similarity = this.cosineSimilarity(messageEmbedding, intentData.embedding);
        
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = { intentKey, ...intentData };
        }
      }
      
      if (bestMatch && bestSimilarity > 0.6) {
        // Extract entities
        const entities = this.extractEntities(message);
        
        // Apply confidence boost based on context
        let confidence = bestSimilarity;
        confidence += bestMatch.config.confidence_boost || 0;
        confidence = Math.min(confidence, 1.0);
        
        // Adjust confidence based on context
        confidence = this.adjustConfidenceForContext(confidence, bestMatch, context);
        
        return new Intent(
          `${bestMatch.category}_${bestMatch.intent}`,
          confidence,
          [], // subIntents can be added later
          entities,
          {
            classificationMethod: 'semantic',
            similarity: bestSimilarity,
            intentDescription: bestMatch.description,
            toolsRequired: bestMatch.config.tools_required || []
          }
        );
      }
      
      return null;
      
    } catch (error) {
      this.logger.error('❌ Semantic classification failed', error);
      return null;
    }
  }

  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  async classifyUsingPatterns(message, context) {
    const messageLower = message.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;
    
    // Iterate through intent taxonomy
    for (const [category, intents] of Object.entries(this.intentTaxonomy)) {
      for (const [intentName, intentConfig] of Object.entries(intents)) {
        let score = 0;
        let matches = 0;
        
        // Check patterns
        if (intentConfig.patterns) {
          for (const pattern of intentConfig.patterns) {
            if (messageLower.includes(pattern.toLowerCase())) {
              score += 0.3;
              matches++;
            }
          }
        }
        
        // Check aliases
        if (intentConfig.aliases) {
          for (const alias of intentConfig.aliases) {
            if (messageLower.includes(alias.replace(/_/g, ' ').toLowerCase())) {
              score += 0.4;
              matches++;
            }
          }
        }
        
        // Boost score if entities are present
        if (intentConfig.entities) {
          const extractedEntities = this.extractEntities(message);
          const entityMatches = intentConfig.entities.filter(
            entity => extractedEntities.hasOwnProperty(entity)
          );
          
          if (entityMatches.length > 0) {
            score += entityMatches.length * 0.2;
            matches += entityMatches.length;
          }
        }
        
        // Normalize score by number of matches
        if (matches > 0) {
          score = score / Math.max(matches, 1);
          score += intentConfig.confidence_boost || 0;
          score = Math.min(score, 1.0);
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            category,
            intent: intentName,
            config: intentConfig,
            score
          };
        }
      }
    }
    
    if (bestMatch && bestScore >= 0.4) {
      const entities = this.extractEntities(message);
      
      // Adjust confidence for context
      const confidence = this.adjustConfidenceForContext(bestScore, bestMatch, context);
      
      return new Intent(
        `${bestMatch.category}_${bestMatch.intent}`,
        confidence,
        [],
        entities,
        {
          classificationMethod: 'pattern',
          patternMatches: bestScore,
          toolsRequired: bestMatch.config.tools_required || []
        }
      );
    }
    
    return null;
  }

  extractEntities(message) {
    const entities = {};
    
    for (const [entityType, entityConfig] of Object.entries(this.entityPatterns)) {
      const matches = [];
      
      for (const pattern of entityConfig.patterns) {
        const found = [...message.matchAll(pattern)];
        found.forEach(match => {
          const normalized = entityConfig.normalize(match[1] || match[0]);
          if (normalized) {
            matches.push(normalized);
          }
        });
      }
      
      if (matches.length > 0) {
        entities[entityType] = matches.length === 1 ? matches[0] : matches;
      }
    }
    
    return entities;
  }

  adjustConfidenceForContext(baseConfidence, intentMatch, context) {
    let adjustedConfidence = baseConfidence;
    
    // Boost confidence if similar intent was recently used
    if (context.recentIntents && intentMatch.intent) {
      const recentSimilarIntent = context.recentIntents.find(
        recent => recent.includes(intentMatch.intent) || intentMatch.intent.includes(recent)
      );
      
      if (recentSimilarIntent) {
        adjustedConfidence += 0.1;
      }
    }
    
    // Boost confidence for real estate business hours
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) { // Business hours
      if (intentMatch.category === 'client_management' || 
          intentMatch.category === 'property_search') {
        adjustedConfidence += 0.05;
      }
    }
    
    // Adjust for conversation phase
    if (context.conversationPhase === 'initial' && 
        intentMatch.category === 'communication') {
      adjustedConfidence += 0.1;
    }
    
    return Math.min(adjustedConfidence, 1.0);
  }

  createFallbackIntent(message) {
    // Analyze message characteristics for fallback classification
    const hasQuestion = /\?/.test(message);
    const hasGreeting = /\b(hi|hello|hey|good morning|good afternoon)\b/i.test(message);
    const hasThanks = /\b(thank|thanks|appreciate)\b/i.test(message);
    
    let intent = 'general_conversation';
    let confidence = 0.5;
    
    if (hasGreeting) {
      intent = 'communication_greeting';
      confidence = 0.7;
    } else if (hasThanks) {
      intent = 'communication_appreciation';
      confidence = 0.7;
    } else if (hasQuestion) {
      intent = 'support_question';
      confidence = 0.6;
    }
    
    return new Intent(
      intent,
      confidence,
      [],
      this.extractEntities(message),
      { classificationMethod: 'fallback' }
    );
  }

  recordMetrics(method, confidence) {
    this.metrics.modelUsage.set(method, (this.metrics.modelUsage.get(method) || 0) + 1);
    this.metrics.avgConfidence = (this.metrics.avgConfidence * (this.metrics.totalClassifications - 1) + confidence) / this.metrics.totalClassifications;
  }

  // Utility methods

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMetrics() {
    return {
      totalClassifications: this.metrics.totalClassifications,
      averageConfidence: this.metrics.avgConfidence,
      modelUsage: Object.fromEntries(this.metrics.modelUsage),
      intentEmbeddingsCount: this.intentEmbeddings.size,
      cacheHitRate: this.embeddingService.cache.size / Math.max(this.metrics.totalClassifications, 1)
    };
  }

  // Health check
  getHealthStatus() {
    return {
      initialized: this.initialized,
      intentEmbeddingsLoaded: this.intentEmbeddings.size > 0,
      apiKeyConfigured: !!process.env.OPENROUTER_API_KEY,
      totalIntents: this.intentEmbeddings.size,
      cacheSize: this.embeddingService.cache.size,
      performanceMetrics: this.getMetrics()
    };
  }
}

module.exports = IntentClassificationService;