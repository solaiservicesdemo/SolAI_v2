/**
 * 🔧 SolAI Tool Orchestrator 
 * Enhanced integration with existing super-tools + Claude Flow's 87 MCP tools
 * Enterprise-grade coordination, performance optimization, and security integration
 */

const Logger = require('../core/logger');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class ToolOrchestrator {
  constructor(memoryManager, executionSandbox, auditTrail) {
    this.memoryManager = memoryManager;
    this.executionSandbox = executionSandbox;
    this.auditTrail = auditTrail;
    this.logger = new Logger('ToolOrchestrator');
    this.initialized = false;
    
    this.setupToolRegistry();
    this.setupCoordinationRules();
    this.setupExecutionStrategies();
    this.setupPerformanceOptimization();
  }

  async initialize() {
    this.logger.info('🔧 Initializing enhanced tool orchestrator...');
    
    try {
      await this.initializeExistingTools();
      await this.initializeClaudeFlowIntegration();
      await this.setupToolChaining();
      await this.initializePerformanceMonitoring();
      
      this.initialized = true;
      this.logger.info('✅ Enhanced tool orchestrator initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize tool orchestrator', error);
      throw error;
    }
  }

  setupToolRegistry() {
    // Registry of existing super-tools + Claude Flow MCP tools
    this.toolRegistry = {
      // Existing Super-Tools from RealEstate AI Enterprise
      super_tools: {
        gmail: {
          name: 'Gmail Integration',
          category: 'communication',
          capabilities: ['send_email', 'read_emails', 'search_emails', 'manage_labels'],
          priority: 'high',
          realEstate: true
        },
        twilio: {
          name: 'Twilio SMS/Voice',
          category: 'communication', 
          capabilities: ['send_sms', 'make_calls', 'voice_messages', 'contact_management'],
          priority: 'high',
          realEstate: true
        },
        calendar: {
          name: 'Calendar Management',
          category: 'scheduling',
          capabilities: ['schedule_meetings', 'check_availability', 'send_reminders', 'sync_calendars'],
          priority: 'high',
          realEstate: true
        },
        crm: {
          name: 'CRM Integration',
          category: 'client_management',
          capabilities: ['manage_contacts', 'track_leads', 'update_properties', 'generate_reports'],
          priority: 'critical',
          realEstate: true
        },
        document_processor: {
          name: 'Document Processing',
          category: 'document_management',
          capabilities: ['parse_contracts', 'extract_data', 'generate_summaries', 'compliance_check'],
          priority: 'medium',
          realEstate: true
        },
        market_analyzer: {
          name: 'Market Analysis',
          category: 'analytics',
          capabilities: ['property_valuation', 'market_trends', 'comparative_analysis', 'investment_insights'],
          priority: 'medium',
          realEstate: true
        }
      },

      // Claude Flow MCP Tools (87 tools organized by category)
      claude_flow_tools: {
        // Communication & Messaging (12 tools)
        slack: { category: 'communication', capabilities: ['send_messages', 'manage_channels'], priority: 'medium' },
        discord: { category: 'communication', capabilities: ['server_management', 'message_automation'], priority: 'low' },
        email_templates: { category: 'communication', capabilities: ['template_generation', 'personalization'], priority: 'medium' },
        
        // Development & Code (15 tools)
        github: { category: 'development', capabilities: ['repository_management', 'issue_tracking'], priority: 'low' },
        docker: { category: 'development', capabilities: ['container_management', 'deployment'], priority: 'low' },
        aws_tools: { category: 'development', capabilities: ['cloud_management', 'resource_monitoring'], priority: 'low' },
        
        // Data & Analytics (20 tools)
        database_connector: { category: 'data', capabilities: ['query_execution', 'data_migration'], priority: 'medium' },
        spreadsheet_processor: { category: 'data', capabilities: ['data_analysis', 'report_generation'], priority: 'high' },
        visualization_engine: { category: 'data', capabilities: ['chart_creation', 'dashboard_building'], priority: 'medium' },
        
        // Productivity & Automation (18 tools)
        task_manager: { category: 'productivity', capabilities: ['task_automation', 'workflow_creation'], priority: 'high' },
        file_organizer: { category: 'productivity', capabilities: ['file_management', 'automated_sorting'], priority: 'medium' },
        note_taker: { category: 'productivity', capabilities: ['meeting_notes', 'action_extraction'], priority: 'high' },
        
        // AI & ML (10 tools)
        text_processor: { category: 'ai', capabilities: ['nlp_analysis', 'sentiment_detection'], priority: 'high' },
        image_analyzer: { category: 'ai', capabilities: ['property_photo_analysis', 'visual_insights'], priority: 'medium' },
        
        // Business & Finance (12 tools)
        invoice_generator: { category: 'finance', capabilities: ['billing_automation', 'payment_tracking'], priority: 'high' },
        expense_tracker: { category: 'finance', capabilities: ['cost_monitoring', 'budget_analysis'], priority: 'medium' }
      }
    };
  }

  setupCoordinationRules() {
    // Rules for intelligent tool coordination
    this.coordinationRules = {
      // Real estate specific workflows
      client_onboarding: {
        primary_tools: ['crm', 'gmail', 'calendar'],
        supporting_tools: ['task_manager', 'note_taker', 'email_templates'],
        sequence: 'parallel_with_coordination'
      },
      
      property_analysis: {
        primary_tools: ['market_analyzer', 'document_processor'],
        supporting_tools: ['spreadsheet_processor', 'visualization_engine', 'image_analyzer'],
        sequence: 'sequential_with_aggregation'
      },
      
      lead_management: {
        primary_tools: ['crm', 'twilio', 'gmail'],
        supporting_tools: ['task_manager', 'calendar', 'text_processor'],
        sequence: 'parallel_with_followup'
      },
      
      transaction_coordination: {
        primary_tools: ['document_processor', 'calendar', 'gmail'],
        supporting_tools: ['task_manager', 'invoice_generator', 'note_taker'],
        sequence: 'workflow_driven'
      },

      // General business workflows  
      communication_blast: {
        primary_tools: ['gmail', 'twilio'],
        supporting_tools: ['crm', 'email_templates', 'text_processor'],
        sequence: 'parallel_with_personalization'
      },
      
      data_analysis: {
        primary_tools: ['spreadsheet_processor', 'database_connector'],
        supporting_tools: ['visualization_engine', 'market_analyzer'],
        sequence: 'sequential_processing'
      },
      
      automation_setup: {
        primary_tools: ['task_manager', 'file_organizer'],
        supporting_tools: ['calendar', 'note_taker'],
        sequence: 'configuration_based'
      }
    };
  }

  setupExecutionStrategies() {
    // Different strategies for executing tool combinations
    this.executionStrategies = {
      single_tool: {
        description: 'Execute one tool to handle the request',
        coordination: 'none',
        fallback: true
      },
      
      parallel_execution: {
        description: 'Run multiple tools simultaneously',
        coordination: 'synchronized_results',
        timeout: 30000
      },
      
      sequential_processing: {
        description: 'Chain tools where output feeds input',
        coordination: 'data_flow',
        error_handling: 'cascade_prevention'
      },
      
      intelligent_orchestration: {
        description: 'Dynamic tool selection based on context',
        coordination: 'adaptive',
        learning: true
      }
    };
  }

  setupPerformanceOptimization() {
    // ENTERPRISE: Advanced performance optimization strategies
    this.performanceOptimization = {
      caching: {
        enabled: true,
        strategy: 'smart_invalidation',
        cache: new Map(),
        maxSize: 500,
        ttl: 300000, // 5 minutes
        hitRate: 0
      },

      loadBalancing: {
        enabled: true,
        strategy: 'least_loaded',
        toolLoads: new Map(),
        maxConcurrentPerTool: 5,
        globalMaxConcurrent: 20
      },

      failoverStrategies: {
        'gmail': ['claude_flow_email_templates', 'twilio'],
        'twilio': ['gmail', 'claude_flow_slack'],
        'crm': ['claude_flow_database_connector', 'local_storage'],
        'market_analyzer': ['claude_flow_visualization_engine', 'cached_analysis'],
        'document_processor': ['claude_flow_text_processor', 'manual_processing']
      },

      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        recoveryTimeout: 30000,
        halfOpenTestLimit: 3,
        openCircuits: new Set(),
        circuitStates: new Map() // 'closed', 'open', 'half-open'
      },

      rateLimiting: {
        enabled: true,
        globalRpm: 1000, // Global requests per minute
        perToolRpm: new Map([
          ['gmail', 100],
          ['twilio', 200],
          ['crm', 300],
          ['market_analyzer', 100],
          ['document_processor', 50],
          ['calendar', 150]
        ]),
        requestCounts: new Map(),
        windowStart: Date.now()
      },

      healthMonitoring: {
        enabled: true,
        checkInterval: 30000, // 30 seconds
        healthScores: new Map(),
        performanceMetrics: new Map()
      }
    };

    this.toolPerformanceStats = new Map();
    this.coordinationMetrics = {
      totalCoordinations: 0,
      successfulCoordinations: 0,
      averageExecutionTime: 0,
      toolUsageStats: new Map(),
      errorPatterns: new Map()
    };
  }

  async initializeExistingTools() {
    // Initialize connections to existing super-tools
    this.existingToolConnections = {
      gmail: {
        status: 'ready',
        apiEndpoint: process.env.GMAIL_API_ENDPOINT || 'http://localhost:3001/gmail',
        authenticated: !!process.env.GMAIL_CREDENTIALS
      },
      twilio: {
        status: 'ready', 
        apiEndpoint: process.env.TWILIO_API_ENDPOINT || 'http://localhost:3001/twilio',
        authenticated: !!process.env.TWILIO_AUTH_TOKEN
      },
      calendar: {
        status: 'ready',
        apiEndpoint: process.env.CALENDAR_API_ENDPOINT || 'http://localhost:3001/calendar',
        authenticated: !!process.env.CALENDAR_CREDENTIALS
      },
      crm: {
        status: 'ready',
        apiEndpoint: process.env.CRM_API_ENDPOINT || 'http://localhost:3001/crm',
        authenticated: !!process.env.CRM_API_KEY
      },
      document_processor: {
        status: 'ready',
        apiEndpoint: process.env.DOC_PROCESSOR_ENDPOINT || 'http://localhost:3001/documents',
        authenticated: true // Internal service
      },
      market_analyzer: {
        status: 'ready',
        apiEndpoint: process.env.MARKET_ANALYZER_ENDPOINT || 'http://localhost:3001/market',
        authenticated: true // Internal service
      }
    };

    this.logger.debug('Existing super-tools initialized', { 
      toolCount: Object.keys(this.existingToolConnections).length,
      authenticatedTools: Object.values(this.existingToolConnections)
        .filter(tool => tool.authenticated).length
    });
  }

  async initializeClaudeFlowIntegration() {
    // Initialize Claude Flow MCP tools integration
    this.claudeFlowConfig = {
      mcpEndpoint: process.env.CLAUDE_FLOW_ENDPOINT || 'http://localhost:3002/mcp',
      apiKey: process.env.CLAUDE_FLOW_API_KEY,
      hiveEnabled: process.env.CLAUDE_FLOW_HIVE === 'true',
      toolCategories: Object.keys(this.toolRegistry.claude_flow_tools),
      batchingEnabled: true,
      maxConcurrentTools: 5
    };

    if (!this.claudeFlowConfig.apiKey) {
      this.logger.warn('⚠️ Claude Flow API key not configured, MCP tools disabled');
      this.claudeFlowConfig.enabled = false;
    } else {
      this.claudeFlowConfig.enabled = true;
      this.logger.info('✅ Claude Flow MCP integration configured');
    }
  }

  async setupToolChaining() {
    // Setup intelligent tool chaining and workflow patterns
    this.toolChains = new Map();
    
    // Pre-defined efficient chains for common real estate tasks
    this.toolChains.set('client_followup', [
      { tool: 'crm', action: 'get_client_info' },
      { tool: 'text_processor', action: 'analyze_communication_style' },
      { tool: 'email_templates', action: 'generate_personalized_template' },
      { tool: 'gmail', action: 'send_followup_email' }
    ]);

    this.toolChains.set('property_research', [
      { tool: 'market_analyzer', action: 'analyze_property' },
      { tool: 'image_analyzer', action: 'process_property_photos' },
      { tool: 'spreadsheet_processor', action: 'create_comparison_sheet' },
      { tool: 'visualization_engine', action: 'generate_market_charts' }
    ]);

    this.logger.debug('Tool chains configured', { 
      chainCount: this.toolChains.size 
    });
  }

  async coordinateTools(request) {
    const coordinationId = uuidv4();
    const timer = this.logger.startTimer(`tool-coordination-${coordinationId}`);
    
    try {
      const { intent, context, priority = 'medium', parameters } = request;
      
      this.logger.info('🔧 Starting enhanced tool coordination', {
        coordinationId,
        intent, 
        priority,
        contextKeys: Object.keys(context || {}),
        toolsRequested: request.tools?.length || 'auto-detect'
      });

      // METRICS: Track coordination attempt
      this.coordinationMetrics.totalCoordinations++;

      // PERFORMANCE: Check rate limiting
      const rateLimitCheck = this.checkRateLimit();
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
      }

      // STEP 1: Analyze intent and select optimal tools
      const toolSelection = await this.selectTools(intent, context, parameters);
      
      // STEP 2: Determine execution strategy
      const strategy = this.determineExecutionStrategy(toolSelection, priority);
      
      // STEP 3: Security validation through sandbox
      const securityValidation = await this.validateCoordinationSecurity(
        toolSelection, strategy, context, coordinationId
      );
      if (!securityValidation.allowed) {
        throw new Error(`Security validation failed: ${securityValidation.reason}`);
      }

      // STEP 4: Execute tools with enterprise monitoring
      const results = await this.executeToolStrategyEnhanced(
        toolSelection, strategy, context, coordinationId
      );
      
      // STEP 5: Aggregate and format results
      const aggregatedResults = this.aggregateResults(results, intent);
      
      // STEP 6: Update performance metrics
      this.updateCoordinationMetrics(toolSelection, results, timer.duration);

      // AUDIT: Log successful coordination
      await this.auditTrail.logExecutionComplete({
        coordinationId,
        sessionId: context?.sessionId,
        success: true,
        toolsUsed: toolSelection.selected.map(t => t.name),
        processingTime: timer.duration,
        strategy: strategy.type,
        resultSummary: aggregatedResults.summary
      });

      timer.end('Enhanced tool coordination completed');
      this.coordinationMetrics.successfulCoordinations++;
      
      return {
        success: true,
        coordinationId,
        coordinationType: strategy.type,
        toolsExecuted: toolSelection.selected.map(t => t.name),
        results: aggregatedResults,
        executionTime: timer.duration || 0,
        performance: {
          cacheHitRate: this.performanceOptimization.caching.hitRate,
          loadBalanced: strategy.loadBalanced || false,
          securityLevel: securityValidation.securityLevel
        },
        metadata: {
          intent,
          strategy: strategy.description,
          toolCount: toolSelection.selected.length,
          coordinationId
        }
      };
      
    } catch (error) {
      timer.end('Enhanced tool coordination failed');
      this.logger.error('❌ Enhanced tool coordination failed', error, { coordinationId });

      // AUDIT: Log failed coordination
      await this.auditTrail.logExecutionComplete({
        coordinationId,
        sessionId: context?.sessionId,
        success: false,
        error: error.message,
        processingTime: timer.duration
      });
      
      return {
        success: false,
        coordinationId,
        error: error.message,
        fallback: await this.generateFallbackResponse(request),
        recovery: await this.suggestRecoveryActions(request, error)
      };
    }
  }

  async selectTools(intent, context, parameters = {}) {
    // Intelligent tool selection based on intent and context
    const selection = {
      selected: [],
      reasoning: [],
      fallbacks: []
    };

    // Check for predefined workflows
    const workflow = this.coordinationRules[intent] || this.coordinationRules[this.mapIntentToWorkflow(intent)];
    
    if (workflow) {
      // Use predefined workflow
      selection.selected = [
        ...this.getToolsByNames(workflow.primary_tools, 'super_tools'),
        ...this.getToolsByNames(workflow.supporting_tools, 'claude_flow_tools')
      ];
      selection.reasoning.push(`Using predefined workflow for ${intent}`);
    } else {
      // Dynamic tool selection
      selection.selected = await this.performDynamicSelection(intent, context);
      selection.reasoning.push('Dynamic tool selection based on context analysis');
    }

    // Add fallback tools
    selection.fallbacks = this.selectFallbackTools(selection.selected);
    
    this.logger.debug('Tool selection completed', {
      selectedCount: selection.selected.length,
      fallbackCount: selection.fallbacks.length
    });

    return selection;
  }

  mapIntentToWorkflow(intent) {
    const intentMappings = {
      'greeting': 'client_onboarding',
      'task_request': 'automation_setup', 
      'question': 'data_analysis',
      'memory_reference': 'lead_management'
    };
    
    return intentMappings[intent] || 'automation_setup';
  }

  getToolsByNames(toolNames, registry) {
    const tools = [];
    const registryTools = this.toolRegistry[registry] || {};
    
    for (const name of toolNames) {
      if (registryTools[name]) {
        tools.push({
          name,
          ...registryTools[name],
          registry
        });
      }
    }
    
    return tools;
  }

  async performDynamicSelection(intent, context) {
    // AI-powered dynamic tool selection for complex scenarios
    const selectedTools = [];
    
    // Analyze context for tool requirements
    const requirements = this.analyzeToolRequirements(intent, context);
    
    // Select from super-tools first (higher priority for real estate tasks)
    for (const [toolName, toolConfig] of Object.entries(this.toolRegistry.super_tools)) {
      if (this.toolMeetsRequirements(toolConfig, requirements)) {
        selectedTools.push({
          name: toolName,
          ...toolConfig,
          registry: 'super_tools'
        });
      }
    }
    
    // Add complementary Claude Flow tools
    const complementaryTools = this.selectComplementaryTools(selectedTools, requirements);
    selectedTools.push(...complementaryTools);
    
    return selectedTools.slice(0, 6); // Limit to 6 tools max for performance
  }

  analyzeToolRequirements(intent, context) {
    return {
      communicationNeeded: intent.includes('contact') || intent.includes('message') || intent.includes('email'),
      dataAnalysisNeeded: intent.includes('analyze') || intent.includes('report') || intent.includes('compare'),
      schedulingNeeded: intent.includes('schedule') || intent.includes('meeting') || intent.includes('appointment'),
      documentProcessingNeeded: intent.includes('contract') || intent.includes('document') || intent.includes('form'),
      clientManagementNeeded: intent.includes('client') || intent.includes('lead') || intent.includes('contact'),
      urgency: context.priority || 'medium',
      realEstateSpecific: true
    };
  }

  toolMeetsRequirements(toolConfig, requirements) {
    // Check if tool capabilities match requirements
    if (requirements.communicationNeeded && toolConfig.category === 'communication') return true;
    if (requirements.dataAnalysisNeeded && toolConfig.category === 'analytics') return true;
    if (requirements.schedulingNeeded && toolConfig.category === 'scheduling') return true;
    if (requirements.documentProcessingNeeded && toolConfig.category === 'document_management') return true;
    if (requirements.clientManagementNeeded && toolConfig.category === 'client_management') return true;
    
    return false;
  }

  selectComplementaryTools(selectedTools, requirements) {
    const complementary = [];
    const selectedCategories = selectedTools.map(t => t.category);
    
    // Add high-priority Claude Flow tools that complement selected super-tools
    for (const [toolName, toolConfig] of Object.entries(this.toolRegistry.claude_flow_tools)) {
      if (toolConfig.priority === 'high' && !selectedCategories.includes(toolConfig.category)) {
        if (this.toolMeetsRequirements(toolConfig, requirements)) {
          complementary.push({
            name: toolName,
            ...toolConfig,
            registry: 'claude_flow_tools'
          });
        }
      }
    }
    
    return complementary.slice(0, 3); // Max 3 complementary tools
  }

  selectFallbackTools(selectedTools) {
    // Always have reliable fallback tools available
    const fallbacks = [];
    
    if (!selectedTools.find(t => t.category === 'communication')) {
      fallbacks.push(this.toolRegistry.super_tools.gmail);
    }
    
    if (!selectedTools.find(t => t.category === 'productivity')) {
      fallbacks.push(this.toolRegistry.claude_flow_tools.task_manager);
    }
    
    return fallbacks;
  }

  determineExecutionStrategy(toolSelection, priority) {
    const toolCount = toolSelection.selected.length;
    
    if (toolCount === 1) {
      return {
        type: 'single_tool',
        description: 'Single tool execution',
        timeout: 15000
      };
    } else if (toolCount <= 3) {
      return {
        type: 'parallel_execution',
        description: 'Parallel tool execution',
        timeout: 30000
      };
    } else {
      return {
        type: 'intelligent_orchestration',
        description: 'Intelligent orchestrated execution',
        timeout: 45000
      };
    }
  }

  async executeToolStrategy(toolSelection, strategy, context) {
    const results = [];
    
    switch (strategy.type) {
      case 'single_tool':
        results.push(await this.executeSingleTool(toolSelection.selected[0], context));
        break;
        
      case 'parallel_execution':
        const parallelPromises = toolSelection.selected.map(tool => 
          this.executeSingleTool(tool, context)
        );
        const parallelResults = await Promise.allSettled(parallelPromises);
        results.push(...parallelResults.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }));
        break;
        
      case 'intelligent_orchestration':
        results.push(...await this.executeIntelligentOrchestration(toolSelection.selected, context));
        break;
        
      default:
        throw new Error(`Unknown execution strategy: ${strategy.type}`);
    }
    
    return results;
  }

  async executeSingleTool(tool, context) {
    try {
      if (tool.registry === 'super_tools') {
        return await this.executeExistingTool(tool, context);
      } else {
        return await this.executeClaudeFlowTool(tool, context);
      }
    } catch (error) {
      this.logger.error(`❌ Tool execution failed: ${tool.name}`, error);
      return { error: error.message, tool: tool.name };
    }
  }

  async executeExistingTool(tool, context) {
    const connection = this.existingToolConnections[tool.name];
    
    if (!connection || !connection.authenticated) {
      throw new Error(`Tool ${tool.name} not available or not authenticated`);
    }

    // Call existing super-tool API
    const response = await axios.post(`${connection.apiEndpoint}/execute`, {
      action: context.action || 'default',
      parameters: context.parameters || {},
      sessionId: context.sessionId,
      priority: context.priority
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env[`${tool.name.toUpperCase()}_API_KEY`] || ''
      }
    });

    return {
      tool: tool.name,
      success: true,
      data: response.data,
      registry: 'super_tools'
    };
  }

  async executeClaudeFlowTool(tool, context) {
    if (!this.claudeFlowConfig.enabled) {
      throw new Error('Claude Flow MCP tools not available');
    }

    // Call Claude Flow MCP endpoint
    const response = await axios.post(`${this.claudeFlowConfig.mcpEndpoint}/execute`, {
      tool: tool.name,
      parameters: context.parameters || {},
      sessionId: context.sessionId,
      hiveMode: this.claudeFlowConfig.hiveEnabled
    }, {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.claudeFlowConfig.apiKey}`
      }
    });

    return {
      tool: tool.name,
      success: true,
      data: response.data,
      registry: 'claude_flow_tools'
    };
  }

  async executeIntelligentOrchestration(tools, context) {
    // Advanced orchestration with dependency management and optimization
    const results = [];
    const executionPlan = this.createExecutionPlan(tools, context);
    
    for (const phase of executionPlan) {
      const phaseResults = await Promise.allSettled(
        phase.map(tool => this.executeSingleTool(tool, context))
      );
      
      results.push(...phaseResults.map(r => 
        r.status === 'fulfilled' ? r.value : { error: r.reason }
      ));
      
      // Brief pause between phases for system stability
      if (executionPlan.indexOf(phase) < executionPlan.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  createExecutionPlan(tools, context) {
    // Group tools into execution phases based on dependencies and optimization
    const phases = [];
    
    // Phase 1: High-priority super-tools
    const highPriorityTools = tools.filter(t => 
      t.registry === 'super_tools' && (t.priority === 'critical' || t.priority === 'high')
    );
    if (highPriorityTools.length > 0) {
      phases.push(highPriorityTools);
    }
    
    // Phase 2: Supporting Claude Flow tools
    const supportingTools = tools.filter(t => 
      t.registry === 'claude_flow_tools' && t.priority === 'high'
    );
    if (supportingTools.length > 0) {
      phases.push(supportingTools);
    }
    
    // Phase 3: Remaining tools
    const remainingTools = tools.filter(t => 
      !highPriorityTools.includes(t) && !supportingTools.includes(t)
    );
    if (remainingTools.length > 0) {
      phases.push(remainingTools);
    }
    
    return phases;
  }

  aggregateResults(results, intent) {
    // Intelligent aggregation of tool results
    const aggregated = {
      summary: this.generateResultSummary(results),
      toolResults: {},
      insights: [],
      actionableItems: [],
      confidence: this.calculateConfidence(results)
    };
    
    // Organize results by tool
    for (const result of results) {
      if (result.tool && result.success) {
        aggregated.toolResults[result.tool] = result.data;
        
        // Extract insights if available
        if (result.data && result.data.insights) {
          aggregated.insights.push(...result.data.insights);
        }
        
        // Extract actionable items
        if (result.data && result.data.actionItems) {
          aggregated.actionableItems.push(...result.data.actionItems);
        }
      }
    }
    
    return aggregated;
  }

  generateResultSummary(results) {
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    return {
      total: results.length,
      successful,
      failed,
      successRate: results.length > 0 ? (successful / results.length) * 100 : 0
    };
  }

  calculateConfidence(results) {
    if (results.length === 0) return 0;
    
    const successCount = results.filter(r => r.success).length;
    const baseConfidence = (successCount / results.length) * 100;
    
    // Adjust confidence based on tool quality and importance
    const superToolResults = results.filter(r => r.registry === 'super_tools' && r.success);
    const bonusConfidence = superToolResults.length * 10; // Super-tools add extra confidence
    
    return Math.min(100, baseConfidence + bonusConfidence);
  }

  async generateFallbackResponse(request) {
    return {
      message: "I encountered an issue coordinating the optimal tools for your request, but I'm still here to help you. Could you try rephrasing your request?",
      suggestion: "Try being more specific about what you'd like me to help you with.",
      availableTools: Object.keys(this.toolRegistry.super_tools)
    };
  }

  // ================= ENTERPRISE PERFORMANCE METHODS =================

  checkRateLimit() {
    const now = Date.now();
    const windowDuration = 60000; // 1 minute

    // Reset window if needed
    if (now - this.performanceOptimization.rateLimiting.windowStart > windowDuration) {
      this.performanceOptimization.rateLimiting.requestCounts.clear();
      this.performanceOptimization.rateLimiting.windowStart = now;
    }

    // Check global rate limit
    const globalCount = Array.from(this.performanceOptimization.rateLimiting.requestCounts.values())
                            .reduce((sum, count) => sum + count, 0);
    
    if (globalCount >= this.performanceOptimization.rateLimiting.globalRpm) {
      return { allowed: false, reason: 'Global rate limit exceeded' };
    }

    return { allowed: true };
  }

  async validateCoordinationSecurity(toolSelection, strategy, context, coordinationId) {
    if (!this.executionSandbox) {
      return { allowed: true, securityLevel: 'basic' };
    }

    try {
      const securityValidation = await this.executionSandbox.validateExecution({
        tool: 'tool_orchestrator',
        action: 'coordinate_tools',
        parameters: {
          toolCount: toolSelection.selected.length,
          tools: toolSelection.selected.map(t => t.name),
          strategy: strategy.type
        },
        context
      }, coordinationId);

      return securityValidation;
    } catch (error) {
      this.logger.error('❌ Security validation failed', error);
      return { allowed: false, reason: 'Security validation error' };
    }
  }

  async executeToolStrategyEnhanced(toolSelection, strategy, context, coordinationId) {
    const results = [];
    
    try {
      switch (strategy.type) {
        case 'single_tool':
          results.push(await this.executeSingleToolEnhanced(toolSelection.selected[0], context, coordinationId));
          break;
          
        case 'parallel_execution':
          const parallelResults = await this.executeParallelEnhanced(toolSelection.selected, context, coordinationId);
          results.push(...parallelResults);
          break;
          
        case 'intelligent_orchestration':
          const orchestratedResults = await this.executeIntelligentOrchestrationEnhanced(toolSelection.selected, context, coordinationId);
          results.push(...orchestratedResults);
          break;
          
        default:
          // Fallback to basic execution
          const fallbackResults = await this.executeToolStrategy(toolSelection, strategy, context);
          results.push(...fallbackResults);
      }
    } catch (error) {
      this.logger.error('❌ Enhanced strategy execution failed', error);
      throw error;
    }
    
    return results;
  }

  async executeSingleToolEnhanced(tool, context, coordinationId) {
    const toolStartTime = Date.now();
    
    try {
      // Check cache first
      const cacheResult = await this.checkToolCache(tool, context);
      if (cacheResult.hit) {
        this.updateCacheHitRate(true);
        return {
          ...cacheResult.result,
          cached: true,
          executionTime: Date.now() - toolStartTime
        };
      }
      this.updateCacheHitRate(false);

      // Check circuit breaker
      if (this.isCircuitOpen(tool.name)) {
        throw new Error(`Circuit breaker open for tool: ${tool.name}`);
      }

      // Execute through sandbox if available
      let result;
      if (this.executionSandbox) {
        const sandboxResult = await this.executionSandbox.executeSecurely({
          tool: tool.name,
          action: context.action || 'execute',
          parameters: context.parameters || {},
          context: { ...context, coordinationId }
        });
        
        result = {
          tool: tool.name,
          success: sandboxResult.success,
          data: sandboxResult.result,
          executionTime: sandboxResult.executionTime || (Date.now() - toolStartTime),
          security: sandboxResult.securityLevel,
          registry: tool.registry
        };
      } else {
        // Fallback to basic execution
        result = await this.executeSingleTool(tool, context);
        result.executionTime = Date.now() - toolStartTime;
      }

      // Update performance stats
      this.updateToolPerformanceStats(tool.name, result.executionTime, result.success);

      // Cache successful results
      if (result.success && this.performanceOptimization.caching.enabled) {
        await this.cacheToolResult(tool, context, result);
      }

      return result;

    } catch (error) {
      const executionTime = Date.now() - toolStartTime;
      this.updateToolPerformanceStats(tool.name, executionTime, false);
      this.updateCircuitBreaker(tool.name, false);
      
      // Try failover if available
      const failoverResult = await this.attemptFailover(tool, context, error);
      if (failoverResult.success) {
        return failoverResult;
      }

      throw error;
    }
  }

  async executeParallelEnhanced(tools, context, coordinationId) {
    // Enhanced parallel execution with load balancing
    const loadBalancedTools = this.applyLoadBalancing(tools);
    
    const toolPromises = loadBalancedTools.map(async (tool) => {
      this.incrementToolLoad(tool.name);
      
      try {
        const result = await this.executeSingleToolEnhanced(tool, context, coordinationId);
        return result;
      } finally {
        this.decrementToolLoad(tool.name);
      }
    });

    const results = await Promise.allSettled(toolPromises);
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : { 
        success: false, 
        error: result.reason.message || result.reason,
        executionTime: 0
      }
    );
  }

  async executeIntelligentOrchestrationEnhanced(tools, context, coordinationId) {
    // Enhanced intelligent orchestration with optimization
    const results = [];
    const executionPlan = this.createOptimizedExecutionPlan(tools, context);
    
    for (const phase of executionPlan) {
      const phaseStartTime = Date.now();
      
      // Execute phase with monitoring
      const phasePromises = phase.tools.map(tool => {
        this.incrementToolLoad(tool.name);
        return this.executeSingleToolEnhanced(tool, context, coordinationId)
                   .finally(() => this.decrementToolLoad(tool.name));
      });

      const phaseResults = await Promise.allSettled(phasePromises);
      const processedResults = phaseResults.map(r => 
        r.status === 'fulfilled' ? r.value : { 
          success: false, 
          error: r.reason.message || r.reason,
          executionTime: Date.now() - phaseStartTime
        }
      );

      results.push(...processedResults);

      // Inter-phase optimization pause
      if (phase.pauseAfter && executionPlan.indexOf(phase) < executionPlan.length - 1) {
        await new Promise(resolve => setTimeout(resolve, phase.pauseAfter));
      }
    }
    
    return results;
  }

  createOptimizedExecutionPlan(tools, context) {
    // Create optimized execution plan with performance considerations
    const plan = [];
    
    // Phase 1: High-priority, fast tools
    const highPriorityFast = tools.filter(t => 
      (t.priority === 'critical' || t.priority === 'high') &&
      this.getToolAverageResponseTime(t.name) < 10000
    );
    if (highPriorityFast.length > 0) {
      plan.push({ 
        tools: highPriorityFast, 
        description: 'High priority fast tools',
        pauseAfter: 500
      });
    }
    
    // Phase 2: Medium priority tools
    const mediumPriority = tools.filter(t => 
      t.priority === 'medium' && !highPriorityFast.includes(t)
    );
    if (mediumPriority.length > 0) {
      plan.push({ 
        tools: mediumPriority, 
        description: 'Medium priority tools',
        pauseAfter: 1000
      });
    }
    
    // Phase 3: Slow or low priority tools
    const remaining = tools.filter(t => 
      !highPriorityFast.includes(t) && !mediumPriority.includes(t)
    );
    if (remaining.length > 0) {
      plan.push({ 
        tools: remaining, 
        description: 'Remaining tools',
        pauseAfter: 0
      });
    }
    
    return plan;
  }

  // ================= PERFORMANCE OPTIMIZATION METHODS =================

  async checkToolCache(tool, context) {
    if (!this.performanceOptimization.caching.enabled) {
      return { hit: false };
    }

    const cacheKey = this.generateCacheKey(tool, context);
    const cached = this.performanceOptimization.caching.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.performanceOptimization.caching.ttl) {
      return { hit: true, result: cached.result };
    }

    return { hit: false };
  }

  generateCacheKey(tool, context) {
    const keyData = {
      tool: tool.name,
      action: context.action,
      parameters: context.parameters,
      sessionContext: context.sessionId
    };
    
    return JSON.stringify(keyData).replace(/\s/g, '');
  }

  async cacheToolResult(tool, context, result) {
    const cacheKey = this.generateCacheKey(tool, context);
    const cache = this.performanceOptimization.caching.cache;
    
    // LRU eviction
    if (cache.size >= this.performanceOptimization.caching.maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }

  updateCacheHitRate(hit) {
    const current = this.performanceOptimization.caching.hitRate;
    const total = this.coordinationMetrics.totalCoordinations;
    
    if (hit) {
      this.performanceOptimization.caching.hitRate = ((current * (total - 1)) + 1) / total;
    } else {
      this.performanceOptimization.caching.hitRate = (current * (total - 1)) / total;
    }
  }

  applyLoadBalancing(tools) {
    if (!this.performanceOptimization.loadBalancing.enabled) {
      return tools;
    }

    const strategy = this.performanceOptimization.loadBalancing.strategy;
    
    if (strategy === 'least_loaded') {
      return tools.sort((a, b) => {
        const aLoad = this.performanceOptimization.loadBalancing.toolLoads.get(a.name) || 0;
        const bLoad = this.performanceOptimization.loadBalancing.toolLoads.get(b.name) || 0;
        return aLoad - bLoad;
      });
    }
    
    return tools;
  }

  incrementToolLoad(toolName) {
    const current = this.performanceOptimization.loadBalancing.toolLoads.get(toolName) || 0;
    this.performanceOptimization.loadBalancing.toolLoads.set(toolName, current + 1);
  }

  decrementToolLoad(toolName) {
    const current = this.performanceOptimization.loadBalancing.toolLoads.get(toolName) || 0;
    this.performanceOptimization.loadBalancing.toolLoads.set(toolName, Math.max(0, current - 1));
  }

  isCircuitOpen(toolName) {
    return this.performanceOptimization.circuitBreaker.openCircuits.has(toolName);
  }

  updateCircuitBreaker(toolName, success) {
    if (!this.performanceOptimization.circuitBreaker.enabled) return;

    const stats = this.toolPerformanceStats.get(toolName) || { failures: 0, lastFailure: null };
    
    if (success) {
      stats.failures = 0;
    } else {
      stats.failures = (stats.failures || 0) + 1;
      stats.lastFailure = Date.now();
      
      if (stats.failures >= this.performanceOptimization.circuitBreaker.failureThreshold) {
        this.performanceOptimization.circuitBreaker.openCircuits.add(toolName);
        
        this.logger.warn(`🔌 Circuit breaker opened for tool: ${toolName}`, {
          failures: stats.failures,
          threshold: this.performanceOptimization.circuitBreaker.failureThreshold
        });

        // Schedule recovery
        setTimeout(() => {
          this.performanceOptimization.circuitBreaker.openCircuits.delete(toolName);
          stats.failures = 0;
          this.logger.info(`🔌 Circuit breaker closed for tool: ${toolName}`);
        }, this.performanceOptimization.circuitBreaker.recoveryTimeout);
      }
    }
    
    this.toolPerformanceStats.set(toolName, stats);
  }

  async attemptFailover(tool, context, originalError) {
    const failoverOptions = this.performanceOptimization.failoverStrategies[tool.name];
    if (!failoverOptions || failoverOptions.length === 0) {
      return { success: false, error: 'No failover options available' };
    }

    for (const alternativeTool of failoverOptions) {
      try {
        this.logger.info(`🔄 Attempting failover: ${tool.name} -> ${alternativeTool}`);
        
        // Create alternative tool object
        const alternative = this.findToolByName(alternativeTool);
        if (!alternative || this.isCircuitOpen(alternativeTool)) {
          continue;
        }

        const failoverResult = await this.executeSingleToolEnhanced(alternative, context, 'failover');
        
        if (failoverResult.success) {
          this.logger.info(`✅ Failover successful: ${tool.name} -> ${alternativeTool}`);
          
          return {
            ...failoverResult,
            failover: true,
            originalTool: tool.name,
            failoverTool: alternativeTool
          };
        }
      } catch (error) {
        this.logger.warn(`Failover attempt failed: ${alternativeTool}`, error);
      }
    }

    return { success: false, error: 'All failover attempts failed' };
  }

  findToolByName(toolName) {
    // Search in super-tools first
    if (this.toolRegistry.super_tools[toolName]) {
      return {
        name: toolName,
        ...this.toolRegistry.super_tools[toolName],
        registry: 'super_tools'
      };
    }
    
    // Search in Claude Flow tools
    if (this.toolRegistry.claude_flow_tools[toolName]) {
      return {
        name: toolName,
        ...this.toolRegistry.claude_flow_tools[toolName],
        registry: 'claude_flow_tools'
      };
    }
    
    return null;
  }

  updateToolPerformanceStats(toolName, executionTime, success) {
    const stats = this.toolPerformanceStats.get(toolName) || {
      totalExecutions: 0,
      successfulExecutions: 0,
      totalTime: 0,
      averageTime: 0,
      successRate: 0
    };
    
    stats.totalExecutions++;
    stats.totalTime += executionTime;
    stats.averageTime = stats.totalTime / stats.totalExecutions;
    
    if (success) {
      stats.successfulExecutions++;
    }
    
    stats.successRate = (stats.successfulExecutions / stats.totalExecutions) * 100;
    
    this.toolPerformanceStats.set(toolName, stats);
  }

  getToolAverageResponseTime(toolName) {
    const stats = this.toolPerformanceStats.get(toolName);
    return stats?.averageTime || 5000; // Default 5 seconds
  }

  updateCoordinationMetrics(toolSelection, results, executionTime) {
    // Update overall coordination metrics
    const metrics = this.coordinationMetrics;
    
    // Update average execution time
    metrics.averageExecutionTime = 
      ((metrics.averageExecutionTime * (metrics.totalCoordinations - 1)) + executionTime) / 
      metrics.totalCoordinations;

    // Update tool usage stats
    for (const tool of toolSelection.selected) {
      const currentUsage = metrics.toolUsageStats.get(tool.name) || 0;
      metrics.toolUsageStats.set(tool.name, currentUsage + 1);
    }
  }

  async initializePerformanceMonitoring() {
    // Start performance monitoring intervals
    if (this.performanceOptimization.healthMonitoring.enabled) {
      setInterval(() => this.performHealthChecks(), 
        this.performanceOptimization.healthMonitoring.checkInterval);
      
      setInterval(() => this.optimizePerformance(), 120000); // Every 2 minutes
    }
  }

  async performHealthChecks() {
    // Check health of all tools and update health scores
    for (const toolName of Object.keys(this.toolRegistry.super_tools)) {
      try {
        const healthScore = await this.checkToolHealth(toolName);
        this.performanceOptimization.healthMonitoring.healthScores.set(toolName, healthScore);
      } catch (error) {
        this.logger.error(`Health check failed for ${toolName}`, error);
        this.performanceOptimization.healthMonitoring.healthScores.set(toolName, 0);
      }
    }
  }

  async checkToolHealth(toolName) {
    const stats = this.toolPerformanceStats.get(toolName);
    if (!stats) return 50; // No data, neutral health

    let healthScore = 100;
    
    // Penalize for low success rate
    if (stats.successRate < 90) healthScore -= (90 - stats.successRate);
    
    // Penalize for slow response times
    if (stats.averageTime > 10000) healthScore -= Math.min(30, (stats.averageTime - 10000) / 1000);
    
    // Circuit breaker penalty
    if (this.isCircuitOpen(toolName)) healthScore = 0;
    
    return Math.max(0, healthScore);
  }

  async optimizePerformance() {
    // Periodic performance optimization
    this.optimizeCacheSize();
    this.adjustLoadBalancing();
    this.updateCircuitBreakerThresholds();
  }

  optimizeCacheSize() {
    const hitRate = this.performanceOptimization.caching.hitRate;
    const currentSize = this.performanceOptimization.caching.maxSize;
    
    if (hitRate > 0.8 && currentSize < 1000) {
      // High hit rate, increase cache size
      this.performanceOptimization.caching.maxSize = Math.min(1000, currentSize + 50);
    } else if (hitRate < 0.3 && currentSize > 100) {
      // Low hit rate, decrease cache size
      this.performanceOptimization.caching.maxSize = Math.max(100, currentSize - 50);
    }
  }

  adjustLoadBalancing() {
    // Adjust load balancing based on performance
    const overloadedTools = [];
    
    for (const [toolName, load] of this.performanceOptimization.loadBalancing.toolLoads.entries()) {
      const maxLoad = this.performanceOptimization.loadBalancing.maxConcurrentPerTool;
      if (load >= maxLoad * 0.9) {
        overloadedTools.push(toolName);
      }
    }
    
    if (overloadedTools.length > 0) {
      this.logger.warn('🚨 Tools approaching capacity', { overloadedTools });
    }
  }

  updateCircuitBreakerThresholds() {
    // Dynamic threshold adjustment based on system performance
    const globalSuccessRate = this.coordinationMetrics.totalCoordinations > 0 
      ? (this.coordinationMetrics.successfulCoordinations / this.coordinationMetrics.totalCoordinations) * 100
      : 100;

    if (globalSuccessRate < 80) {
      // Lower thresholds during poor system performance
      this.performanceOptimization.circuitBreaker.failureThreshold = 3;
    } else {
      // Normal thresholds during good system performance
      this.performanceOptimization.circuitBreaker.failureThreshold = 5;
    }
  }

  async suggestRecoveryActions(request, error) {
    const suggestions = [];
    
    if (error.message.includes('rate limit')) {
      suggestions.push('Try again in a few moments when rate limits reset');
      suggestions.push('Consider prioritizing only essential tools for your request');
    }
    
    if (error.message.includes('circuit breaker')) {
      suggestions.push('Some tools are currently experiencing issues');
      suggestions.push('Try using alternative approaches or simplified requests');
    }
    
    if (error.message.includes('security')) {
      suggestions.push('Your request may contain sensitive parameters');
      suggestions.push('Try rephrasing your request with less specific details');
    }
    
    return suggestions;
  }

  async getToolStatus() {
    const status = {
      initialized: this.initialized,
      superTools: {},
      claudeFlowTools: {
        enabled: this.claudeFlowConfig?.enabled || false,
        toolCount: Object.keys(this.toolRegistry.claude_flow_tools).length
      },
      orchestrationCapabilities: {
        workflows: Object.keys(this.coordinationRules).length,
        chains: this.toolChains.size,
        strategies: Object.keys(this.executionStrategies).length
      },
      performance: {
        totalCoordinations: this.coordinationMetrics.totalCoordinations,
        successfulCoordinations: this.coordinationMetrics.successfulCoordinations,
        successRate: this.coordinationMetrics.totalCoordinations > 0 
          ? (this.coordinationMetrics.successfulCoordinations / this.coordinationMetrics.totalCoordinations) * 100 
          : 0,
        averageExecutionTime: this.coordinationMetrics.averageExecutionTime,
        cacheHitRate: this.performanceOptimization.caching.hitRate * 100,
        activeCircuitBreakers: this.performanceOptimization.circuitBreaker.openCircuits.size
      }
    };

    // Check super-tool connectivity
    for (const [toolName, connection] of Object.entries(this.existingToolConnections)) {
      const healthScore = this.performanceOptimization.healthMonitoring.healthScores.get(toolName) || 50;
      const performanceStats = this.toolPerformanceStats.get(toolName);
      
      status.superTools[toolName] = {
        connected: connection.status === 'ready',
        authenticated: connection.authenticated,
        healthScore,
        circuitOpen: this.isCircuitOpen(toolName),
        performance: performanceStats ? {
          averageResponseTime: performanceStats.averageTime,
          successRate: performanceStats.successRate,
          totalExecutions: performanceStats.totalExecutions
        } : null
      };
    }

    return status;
  }
}

module.exports = ToolOrchestrator;