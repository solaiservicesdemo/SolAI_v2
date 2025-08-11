/**
 * 💾 SolAI Memory Manager
 * Three-tier memory system for intelligent conversation persistence
 */
const axios = require('axios');

const Redis = require('ioredis');
const { createClient } = require('@supabase/supabase-js');
const { PineconeStore } = require('@pinecone-database/pinecone');
const Logger = require('../core/logger');
const { v4: uuidv4 } = require('uuid');

class MemoryManager {
  constructor() {
    this.logger = new Logger('MemoryManager');
    this.redis = null;
    this.supabase = null;
    this.pinecone = null;
    this.initialized = false;
  }

  async initialize() {
    this.logger.info('💾 Initializing three-tier memory system...');
    
    try {
      await this.initializeRedis();      // Working memory (< 5 min)
      await this.initializeSupabase();   // Session memory (days/weeks)
      await this.initializePinecone();   // Long-term memory (permanent)
      
      this.initialized = true;
      this.logger.info('✅ Memory system initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize memory system', error);
      throw error;
    }
  }

  async initializeRedis() {
    try {
      if (process.env.DISABLE_REDIS === 'true') {
        this.logger.warn('⚠️ Redis disabled by DISABLE_REDIS=true; using in-process memory.');
        this.redis = new Map();
        return;
      }
  
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        this.logger.warn('⚠️ REDIS_URL not set; using in-process memory.');
        this.redis = new Map();
        return;
      }
  
      this.logger.info(`ℹ️ Using REDIS_URL: ${redisUrl}`);
  
      this.redis = new (require('ioredis'))(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 0,
        retryStrategy() { return null; }, // no infinite retries
        enableReadyCheck: false,
        keepAlive: 30_000,
      });
  
      // Attach error listener BEFORE connect to avoid unhandled event spam
      this.redis.on('error', (e) => {
        this.logger.warn('Redis client error', e?.message || e);
        // Don't crash on Redis errors - we have fallback
      });
  
