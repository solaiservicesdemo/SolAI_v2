/**
 * 🏗️ Enterprise Tool Orchestrator - Real Tool Coordination System
 * BMAD Architecture: Proper enterprise workflow orchestration replacing fake tool system
 */

const Logger = require('../core/logger');
const { v4: uuidv4 } = require('uuid');

// Import tool adapters
const BaseToolAdapter = require('./adapters/BaseToolAdapter');
const MCPToolAdapter = require('./adapters/MCPToolAdapter');
const SuperToolAdapter = require('./adapters/SuperToolAdapter');
const ExternalAPIAdapter = require('./adapters/ExternalAPIAdapter');

class EnterpriseToolOrchestrator {
  constructor(memoryManager, executionSandbox, auditTrail, notificationBroadcaster = null) {
    this.memoryManager = memoryManager;
    this.executionSandbox = executionSandbox;
    this.auditTrail = auditTrail;
    this.notificationBroadcaster = notificationBroadcaster;
    this.logger = new Logger('EnterpriseToolOrchestrator');
    this.initialized = false;

    // Tool management
    this.toolAdapters = new Map();
    this.toolCategories = new Map();
    this.workflowEngine = null;
    this.toolHealthMonitor = null;

    // Performance and reliability
    this.performanceMetrics = new Map();
    this.circuitBreakers = new Map();
    this.executionHistory = [];
    this.maxHistorySize = 1000;

    // Workflow management
    this.activeWorkflows = new Map();
    this.workflowTemplates = new Map();
    this.coordinationRules = new Map();

    this.initializeSystemComponents();
  }

  initializeSystemComponents() {
    // Initialize workflow engine
    this.workflowEngine = new WorkflowExecutionEngine(this);
    
    // Initialize tool health monitoring
    this.toolHealthMonitor = new ToolHealthMonitor(this);
    
    // Set up coordination rules
    this.setupCoordinationRules();
    
    // Set up workflow templates
    this.setupWorkflowTemplates();
  }

  async initialize() {
    this.logger.info('🏗️ Initializing Enterprise Tool Orchestrator...');
    
    try {
      // Load and initialize tool configurations
      await this.loadToolConfigurations();
      
      // Initialize all tool adapters
      await this.initializeToolAdapters();
      
      // Start health monitoring
      await this.toolHealthMonitor.start();
      
      // Initialize workflow engine
      await this.workflowEngine.initialize();
      
      this.initialized = true;
      this.logger.info('✅ Enterprise Tool Orchestrator initialized successfully');
      
      return { success: true, toolsLoaded: this.toolAdapters.size };
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize Enterprise Tool Orchestrator', error);
      throw error;
    }
  }

  async loadToolConfigurations() {
    // Load tool configurations from environment and configuration files
    const toolConfigs = this.getToolConfigurations();
    
    for (const [toolName, config] of Object.entries(toolConfigs)) {
      try {
        const adapter = await this.createToolAdapter(toolName, config);
        this.toolAdapters.set(toolName, adapter);
        
        // Categorize the tool
        this.categorizeTools(toolName, config);
        
        this.logger.debug(`Tool configuration loaded: ${toolName}`, {
          type: config.type,
          capabilities: config.capabilities?.length || 0
        });
        
      } catch (error) {
        this.logger.error(`Failed to load tool configuration: ${toolName}`, error);
      }
    }
  }

