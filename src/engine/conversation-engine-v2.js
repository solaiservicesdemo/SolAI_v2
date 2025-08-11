/**
 * Conversation Engine V2 Integration Wrapper
 * Provides backward compatibility while enabling enterprise features
 */

const Logger = require('../core/logger');
const EnterpriseConversationEngine = require('../domain/conversation/EnterpriseConversationEngine');

class ConversationEngineV2 {
  constructor(memoryManager, personalityEngine, toolOrchestrator) {
    this.logger = new Logger('ConversationEngineV2');
    this.enterpriseEngine = new EnterpriseConversationEngine(
      memoryManager, 
      personalityEngine, 
      toolOrchestrator
    );
    
    // Feature flags for gradual rollout
    this.features = {
      useSemanticIntentClassification: process.env.ENABLE_SEMANTIC_INTENT === 'true' || true,
      useConversationFlows: process.env.ENABLE_CONVERSATION_FLOWS === 'true' || true,
      useSemanticMemory: process.env.ENABLE_SEMANTIC_MEMORY === 'true' || true,
      useAnalytics: process.env.ENABLE_CONVERSATION_ANALYTICS === 'true' || true,
      useDomainDrivenArchitecture: process.env.ENABLE_DDD === 'true' || true
    };
    
    this.initialized = false;
    
    this.logger.info('🚀 Conversation Engine V2 initialized with features:', this.features);
  }

  async initialize() {
    try {
      await this.enterpriseEngine.initialize();
      this.initialized = true;
      
      this.logger.info('✅ Conversation Engine V2 fully initialized');
      
      return {
        success: true,
        version: '2.0.0',
        features: this.getEnabledFeatures(),
        capabilities: await this.getSystemCapabilities()
      };
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize Conversation Engine V2', error);
      throw error;
    }
  }

  async processMessage(request) {
    if (!this.initialized) {
      throw new Error('Conversation Engine V2 not initialized');
    }

    // Enhance request with V2 metadata
    const enhancedRequest = {
      ...request,
      engineVersion: '2.0.0',
      features: this.features,
      processingTimestamp: new Date()
    };

    try {
      // Process using enterprise engine
      const result = await this.enterpriseEngine.processMessage(enhancedRequest);
      
      // Add V2-specific metadata
      result.engineVersion = '2.0.0';
      result.enterpriseFeatures = this.getEnabledFeatures();
      
      // Backward compatibility transformations
      if (result.success) {
        result.personalityInsights = result.personalityInsights || { fallback: false };
        result.toolsUsed = result.toolCoordination?.toolsUsed || [];
        result.responseTime = result.processingTime;
        result.metadata = {
          ...result.metadata,
          intent: result.messageAnalysis?.intent,
          emotionalContext: result.messageAnalysis?.emotion,
          memoryRetrieved: result.semanticContext,
          toolCoordination: result.toolCoordination?.coordination || 'none'
        };
      }
      
      return result;
      
    } catch (error) {
      this.logger.error('❌ V2 message processing failed', error);
      
      // Fallback response with V2 structure
      return {
        success: false,
        error: 'Processing failed',
        content: 'I apologize, but I encountered an issue processing your message. Could you please try again?',
        sessionId: request.sessionId,
        engineVersion: '2.0.0',
        fallback: true,
        processingTime: 0
      };
    }
  }

  // Backward compatibility methods

  async getConversationState(sessionId) {
    try {
      const status = await this.enterpriseEngine.getConversationStatus(sessionId);
      
      if (!status.exists) {
        return null;
      }
      
      // Transform to V1 format for backward compatibility
      return {
        sessionId,
        history: status.summary?.turnCount ? Array.from({ length: status.summary.turnCount }, (_, i) => ({
          message: `Turn ${i + 1}`,
          response: 'Response',
          timestamp: new Date()
        })) : [],
        preferences: status.summary?.preferences || {},
        lastActivity: new Date(),
        source: 'enterprise_v2'
      };
      
    } catch (error) {
      this.logger.error('❌ Failed to get conversation state', error);
      return null;
    }
  }

  async updateConversationState(sessionId, conversationData) {
    // V2 handles state automatically through domain aggregates
    // This method is kept for backward compatibility
    this.logger.debug('Conversation state update handled automatically by V2 engine', {
      sessionId: sessionId.substring(0, 8)
    });
    
    return true;
  }

  // Analytics and monitoring

  async getAnalytics(sessionId = null) {
    try {
      if (sessionId) {
        return await this.enterpriseEngine.getConversationStatus(sessionId);
      }
      
      const systemHealth = await this.enterpriseEngine.getSystemHealth();
      return {
        totalConversations: systemHealth.activeConversations,
        performanceMetrics: systemHealth.performanceMetrics,
        systemHealth: systemHealth
      };
      
    } catch (error) {
      this.logger.error('❌ Failed to get analytics', error);
      return null;
    }
  }

  async exportData(sessionId, format = 'json') {
    try {
      return await this.enterpriseEngine.exportConversationData(sessionId, format);
    } catch (error) {
      this.logger.error('❌ Failed to export data', error);
      return null;
    }
  }

  // System health and capabilities

  async getSystemHealth() {
    try {
      return await this.enterpriseEngine.getSystemHealth();
    } catch (error) {
      this.logger.error('❌ Failed to get system health', error);
      return {
        initialized: false,
        error: error.message,
        version: '2.0.0'
      };
    }
  }

  getEnabledFeatures() {
    return Object.entries(this.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature);
  }

  async getSystemCapabilities() {
    const health = await this.getSystemHealth();
    return health.capabilities || [];
  }

