/**
 * 🔧 SolAI Tool Orchestrator 
 * Enhanced integration with existing super-tools + Claude Flow's 87 MCP tools
 * Enterprise-grade coordination, performance optimization, and security integration
 */

const Logger = require('../core/logger');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class ToolOrchestrator {
  constructor(memoryManager, executionSandbox, auditTrail, notificationBroadcaster = null) {
    this.memoryManager = memoryManager;
    this.executionSandbox = executionSandbox;
    this.auditTrail = auditTrail;
    this.notificationBroadcaster = notificationBroadcaster;
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
    // OPTIMIZATION: Check if this intent actually needs tools BEFORE selecting any
    const needsTools = this.intentRequiresTools(intent, context);
    
    const selection = {
      selected: [],
      reasoning: [],
      fallbacks: []
    };

    if (!needsTools) {
      // No tools needed for this conversation - save API calls
      selection.reasoning.push(`Intent '${intent}' is conversational only - no tools required`);
      this.logger.debug('🚀 Skipping tool selection - conversational intent', { intent });
      return selection;
    }

    // Check for predefined workflows (only if tools are needed)
    const workflow = this.coordinationRules[intent];
    
    if (workflow) {
      // Use predefined workflow
      selection.selected = [
        ...this.getToolsByNames(workflow.primary_tools, 'super_tools'),
        ...this.getToolsByNames(workflow.supporting_tools, 'claude_flow_tools')
      ];
      selection.reasoning.push(`Using predefined workflow for ${intent}`);
    } else if (this.shouldUseDynamicSelection(intent, context)) {
      // Dynamic tool selection (only for complex scenarios)
      selection.selected = await this.performDynamicSelection(intent, context);
      selection.reasoning.push('Dynamic tool selection based on context analysis');
    } else {
      // Use minimal tool selection
      selection.selected = this.selectMinimalTools(intent, context);
      selection.reasoning.push('Minimal tool selection for efficiency');
    }

    // Add fallback tools only if primary tools exist
    if (selection.selected.length > 0) {
      selection.fallbacks = this.selectFallbackTools(selection.selected);
    }
    
    this.logger.debug('Tool selection completed', {
      selectedCount: selection.selected.length,
      fallbackCount: selection.fallbacks.length,
      intent,
      toolsNeeded: needsTools
    });

    return selection;
  }

  intentRequiresTools(intent, context) {
    // CRITICAL: Only these intents actually need tool coordination
    const toolRequiringIntents = [
      'task_request',
      'appointment_request', 
      'task_reminder',
      'market_analysis',
      'communication',
      'document_request',
      'property_search', // Only if specific data lookup needed
      'workflow_execution'
    ];

    // Simple conversational intents that DON'T need tools
    const conversationalIntents = [
      'greeting',
      'appreciation',
      'question', // Most questions are answerable without tools
      'memory_reference',
      'general_conversation',
      'informational_response'
    ];

    if (toolRequiringIntents.includes(intent)) {
      return true;
    }

    if (conversationalIntents.includes(intent)) {
      // Additional context check for edge cases
      const message = context?.currentUserMessage?.toLowerCase() || '';
      
      // Even conversational intents might need tools if they mention specific actions
      if (message.includes('schedule') || 
          message.includes('remind') || 
          message.includes('book') ||
          message.includes('create') ||
          message.includes('send')) {
        return true;
      }
      
      return false; // Pure conversation
    }

    // Default to requiring tools for unknown intents (safer)
    return true;
  }

  shouldUseDynamicSelection(intent, context) {
    // Only use expensive dynamic selection for complex scenarios
    const complexIntents = ['general_assistance', 'intelligent_assistance'];
    const hasComplexContext = context?.conversationHistory?.length > 3;
    const hasMultipleRequirements = (context?.currentUserMessage?.split(' ')?.length || 0) > 10;
    
    return complexIntents.includes(intent) && (hasComplexContext || hasMultipleRequirements);
  }

  selectMinimalTools(intent, context) {
    // Return minimal set of tools based on intent
    const minimalToolMappings = {
      'task_request': [{ name: 'task_manager', registry: 'super_tools' }],
      'appointment_request': [{ name: 'calendar_integration', registry: 'super_tools' }],
      'task_reminder': [{ name: 'reminder_system', registry: 'super_tools' }],
      'market_analysis': [{ name: 'market_data', registry: 'super_tools' }],
      'communication': [{ name: 'communication_hub', registry: 'super_tools' }],
      'property_search': [{ name: 'property_search', registry: 'super_tools' }]
    };

    const tools = minimalToolMappings[intent] || [];
    
    // Only return tools that actually exist in our registry
    return tools.filter(tool => {
      const registry = this.toolRegistry[tool.registry];
      return registry && registry[tool.name];
    });
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

  // =================== STORY 2: TASK MANAGEMENT METHODS ===================

  async createTask(sessionId, taskData) {
    try {
      const { title, description, priority = 'medium', dueDate, reminderTime, createdBy = 'ai', workflowId, parentTaskId, metadata = {} } = taskData;
      
      // Validate required fields
      if (!title) {
        throw new Error('Task title is required');
      }

      const taskId = require('uuid').v4();
      
      const task = {
        id: taskId,
        session_id: sessionId,
        title,
        description,
        status: 'pending',
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        reminder_time: reminderTime ? new Date(reminderTime).toISOString() : null,
        created_by: createdBy,
        workflow_id: workflowId || null,
        parent_task_id: parentTaskId || null,
        metadata: JSON.stringify(metadata),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store in database (will implement when memory manager has Supabase connection)
      if (this.memoryManager && this.memoryManager.supabase) {
        const { data, error } = await this.memoryManager.supabase
          .from('tasks')
          .insert(task)
          .select()
          .single();

        if (error) throw error;
        
        // Create notification if reminder is set
        if (reminderTime) {
          await this.createNotification(sessionId, {
            type: 'task_reminder',
            title: `Reminder: ${title}`,
            message: description,
            scheduledFor: reminderTime,
            priority
          });
        }

        this.logger.info('✅ Task created successfully', { taskId: task.id, title: task.title });
        return { success: true, task: data };
      }

      // Fallback to in-memory storage
      this.logger.warn('⚠️ Database unavailable, storing task in memory');
      return { success: true, task, fallback: true };

    } catch (error) {
      this.logger.error('❌ Failed to create task', error);
      return { success: false, error: error.message };
    }
  }

  async updateTaskStatus(sessionId, taskId, status, metadata = {}) {
    try {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid task status');
      }

      const updates = {
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'completed' && { completed_at: new Date().toISOString() }),
        ...(Object.keys(metadata).length > 0 && { metadata: JSON.stringify(metadata) })
      };

      if (this.memoryManager && this.memoryManager.supabase) {
        const { data, error } = await this.memoryManager.supabase
          .from('tasks')
          .update(updates)
          .eq('id', taskId)
          .eq('session_id', sessionId)
          .select()
          .single();

        if (error) throw error;

        this.logger.info('✅ Task status updated', { taskId, status });
        return { success: true, task: data };
      }

      this.logger.warn('⚠️ Database unavailable, task update stored in memory');
      return { success: true, fallback: true };

    } catch (error) {
      this.logger.error('❌ Failed to update task status', error);
      return { success: false, error: error.message };
    }
  }

  async listTasks(sessionId, filters = {}) {
    try {
      const { status, priority, dueDate, includeCompleted = false } = filters;

      if (this.memoryManager && this.memoryManager.supabase) {
        let query = this.memoryManager.supabase
          .from('tasks')
          .select('*')
          .eq('session_id', sessionId);

        // Apply filters
        if (status) query = query.eq('status', status);
        if (priority) query = query.eq('priority', priority);
        if (dueDate) query = query.lte('due_date', new Date(dueDate).toISOString());
        if (!includeCompleted) query = query.neq('status', 'completed');

        // Order by priority and due date
        query = query.order('priority', { ascending: false })
                     .order('due_date', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;

        return { success: true, tasks: data || [] };
      }

      this.logger.warn('⚠️ Database unavailable, returning empty task list');
      return { success: true, tasks: [], fallback: true };

    } catch (error) {
      this.logger.error('❌ Failed to list tasks', error);
      return { success: false, error: error.message };
    }
  }

  async enrollInWorkflow(sessionId, workflowName, variables = {}) {
    try {
      // Get workflow template
      const template = await this.getWorkflowTemplate(workflowName);
      if (!template) {
        throw new Error(`Workflow template '${workflowName}' not found`);
      }

      const workflowId = require('uuid').v4();
      
      const workflowInstance = {
        id: workflowId,
        session_id: sessionId,
        template_id: template.id,
        name: template.name,
        status: 'active',
        progress: JSON.stringify({}),
        variables: JSON.stringify(variables),
        started_at: new Date().toISOString()
      };

      if (this.memoryManager && this.memoryManager.supabase) {
        const { data, error } = await this.memoryManager.supabase
          .from('workflow_instances')
          .insert(workflowInstance)
          .select()
          .single();

        if (error) throw error;

        // Create initial tasks from workflow template
        await this.createWorkflowTasks(sessionId, workflowId, template, variables);

        this.logger.info('✅ Enrolled in workflow successfully', { workflowId, workflowName });
        return { success: true, workflowInstance: data };
      }

      this.logger.warn('⚠️ Database unavailable, workflow enrollment stored in memory');
      return { success: true, workflowInstance, fallback: true };

    } catch (error) {
      this.logger.error('❌ Failed to enroll in workflow', error);
      return { success: false, error: error.message };
    }
  }

  async getNotifications(sessionId, options = {}) {
    try {
      const { includeExpired = false, sortBy = ['priority', 'scheduled_for'] } = options;

      if (this.memoryManager && this.memoryManager.supabase) {
        let query = this.memoryManager.supabase
          .from('notifications')
          .select('*')
          .eq('session_id', sessionId);

        // Filter out expired notifications unless requested
        if (!includeExpired) {
          query = query.or('expires_at.is.null,expires_at.gte.now()');
        }

        // Apply sorting
        if (sortBy.includes('priority')) {
          query = query.order('priority', { 
            ascending: false,
            foreignTable: null
          });
        }
        
        if (sortBy.includes('scheduled_for')) {
          query = query.order('scheduled_for', { ascending: true });
        }

        const { data, error } = await query;

        if (error) {
          this.logger.error('❌ Failed to fetch notifications from database', error);
          return [];
        }

        // Sort by priority order (urgent > high > medium > low)
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const sortedData = data.sort((a, b) => {
          const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
          if (priorityDiff !== 0) return priorityDiff;
          
          // Secondary sort by scheduled_for
          const aDate = new Date(a.scheduled_for || a.created_at);
          const bDate = new Date(b.scheduled_for || b.created_at);
          return aDate - bDate;
        });

        this.logger.info('✅ Notifications retrieved', { 
          sessionId: sessionId.substring(0, 8) + '...',
          count: sortedData.length 
        });
        
        return sortedData;
      }

      // Fallback to memory storage
      const memoryKey = `notifications_${sessionId}`;
      const notifications = await this.memoryManager.getFromMemory(memoryKey) || [];
      
      return notifications.filter(n => includeExpired || !n.expires_at || new Date(n.expires_at) > new Date());
      
    } catch (error) {
      this.logger.error('❌ Failed to get notifications', error);
      return [];
    }
  }

  async markNotificationAsRead(sessionId, notificationId) {
    try {
      if (this.memoryManager && this.memoryManager.supabase) {
        const { data, error } = await this.memoryManager.supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId)
          .eq('session_id', sessionId)
          .select();

        if (error) {
          this.logger.error('❌ Failed to mark notification as read in database', error);
          return false;
        }

        this.logger.info('✅ Notification marked as read', { notificationId });
        return true;
      }

      // Fallback to memory storage
      const memoryKey = `notifications_${sessionId}`;
      const notifications = await this.memoryManager.getFromMemory(memoryKey) || [];
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.is_read = true;
        await this.memoryManager.storeInMemory(memoryKey, notifications);
        return true;
      }

      return false;
      
    } catch (error) {
      this.logger.error('❌ Failed to mark notification as read', error);
      return false;
    }
  }

  async createNotification(sessionId, notificationData) {
    try {
      // VALIDATION: Critical input validation
      if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
        throw new Error('Valid session ID is required');
      }
      
      if (!notificationData || typeof notificationData !== 'object') {
        throw new Error('Notification data is required');
      }
      
      const { type, title, message, actionUrl, priority = 'medium', scheduledFor } = notificationData;
      
      // VALIDATION: Required fields
      if (!type || typeof type !== 'string') {
        throw new Error('Notification type is required');
      }
      
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw new Error('Notification title is required');
      }
      
      // VALIDATION: Priority must be valid
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        throw new Error('Invalid priority. Must be: low, medium, high, or urgent');
      }
      
      const notification = {
        id: require('uuid').v4(),
        session_id: sessionId.trim(),
        type: type.trim(),
        title: title.trim(),
        message: message || '',
        action_url: actionUrl || null,
        priority,
        is_read: false,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : new Date().toISOString(),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };

      if (this.memoryManager && this.memoryManager.supabase) {
        const { data, error } = await this.memoryManager.supabase
          .from('notifications')
          .insert(notification)
          .select()
          .single();

        if (error) throw error;

        // Broadcast via WebSocket if available
        if (this.notificationBroadcaster) {
          this.notificationBroadcaster(sessionId, data);
        }

        this.logger.info('✅ Notification created successfully', { notificationId: data.id });
        return { success: true, notification: data };
      }

      // Broadcast via WebSocket if available
      if (this.notificationBroadcaster) {
        this.notificationBroadcaster(sessionId, notification);
      }

      this.logger.info('✅ Notification created successfully (fallback)', { notificationId: notification.id });
      return { success: true, notification, fallback: true };

    } catch (error) {
      this.logger.error('❌ Failed to create notification', error);
      return { success: false, error: error.message };
    }
  }

  async getWorkflowTemplate(workflowName) {
    try {
      if (this.memoryManager && this.memoryManager.supabase) {
        const { data, error } = await this.memoryManager.supabase
          .from('workflow_templates')
          .select('*')
          .eq('name', workflowName)
          .eq('is_active', true)
          .single();

        if (error) {
          this.logger.debug('Workflow template not found in database, checking built-in templates');
          return this.getBuiltInWorkflowTemplate(workflowName);
        }

        return data;
      }

      return this.getBuiltInWorkflowTemplate(workflowName);

    } catch (error) {
      this.logger.error('❌ Failed to get workflow template', error);
      return null;
    }
  }

  getBuiltInWorkflowTemplate(workflowName) {
    const templates = {
      'buyer_intake': {
        id: 'builtin_buyer_intake',
        name: 'Buyer Intake Process',
        description: 'Complete buyer intake from lead to offer',
        template_data: {
          steps: [
            { name: 'Initial Contact', description: 'Contact the lead within 5 minutes', priority: 'high' },
            { name: 'Pre-qualification', description: 'Assess buyer financial readiness', priority: 'high' },
            { name: 'Needs Assessment', description: 'Determine property preferences and requirements', priority: 'medium' },
            { name: 'Property Search Setup', description: 'Set up MLS alerts and search criteria', priority: 'medium' },
            { name: 'Schedule Tours', description: 'Arrange property showings', priority: 'medium' },
            { name: 'Offer Preparation', description: 'Prepare and submit competitive offer', priority: 'high' }
          ]
        }
      },
      'listing_launch': {
        id: 'builtin_listing_launch',
        name: 'Listing Launch Process',
        description: 'Complete listing preparation to market launch',
        template_data: {
          steps: [
            { name: 'Property Preparation', description: 'Staging recommendations and repairs', priority: 'high' },
            { name: 'Professional Photography', description: 'Schedule and complete photo/video shoot', priority: 'high' },
            { name: 'MLS Entry', description: 'Enter listing details in MLS system', priority: 'high' },
            { name: 'Marketing Materials', description: 'Create flyers, social posts, and online listings', priority: 'medium' },
            { name: 'Open House Planning', description: 'Schedule and prepare open house events', priority: 'medium' },
            { name: 'Agent Outreach', description: 'Notify agent network of new listing', priority: 'low' }
          ]
        }
      },
      'contract_to_close': {
        id: 'builtin_contract_to_close',
        name: 'Contract to Close Process',
        description: 'Manage transaction from accepted offer to closing',
        template_data: {
          steps: [
            { name: 'Escrow Opening', description: 'Open escrow with title company', priority: 'high' },
            { name: 'Inspection Coordination', description: 'Schedule and manage property inspections', priority: 'high' },
            { name: 'Appraisal Management', description: 'Coordinate lender appraisal process', priority: 'high' },
            { name: 'Loan Processing', description: 'Monitor buyer\'s loan approval process', priority: 'high' },
            { name: 'Final Walkthrough', description: 'Schedule pre-closing property walkthrough', priority: 'medium' },
            { name: 'Closing Preparation', description: 'Review closing documents and coordinate signing', priority: 'high' }
          ]
        }
      }
    };

    return templates[workflowName] || null;
  }

  async createWorkflowTasks(sessionId, workflowId, template, variables) {
    try {
      const steps = template.template_data?.steps || [];
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const taskData = {
          title: step.name,
          description: step.description,
          priority: step.priority || 'medium',
          workflowId,
          metadata: { 
            stepIndex: i, 
            workflowName: template.name,
            variables 
          }
        };

        await this.createTask(sessionId, taskData);
      }

      this.logger.info('✅ Workflow tasks created', { workflowId, stepCount: steps.length });
      
    } catch (error) {
      this.logger.error('❌ Failed to create workflow tasks', error);
    }
  }

  // =================== CALENDAR INTEGRATION METHODS ===================

  async createCalendarEvent(sessionId, eventData) {
    try {
      const { title, description, startTime, endTime, location, attendees = [], reminderMinutes = 15 } = eventData;
      
      // Create calendar event notification
      const calendarNotification = {
        type: 'calendar_event',
        title: `Calendar: ${title}`,
        message: `${description}\nLocation: ${location || 'Not specified'}\nTime: ${new Date(startTime).toLocaleString()}`,
        scheduledFor: new Date(new Date(startTime).getTime() - (reminderMinutes * 60 * 1000)).toISOString(),
        priority: 'medium',
        actionUrl: null
      };

      const result = await this.createNotification(sessionId, calendarNotification);
      
      // Store calendar event data for future reference
      const calendarEvent = {
        id: require('uuid').v4(),
        session_id: sessionId,
        title,
        description,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        location,
        attendees: JSON.stringify(attendees),
        reminder_minutes: reminderMinutes,
        notification_id: result.notification?.id,
        created_at: new Date().toISOString()
      };

      // Store in memory for fallback
      const memoryKey = `calendar_events_${sessionId}`;
      const existingEvents = await this.memoryManager.getFromMemory(memoryKey) || [];
      existingEvents.push(calendarEvent);
      await this.memoryManager.storeInMemory(memoryKey, existingEvents);

      this.logger.info('✅ Calendar event created', { eventId: calendarEvent.id, title });
      return { success: true, event: calendarEvent, notification: result.notification };

    } catch (error) {
      this.logger.error('❌ Failed to create calendar event', error);
      return { success: false, error: error.message };
    }
  }

  async scheduleRecurringReminder(sessionId, reminderData) {
    try {
      const { title, description, startDate, frequency, interval = 1, endDate, reminderTime = '09:00' } = reminderData;
      
      // Supported frequencies: daily, weekly, monthly
      const supportedFrequencies = ['daily', 'weekly', 'monthly'];
      if (!supportedFrequencies.includes(frequency)) {
        throw new Error('Invalid frequency. Supported: daily, weekly, monthly');
      }

      const reminders = [];
      let currentDate = new Date(startDate);
      const finalDate = endDate ? new Date(endDate) : new Date(currentDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year max

      while (currentDate <= finalDate) {
        // Set reminder time on the current date
        const [hours, minutes] = reminderTime.split(':').map(Number);
        const reminderDateTime = new Date(currentDate);
        reminderDateTime.setHours(hours, minutes, 0, 0);

        // Create notification for this occurrence
        const reminderNotification = {
          type: 'recurring_reminder',
          title: `Reminder: ${title}`,
          message: description,
          scheduledFor: reminderDateTime.toISOString(),
          priority: 'medium'
        };

        const result = await this.createNotification(sessionId, reminderNotification);
        
        reminders.push({
          date: reminderDateTime.toISOString(),
          notificationId: result.notification?.id
        });

        // Calculate next occurrence
        switch (frequency) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + interval);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + (7 * interval));
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + interval);
            break;
        }

        // Safety limit - max 100 reminders per recurring series
        if (reminders.length >= 100) break;
      }

      this.logger.info('✅ Recurring reminder scheduled', { 
        title, 
        frequency, 
        occurrences: reminders.length 
      });

      return { success: true, reminders, occurrenceCount: reminders.length };

    } catch (error) {
      this.logger.error('❌ Failed to schedule recurring reminder', error);
      return { success: false, error: error.message };
    }
  }

  async parseNaturalLanguageReminder(sessionId, naturalText) {
    try {
      // Simple natural language parsing for common reminder patterns
      const patterns = {
        // "Remind me to call John at 3pm today"
        today: /remind me to (.+) at (\d{1,2}):?(\d{0,2})\s*(am|pm|AM|PM)?\s*today/i,
        // "Remind me to call John tomorrow at 3pm" 
        tomorrow: /remind me to (.+) (tomorrow|tmrw) at (\d{1,2}):?(\d{0,2})\s*(am|pm|AM|PM)?/i,
        // "Remind me to call John in 2 hours"
        inHours: /remind me to (.+) in (\d+) hours?/i,
        // "Remind me to call John in 30 minutes"
        inMinutes: /remind me to (.+) in (\d+) minutes?/i,
        // "Remind me to call John on Friday"
        onDay: /remind me to (.+) on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
      };

      for (const [type, pattern] of Object.entries(patterns)) {
        const match = naturalText.match(pattern);
        if (match) {
          return await this.createReminderFromPattern(sessionId, type, match);
        }
      }

      // If no pattern matches, create a basic reminder for "soon"
      const basicMatch = naturalText.match(/remind me to (.+)/i);
      if (basicMatch) {
        const task = basicMatch[1];
        const reminderTime = new Date(Date.now() + (60 * 60 * 1000)); // 1 hour from now
        
        return await this.createNotification(sessionId, {
          type: 'task_reminder',
          title: `Reminder: ${task}`,
          message: `Don't forget to ${task}`,
          scheduledFor: reminderTime.toISOString(),
          priority: 'medium'
        });
      }

      throw new Error('Could not understand reminder request');

    } catch (error) {
      this.logger.error('❌ Failed to parse natural language reminder', error);
      return { success: false, error: error.message };
    }
  }

  async createReminderFromPattern(sessionId, type, match) {
    try {
      let reminderTime;
      let task;

      switch (type) {
        case 'today':
          task = match[1];
          const hour = parseInt(match[2]);
          const minute = parseInt(match[3]) || 0;
          const isPM = match[4]?.toLowerCase() === 'pm';
          
          reminderTime = new Date();
          reminderTime.setHours(isPM && hour !== 12 ? hour + 12 : hour, minute, 0, 0);
          break;

        case 'tomorrow':
          task = match[1];
          const tomorrowHour = parseInt(match[3]);
          const tomorrowMinute = parseInt(match[4]) || 0;
          const tomorrowIsPM = match[5]?.toLowerCase() === 'pm';
          
          reminderTime = new Date();
          reminderTime.setDate(reminderTime.getDate() + 1);
          reminderTime.setHours(
            tomorrowIsPM && tomorrowHour !== 12 ? tomorrowHour + 12 : tomorrowHour, 
            tomorrowMinute, 0, 0
          );
          break;

        case 'inHours':
          task = match[1];
          const hours = parseInt(match[2]);
          reminderTime = new Date(Date.now() + (hours * 60 * 60 * 1000));
          break;

        case 'inMinutes':
          task = match[1];
          const minutes = parseInt(match[2]);
          reminderTime = new Date(Date.now() + (minutes * 60 * 1000));
          break;

        case 'onDay':
          task = match[1];
          const dayName = match[2].toLowerCase();
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const targetDay = days.indexOf(dayName);
          
          reminderTime = new Date();
          const currentDay = reminderTime.getDay();
          const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
          reminderTime.setDate(reminderTime.getDate() + daysUntilTarget);
          reminderTime.setHours(9, 0, 0, 0); // Default to 9 AM
          break;
      }

      const result = await this.createNotification(sessionId, {
        type: 'task_reminder',
        title: `Reminder: ${task}`,
        message: `Don't forget to ${task}`,
        scheduledFor: reminderTime.toISOString(),
        priority: 'medium'
      });

      return { 
        success: true, 
        parsedAction: task, 
        scheduledTime: reminderTime.toISOString(),
        notification: result.notification 
      };

    } catch (error) {
      this.logger.error('❌ Failed to create reminder from pattern', error);
      return { success: false, error: error.message };
    }
  }

  async getUpcomingReminders(sessionId, timeframe = 'today') {
    try {
      let startTime, endTime;
      const now = new Date();

      switch (timeframe) {
        case 'today':
          startTime = new Date(now);
          startTime.setHours(0, 0, 0, 0);
          endTime = new Date(now);
          endTime.setHours(23, 59, 59, 999);
          break;

        case 'tomorrow':
          startTime = new Date(now);
          startTime.setDate(now.getDate() + 1);
          startTime.setHours(0, 0, 0, 0);
          endTime = new Date(startTime);
          endTime.setHours(23, 59, 59, 999);
          break;

        case 'week':
          startTime = new Date(now);
          startTime.setHours(0, 0, 0, 0);
          endTime = new Date(now);
          endTime.setDate(now.getDate() + 7);
          endTime.setHours(23, 59, 59, 999);
          break;

        default:
          // Next 24 hours
          startTime = new Date(now);
          endTime = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      }

      const notifications = await this.getNotifications(sessionId, { includeExpired: false });
      
      const upcomingReminders = notifications.filter(notification => {
        const scheduledTime = new Date(notification.scheduled_for);
        return scheduledTime >= startTime && scheduledTime <= endTime;
      });

      return {
        success: true,
        reminders: upcomingReminders,
        timeframe,
        count: upcomingReminders.length
      };

    } catch (error) {
      this.logger.error('❌ Failed to get upcoming reminders', error);
      return { success: false, error: error.message };
    }
  }

  // =================== APPOINTMENT MANAGEMENT METHODS ===================

  async requestAppointment(sessionId, appointmentData) {
    try {
      const { leadName, leadContact, requestedTime, requestedDate, purpose, notes } = appointmentData;
      
      const appointmentRequest = {
        id: require('uuid').v4(),
        session_id: sessionId,
        lead_name: leadName,
        lead_contact: leadContact,
        requested_time: requestedTime,
        requested_date: new Date(requestedDate).toISOString(),
        purpose,
        notes,
        status: 'pending_realtor_response', // pending_realtor_response → pending_lead_confirmation → confirmed → completed
        created_at: new Date().toISOString()
      };

      // Create notification for realtor
      const realtorNotification = {
        type: 'appointment_request',
        title: `Appointment Request: ${leadName}`,
        message: `${leadName} would like to meet on ${new Date(requestedDate).toDateString()} at ${requestedTime}. Purpose: ${purpose}`,
        priority: 'high',
        actionUrl: `/appointments/${appointmentRequest.id}`,
        scheduledFor: new Date().toISOString() // Immediate notification
      };

      const notificationResult = await this.createNotification(sessionId, realtorNotification);
      appointmentRequest.realtor_notification_id = notificationResult.notification?.id;

      // Store appointment request
      const memoryKey = `appointment_requests_${sessionId}`;
      const existingRequests = await this.memoryManager.getFromMemory(memoryKey) || [];
      existingRequests.push(appointmentRequest);
      await this.memoryManager.storeInMemory(memoryKey, existingRequests);

      this.logger.info('✅ Appointment request created', { 
        appointmentId: appointmentRequest.id, 
        leadName 
      });

      return { 
        success: true, 
        appointmentRequest,
        message: `I've sent your request to check availability for ${new Date(requestedDate).toDateString()} at ${requestedTime}. I'll get back to you within 30 minutes with confirmation.`
      };

    } catch (error) {
      this.logger.error('❌ Failed to create appointment request', error);
      return { success: false, error: error.message };
    }
  }

  async respondToAppointmentRequest(sessionId, appointmentId, response) {
    try {
      const { action, counterOffer } = response; // action: 'accept', 'counter', 'decline'
      
      const memoryKey = `appointment_requests_${sessionId}`;
      const requests = await this.memoryManager.getFromMemory(memoryKey) || [];
      const appointmentIndex = requests.findIndex(req => req.id === appointmentId);
      
      if (appointmentIndex === -1) {
        throw new Error('Appointment request not found');
      }

      const appointment = requests[appointmentIndex];
      
      switch (action) {
        case 'accept':
          appointment.status = 'pending_lead_confirmation';
          appointment.confirmed_time = appointment.requested_time;
          appointment.confirmed_date = appointment.requested_date;
          appointment.realtor_response_at = new Date().toISOString();
          
          // Notify lead of confirmation
          await this.createNotification(sessionId, {
            type: 'appointment_confirmed',
            title: `Appointment Confirmed with ${appointment.lead_name}`,
            message: `Your appointment for ${new Date(appointment.confirmed_date).toDateString()} at ${appointment.confirmed_time} has been confirmed.`,
            priority: 'medium',
            scheduledFor: new Date().toISOString()
          });
          break;

        case 'counter':
          appointment.status = 'pending_lead_confirmation';
          appointment.confirmed_time = counterOffer.time;
          appointment.confirmed_date = new Date(counterOffer.date).toISOString();
          appointment.realtor_response_at = new Date().toISOString();
          appointment.counter_offered = true;
          
          // Notify lead of counter-offer
          await this.createNotification(sessionId, {
            type: 'appointment_counter_offer',
            title: `Alternative Time Suggested for ${appointment.lead_name}`,
            message: `Instead of ${appointment.requested_time} on ${new Date(appointment.requested_date).toDateString()}, how about ${counterOffer.time} on ${new Date(counterOffer.date).toDateString()}?`,
            priority: 'high',
            scheduledFor: new Date().toISOString()
          });
          break;

        case 'decline':
          appointment.status = 'declined';
          appointment.realtor_response_at = new Date().toISOString();
          appointment.decline_reason = response.reason || 'Schedule conflict';
          
          // Notify lead of decline with alternatives
          await this.createNotification(sessionId, {
            type: 'appointment_declined',
            title: `Need to Reschedule with ${appointment.lead_name}`,
            message: `Unfortunately, the requested time isn't available. I'll follow up with alternative times that work better.`,
            priority: 'high',
            scheduledFor: new Date().toISOString()
          });
          break;
      }

      // Update stored requests
      requests[appointmentIndex] = appointment;
      await this.memoryManager.storeInMemory(memoryKey, requests);

      this.logger.info('✅ Appointment response processed', { 
        appointmentId, 
        action,
        status: appointment.status 
      });

      return { success: true, appointment, action };

    } catch (error) {
      this.logger.error('❌ Failed to respond to appointment request', error);
      return { success: false, error: error.message };
    }
  }

  async confirmFinalAppointment(sessionId, appointmentId, leadConfirmation = true) {
    try {
      const memoryKey = `appointment_requests_${sessionId}`;
      const requests = await this.memoryManager.getFromMemory(memoryKey) || [];
      const appointmentIndex = requests.findIndex(req => req.id === appointmentId);
      
      if (appointmentIndex === -1) {
        throw new Error('Appointment request not found');
      }

      const appointment = requests[appointmentIndex];
      
      if (leadConfirmation) {
        appointment.status = 'confirmed';
        appointment.lead_confirmed_at = new Date().toISOString();
        
        // Create final calendar event for both parties
        const calendarEvent = await this.createCalendarEvent(sessionId, {
          title: `Meeting with ${appointment.lead_name}`,
          description: `${appointment.purpose}\nContact: ${appointment.lead_contact}${appointment.notes ? `\nNotes: ${appointment.notes}` : ''}`,
          startTime: `${appointment.confirmed_date.split('T')[0]}T${appointment.confirmed_time}:00`,
          endTime: `${appointment.confirmed_date.split('T')[0]}T${this.addMinutesToTime(appointment.confirmed_time, 60)}:00`,
          attendees: [appointment.lead_contact],
          reminderMinutes: 30
        });

        // Optional: Restaurant reservation logic
        if (appointment.purpose?.toLowerCase().includes('lunch') || 
            appointment.purpose?.toLowerCase().includes('restaurant')) {
          await this.createNotification(sessionId, {
            type: 'restaurant_reservation',
            title: 'Restaurant Reservation Needed',
            message: `Would you like me to make a reservation for your lunch meeting with ${appointment.lead_name}?`,
            priority: 'low',
            scheduledFor: new Date(Date.now() + (5 * 60 * 1000)).toISOString() // 5 minutes from now
          });
        }

        // Update stored requests
        requests[appointmentIndex] = appointment;
        await this.memoryManager.storeInMemory(memoryKey, requests);

        this.logger.info('✅ Final appointment confirmed', { 
          appointmentId,
          leadName: appointment.lead_name,
          confirmedTime: `${appointment.confirmed_date} ${appointment.confirmed_time}`
        });

        return { 
          success: true, 
          appointment, 
          calendarEvent: calendarEvent.event,
          message: 'Appointment confirmed and calendar event created'
        };
      } else {
        // Lead declined the counter-offer
        appointment.status = 'cancelled';
        appointment.lead_declined_at = new Date().toISOString();
        
        requests[appointmentIndex] = appointment;
        await this.memoryManager.storeInMemory(memoryKey, requests);

        return { 
          success: true, 
          appointment, 
          message: 'Appointment cancelled by lead' 
        };
      }

    } catch (error) {
      this.logger.error('❌ Failed to confirm final appointment', error);
      return { success: false, error: error.message };
    }
  }

  addMinutesToTime(timeString, minutes) {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = (hours * 60) + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }
}

module.exports = ToolOrchestrator;