  getToolConfigurations() {
    return {
      // Real Estate Super Tools
      gmail: {
        type: 'super_tool',
        name: 'gmail',
        category: 'communication',
        capabilities: ['send_email', 'read_emails', 'search_emails', 'manage_labels'],
        priority: 'high',
        securityLevel: 'medium',
        requiresAuth: true,
        credentials: {
          google_client_id: process.env.GOOGLE_CLIENT_ID,
          google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
          google_refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        }
      },
      
      twilio: {
        type: 'super_tool',
        name: 'twilio',
        category: 'communication',
        capabilities: ['send_sms', 'make_calls', 'voice_messages', 'contact_management'],
        priority: 'high',
        securityLevel: 'medium',
        requiresAuth: true,
        credentials: {
          twilio_account_sid: process.env.TWILIO_ACCOUNT_SID,
          twilio_auth_token: process.env.TWILIO_AUTH_TOKEN
        }
      },
      
      crm: {
        type: 'super_tool',
        name: 'crm',
        category: 'client_management',
        capabilities: ['manage_contacts', 'track_leads', 'update_properties', 'generate_reports'],
        priority: 'critical',
        securityLevel: 'high',
        requiresAuth: true,
        credentials: {
          crm_api_key: process.env.CRM_API_KEY,
          crm_base_url: process.env.CRM_BASE_URL
        }
      },
      
      // MCP Tools (if Claude Flow is available)
      claude_flow_mcp: {
        type: 'mcp',
        name: 'claude_flow_mcp',
        category: 'multi_purpose',
        capabilities: ['*'], // Dynamically discovered from MCP server
        priority: 'medium',
        securityLevel: 'medium',
        mcpConfig: {
          endpoint: process.env.CLAUDE_FLOW_ENDPOINT || 'http://localhost:3002',
          apiKey: process.env.CLAUDE_FLOW_API_KEY,
          timeout: 30000
        }
      },
      
      // External APIs
      market_data: {
        type: 'external_api',
        name: 'market_data',
        category: 'analytics',
        capabilities: ['property_valuation', 'market_trends', 'comparative_analysis'],
        priority: 'medium',
        securityLevel: 'low',
        apiConfig: {
          baseUrl: process.env.MARKET_DATA_API_BASE || 'https://api.realestate-data.com',
          auth: {
            type: 'api_key',
            apiKey: process.env.MARKET_DATA_API_KEY,
            headerName: 'X-API-Key'
          },
          actions: {
            property_valuation: {
              method: 'GET',
              endpoint: '/properties/{propertyId}/valuation',
              queryParams: {
                include_comparables: 'includeComparables'
              }
            },
            market_trends: {
              method: 'GET',
              endpoint: '/markets/{marketId}/trends'
            }
          }
        }
      }
    };
  }

  async createToolAdapter(toolName, config) {
    switch (config.type) {
      case 'super_tool':
        return new SuperToolAdapter(config, this.auditTrail, config.credentials);
      
      case 'mcp':
        return new MCPToolAdapter(config, this.auditTrail, config.mcpConfig);
      
      case 'external_api':
        return new ExternalAPIAdapter(config, this.auditTrail, config.apiConfig);
      
      default:
        throw new Error(`Unknown tool type: ${config.type}`);
    }
  }

  categorizeTools(toolName, config) {
    const category = config.category || 'general';
    
    if (!this.toolCategories.has(category)) {
      this.toolCategories.set(category, new Set());
    }
    
    this.toolCategories.get(category).add(toolName);
  }

