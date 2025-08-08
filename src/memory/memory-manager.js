/**
 * 💾 SolAI Memory Manager
 * Three-tier memory system for intelligent conversation persistence
 */

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
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 1000,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000
      });

      await this.redis.connect();
      
      // Test connection
      await this.redis.ping();
      
      this.logger.info('✅ Redis (working memory) connected');
      
    } catch (error) {
      this.logger.warn('⚠️ Redis connection failed, using in-memory fallback', error);
      this.redis = new Map(); // Fallback to in-memory storage
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

      // Initialize Pinecone client (simplified for now)
      this.pinecone = { connected: false, apiKey: pineconeKey };
      
      this.logger.info('✅ Pinecone (long-term memory) configured');
      
    } catch (error) {
      this.logger.warn('⚠️ Pinecone connection failed, semantic search disabled', error);
      this.pinecone = null;
    }
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
    // For now, return recent conversations
    // In Story 2, we'll add advanced semantic search with Pinecone
    try {
      const recentConversations = await this.getRecentConversations(sessionId, 3);
      
      return {
        discussions: recentConversations,
        preferences: {},
        facts: [],
        relevanceScore: recentConversations.length > 0 ? 0.7 : 0.1
      };
      
    } catch (error) {
      this.logger.error('❌ Memory search failed', error);
      return {
        discussions: [],
        preferences: {},
        facts: [],
        relevanceScore: 0.0
      };
    }
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