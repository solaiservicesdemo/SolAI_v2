/**
 * 🏥 SolAI Health Monitor
 * System health monitoring and diagnostics
 */

const Logger = require('../core/logger');

class HealthMonitor {
  constructor(components = {}) {
    this.components = components;
    this.logger = new Logger('HealthMonitor');
    this.healthChecks = new Map();
    this.metrics = {
      startTime: new Date(),
      totalRequests: 0,
      successfulRequests: 0,
      errors: 0,
      averageResponseTime: 0
    };
    
    this.setupHealthChecks();
  }

  setupHealthChecks() {
    // Register component health checks
    if (this.components.memoryManager) {
      this.healthChecks.set('memory', () => this.components.memoryManager.getHealthStatus());
    }
    
    if (this.components.conversationEngine) {
      this.healthChecks.set('conversation', () => this.checkConversationEngine());
    }
    
    if (this.components.toolOrchestrator) {
      this.healthChecks.set('tools', () => this.components.toolOrchestrator.getToolStatus());
    }
  }

  async checkConversationEngine() {
    // Basic health check for conversation engine
    try {
      return {
        initialized: true,
        status: 'healthy',
        activeConversations: 0 // Would track active sessions in production
      };
    } catch (error) {
      return {
        initialized: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async getSystemHealth() {
    const health = {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      components: {},
      uptime: Date.now() - this.metrics.startTime.getTime()
    };

    // Check all registered components
    for (const [component, checkFn] of this.healthChecks) {
      try {
        health.components[component] = await checkFn();
      } catch (error) {
        health.components[component] = {
          status: 'error',
          error: error.message
        };
        health.overall = 'degraded';
      }
    }

    return health;
  }

  async getSystemMetrics() {
    const health = await this.getSystemHealth();
    
    return {
      health,
      metrics: {
        ...this.metrics,
        uptime: Date.now() - this.metrics.startTime.getTime(),
        successRate: this.metrics.totalRequests > 0 
          ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
          : 0
      }
    };
  }

  recordRequest(responseTime, success = true) {
    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.errors++;
    }
    
    // Update average response time
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests;
  }
}

module.exports = HealthMonitor;