  async initializeToolAdapters() {
    const initPromises = [];
    
    for (const [toolName, adapter] of this.toolAdapters) {
      initPromises.push(
        adapter.initialize().catch(error => {
          this.logger.error(`Failed to initialize tool: ${toolName}`, error);
          // Mark tool as unavailable but don't fail the whole system
          return { success: false, error: error.message };
        })
      );
    }
    
    const results = await Promise.allSettled(initPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    this.logger.info(`Tool adapters initialized: ${successCount}/${this.toolAdapters.size}`);
  }

  setupCoordinationRules() {
    // Define rules for tool coordination and workflow orchestration
    this.coordinationRules.set('client_communication', {
      priority: ['twilio', 'gmail'], // Try SMS first, fallback to email
      maxConcurrent: 1,
      timeout: 30000,
      retryPolicy: { maxAttempts: 3, backoffMultiplier: 2 }
    });
    
    this.coordinationRules.set('data_processing', {
      priority: ['crm', 'market_data'],
      maxConcurrent: 5,
      timeout: 60000,
      retryPolicy: { maxAttempts: 2, backoffMultiplier: 1.5 }
    });
    
    this.coordinationRules.set('document_handling', {
      priority: ['claude_flow_mcp'],
      maxConcurrent: 3,
      timeout: 120000,
      retryPolicy: { maxAttempts: 2, backoffMultiplier: 2 }
    });
  }

  setupWorkflowTemplates() {
    // Pre-defined workflow templates for common business processes
    this.workflowTemplates.set('lead_followup', {
      name: 'Lead Follow-up Workflow',
      steps: [
        { tool: 'crm', action: 'get_lead_info', required: true },
        { tool: 'crm', action: 'get_interaction_history', required: false },
        { 
          tool: 'twilio', 
          action: 'send_sms', 
          condition: 'lead.preferred_contact === "sms"',
          fallback: { tool: 'gmail', action: 'send_email' }
        },
        { tool: 'crm', action: 'log_interaction', required: true }
      ],
      timeout: 300000,
      errorHandling: 'continue_on_non_critical'
    });
    
    this.workflowTemplates.set('property_analysis', {
      name: 'Property Analysis Workflow',
      steps: [
        { tool: 'market_data', action: 'property_valuation', required: true },
        { tool: 'market_data', action: 'market_trends', required: false },
        { tool: 'crm', action: 'update_property_data', required: true }
      ],
      timeout: 180000,
      errorHandling: 'fail_on_critical'
    });
  }

  // ===================== MAIN ORCHESTRATION METHODS =====================

  async coordinateTools(intent, context, parameters = {}) {
    const coordinationId = uuidv4();
    const startTime = Date.now();
    
    this.logger.info(`🔧 Starting tool coordination: ${intent}`, { coordinationId });
    
    try {
      // Validate that we're initialized
      if (!this.initialized) {
        throw new Error('Tool orchestrator not initialized');
      }
      
      // Analyze intent and select appropriate workflow
      const workflow = await this.selectWorkflow(intent, context, parameters);
      
      // Execute the workflow
      const result = await this.workflowEngine.executeWorkflow(workflow, context, coordinationId);
      
      // Record performance metrics
      const executionTime = Date.now() - startTime;
      this.recordPerformanceMetrics(intent, true, executionTime);
      
      this.logger.info(`✅ Tool coordination completed: ${intent}`, { 
        coordinationId, 
        executionTime 
      });
      
      return {
        success: true,
        coordinationId,
        result,
        executionTime,
        toolsUsed: result.toolsUsed || []
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordPerformanceMetrics(intent, false, executionTime);
      
      this.logger.error(`❌ Tool coordination failed: ${intent}`, { 
        coordinationId, 
        error: error.message 
      });
      
      throw new Error(`Tool coordination failed: ${error.message}`);
    }
  }

  async selectWorkflow(intent, context, parameters) {
    // Check for pre-defined workflow templates
    if (this.workflowTemplates.has(intent)) {
      const template = this.workflowTemplates.get(intent);
      return this.customizeWorkflowTemplate(template, context, parameters);
    }
    
    // Generate dynamic workflow based on intent
    return this.generateDynamicWorkflow(intent, context, parameters);
  }

  customizeWorkflowTemplate(template, context, parameters) {
    const customizedSteps = template.steps.map(step => ({
      ...step,
      parameters: this.mergeParameters(step.parameters, parameters),
      context
    }));
    
    return {
      ...template,
      steps: customizedSteps,
      id: uuidv4(),
      context,
      parameters
    };
  }

  generateDynamicWorkflow(intent, context, parameters) {
    // Dynamic workflow generation based on intent analysis
    const toolMapping = this.getToolsForIntent(intent);
    
    if (toolMapping.length === 0) {
      throw new Error(`No tools available for intent: ${intent}`);
    }
    
    const steps = toolMapping.map(tool => ({
      tool: tool.name,
      action: this.deriveActionFromIntent(intent, tool),
      parameters,
      required: tool.priority === 'critical'
    }));
    
    return {
      id: uuidv4(),
      name: `Dynamic workflow for ${intent}`,
      steps,
      timeout: 180000,
      errorHandling: 'continue_on_non_critical',
      context,
      parameters
    };
  }

  getToolsForIntent(intent) {
    const intentCategories = {
      'send_email': ['communication'],
      'send_sms': ['communication'],
      'client_followup': ['communication', 'client_management'],
      'lead_management': ['client_management'],
      'property_analysis': ['analytics', 'client_management'],
      'market_research': ['analytics'],
      'schedule_appointment': ['communication', 'scheduling'],
      'document_processing': ['multi_purpose', 'document_management']
    };
    
    const relevantCategories = intentCategories[intent] || ['general'];
    const availableTools = [];
    
    for (const category of relevantCategories) {
      if (this.toolCategories.has(category)) {
        for (const toolName of this.toolCategories.get(category)) {
          const adapter = this.toolAdapters.get(toolName);
          if (adapter && adapter.getHealthStatus().healthy) {
            availableTools.push({
              name: toolName,
              category,
              priority: adapter.toolConfig.priority || 'medium'
            });
          }
        }
      }
    }
    
    // Sort by priority: critical > high > medium > low
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    return availableTools.sort((a, b) => 
      (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
    );
  }

  deriveActionFromIntent(intent, tool) {
    // Map intents to specific tool actions
    const actionMappings = {
      'send_email': { 'gmail': 'send_email' },
      'send_sms': { 'twilio': 'send_sms' },
      'client_followup': { 
        'crm': 'track_leads',
        'gmail': 'send_email',
        'twilio': 'send_sms'
      },
      'property_analysis': {
        'market_data': 'property_valuation',
        'crm': 'update_properties'
      }
    };
    
    const mapping = actionMappings[intent];
    if (mapping && mapping[tool.name]) {
      return mapping[tool.name];
    }
    
    // Default to the first capability of the tool
    const adapter = this.toolAdapters.get(tool.name);
    return adapter?.toolConfig.capabilities?.[0] || 'execute';
  }

  mergeParameters(stepParams = {}, globalParams = {}) {
    return { ...globalParams, ...stepParams };
  }

  recordPerformanceMetrics(intent, success, executionTime) {
    if (!this.performanceMetrics.has(intent)) {
      this.performanceMetrics.set(intent, {
        totalExecutions: 0,
        successfulExecutions: 0,
        averageTime: 0,
        totalTime: 0
      });
    }
    
    const metrics = this.performanceMetrics.get(intent);
    metrics.totalExecutions++;
    metrics.totalTime += executionTime;
    metrics.averageTime = metrics.totalTime / metrics.totalExecutions;
    
    if (success) {
      metrics.successfulExecutions++;
    }
    
    // Keep execution history for analysis
    this.executionHistory.push({
      intent,
      success,
      executionTime,
      timestamp: Date.now()
    });
    
    // Trim history if it gets too large
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistorySize);
    }
  }

  // ===================== TOOL MANAGEMENT METHODS =====================

  async executeDirectTool(toolName, action, parameters, context = {}) {
    const adapter = this.toolAdapters.get(toolName);
    if (!adapter) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    return adapter.execute(action, parameters, context);
  }

  getAvailableTools() {
    const tools = {};
    
    for (const [toolName, adapter] of this.toolAdapters) {
      const healthStatus = adapter.getHealthStatus();
      tools[toolName] = {
        type: adapter.toolConfig.type,
        category: adapter.toolConfig.category,
        capabilities: adapter.toolConfig.capabilities,
        healthy: healthStatus.healthy,
        initialized: healthStatus.initialized
      };
    }
    
    return tools;
  }

  getToolsByCategory(category) {
    const categoryTools = this.toolCategories.get(category);
    if (!categoryTools) return [];
    
    return Array.from(categoryTools).map(toolName => {
      const adapter = this.toolAdapters.get(toolName);
      return {
        name: toolName,
        health: adapter?.getHealthStatus(),
        capabilities: adapter?.toolConfig.capabilities
      };
    });
  }

  getPerformanceMetrics() {
    const metrics = {};
    
    for (const [intent, data] of this.performanceMetrics) {
      metrics[intent] = {
        ...data,
        successRate: data.totalExecutions > 0 ? 
          (data.successfulExecutions / data.totalExecutions * 100).toFixed(2) + '%' : '0%'
      };
    }
    
    return {
      byIntent: metrics,
      recentExecutions: this.executionHistory.slice(-10),
      totalTools: this.toolAdapters.size,
      healthyTools: Array.from(this.toolAdapters.values())
        .filter(adapter => adapter.getHealthStatus().healthy).length
    };
  }

  async shutdown() {
    this.logger.info('🔄 Shutting down Enterprise Tool Orchestrator...');
    
    try {
      // Stop health monitoring
      await this.toolHealthMonitor.stop();
      
      // Shutdown workflow engine
      await this.workflowEngine.shutdown();
      
      // Shutdown all tool adapters
      const shutdownPromises = [];
      for (const [toolName, adapter] of this.toolAdapters) {
        shutdownPromises.push(
          adapter.shutdown().catch(error => 
            this.logger.error(`Failed to shutdown tool: ${toolName}`, error)
          )
        );
      }
      
      await Promise.allSettled(shutdownPromises);
      
      this.initialized = false;
      this.logger.info('✅ Enterprise Tool Orchestrator shutdown completed');
      
    } catch (error) {
      this.logger.error('❌ Error during Enterprise Tool Orchestrator shutdown', error);
      throw error;
    }
  }
}

// ===================== WORKFLOW EXECUTION ENGINE =====================

class WorkflowExecutionEngine {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.logger = new Logger('WorkflowExecutionEngine');
    this.activeWorkflows = new Map();
    this.workflowHistory = [];
  }

