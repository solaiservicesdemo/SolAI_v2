/**
 * 🏗️ Base Tool Adapter - Enterprise Tool Integration Pattern
 * BMAD Architecture: Base class for all tool adapters with proper error handling and validation
 */

const Logger = require('../../core/logger');
const { v4: uuidv4 } = require('uuid');

class BaseToolAdapter {
  constructor(toolConfig, auditTrail) {
    this.toolConfig = toolConfig;
    this.auditTrail = auditTrail;
    this.logger = new Logger(`ToolAdapter:${toolConfig.name}`);
    this.initialized = false;
    this.errorCount = 0;
    this.maxRetries = 3;
    this.circuitBreakerThreshold = 5;
    this.lastError = null;
    this.performance = {
      averageResponseTime: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0
    };
  }

  async initialize() {
    this.logger.info(`Initializing tool adapter: ${this.toolConfig.name}`);
    
    try {
      await this.validateConfiguration();
      await this.establishConnection();
      await this.performHealthCheck();
      
      this.initialized = true;
      this.logger.info(`Tool adapter initialized: ${this.toolConfig.name}`);
      
      return { success: true };
      
    } catch (error) {
      this.logger.error(`Failed to initialize tool adapter: ${this.toolConfig.name}`, error);
      throw error;
    }
  }

  async validateConfiguration() {
    const requiredFields = ['name', 'type', 'capabilities'];
    const missingFields = requiredFields.filter(field => !this.toolConfig[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
    }

    // Validate capabilities array
    if (!Array.isArray(this.toolConfig.capabilities) || this.toolConfig.capabilities.length === 0) {
      throw new Error('Tool must have at least one capability defined');
    }
  }

  async establishConnection() {
    // Base implementation - override in specific adapters
    this.logger.debug('Base connection established (override in specific adapter)');
  }

  async performHealthCheck() {
    // Base implementation - override in specific adapters
    return { healthy: true, latency: 0 };
  }

  async execute(action, parameters = {}, context = {}) {
    const executionId = uuidv4();
    const startTime = Date.now();

    // Pre-execution validation
    if (!this.initialized) {
      throw new Error('Tool adapter not initialized');
    }

    if (this.errorCount >= this.circuitBreakerThreshold) {
      throw new Error('Circuit breaker open - tool experiencing high error rate');
    }

    try {
      // Audit execution start
      await this.auditTrail?.logExecutionStart({
        executionId,
        sessionId: context.sessionId,
        operation: `${this.toolConfig.name}.${action}`,
        securityLevel: this.toolConfig.securityLevel || 'medium',
        resourceAllocation: this.calculateResourceAllocation(parameters)
      });

      // Validate action and parameters
      await this.validateExecution(action, parameters);

      // Execute with retry logic
      const result = await this.executeWithRetry(action, parameters, context, executionId);

      // Update performance metrics
      const executionTime = Date.now() - startTime;
      this.updatePerformanceMetrics(true, executionTime);

      // Reset error count on successful execution
      this.errorCount = 0;

      // Audit execution completion
      await this.auditTrail?.logExecutionComplete({
        executionId,
        sessionId: context.sessionId,
        success: true,
        processingTime: executionTime,
        resourcesUsed: this.calculateResourcesUsed(parameters, result),
        result
      });

      return {
        success: true,
        executionId,
        result,
        metadata: {
          executionTime,
          tool: this.toolConfig.name,
          action,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.errorCount++;
      this.lastError = error;

      this.updatePerformanceMetrics(false, executionTime);

      // Audit execution failure
      await this.auditTrail?.logSecurityIncident({
        executionId,
        sessionId: context.sessionId,
        operation: `${this.toolConfig.name}.${action}`,
        error: error.message,
        severity: this.classifyErrorSeverity(error),
        threatIndicators: this.extractThreatIndicators(error, parameters)
      });

      this.logger.error(`Tool execution failed: ${this.toolConfig.name}.${action}`, {
        executionId,
        error: error.message,
        parameters
      });

      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  async validateExecution(action, parameters) {
    // Check if action is supported
    if (!this.toolConfig.capabilities.includes(action)) {
      throw new Error(`Action '${action}' not supported by tool '${this.toolConfig.name}'`);
    }

    // Validate parameters - override in specific adapters
    await this.validateParameters(action, parameters);
  }

  async validateParameters(action, parameters) {
    // Base validation - override in specific adapters
    if (typeof parameters !== 'object') {
      throw new Error('Parameters must be an object');
    }
  }

  async executeWithRetry(action, parameters, context, executionId) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.executeAction(action, parameters, context, executionId);
      } catch (error) {
        lastError = error;
        
        if (!this.isRetryableError(error) || attempt === this.maxRetries) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        this.logger.warn(`Retrying tool execution (attempt ${attempt + 1}/${this.maxRetries})`, {
          tool: this.toolConfig.name,
          action,
          error: error.message
        });
      }
    }

    throw lastError;
  }

  async executeAction(action, parameters, context, executionId) {
    // Override in specific adapters to implement actual tool execution
    throw new Error('executeAction must be implemented in specific adapter');
  }

  isRetryableError(error) {
    // Network errors, timeouts, and temporary service unavailable errors are retryable
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /503/,
      /502/,
      /connection/i,
      /temporary/i
    ];

    return retryablePatterns.some(pattern => pattern.test(error.message));
  }

  classifyErrorSeverity(error) {
    // Security-related errors are high severity
    if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
      return 'high';
    }
    
    // Authentication errors are medium severity
    if (error.message.includes('authentication') || error.message.includes('token')) {
      return 'medium';
    }
    
    // Network and timeout errors are low severity
    if (this.isRetryableError(error)) {
      return 'low';
    }
    
    return 'medium';
  }

