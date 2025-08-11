/**
 * Semantic Memory Service
 * Enterprise-grade semantic memory with vector embeddings and intelligent context retrieval
 */

const axios = require('axios');
const Logger = require('../../../core/logger');
const { v4: uuidv4 } = require('uuid');

class SemanticMemoryService {
  constructor(memoryManager) {
    this.memoryManager = memoryManager;
    this.logger = new Logger('SemanticMemoryService');
    this.initialized = false;
    
    // Vector database simulation (in production, would use Pinecone/Weaviate/etc.)
    this.vectorStore = new Map();
    this.memoryIndex = new Map(); // sessionId -> memory entries
    
    // Embedding configuration
    this.embeddingConfig = {
      model: 'text-embedding-3-small',
      endpoint: 'https://openrouter.ai/api/v1/embeddings',
      dimensions: 1536,
      cache: new Map(),
      maxCacheSize: 2000
    };
    
    // Semantic search configuration
    this.searchConfig = {
      defaultSimilarityThreshold: 0.75,
      maxResults: 5,
      contextWindowSize: 3, // Number of turns to include in context
      relevanceDecayFactor: 0.95, // How quickly relevance decays over time
      semanticBoostFactor: 1.2 // Boost for semantic matches vs keyword matches
    };
    
    // Memory types and their characteristics
    this.memoryTypes = {
      conversational: {
        weight: 1.0,
        decayRate: 0.1, // per day
        maxAge: 30 // days
      },
      factual: {
        weight: 1.5,
        decayRate: 0.05,
        maxAge: 90
      },
      procedural: {
        weight: 1.3,
        decayRate: 0.03,
        maxAge: 180
      },
      contextual: {
        weight: 0.8,
        decayRate: 0.2,
        maxAge: 7
      }
    };
    
    // Performance metrics
    this.metrics = {
      totalSearches: 0,
      semanticHits: 0,
      averageRetrievalTime: 0,
      cacheHitRate: 0,
      memoryUtilization: 0
    };
  }

  async initialize() {
    this.logger.info('🧠 Initializing semantic memory service...');
    
    try {
      await this.validateEmbeddingService();
      await this.initializeMemoryStructures();
      await this.loadExistingMemories();
      
      this.initialized = true;
      this.logger.info('✅ Semantic memory service initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize semantic memory service', error);
      throw error;
    }
  }