  async initialize() {
    this.logger.info('Initializing Workflow Execution Engine');
  }

  async executeWorkflow(workflow, context, coordinationId) {
    this.logger.info(`Executing workflow: ${workflow.name}`, { coordinationId });
    
    const execution = {
      id: workflow.id,
      coordinationId,
      name: workflow.name,
      startTime: Date.now(),
      status: 'running',
      steps: [],
      toolsUsed: [],
      errors: []
    };
    
    this.activeWorkflows.set(workflow.id, execution);
    
    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        const stepExecution = await this.executeWorkflowStep(step, context, execution);
        
        execution.steps.push(stepExecution);
        
        if (!execution.toolsUsed.includes(step.tool)) {
          execution.toolsUsed.push(step.tool);
        }
        
        // Handle step failure
        if (!stepExecution.success) {
          if (step.required && workflow.errorHandling === 'fail_on_critical') {
            throw new Error(`Critical step failed: ${step.tool}.${step.action}`);
          }
          
          execution.errors.push({
            step: i,
            tool: step.tool,
            action: step.action,
            error: stepExecution.error
          });
        }
      }
      
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.executionTime = execution.endTime - execution.startTime;
      
      this.logger.info(`Workflow completed: ${workflow.name}`, { 
        coordinationId,
        executionTime: execution.executionTime
      });
      