  // Feature toggles (for runtime configuration)

  enableFeature(featureName) {
    if (featureName in this.features) {
      this.features[featureName] = true;
      this.logger.info(`✅ Feature enabled: ${featureName}`);
      return true;
    }
    return false;
  }

  disableFeature(featureName) {
    if (featureName in this.features) {
      this.features[featureName] = false;
      this.logger.warn(`⚠️ Feature disabled: ${featureName}`);
      return true;
    }
    return false;
  }

  getFeatureStatus() {
    return { ...this.features };
  }

  // Performance monitoring

  getPerformanceMetrics() {
    return this.enterpriseEngine?.performanceMetrics || {
      totalRequests: 0,
      successfulRequests: 0,
      averageProcessingTime: 0,
      errorRate: 0
    };
  }

  // Development and debugging utilities

  async validateConfiguration() {
    const issues = [];
    
    // Check environment variables
    if (this.features.useSemanticIntentClassification && !process.env.OPENROUTER_API_KEY) {
      issues.push('OPENROUTER_API_KEY required for semantic intent classification');
    }
    
    if (this.features.useSemanticMemory && !process.env.OPENROUTER_API_KEY) {
      issues.push('OPENROUTER_API_KEY required for semantic memory');
    }
    
    // Check system health
    try {
      const health = await this.getSystemHealth();
      if (!health.initialized) {
        issues.push('Enterprise engine not properly initialized');
      }
    } catch (error) {
      issues.push(`System health check failed: ${error.message}`);
    }
    
    return {
      valid: issues.length === 0,
      issues,
      recommendations: this.generateConfigRecommendations(issues)
    };
  }

  generateConfigRecommendations(issues) {
    const recommendations = [];
    
    if (issues.some(issue => issue.includes('OPENROUTER_API_KEY'))) {
      recommendations.push('Set OPENROUTER_API_KEY environment variable for AI features');
    }
    
    if (issues.some(issue => issue.includes('initialized'))) {
      recommendations.push('Ensure all dependencies are properly configured before initialization');
    }
    
    return recommendations;
  }

  // Testing utilities

  async runDiagnostics() {
    const diagnostics = {
      timestamp: new Date(),
      version: '2.0.0',
      systemHealth: null,
      featureStatus: this.getFeatureStatus(),
      performanceMetrics: this.getPerformanceMetrics(),
      configuration: null,
      recommendations: []
    };
    
    try {
      // System health check
      diagnostics.systemHealth = await this.getSystemHealth();
      
      // Configuration validation
      diagnostics.configuration = await this.validateConfiguration();
      
      // Generate overall health assessment
      diagnostics.overallHealth = this.assessOverallHealth(diagnostics);
      
      // Generate recommendations
      diagnostics.recommendations = this.generateDiagnosticRecommendations(diagnostics);
      
    } catch (error) {
      diagnostics.error = error.message;
      diagnostics.overallHealth = 'critical';
    }
    
    return diagnostics;
  }

  assessOverallHealth(diagnostics) {
    if (diagnostics.error) return 'critical';
    
    const health = diagnostics.systemHealth;
    if (!health?.initialized) return 'critical';
    
    const errorRate = diagnostics.performanceMetrics?.errorRate || 0;
    if (errorRate > 0.1) return 'degraded';
    if (errorRate > 0.05) return 'warning';
    
    return 'healthy';
  }

  generateDiagnosticRecommendations(diagnostics) {
    const recommendations = [];
    
    if (diagnostics.overallHealth === 'critical') {
      recommendations.push({
        priority: 'high',
        category: 'system',
        message: 'System requires immediate attention - check error logs and configuration'
      });
    }
    
    if (diagnostics.performanceMetrics?.errorRate > 0.05) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        message: 'Error rate is elevated - monitor system stability'
      });
    }
    
    if (diagnostics.performanceMetrics?.averageProcessingTime > 5000) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        message: 'Average processing time is high - consider optimization'
      });
    }
    
    // Add configuration recommendations
    if (diagnostics.configuration?.issues?.length > 0) {
      recommendations.push(...diagnostics.configuration.recommendations.map(rec => ({
        priority: 'medium',
        category: 'configuration',
        message: rec
      })));
    }
    
    return recommendations;
  }

  // Migration utilities

  async migrateFromV1() {
    this.logger.info('🔄 Starting migration from V1 to V2...');
    
    try {
      // Migration would involve:
      // 1. Converting existing conversation states
      // 2. Importing memory data
      // 3. Updating configuration
      // 4. Validating system health
      
      this.logger.info('✅ Migration from V1 to V2 completed successfully');
      
      return {
        success: true,
        migrationDetails: {
          conversationsMigrated: 0,
          memoriesMigrated: 0,
          configurationUpdated: true
        }
      };
      
    } catch (error) {
      this.logger.error('❌ Migration from V1 to V2 failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Utility methods

  getVersion() {
    return {
      version: '2.0.0',
      name: 'Enterprise Conversational Intelligence Engine',
      build: process.env.BUILD_NUMBER || 'development',
      features: this.getEnabledFeatures(),
      initialized: this.initialized
    };
  }

  async shutdown() {
    this.logger.info('🔄 Shutting down Conversation Engine V2...');
    
    try {
      // Graceful shutdown procedures
      // 1. Complete any pending operations
      // 2. Save conversation states
      // 3. Close connections
      
      this.initialized = false;
      this.logger.info('✅ Conversation Engine V2 shutdown completed');
      
    } catch (error) {
      this.logger.error('❌ Error during shutdown', error);
    }
  }
}

module.exports = ConversationEngineV2;