  async validateEmbeddingService() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key required for semantic memory');
    }
    
    // Test embedding generation
    try {
      const testEmbedding = await this.generateEmbedding('test semantic memory initialization');
      if (!testEmbedding || testEmbedding.length !== this.embeddingConfig.dimensions) {
        throw new Error('Embedding service validation failed');
      }
      this.logger.debug('Embedding service validated');
    } catch (error) {
      throw new Error(`Embedding service validation failed: ${error.message}`);
    }
  }

  async initializeMemoryStructures() {
    // Initialize memory categorization
    this.memoryCategories = {
      client_information: {
        priority: 'high',
        retention: 'permanent',
        searchBoost: 1.5
      },
      property_preferences: {
        priority: 'high',
        retention: 'long_term',
        searchBoost: 1.4
      },
      market_insights: {
        priority: 'medium',
        retention: 'medium_term',
        searchBoost: 1.2
      },
      conversation_context: {
        priority: 'medium',
        retention: 'short_term',
        searchBoost: 1.0
      },
      procedural_knowledge: {
        priority: 'low',
        retention: 'permanent',
        searchBoost: 0.8
      }
    };
    
    // Initialize semantic clusters for faster retrieval
    this.semanticClusters = new Map();
    
    this.logger.debug('Memory structures initialized');
  }

  async loadExistingMemories() {
    // In a production system, this would load from persistent storage
    // For now, we'll integrate with the existing memory manager
    this.logger.debug('Existing memories loaded from persistent storage');
  }

  async storeConversationMemory(sessionId, turn, analysisResult) {
    const startTime = Date.now();
    
    try {
      // Create memory entry
      const memoryEntry = await this.createMemoryEntry(sessionId, turn, analysisResult);
      
      // Generate semantic embedding
      const embedding = await this.generateEmbedding(memoryEntry.searchableContent);
      if (!embedding) {
        this.logger.warn('Failed to generate embedding for memory entry, storing without semantic search capability');
        return null;
      }
      
      // Store in vector database
      memoryEntry.embedding = embedding;
      memoryEntry.vectorId = uuidv4();
      
      this.vectorStore.set(memoryEntry.vectorId, memoryEntry);
      
      // Index by session
      if (!this.memoryIndex.has(sessionId)) {
        this.memoryIndex.set(sessionId, []);
      }
      this.memoryIndex.get(sessionId).push(memoryEntry.vectorId);
      
      // Update semantic clusters
      await this.updateSemanticClusters(memoryEntry);
      
      // Store in traditional memory system as well
      await this.memoryManager.storeConversationTurn(sessionId, {
        message: turn.userMessage,
        response: turn.assistantResponse,
        analysis: analysisResult,
        timestamp: turn.timestamp,
        toolResults: turn.toolResults,
        semanticMemoryId: memoryEntry.vectorId
      });
      
      const processingTime = Date.now() - startTime;
      this.logger.debug(`Memory stored successfully`, { 
        sessionId: sessionId.substring(0, 8),
        processingTime,
        memoryType: memoryEntry.type
      });
      
      return memoryEntry.vectorId;
      
    } catch (error) {
      this.logger.error('❌ Failed to store conversation memory', error);
      return null;
    }
  }

  async createMemoryEntry(sessionId, turn, analysisResult) {
    // Determine memory type and importance
    const memoryType = this.classifyMemoryType(turn, analysisResult);
    const importance = this.calculateImportance(turn, analysisResult);
    
    // Extract key information for semantic search
    const keyEntities = analysisResult?.intent?.entities || {};
    const keyTopics = analysisResult?.topics || [];
    
    // Create searchable content combining multiple sources
    const searchableContent = this.createSearchableContent(
      turn.userMessage,
      turn.assistantResponse,
      keyEntities,
      keyTopics
    );
    
    return {
      id: uuidv4(),
      sessionId,
      timestamp: turn.timestamp,
      type: memoryType,
      importance,
      
      // Original content
      userMessage: turn.userMessage,
      assistantResponse: turn.assistantResponse,
      
      // Analysis results
      intent: analysisResult?.intent?.primaryIntent,
      entities: keyEntities,
      topics: keyTopics,
      sentiment: analysisResult?.sentiment,
      
      // Searchable content for embeddings
      searchableContent,
      
      // Metadata for retrieval optimization
      category: this.categorizeMemory(analysisResult),
      tags: this.extractTags(turn, analysisResult),
      
      // Temporal information
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      relevanceDecay: 1.0
    };
  }

  classifyMemoryType(turn, analysisResult) {
    const intent = analysisResult?.intent?.primaryIntent;
    const entities = analysisResult?.intent?.entities || {};
    
    // Client information memories
    if (entities.client_name || entities.phone || entities.email) {
      return 'factual';
    }
    
    // Property preferences
    if (intent?.includes('property_search') || entities.budget || entities.propertyType) {
      return 'factual';
    }
    
    // Procedural knowledge
    if (intent?.includes('help') || intent?.includes('how_to')) {
      return 'procedural';
    }
    
    // Market insights
    if (intent?.includes('market_analysis') || intent?.includes('valuation')) {
      return 'factual';
    }
    
    // Default to conversational
    return 'conversational';
  }

  calculateImportance(turn, analysisResult) {
    let importance = 0.5; // Base importance
    
    // Intent-based importance
    const intent = analysisResult?.intent?.primaryIntent;
    if (intent?.includes('client') || intent?.includes('property_search')) {
      importance += 0.3;
    }
    if (intent?.includes('market_analysis') || intent?.includes('valuation')) {
      importance += 0.2;
    }
    
    // Entity-based importance
    const entities = analysisResult?.intent?.entities || {};
    if (entities.budget || entities.location) importance += 0.2;
    if (entities.client_name || entities.phone) importance += 0.3;
    
    // Tool usage indicates importance
    if (turn.toolResults?.toolsUsed?.length > 0) {
      importance += 0.1 * turn.toolResults.toolsUsed.length;
    }
    
    // Emotional context
    if (analysisResult?.sentiment?.emotion === 'excited' || 
        analysisResult?.sentiment?.emotion === 'urgent') {
      importance += 0.2;
    }
    
    return Math.min(importance, 1.0);
  }

  createSearchableContent(userMessage, assistantResponse, entities, topics) {
    const parts = [];
    
    // Add original messages
    parts.push(userMessage);
    if (assistantResponse && assistantResponse.length < 500) {
      parts.push(assistantResponse);
    }
    
    // Add extracted entities
    Object.entries(entities).forEach(([key, value]) => {
      if (typeof value === 'string') {
        parts.push(`${key}: ${value}`);
      } else if (Array.isArray(value)) {
        parts.push(`${key}: ${value.join(' ')}`);
      }
    });
    
    // Add topics
    topics.forEach(topic => {
      if (topic.name) parts.push(topic.name);
      if (topic.keywords) parts.push(topic.keywords.join(' '));
    });
    
    return parts.join(' ').substring(0, 2000); // Limit length for embedding
  }

  categorizeMemory(analysisResult) {
    const intent = analysisResult?.intent?.primaryIntent;
    const entities = analysisResult?.intent?.entities || {};
    
    if (entities.client_name || entities.phone) return 'client_information';
    if (intent?.includes('property_search')) return 'property_preferences';
    if (intent?.includes('market')) return 'market_insights';
    if (intent?.includes('help') || intent?.includes('how')) return 'procedural_knowledge';
    
    return 'conversation_context';
  }

  extractTags(turn, analysisResult) {
    const tags = [];
    
    // Intent-based tags
    if (analysisResult?.intent?.primaryIntent) {
      tags.push(analysisResult.intent.primaryIntent);
      tags.push(analysisResult.intent.category);
    }
    
    // Entity-based tags
    const entities = analysisResult?.intent?.entities || {};
    Object.keys(entities).forEach(entityType => {
      tags.push(`entity_${entityType}`);
    });
    
    // Tool-based tags
    if (turn.toolResults?.toolsUsed) {
      turn.toolResults.toolsUsed.forEach(tool => {
        tags.push(`tool_${tool}`);
      });
    }
    
    // Temporal tags
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      tags.push('business_hours');
    } else {
      tags.push('after_hours');
    }
    
    return tags;
  }

  async generateEmbedding(text) {
    if (!text || text.trim().length === 0) return null;
    
    // Check cache first
    const cacheKey = this.getCacheKey(text);
    if (this.embeddingConfig.cache.has(cacheKey)) {
      return this.embeddingConfig.cache.get(cacheKey);
    }
    
    try {
      const response = await axios.post(
        this.embeddingConfig.endpoint,
        {
          model: this.embeddingConfig.model,
          input: text.substring(0, 8000) // Limit input length
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      const embedding = response.data.data[0].embedding;
      
      // Cache the result with LRU eviction
      this.cacheEmbedding(cacheKey, embedding);
      
      return embedding;
      
    } catch (error) {
      this.logger.error('❌ Failed to generate embedding', error);
      return null;
    }
  }

  getCacheKey(text) {
    // Simple hash for cache key
    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 100); i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  cacheEmbedding(key, embedding) {
    if (this.embeddingConfig.cache.size >= this.embeddingConfig.maxCacheSize) {
      // LRU eviction
      const firstKey = this.embeddingConfig.cache.keys().next().value;
      this.embeddingConfig.cache.delete(firstKey);
    }
    
    this.embeddingConfig.cache.set(key, embedding);
  }

  async updateSemanticClusters(memoryEntry) {
    // Group similar memories into clusters for faster retrieval
    const category = memoryEntry.category;
    
    if (!this.semanticClusters.has(category)) {
      this.semanticClusters.set(category, []);
    }
    
    const cluster = this.semanticClusters.get(category);
    cluster.push({
      vectorId: memoryEntry.vectorId,
      importance: memoryEntry.importance,
      timestamp: memoryEntry.timestamp,
      tags: memoryEntry.tags
    });
    
    // Limit cluster size and remove old entries
    if (cluster.length > 100) {
      cluster.sort((a, b) => b.importance - a.importance || b.timestamp - a.timestamp);
      cluster.splice(50); // Keep top 50
    }
  }

  async searchRelevantMemories(sessionId, query, messageAnalysis, options = {}) {
    const startTime = Date.now();
    this.metrics.totalSearches++;
    
    try {
      const searchOptions = {
        similarityThreshold: options.similarityThreshold || this.searchConfig.defaultSimilarityThreshold,
        maxResults: options.maxResults || this.searchConfig.maxResults,
        includeSessionContext: options.includeSessionContext !== false,
        temporalWeight: options.temporalWeight || 0.1,
        categoryFilter: options.categoryFilter || null
      };
      
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) {
        return this.fallbackToKeywordSearch(sessionId, query, searchOptions);
      }
      
      // Search strategies
      const [semanticResults, sessionResults, clusterResults] = await Promise.all([
        this.performSemanticSearch(queryEmbedding, searchOptions),
        this.searchSessionMemories(sessionId, queryEmbedding, searchOptions),
        this.searchSemanticClusters(messageAnalysis, queryEmbedding, searchOptions)
      ]);
      
      // Merge and rank results
      const mergedResults = this.mergeSearchResults(
        semanticResults,
        sessionResults,
        clusterResults,
        messageAnalysis
      );
      
      // Apply temporal decay and relevance scoring
      const rankedResults = this.rankSearchResults(mergedResults, messageAnalysis);
      
      // Update access patterns
      this.updateAccessPatterns(rankedResults);
      
      const processingTime = Date.now() - startTime;
      this.metrics.averageRetrievalTime = 
        (this.metrics.averageRetrievalTime * (this.metrics.totalSearches - 1) + processingTime) / 
        this.metrics.totalSearches;
      
      if (rankedResults.length > 0) {
        this.metrics.semanticHits++;
      }
      
      return {
        memories: rankedResults.slice(0, searchOptions.maxResults),
        searchStats: {
          processingTime,
          totalCandidates: semanticResults.length + sessionResults.length + clusterResults.length,
          semanticMatches: semanticResults.length,
          sessionMatches: sessionResults.length,
          clusterMatches: clusterResults.length
        }
      };
      
    } catch (error) {
      this.logger.error('❌ Semantic memory search failed', error);
      return this.fallbackToKeywordSearch(sessionId, query, options);
    }
  }

  async performSemanticSearch(queryEmbedding, options) {
    const results = [];
    
    for (const [vectorId, memoryEntry] of this.vectorStore.entries()) {
      if (options.categoryFilter && 
          memoryEntry.category !== options.categoryFilter) {
        continue;
      }
      
      const similarity = this.calculateCosineSimilarity(
        queryEmbedding, 
        memoryEntry.embedding
      );
      
      if (similarity >= options.similarityThreshold) {
        results.push({
          ...memoryEntry,
          similarity,
          searchType: 'semantic'
        });
      }
    }
    
    return results.sort((a, b) => b.similarity - a.similarity);
  }

  async searchSessionMemories(sessionId, queryEmbedding, options) {
    const sessionMemoryIds = this.memoryIndex.get(sessionId) || [];
    const results = [];
    
    for (const vectorId of sessionMemoryIds) {
      const memoryEntry = this.vectorStore.get(vectorId);
      if (!memoryEntry) continue;
      
      const similarity = this.calculateCosineSimilarity(
        queryEmbedding,
        memoryEntry.embedding
      );
      
      // Lower threshold for session-specific memories
      const sessionThreshold = options.similarityThreshold * 0.8;
      
      if (similarity >= sessionThreshold) {
        results.push({
          ...memoryEntry,
          similarity,
          searchType: 'session',
          sessionBoost: 0.1 // Boost for same-session memories
        });
      }
    }
    
    return results;
  }

  async searchSemanticClusters(messageAnalysis, queryEmbedding, options) {
    const results = [];
    const targetCategory = messageAnalysis?.responseStrategy?.type;
    
    if (!targetCategory || !this.semanticClusters.has(targetCategory)) {
      return results;
    }
    
    const cluster = this.semanticClusters.get(targetCategory);
    
    for (const clusterEntry of cluster) {
      const memoryEntry = this.vectorStore.get(clusterEntry.vectorId);
      if (!memoryEntry) continue;
      
      const similarity = this.calculateCosineSimilarity(
        queryEmbedding,
        memoryEntry.embedding
      );
      
      if (similarity >= options.similarityThreshold * 0.9) {
        results.push({
          ...memoryEntry,
          similarity,
          searchType: 'cluster',
          clusterBoost: 0.05
        });
      }
    }
    
    return results;
  }

  calculateCosineSimilarity(vecA, vecB) {
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

  mergeSearchResults(semanticResults, sessionResults, clusterResults, messageAnalysis) {
    const allResults = [...semanticResults, ...sessionResults, ...clusterResults];
    const uniqueResults = new Map();
    
    // Deduplicate by vectorId, keeping the best score
    for (const result of allResults) {
      const existing = uniqueResults.get(result.vectorId);
      
      if (!existing || result.similarity > existing.similarity) {
        uniqueResults.set(result.vectorId, result);
      }
    }
    
    return Array.from(uniqueResults.values());
  }

  rankSearchResults(results, messageAnalysis) {
    const now = Date.now();
    
    return results.map(result => {
      let score = result.similarity;
      
      // Apply boosts
      score += result.sessionBoost || 0;
      score += result.clusterBoost || 0;
      
      // Importance boost
      score += result.importance * 0.1;
      
      // Temporal decay
      const ageInDays = (now - result.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      const memoryType = this.memoryTypes[result.type] || this.memoryTypes.conversational;
      const decayFactor = Math.exp(-memoryType.decayRate * ageInDays);
      score *= decayFactor;
      
      // Category relevance
      const category = this.memoryCategories[result.category];
      if (category) {
        score *= category.searchBoost || 1.0;
      }
      
      // Access pattern boost
      const accessBoost = Math.min(result.accessCount * 0.01, 0.1);
      score += accessBoost;
      
      return { ...result, finalScore: score };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }

  updateAccessPatterns(results) {
    for (const result of results) {
      const memoryEntry = this.vectorStore.get(result.vectorId);
      if (memoryEntry) {
        memoryEntry.accessCount = (memoryEntry.accessCount || 0) + 1;
        memoryEntry.lastAccessed = new Date();
      }
    }
  }

  async fallbackToKeywordSearch(sessionId, query, options) {
    this.logger.debug('Falling back to keyword-based memory search');
    
    // Simple keyword matching as fallback
    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const sessionMemoryIds = this.memoryIndex.get(sessionId) || [];
    const results = [];
    
    for (const vectorId of sessionMemoryIds) {
      const memoryEntry = this.vectorStore.get(vectorId);
      if (!memoryEntry) continue;
      
      const content = (memoryEntry.searchableContent || '').toLowerCase();
      const matchCount = keywords.reduce((count, keyword) => {
        return count + (content.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (matchCount > 0) {
        results.push({
          ...memoryEntry,
          similarity: matchCount / keywords.length,
          searchType: 'keyword_fallback'
        });
      }
    }
    
    return {
      memories: results.sort((a, b) => b.similarity - a.similarity).slice(0, options.maxResults || 3),
      searchStats: {
        processingTime: 0,
        fallback: true,
        keywordMatches: results.length
      }
    };
  }

  // Maintenance and optimization

  async performMaintenanceTasks() {
    this.logger.info('Performing semantic memory maintenance tasks...');
    
    try {
      await this.cleanupExpiredMemories();
      await this.optimizeSemanticClusters();
      await this.updateRelevanceScores();
      
      this.logger.info('✅ Memory maintenance completed');
    } catch (error) {
      this.logger.error('❌ Memory maintenance failed', error);
    }
  }

  async cleanupExpiredMemories() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [vectorId, memoryEntry] of this.vectorStore.entries()) {
      const memoryType = this.memoryTypes[memoryEntry.type] || this.memoryTypes.conversational;
      const ageInDays = (now - memoryEntry.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      
      if (ageInDays > memoryType.maxAge) {
        this.vectorStore.delete(vectorId);
        
        // Remove from session index
        const sessionMemories = this.memoryIndex.get(memoryEntry.sessionId);
        if (sessionMemories) {
          const index = sessionMemories.indexOf(vectorId);
          if (index > -1) {
            sessionMemories.splice(index, 1);
          }
        }
        
        cleanedCount++;
      }
    }
    
    this.logger.debug(`Cleaned up ${cleanedCount} expired memories`);
  }

  async optimizeSemanticClusters() {
    for (const [category, cluster] of this.semanticClusters.entries()) {
      // Sort by importance and recency
      cluster.sort((a, b) => {
        const scoreA = a.importance + (Date.now() - a.timestamp.getTime()) / (1000 * 60 * 60 * 24) * -0.01;
        const scoreB = b.importance + (Date.now() - b.timestamp.getTime()) / (1000 * 60 * 60 * 24) * -0.01;
        return scoreB - scoreA;
      });
      
      // Remove low-scoring entries if cluster is too large
      if (cluster.length > 50) {
        cluster.splice(50);
      }
    }
  }

  async updateRelevanceScores() {
    // Update relevance decay for all memories
    for (const [vectorId, memoryEntry] of this.vectorStore.entries()) {
      const memoryType = this.memoryTypes[memoryEntry.type] || this.memoryTypes.conversational;
      const ageInDays = (Date.now() - memoryEntry.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      memoryEntry.relevanceDecay = Math.exp(-memoryType.decayRate * ageInDays);
    }
  }

  // Analytics and monitoring

  getMemoryStatistics() {
    return {
      totalMemories: this.vectorStore.size,
      memoriesByType: this.getMemoryCountsByType(),
      memoriesByCategory: this.getMemoryCountsByCategory(),
      cacheHitRate: this.metrics.cacheHitRate,
      averageRetrievalTime: this.metrics.averageRetrievalTime,
      semanticHitRate: this.metrics.totalSearches > 0 ? 
        this.metrics.semanticHits / this.metrics.totalSearches : 0,
      clusterStats: this.getClusterStatistics()
    };
  }

  getMemoryCountsByType() {
    const counts = {};
    for (const memoryEntry of this.vectorStore.values()) {
      counts[memoryEntry.type] = (counts[memoryEntry.type] || 0) + 1;
    }
    return counts;
  }

  getMemoryCountsByCategory() {
    const counts = {};
    for (const memoryEntry of this.vectorStore.values()) {
      counts[memoryEntry.category] = (counts[memoryEntry.category] || 0) + 1;
    }
    return counts;
  }

  getClusterStatistics() {
    const stats = {};
    for (const [category, cluster] of this.semanticClusters.entries()) {
      stats[category] = {
        size: cluster.length,
        avgImportance: cluster.reduce((sum, item) => sum + item.importance, 0) / cluster.length
      };
    }
    return stats;
  }

  // Health check
  getHealthStatus() {
    return {
      initialized: this.initialized,
      vectorStoreSize: this.vectorStore.size,
      cacheSize: this.embeddingConfig.cache.size,
      embeddingServiceAvailable: !!process.env.OPENROUTER_API_KEY,
      semanticClustersCount: this.semanticClusters.size,
      performanceMetrics: {
        averageRetrievalTime: this.metrics.averageRetrievalTime,
        semanticHitRate: this.metrics.totalSearches > 0 ? 
          this.metrics.semanticHits / this.metrics.totalSearches : 0,
        totalSearches: this.metrics.totalSearches
      }
    };
  }
}

module.exports = SemanticMemoryService;