      return this.formatWorkflowResult(execution);
      
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.executionTime = execution.endTime - execution.startTime;
      execution.errors.push({ error: error.message });
      
      this.logger.error(`Workflow failed: ${workflow.name}`, { 
        coordinationId, 
        error: error.message 
      });
      
      throw error;
      
    } finally {
      this.activeWorkflows.delete(workflow.id);
      this.workflowHistory.push(execution);
      
      // Trim history
      if (this.workflowHistory.length > 100) {
        this.workflowHistory = this.workflowHistory.slice(-100);
      }
    }
  }

  async executeWorkflowStep(step, context, execution) {
    this.logger.debug(`Executing workflow step: ${step.tool}.${step.action}`, {
      coordinationId: execution.coordinationId
    });
    
    const stepStartTime = Date.now();
    
    try {
      // Check step conditions
      if (step.condition && !this.evaluateCondition(step.condition, context)) {
        return {
          tool: step.tool,
          action: step.action,
          success: true,
          skipped: true,
          reason: 'condition_not_met',
          executionTime: Date.now() - stepStartTime
        };
      }
      
      // Execute the step
      const result = await this.orchestrator.executeDirectTool(
        step.tool, 
        step.action, 
        step.parameters || {},
        { ...context, workflowId: execution.id }
      );
      
      return {
        tool: step.tool,
        action: step.action,
        success: true,
        result,
        executionTime: Date.now() - stepStartTime
      };
      
    } catch (error) {
      // Try fallback if available
      if (step.fallback) {
        try {
          const fallbackResult = await this.orchestrator.executeDirectTool(
            step.fallback.tool,
            step.fallback.action,
            step.parameters || {},
            { ...context, workflowId: execution.id, fallback: true }
          );
          
          return {
            tool: step.fallback.tool,
            action: step.fallback.action,
            success: true,
            result: fallbackResult,
            fallbackUsed: true,
            originalError: error.message,
            executionTime: Date.now() - stepStartTime
          };
          
        } catch (fallbackError) {
          return {
            tool: step.tool,
            action: step.action,
            success: false,
            error: error.message,
            fallbackError: fallbackError.message,
            executionTime: Date.now() - stepStartTime
          };
        }
      }
      
      return {
        tool: step.tool,
        action: step.action,
        success: false,
        error: error.message,
        executionTime: Date.now() - stepStartTime
      };
    }
  }

  evaluateCondition(condition, context) {
    // Simple condition evaluation - in production use a proper expression evaluator
    try {
      // Basic string conditions like "context.property === 'value'"
      return eval(condition.replace(/context\./g, 'context.'));
    } catch (error) {
      this.logger.warn('Failed to evaluate condition', { condition, error: error.message });
      return false;
    }
  }

  formatWorkflowResult(execution) {
    const successfulSteps = execution.steps.filter(step => step.success);
    const results = successfulSteps.map(step => step.result).filter(Boolean);
    
    return {
      workflowId: execution.id,
      name: execution.name,
      status: execution.status,
      executionTime: execution.executionTime,
      toolsUsed: execution.toolsUsed,
      stepsExecuted: execution.steps.length,
      successfulSteps: successfulSteps.length,
      errors: execution.errors,
      results,
      summary: this.generateWorkflowSummary(execution)
    };
  }

  generateWorkflowSummary(execution) {
    const successRate = (execution.steps.filter(s => s.success).length / execution.steps.length * 100).toFixed(1);
    
    return `Workflow ${execution.status} with ${successRate}% success rate in ${execution.executionTime}ms using ${execution.toolsUsed.length} tools`;
  }

  async shutdown() {
    this.logger.info('Shutting down Workflow Execution Engine');
  }
}

