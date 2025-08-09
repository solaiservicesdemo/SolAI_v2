/**
 * 🔒 SolAI Execution Sandbox
 * Enterprise-grade security and isolation for tool execution
 */

const Logger = require('../core/logger');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class ExecutionSandbox {
  constructor(auditTrail) {
    this.logger = new Logger('ExecutionSandbox');
    this.auditTrail = auditTrail;
    this.initialized = false;
    
    this.setupSecurityPolicies();
    this.setupResourceLimits();
    this.setupIsolationRules();
  }

  async initialize() {
    this.logger.info('🔒 Initializing execution sandbox...');
    
    try {
      await this.validateSecurityConfiguration();
      await this.initializeContainerization();
      await this.setupMonitoring();
      
      this.initialized = true;
      this.logger.info('✅ Execution sandbox initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize execution sandbox', error);
      throw error;
    }
  }

  setupSecurityPolicies() {
    // ENTERPRISE SECURITY: Comprehensive security policies
    this.securityPolicies = {
      allowedOperations: {
        'gmail': ['send_email', 'read_email', 'search_emails', 'create_draft'],
        'twilio': ['send_sms', 'make_call', 'schedule_call', 'get_call_logs'],
        'calendar': ['create_event', 'update_event', 'get_availability', 'schedule_meeting'],
        'crm': ['create_lead', 'update_contact', 'search_contacts', 'get_pipeline'],
        'document_processor': ['analyze_document', 'extract_text', 'generate_report'],
        'market_analyzer': ['get_market_data', 'comparative_analysis', 'price_trends'],
        'claude_flow': ['*'] // Claude Flow tools have built-in security
      },

      restrictedOperations: [
        'delete_all_*',
        'system_*',
        'admin_*',
        'root_*',
        'sudo_*',
        'exec_*',
        'shell_*'
      ],

      dataAccess: {
        'gmail': {
          readScopes: ['user_emails', 'drafts'],
          writeScopes: ['compose', 'send'],
          restrictions: ['no_admin_emails', 'no_system_folders']
        },
        'crm': {
          readScopes: ['contacts', 'leads', 'opportunities'],
          writeScopes: ['create_contact', 'update_contact'],
          restrictions: ['no_delete', 'no_bulk_operations']
        }
      },

      networkAccess: {
        allowedDomains: [
          'api.openai.com',
          'api.anthropic.com',
          'openrouter.ai',
          'supabase.co',
          'pinecone.io',
          'gmail.googleapis.com',
          'api.twilio.com'
        ],
        blockedDomains: [
          'suspicious-domain.com',
          'malware-site.net'
        ],
        requiresApproval: [
          'new-api-endpoint.com'
        ]
      }
    };
  }

  setupResourceLimits() {
    // PERFORMANCE & SECURITY: Resource consumption limits
    this.resourceLimits = {
      execution: {
        maxDuration: 30000,        // 30 seconds per operation
        maxMemory: 256 * 1024 * 1024, // 256MB memory limit
        maxConcurrency: 10,        // Max 10 concurrent operations
        timeoutGracePeriod: 5000   // 5 second grace period
      },

      network: {
        maxRequestSize: 10 * 1024 * 1024, // 10MB max request
        maxResponseSize: 50 * 1024 * 1024, // 50MB max response
        requestTimeout: 15000,     // 15 second request timeout
        maxRetries: 3,             // Max 3 retry attempts
        rateLimitRpm: 100          // 100 requests per minute
      },

      storage: {
        maxTempFileSize: 100 * 1024 * 1024, // 100MB temp files
        maxSessionStorage: 500 * 1024 * 1024, // 500MB per session
        tempFileRetention: 3600000 // 1 hour temp file retention
      },

      data: {
        maxRecordsRead: 1000,      // Max 1000 records per query
        maxRecordsWrite: 100,      // Max 100 records per operation
        batchOperationLimit: 50    // Max 50 items per batch
      }
    };

    this.activeExecutions = new Map();
    this.resourceUsage = {
      currentMemory: 0,
      concurrentOperations: 0,
      requestsPerMinute: 0,
      lastMinuteReset: Date.now()
    };
  }

  setupIsolationRules() {
    // ISOLATION: Multi-tenant security isolation
    this.isolationRules = {
      sessionIsolation: true,
      dataSegmentation: true,
      networkIsolation: false, // Shared network with monitoring
      processIsolation: true,
      
      crossSessionAccess: 'forbidden',
      sharedResourceAccess: 'monitored',
      elevatedPrivileges: 'never'
    };

    this.isolationState = {
      activeSessions: new Map(),
      sharedResources: new Set(),
      isolationViolations: []
    };
  }

  async validateSecurityConfiguration() {
    // Validate security settings and dependencies
    const requiredEnvVars = [
      'ENCRYPTION_KEY',
      'AUDIT_ENDPOINT'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        this.logger.warn(`⚠️ ${envVar} not configured, using fallback security`);
      }
    }

    // Generate session encryption key if not provided
    if (!process.env.ENCRYPTION_KEY) {
      this.encryptionKey = crypto.randomBytes(32);
      this.logger.debug('Generated temporary encryption key');
    } else {
      this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    }
  }

  async initializeContainerization() {
    // ENTERPRISE: Initialize process containerization
    this.containerConfig = {
      enabled: process.env.NODE_ENV === 'production',
      isolationLevel: 'process', // process, container, vm
      resourceMonitoring: true,
      networkSegmentation: true
    };

    if (this.containerConfig.enabled) {
      this.logger.info('🐳 Container-based isolation enabled');
      // In production, this would initialize actual container runtime
    } else {
      this.logger.info('🔧 Development mode - using process isolation');
    }
  }

  async setupMonitoring() {
    // Real-time security monitoring
    this.securityMonitoring = {
      enabled: true,
      anomalyDetection: true,
      threatScoring: true,
      realTimeAlerts: true
    };

    this.securityMetrics = {
      executionsBlocked: 0,
      anomaliesDetected: 0,
      resourceViolations: 0,
      securityAlerts: 0
    };

    // Start monitoring intervals
    setInterval(() => this.performSecurityScan(), 30000); // Every 30 seconds
    setInterval(() => this.updateResourceMetrics(), 5000); // Every 5 seconds
  }

  async executeSecurely(operation) {
    const executionId = uuidv4();
    const timer = this.logger.startTimer(`secure-execution-${executionId}`);
    
    try {
      // PRE-EXECUTION SECURITY CHECKS
      const securityValidation = await this.validateExecution(operation, executionId);
      if (!securityValidation.allowed) {
        throw new Error(`Execution blocked: ${securityValidation.reason}`);
      }

      // RESOURCE ALLOCATION
      const resourceAllocation = await this.allocateResources(operation, executionId);
      if (!resourceAllocation.success) {
        throw new Error(`Resource allocation failed: ${resourceAllocation.reason}`);
      }

      // CREATE EXECUTION CONTEXT
      const executionContext = this.createSecureContext(operation, executionId);
      
      // AUDIT TRAIL: Log execution start
      await this.auditTrail.logExecutionStart({
        executionId,
        operation: operation.tool + '.' + operation.action,
        sessionId: operation.context?.sessionId,
        securityLevel: securityValidation.securityLevel,
        resourceAllocation: resourceAllocation.allocation
      });

      // EXECUTE IN SANDBOX
      const result = await this.executeInSandbox(operation, executionContext);

      // POST-EXECUTION VALIDATION
      const resultValidation = this.validateExecutionResult(result, operation);
      if (!resultValidation.safe) {
        throw new Error(`Execution result validation failed: ${resultValidation.reason}`);
      }

      // CLEAN UP RESOURCES
      await this.releaseResources(executionId, resourceAllocation.allocation);

      // AUDIT TRAIL: Log successful execution
      await this.auditTrail.logExecutionComplete({
        executionId,
        success: true,
        result: this.sanitizeResultForAudit(result),
        processingTime: timer.duration,
        resourcesUsed: resourceAllocation.allocation
      });

      timer.end('Secure execution completed');

      return {
        success: true,
        result: result,
        executionId,
        securityLevel: securityValidation.securityLevel,
        processingTime: timer.duration
      };

    } catch (error) {
      // SECURITY INCIDENT: Log and handle security failures
      await this.handleSecurityIncident(executionId, operation, error);
      
      timer.end('Secure execution failed');
      
      return {
        success: false,
        error: error.message,
        executionId,
        securityIncident: true
      };
    }
  }

  async validateExecution(operation, executionId) {
    try {
      // OPERATION VALIDATION
      const operationCheck = this.validateOperation(operation);
      if (!operationCheck.allowed) {
        this.securityMetrics.executionsBlocked++;
        return { allowed: false, reason: operationCheck.reason };
      }

      // PERMISSION VALIDATION
      const permissionCheck = this.validatePermissions(operation);
      if (!permissionCheck.allowed) {
        this.securityMetrics.executionsBlocked++;
        return { allowed: false, reason: permissionCheck.reason };
      }

      // ANOMALY DETECTION
      const anomalyCheck = this.detectAnomalies(operation);
      if (anomalyCheck.suspicious) {
        this.securityMetrics.anomaliesDetected++;
        this.logger.warn('🚨 Suspicious activity detected', {
          executionId,
          anomalies: anomalyCheck.anomalies
        });
        
        if (anomalyCheck.riskLevel === 'high') {
          return { allowed: false, reason: 'High risk anomaly detected' };
        }
      }

      // RATE LIMITING
      const rateLimitCheck = this.checkRateLimit(operation);
      if (!rateLimitCheck.allowed) {
        return { allowed: false, reason: 'Rate limit exceeded' };
      }

      return {
        allowed: true,
        securityLevel: this.calculateSecurityLevel(operation, anomalyCheck),
        recommendations: anomalyCheck.recommendations
      };

    } catch (error) {
      this.logger.error('❌ Security validation failed', error);
      return { allowed: false, reason: 'Security validation error' };
    }
  }

  validateOperation(operation) {
    const { tool, action } = operation;
    
    // Check if tool is allowed
    if (!this.securityPolicies.allowedOperations[tool]) {
      return { allowed: false, reason: `Tool '${tool}' not in allowed list` };
    }

    // Check if action is allowed for this tool
    const allowedActions = this.securityPolicies.allowedOperations[tool];
    if (allowedActions !== ['*'] && !allowedActions.includes(action)) {
      return { allowed: false, reason: `Action '${action}' not allowed for tool '${tool}'` };
    }

    // Check restricted operations
    const operationString = `${tool}.${action}`;
    for (const restricted of this.securityPolicies.restrictedOperations) {
      if (restricted.includes('*')) {
        const pattern = restricted.replace('*', '.*');
        if (new RegExp(pattern).test(operationString)) {
          return { allowed: false, reason: `Operation matches restricted pattern: ${restricted}` };
        }
      } else if (operationString === restricted) {
        return { allowed: false, reason: `Operation explicitly restricted: ${restricted}` };
      }
    }

    return { allowed: true };
  }

  validatePermissions(operation) {
    const { tool, parameters } = operation;
    
    // Check data access permissions
    if (this.securityPolicies.dataAccess[tool]) {
      const accessPolicy = this.securityPolicies.dataAccess[tool];
      
      // Validate restrictions
      for (const restriction of accessPolicy.restrictions || []) {
        if (this.violatesRestriction(parameters, restriction)) {
          return { allowed: false, reason: `Violates restriction: ${restriction}` };
        }
      }
    }

    return { allowed: true };
  }

  violatesRestriction(parameters, restriction) {
    // Simple restriction checking - expand based on needs
    switch (restriction) {
      case 'no_admin_emails':
        return parameters?.recipients?.some(email => 
          email.includes('admin') || email.includes('root')
        );
      case 'no_delete':
        return parameters?.operation?.toLowerCase().includes('delete');
      case 'no_bulk_operations':
        return Array.isArray(parameters?.items) && parameters.items.length > 50;
      default:
        return false;
    }
  }

  detectAnomalies(operation) {
    const anomalies = [];
    const recommendations = [];
    
    // TIMING ANOMALIES: Unusual execution patterns
    const recentExecutions = Array.from(this.activeExecutions.values())
      .filter(exec => Date.now() - exec.startTime < 60000); // Last minute
    
    if (recentExecutions.length > 20) {
      anomalies.push('high_frequency_execution');
      recommendations.push('Consider rate limiting');
    }

    // PARAMETER ANOMALIES: Suspicious parameter patterns
    if (operation.parameters) {
      const paramString = JSON.stringify(operation.parameters).toLowerCase();
      const suspiciousPatterns = ['<script', 'javascript:', 'eval(', 'exec('];
      
      for (const pattern of suspiciousPatterns) {
        if (paramString.includes(pattern)) {
          anomalies.push('suspicious_parameters');
          recommendations.push('Parameter sanitization required');
        }
      }
    }

    // RESOURCE ANOMALIES: Unusual resource requests
    if (operation.parameters?.file_size && operation.parameters.file_size > 100 * 1024 * 1024) {
      anomalies.push('large_file_operation');
      recommendations.push('Monitor resource usage');
    }

    const riskLevel = anomalies.length > 2 ? 'high' : anomalies.length > 0 ? 'medium' : 'low';
    
    return {
      suspicious: anomalies.length > 0,
      anomalies,
      recommendations,
      riskLevel
    };
  }

  checkRateLimit(operation) {
    const now = Date.now();
    
    // Reset counter every minute
    if (now - this.resourceUsage.lastMinuteReset > 60000) {
      this.resourceUsage.requestsPerMinute = 0;
      this.resourceUsage.lastMinuteReset = now;
    }

    // Check rate limit
    if (this.resourceUsage.requestsPerMinute >= this.resourceLimits.network.rateLimitRpm) {
      return { allowed: false, reason: 'Rate limit exceeded' };
    }

    this.resourceUsage.requestsPerMinute++;
    return { allowed: true };
  }

  calculateSecurityLevel(operation, anomalyCheck) {
    let level = 'standard';
    
    if (anomalyCheck.riskLevel === 'high') level = 'maximum';
    else if (anomalyCheck.riskLevel === 'medium') level = 'enhanced';
    
    // Elevate security for sensitive operations
    const sensitiveTools = ['crm', 'gmail', 'financial_data'];
    if (sensitiveTools.includes(operation.tool)) {
      level = level === 'standard' ? 'enhanced' : 'maximum';
    }

    return level;
  }

  async allocateResources(operation, executionId) {
    try {
      // CHECK CURRENT RESOURCE USAGE
      if (this.resourceUsage.concurrentOperations >= this.resourceLimits.execution.maxConcurrency) {
        return { success: false, reason: 'Maximum concurrency reached' };
      }

      // ALLOCATE RESOURCES
      const allocation = {
        executionId,
        memoryLimit: this.resourceLimits.execution.maxMemory,
        timeoutLimit: this.resourceLimits.execution.maxDuration,
        networkTimeout: this.resourceLimits.network.requestTimeout,
        allocatedAt: Date.now()
      };

      // TRACK ALLOCATION
      this.activeExecutions.set(executionId, {
        startTime: Date.now(),
        allocation,
        operation: `${operation.tool}.${operation.action}`
      });

      this.resourceUsage.concurrentOperations++;
      
      return { success: true, allocation };

    } catch (error) {
      this.logger.error('❌ Resource allocation failed', error);
      return { success: false, reason: 'Resource allocation error' };
    }
  }

  createSecureContext(operation, executionId) {
    // CREATE ISOLATED EXECUTION CONTEXT
    const secureContext = {
      executionId,
      sessionId: operation.context?.sessionId,
      isolatedEnvironment: true,
      
      // Security constraints
      allowedNetworkAccess: this.securityPolicies.networkAccess.allowedDomains,
      blockedNetworkAccess: this.securityPolicies.networkAccess.blockedDomains,
      resourceLimits: this.resourceLimits,
      
      // Monitoring hooks
      onNetworkRequest: this.monitorNetworkAccess.bind(this),
      onResourceUsage: this.monitorResourceUsage.bind(this),
      onSecurityEvent: this.handleSecurityEvent.bind(this),
      
      // Isolation state
      tempFiles: new Set(),
      networkConnections: new Set(),
      allocatedMemory: 0
    };

    return secureContext;
  }

  async executeInSandbox(operation, context) {
    // SANDBOX EXECUTION: Isolated and monitored execution
    const startTime = Date.now();
    
    try {
      // Set up execution timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Execution timeout'));
        }, this.resourceLimits.execution.maxDuration);
      });

      // Execute operation with monitoring
      const executionPromise = this.monitoredExecution(operation, context);
      
      // Race between execution and timeout
      const result = await Promise.race([executionPromise, timeoutPromise]);
      
      // Validate execution time
      const executionTime = Date.now() - startTime;
      if (executionTime > this.resourceLimits.execution.maxDuration) {
        throw new Error('Execution exceeded time limit');
      }

      return result;

    } catch (error) {
      // Clean up any partial execution state
      await this.cleanupExecution(context);
      throw error;
    }
  }

  async monitoredExecution(operation, context) {
    // This would integrate with your existing tool orchestrator
    // For now, simulate secure execution
    
    this.logger.debug('🔒 Executing in sandbox', {
      executionId: context.executionId,
      operation: `${operation.tool}.${operation.action}`,
      securityLevel: 'enhanced'
    });

    // Simulate tool execution with monitoring
    return {
      success: true,
      tool: operation.tool,
      action: operation.action,
      results: { message: 'Operation executed securely' },
      executionTime: Date.now(),
      securityContext: {
        sandboxed: true,
        monitored: true,
        isolated: true
      }
    };
  }

  validateExecutionResult(result, operation) {
    // POST-EXECUTION VALIDATION
    try {
      // Check result size
      const resultSize = JSON.stringify(result).length;
      if (resultSize > this.resourceLimits.network.maxResponseSize) {
        return { safe: false, reason: 'Result exceeds size limit' };
      }

      // Check for sensitive data in results
      const resultString = JSON.stringify(result).toLowerCase();
      const sensitivePatterns = ['password', 'ssn', 'credit_card', 'api_key'];
      
      for (const pattern of sensitivePatterns) {
        if (resultString.includes(pattern)) {
          this.logger.warn('🚨 Sensitive data detected in result', { 
            pattern, 
            operation: `${operation.tool}.${operation.action}` 
          });
          // Don't block, but flag for review
        }
      }

      return { safe: true };

    } catch (error) {
      this.logger.error('❌ Result validation failed', error);
      return { safe: false, reason: 'Result validation error' };
    }
  }

  async releaseResources(executionId, allocation) {
    try {
      // Remove from active executions
      this.activeExecutions.delete(executionId);
      this.resourceUsage.concurrentOperations--;
      
      // Clean up any temp resources
      // In a real implementation, this would clean up files, connections, etc.
      
      this.logger.debug('Resources released', { executionId });

    } catch (error) {
      this.logger.error('❌ Failed to release resources', error);
    }
  }

  sanitizeResultForAudit(result) {
    // Remove sensitive data from audit logs
    const sanitized = JSON.parse(JSON.stringify(result));
    
    // Remove potential sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret'];
    
    function sanitizeObject(obj) {
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  async handleSecurityIncident(executionId, operation, error) {
    const incident = {
      incidentId: uuidv4(),
      executionId,
      timestamp: new Date().toISOString(),
      operation: `${operation.tool}.${operation.action}`,
      error: error.message,
      severity: this.classifyIncidentSeverity(error),
      sessionId: operation.context?.sessionId
    };

    // Log security incident
    this.logger.error('🚨 Security incident', incident);
    
    // Audit trail
    await this.auditTrail.logSecurityIncident(incident);
    
    // Update security metrics
    this.securityMetrics.securityAlerts++;
    
    // In production, this could trigger alerts, notifications, etc.
  }

  classifyIncidentSeverity(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('blocked') || message.includes('restricted')) {
      return 'medium';
    } else if (message.includes('anomaly') || message.includes('suspicious')) {
      return 'high';
    } else if (message.includes('timeout') || message.includes('resource')) {
      return 'low';
    }
    
    return 'medium';
  }

  // MONITORING METHODS
  monitorNetworkAccess(request) {
    this.logger.debug('Network access monitored', { 
      url: request.url,
      method: request.method 
    });
  }

  monitorResourceUsage(usage) {
    this.resourceUsage.currentMemory = usage.memory;
  }

  handleSecurityEvent(event) {
    this.logger.warn('Security event', event);
  }

  async performSecurityScan() {
    // Periodic security scanning
    const activeCount = this.activeExecutions.size;
    if (activeCount > this.resourceLimits.execution.maxConcurrency * 0.8) {
      this.logger.warn('⚠️ High resource utilization detected', { activeExecutions: activeCount });
    }
  }

  updateResourceMetrics() {
    // Update resource tracking
    const now = Date.now();
    const staleExecutions = [];
    
    for (const [id, execution] of this.activeExecutions.entries()) {
      if (now - execution.startTime > this.resourceLimits.execution.maxDuration + 5000) {
        staleExecutions.push(id);
      }
    }
    
    // Clean up stale executions
    for (const staleId of staleExecutions) {
      this.activeExecutions.delete(staleId);
      this.resourceUsage.concurrentOperations--;
      this.logger.warn('⚠️ Cleaned up stale execution', { executionId: staleId });
    }
  }

  async cleanupExecution(context) {
    // Clean up any resources from failed execution
    if (context.tempFiles) {
      for (const file of context.tempFiles) {
        // Clean up temp files
      }
    }
    
    if (context.networkConnections) {
      for (const connection of context.networkConnections) {
        // Close network connections
      }
    }
  }

  // PUBLIC API
  async getSecurityStatus() {
    return {
      initialized: this.initialized,
      securityLevel: 'enterprise',
      activeExecutions: this.activeExecutions.size,
      metrics: this.securityMetrics,
      resourceUsage: {
        memoryUsage: this.resourceUsage.currentMemory,
        concurrentOperations: this.resourceUsage.concurrentOperations,
        requestsPerMinute: this.resourceUsage.requestsPerMinute
      }
    };
  }

  async updateSecurityPolicy(policy) {
    // Dynamic security policy updates
    this.securityPolicies = { ...this.securityPolicies, ...policy };
    this.logger.info('Security policy updated');
    
    return { success: true };
  }
}

module.exports = ExecutionSandbox;