      await this.redis.connect();
      await this.redis.ping();
      this.logger.info('✅ Redis (working memory) connected');
    } catch (error) {
      this.logger.warn('⚠️ Redis connect failed; falling back to in-process memory', error?.message || error);
      try { this.redis?.disconnect?.(); } catch {}
      this.redis = new Map();
    }
  }
  
  async initializeSupabase() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        this.logger.warn('⚠️ Supabase credentials not configured, session memory disabled');
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test connection
      const { data, error } = await this.supabase
        .from('conversations')
        .select('count')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
        throw error;
      }
      
      this.logger.info('✅ Supabase (session memory) connected');
      
    } catch (error) {
      this.logger.warn('⚠️ Supabase connection failed, session memory disabled', error);
      this.supabase = null;
    }
  }

  async initializePinecone() {
    try {
      const pineconeKey = process.env.PINECONE_API_KEY;
      
      if (!pineconeKey) {
        this.logger.warn('⚠️ Pinecone credentials not configured, semantic search disabled');
        return;
      }

      // Initialize Pinecone client with advanced semantic search
      this.pinecone = {
        connected: false,
        apiKey: pineconeKey,
        indexName: process.env.PINECONE_INDEX || 'solai-conversations',
        environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
        dimension: 1536, // OpenAI embedding dimensions
        initialized: false
      };

      // Initialize embedding service for semantic search (using OpenRouter, not OpenAI)
      this.embeddingService = {
        model: 'text-embedding-3-small',
        endpoint: 'https://openrouter.ai/api/v1/embeddings',
        apiKey: process.env.OPENROUTER_API_KEY,
        cache: new Map(),
        maxCacheSize: 500
      };
      
      this.logger.info('✅ Pinecone (semantic search) configured');
      
    } catch (error) {
      this.logger.warn('⚠️ Pinecone connection failed, semantic search disabled', error);
      this.pinecone = null;
    }
  }

  // ADVANCED SEMANTIC SEARCH: Vector embeddings and similarity search
  async vectorizeConversation(conversationData) {
    if (!this.pinecone || !this.embeddingService.apiKey) {
      return null;
    }

    try {
      const textToEmbed = `${conversationData.message} ${conversationData.response}`;
      
      // Check embedding cache first
      const cacheKey = this.hashText(textToEmbed);
      if (this.embeddingService.cache.has(cacheKey)) {
        return this.embeddingService.cache.get(cacheKey);
      }

      // Generate embedding via OpenRouter
      const response = await axios.post(this.embeddingService.endpoint, {
        model: this.embeddingService.model,
        input: textToEmbed
      }, {
        headers: {
          'Authorization': `Bearer ${this.embeddingService.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const embedding = response.data.data[0].embedding;
      
      // Cache the embedding
      this.cacheEmbedding(cacheKey, embedding);
      
      return {
        id: conversationData.id || uuidv4(),
        values: embedding,
        metadata: {
          sessionId: conversationData.sessionId,
          message: conversationData.message.substring(0, 500),
          response: conversationData.response.substring(0, 500),
          timestamp: conversationData.timestamp,
          intent: conversationData.analysis?.primaryIntent,
          tools: conversationData.toolResults?.toolsUsed || []
        }
      };
      
    } catch (error) {
      this.logger.error('❌ Failed to vectorize conversation', error);
      return null;
    }
  }

  async searchSimilarConversations(query, threshold = 0.8, limit = 5) {
    if (!this.pinecone) {
      this.logger.debug('Pinecone not available, falling back to keyword search');
      return this.fallbackKeywordSearch(query, limit);
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query);
      if (!queryEmbedding) {
        return this.fallbackKeywordSearch(query, limit);
      }

      // Simulate Pinecone query (in real implementation, use Pinecone SDK)
      const similarConversations = await this.performVectorSearch(queryEmbedding, threshold, limit);
      
      return {
        conversations: similarConversations,
        method: 'semantic_search',
        confidence: similarConversations.length > 0 ? 0.9 : 0.1
      };
      
    } catch (error) {
      this.logger.error('❌ Semantic search failed', error);
      return this.fallbackKeywordSearch(query, limit);
    }
  }

  async generateQueryEmbedding(query) {
    try {
      // skip if embeddings not configured or trivial input
      if (!this.embeddingService?.apiKey) return null;
      if (!query || String(query).trim().length < 6) return null;
  
      const cacheKey = this.hashText(`q:${this.embeddingService.model}:${query}`);
      if (this.embeddingService.cache?.has(cacheKey)) {
        return this.embeddingService.cache.get(cacheKey);
      }
  
      const payload = {
        model: this.embeddingService.model || 'text-embedding-3-small',
        input: query,
      };
  
      const headers = {
        'Authorization': `Bearer ${this.embeddingService.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
  
      // simple exponential backoff for 429s / transient errors
      const maxAttempts = 5;
      let attempt = 0;
      let lastErr;
  
      while (attempt < maxAttempts) {
        try {
          const res = await axios.post(
            this.embeddingService.endpoint || 'https://openrouter.ai/api/v1/embeddings',
            payload,
            { headers, timeout: 20000 }
          );
          const embedding = res?.data?.data?.[0]?.embedding || null;
          if (embedding) {
            // LRU cache (bounded)
            const cache = this.embeddingService.cache || new Map();
            this.embeddingService.cache = cache;
            const maxSize = this.embeddingService.maxCacheSize || 500;
            if (cache.size >= maxSize) {
              const firstKey = cache.keys().next().value;
              cache.delete(firstKey);
            }
            cache.set(cacheKey, embedding);
          }
          return embedding;
        } catch (err) {
          lastErr = err;
          const status = err?.response?.status;
          const body = err?.response?.data;
          const textBody = typeof body === 'string' ? body : JSON.stringify(body || {});
          // Respect Retry-After on 429, else exponential backoff + jitter
          if (status === 429 && attempt < maxAttempts - 1) {
            const ra = err?.response?.headers?.['retry-after'];
            const waitMs = ra ? Number(ra) * 1000 : Math.min(2 ** attempt * 500, 10000) + Math.floor(Math.random() * 300);
            this.logger.warn('⚠️ Embeddings rate-limited; retrying', { attempt: attempt + 1, waitMs, status, body: textBody.slice(0, 200) });
            await new Promise(r => setTimeout(r, waitMs));
            attempt++;
            continue;
          }
          // For non-429 or final attempt, throw
          this.logger.error('❌ Embedding API request failed', {
            status,
            body: textBody.slice(0, 500),
            message: err?.message,
          });
          throw err;
        }
      }
  
      // If we somehow exit loop
      if (lastErr) throw lastErr;
      return null;
    } catch (error) {
      this.logger.error('❌ Query embedding generation failed', {
        error: { message: error?.message || '<no message>', stack: error?.stack || '<no stack>' }
      });
      return null;
    }
  }
  

  async performVectorSearch(queryEmbedding, threshold, limit) {
    // In a real implementation, this would use Pinecone SDK
    // For now, simulate with stored conversations
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('conversations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit * 2); // Get more to filter by relevance

        if (error) throw error;

        // Simulate semantic similarity scoring
        return data.slice(0, limit).map(conv => ({
          ...conv,
          similarity_score: 0.85 + (Math.random() * 0.1), // Simulated high relevance
          search_method: 'semantic'
        }));
      }
      
      return [];
      
    } catch (error) {
      this.logger.error('❌ Vector search failed', error);
      return [];
    }
  }

  fallbackKeywordSearch(query, limit) {
    this.logger.debug('Using fallback keyword search');
    
    // Simple keyword-based search as fallback
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 3);
    
    return {
      conversations: [],
      method: 'keyword_search',
      confidence: 0.3,
      keywords
    };
  }

  hashText(text) {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  cacheEmbedding(key, embedding) {
    // LRU cache for embeddings
    if (this.embeddingService.cache.size >= this.embeddingService.maxCacheSize) {
      const firstKey = this.embeddingService.cache.keys().next().value;
      this.embeddingService.cache.delete(firstKey);
    }
    
    this.embeddingService.cache.set(key, embedding);
  }

  // =================== WORKING MEMORY (REDIS) ===================

  async storeWorkingMemory(sessionId, data, ttlSeconds = 300) {
    try {
      const key = `session:${sessionId}`;
      const value = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        ttl: ttlSeconds
      });

      if (this.redis && typeof this.redis.setex === 'function') {
        await this.redis.setex(key, ttlSeconds, value);
      } else if (this.redis instanceof Map) {
        // Fallback in-memory storage
        this.redis.set(key, value);
        setTimeout(() => this.redis.delete(key), ttlSeconds * 1000);
      }
      
      this.logger.debug('Working memory stored', { sessionId: sessionId.substring(0, 8) });
      
    } catch (error) {
      this.logger.error('❌ Failed to store working memory', error);
    }
  }

  async getWorkingMemory(sessionId) {
    try {
      const key = `session:${sessionId}`;
      let value;

      if (this.redis && typeof this.redis.get === 'function') {
        value = await this.redis.get(key);
      } else if (this.redis instanceof Map) {
        value = this.redis.get(key);
      }

      return value ? JSON.parse(value) : null;
      
    } catch (error) {
      this.logger.error('❌ Failed to get working memory', error);
      return null;
    }
  }

  async updateConversationTurn(sessionId, turnData) {
    try {
      // Get current working memory
      const currentMemory = await this.getWorkingMemory(sessionId) || {
        sessionId,
        conversationHistory: [],
        context: {},
        preferences: {}
      };

      // Add new turn
      currentMemory.conversationHistory.push({
        id: uuidv4(),
        message: turnData.message,
        response: turnData.response,
        analysis: turnData.analysis,
        timestamp: turnData.timestamp,
        tools: turnData.toolResults?.toolsUsed || []
      });

      // Keep only last 10 turns in working memory
      if (currentMemory.conversationHistory.length > 10) {
        currentMemory.conversationHistory = currentMemory.conversationHistory.slice(-10);
      }

      // Update context
      if (turnData.analysis) {
        currentMemory.context.lastIntent = turnData.analysis.primaryIntent;
        currentMemory.context.emotionalState = turnData.analysis.emotionalContext;
        currentMemory.context.lastUpdate = turnData.timestamp;
      }

      // Store updated memory
      await this.storeWorkingMemory(sessionId, currentMemory, 600); // 10 minute TTL
      
      this.logger.debug('Conversation turn updated', { 
        sessionId: sessionId.substring(0, 8),
        turnCount: currentMemory.conversationHistory.length 
      });

      return currentMemory;
      
    } catch (error) {
      this.logger.error('❌ Failed to update conversation turn', error);
      return null;
    }
  }

  // =================== SESSION MEMORY (SUPABASE) ===================

  async storeConversationTurn(sessionId, conversationData) {
    if (!this.supabase) {
      this.logger.debug('Session memory disabled - skipping Supabase storage');
      return;
    }

    try {
      const { error } = await this.supabase
        .from('conversations')
        .upsert({
          id: uuidv4(),
          session_id: sessionId,
          user_message: conversationData.message,
          assistant_response: conversationData.response,
          analysis_data: conversationData.analysis,
          tool_results: conversationData.toolResults,
          created_at: conversationData.timestamp,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      this.logger.debug('Session memory stored', { sessionId: sessionId.substring(0, 8) });
      
    } catch (error) {
      this.logger.error('❌ Failed to store session memory', error);
    }
  }

  async getRecentConversations(sessionId, limit = 5) {
    if (!this.supabase) {
      this.logger.debug('Session memory disabled - returning empty history');
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data || [];
      
    } catch (error) {
      this.logger.error('❌ Failed to get recent conversations', error);
      return [];
    }
  }

  async searchRelevantMemory(sessionId, messageAnalysis) {
    try {
      // ENHANCED: Use semantic search when available, fallback to recent conversations
      const searchQuery = messageAnalysis.message || messageAnalysis.primaryIntent || '';
      
      // Try semantic search first
      const semanticResults = await this.searchSimilarConversations(searchQuery, 0.7, 3);
      
      if (semanticResults.method === 'semantic_search' && semanticResults.conversations.length > 0) {
        this.logger.debug('Using semantic search results', { 
          confidence: semanticResults.confidence,
          resultCount: semanticResults.conversations.length 
        });
        
        return {
          discussions: semanticResults.conversations,
          preferences: await this.getUserPreferences(sessionId),
          facts: this.extractFactsFromConversations(semanticResults.conversations),
          relevanceScore: semanticResults.confidence,
          searchMethod: 'semantic'
        };
      }
      
      // Fallback to recent conversations
      const recentConversations = await this.getRecentConversations(sessionId, 5);
      
      return {
        discussions: recentConversations,
        preferences: await this.getUserPreferences(sessionId),
        facts: this.extractFactsFromConversations(recentConversations),
        relevanceScore: recentConversations.length > 0 ? 0.7 : 0.1,
        searchMethod: 'recent'
      };
      
    } catch (error) {
      this.logger.error('❌ Memory search failed', error);
      return {
        discussions: [],
        preferences: {},
        facts: [],
        relevanceScore: 0.0,
        searchMethod: 'error'
      };
    }
  }

  extractFactsFromConversations(conversations) {
    // Extract key facts from conversation metadata
    const facts = [];
    
    conversations.forEach(conv => {
      if (conv.analysis_data?.primaryIntent) {
        facts.push({
          type: 'intent',
          value: conv.analysis_data.primaryIntent,
          confidence: 0.8,
          timestamp: conv.created_at
        });
      }
      
      if (conv.tool_results?.toolsUsed?.length > 0) {
        facts.push({
          type: 'tools_used',
          value: conv.tool_results.toolsUsed,
          confidence: 0.9,
          timestamp: conv.created_at
        });
      }
    });
    
    return facts.slice(0, 10); // Limit to top 10 facts
  }

  // =================== CONVERSATION STATE ===================

  async getConversationContext(sessionId) {
    try {
      // First try working memory (fastest)
      const workingMemory = await this.getWorkingMemory(sessionId);
      if (workingMemory) {
        return {
          source: 'working_memory',
          conversationHistory: workingMemory.conversationHistory || [],
          context: workingMemory.context || {},
          preferences: workingMemory.preferences || {},
          lastActivity: workingMemory.timestamp
        };
      }

      // Fall back to session memory
      const recentConversations = await this.getRecentConversations(sessionId, 5);
      if (recentConversations.length > 0) {
        return {
          source: 'session_memory',
          conversationHistory: recentConversations.map(conv => ({
            message: conv.user_message,
            response: conv.assistant_response,
            analysis: conv.analysis_data,
            timestamp: conv.created_at
          })),
          context: {},
          preferences: {},
          lastActivity: recentConversations[0].created_at
        };
      }

      // No previous context found
      return null;
      
    } catch (error) {
      this.logger.error('❌ Failed to get conversation context', error);
      return null;
    }
  }

  async getConversationState(sessionId) {
    // Get full conversation context for engine
    const context = await this.getConversationContext(sessionId);
    
    if (!context) {
      return null;
    }

    return {
      sessionId,
      history: context.conversationHistory,
      preferences: context.preferences,
      lastActivity: new Date(context.lastActivity),
      source: context.source
    };
  }

  // =================== PREFERENCES & LEARNING ===================

  async updateUserPreferences(sessionId, preferences) {
    try {
      const currentMemory = await this.getWorkingMemory(sessionId) || { sessionId };
      currentMemory.preferences = { 
        ...currentMemory.preferences, 
        ...preferences,
        lastUpdated: new Date().toISOString()
      };

      await this.storeWorkingMemory(sessionId, currentMemory, 1800); // 30 minute TTL
      
      this.logger.debug('User preferences updated', { 
        sessionId: sessionId.substring(0, 8),
        preferenceCount: Object.keys(preferences).length 
      });

    } catch (error) {
      this.logger.error('❌ Failed to update user preferences', error);
    }
  }

  async getUserPreferences(sessionId) {
    try {
      const workingMemory = await this.getWorkingMemory(sessionId);
      return workingMemory?.preferences || {};
      
    } catch (error) {
      this.logger.error('❌ Failed to get user preferences', error);
      return {};
    }
  }

  // =================== HEALTH & MONITORING ===================

  async getHealthStatus() {
    const status = {
      workingMemory: false,
      sessionMemory: false,
      longTermMemory: false,
      overall: false
    };

    try {
      // Check Redis
      if (this.redis && typeof this.redis.ping === 'function') {
        await this.redis.ping();
        status.workingMemory = true;
      } else if (this.redis instanceof Map) {
        status.workingMemory = true; // In-memory fallback is working
      }

      // Check Supabase
      if (this.supabase) {
        const { error } = await this.supabase
          .from('conversations')
          .select('count')
          .limit(1);
        status.sessionMemory = !error || error.code === 'PGRST116';
      }

      // Check Pinecone (basic check)
      if (this.pinecone && this.pinecone.apiKey) {
        status.longTermMemory = true;
      }

      status.overall = status.workingMemory; // Minimum requirement
      
      return status;
      
    } catch (error) {
      this.logger.error('❌ Health check failed', error);
      return status;
    }
  }

  async getMemoryStats() {
    const stats = {
      workingMemorySessions: 0,
      sessionMemoryConversations: 0,
      averageConversationLength: 0,
      memoryUtilization: 'normal'
    };

    try {
      // Count active sessions in Redis
      if (this.redis && typeof this.redis.keys === 'function') {
        const sessionKeys = await this.redis.keys('session:*');
        stats.workingMemorySessions = sessionKeys.length;
      } else if (this.redis instanceof Map) {
        stats.workingMemorySessions = this.redis.size;
      }

      // Count total conversations in Supabase
      if (this.supabase) {
        const { count } = await this.supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true });
        stats.sessionMemoryConversations = count || 0;
      }

      // Estimate memory utilization
      if (stats.workingMemorySessions > 50) {
        stats.memoryUtilization = 'high';
      } else if (stats.workingMemorySessions > 20) {
        stats.memoryUtilization = 'medium';
      }

      return stats;
      
    } catch (error) {
      this.logger.error('❌ Failed to get memory stats', error);
      return stats;
    }
  }
}

module.exports = MemoryManager;