// ===================== TOOL HEALTH MONITOR =====================

class ToolHealthMonitor {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.logger = new Logger('ToolHealthMonitor');
    this.monitoringInterval = null;
    this.healthCheckInterval = 60000; // 1 minute
    this.healthHistory = new Map();
  }

  async start() {
    this.logger.info('Starting tool health monitoring');
    
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  async performHealthChecks() {
    for (const [toolName, adapter] of this.orchestrator.toolAdapters) {
      try {
        const healthStatus = await adapter.performHealthCheck();
        this.recordHealthStatus(toolName, healthStatus);
        
        if (!healthStatus.healthy) {
          this.logger.warn(`Tool health degraded: ${toolName}`, healthStatus);
        }
        
      } catch (error) {
        this.logger.error(`Health check failed for tool: ${toolName}`, error);
        this.recordHealthStatus(toolName, { healthy: false, error: error.message });
      }
    }
  }

  recordHealthStatus(toolName, status) {
    if (!this.healthHistory.has(toolName)) {
      this.healthHistory.set(toolName, []);
    }
    
    const history = this.healthHistory.get(toolName);
    history.push({
      ...status,
      timestamp: Date.now()
    });
    
    // Keep last 100 health checks
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  getHealthSummary() {
    const summary = {};
    
    for (const [toolName, history] of this.healthHistory) {
      const recent = history.slice(-10);
      const healthyCount = recent.filter(h => h.healthy).length;
      
      summary[toolName] = {
        currentHealth: recent[recent.length - 1]?.healthy || false,
        recentAvailability: (healthyCount / recent.length * 100).toFixed(1) + '%',
        lastChecked: recent[recent.length - 1]?.timestamp,
        averageLatency: this.calculateAverageLatency(recent)
      };
    }
    
    return summary;
  }

  calculateAverageLatency(healthChecks) {
    const withLatency = healthChecks.filter(h => h.latency != null);
    if (withLatency.length === 0) return 0;
    
    const totalLatency = withLatency.reduce((sum, h) => sum + h.latency, 0);
    return Math.round(totalLatency / withLatency.length);
  }

  async stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.logger.info('Tool health monitoring stopped');
  }
}

module.exports = EnterpriseToolOrchestrator;