  extractThreatIndicators(error, parameters) {
    const indicators = [];
    
    // Check for potential injection attempts
    const parameterString = JSON.stringify(parameters);
    if (parameterString.includes('<script') || parameterString.includes('DROP TABLE')) {
      indicators.push('potential_injection');
    }
    
    // Check for excessive parameter sizes
    if (parameterString.length > 10000) {
      indicators.push('oversized_payload');
    }
    
    // Check for authentication bypass attempts
    if (error.message.includes('bypass') || error.message.includes('escalation')) {
      indicators.push('privilege_escalation');
    }
    
    return indicators;
  }

  calculateResourceAllocation(parameters) {
    // Estimate resource needs based on parameters
    const parameterSize = JSON.stringify(parameters).length;
    const complexity = this.toolConfig.complexity || 'medium';
    
    return {
      estimatedMemory: Math.max(1, Math.ceil(parameterSize / 1000)) + 'MB',
      estimatedCpuTime: complexity === 'high' ? '5s' : '1s',
      networkRequired: this.toolConfig.requiresNetwork !== false
    };
  }

  calculateResourcesUsed(parameters, result) {
    return {
      actualMemory: '1MB', // Would be measured in real implementation
      actualCpuTime: '0.5s',
      networkCalls: 1,
      resultSize: JSON.stringify(result).length + ' bytes'
    };
  }

  updatePerformanceMetrics(success, executionTime) {
    this.performance.totalExecutions++;
    
    if (success) {
      this.performance.successfulExecutions++;
    } else {
      this.performance.failedExecutions++;
    }

    // Update average response time
    const totalTime = this.performance.averageResponseTime * (this.performance.totalExecutions - 1) + executionTime;
    this.performance.averageResponseTime = totalTime / this.performance.totalExecutions;
  }

  getHealthStatus() {
    const successRate = this.performance.totalExecutions === 0 ? 0 : 
      this.performance.successfulExecutions / this.performance.totalExecutions;

    return {
      initialized: this.initialized,
      healthy: this.errorCount < this.circuitBreakerThreshold && successRate > 0.8,
      errorCount: this.errorCount,
      successRate: Math.round(successRate * 100),
      averageResponseTime: Math.round(this.performance.averageResponseTime),
      lastError: this.lastError?.message,
      circuitBreakerOpen: this.errorCount >= this.circuitBreakerThreshold
    };
  }

  getPerformanceMetrics() {
    return { ...this.performance };
  }

  async shutdown() {
    this.logger.info(`Shutting down tool adapter: ${this.toolConfig.name}`);
    this.initialized = false;
    
    // Override in specific adapters for cleanup
    await this.cleanup();
  }

  async cleanup() {
    // Override in specific adapters
  }
}

module.exports = BaseToolAdapter;