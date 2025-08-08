/**
 * 🔧 SolAI Tool Orchestrator
 * Intelligent coordination of existing super-tools + Claude Flow's 87 MCP tools
 */

const Logger = require('../core/logger');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class ToolOrchestrator {
  constructor(memoryManager) {
    this.memoryManager = memoryManager;
    this.logger = new Logger('ToolOrchestrator');
    this.initialized = false;
    
    this.setupToolRegistry();
    this.setupCoordinationRules();
    this.setupExecutionStrategies();
  }

  async initialize() {
    this.logger.info('🔧 Initializing tool orchestrator...');
    
    try {
      await this.initializeExistingTools();
      await this.initializeClaudeFlowIntegration();
      await this.setupToolChaining();
      
      this.initialized = true;
      this.logger.info('✅ Tool orchestrator initialized successfully');
      
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
    const timer = this.logger.startTimer('tool-coordination');
    
    try {
      const { intent, context, priority = 'medium' } = request;
      
      this.logger.debug('Coordinating tools', { 
        intent, 
        priority,
        contextKeys: Object.keys(context || {})
      });

      // Step 1: Analyze intent and select optimal tools
      const toolSelection = await this.selectTools(intent, context);
      
      // Step 2: Determine execution strategy
      const strategy = this.determineExecutionStrategy(toolSelection, priority);
      
      // Step 3: Execute tools according to strategy
      const results = await this.executeToolStrategy(toolSelection, strategy, context);
      
      // Step 4: Aggregate and format results
      const aggregatedResults = this.aggregateResults(results, intent);
      
      timer.end('Tool coordination completed');
      
      return {
        success: true,
        coordinationType: strategy.type,
        toolsExecuted: toolSelection.selected.map(t => t.name),
        results: aggregatedResults,
        executionTime: timer.duration || 0,
        metadata: {
          intent,
          strategy: strategy.description,
          toolCount: toolSelection.selected.length
        }
      };
      
    } catch (error) {
      timer.end('Tool coordination failed');
      this.logger.error('❌ Tool coordination failed', error);
      
      return {
        success: false,
        error: error.message,
        fallback: await this.generateFallbackResponse(request)
      };
    }
  }

  async selectTools(intent, context) {
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
      }
    };

    // Check super-tool connectivity
    for (const [toolName, connection] of Object.entries(this.existingToolConnections)) {
      status.superTools[toolName] = {
        connected: connection.status === 'ready',
        authenticated: connection.authenticated
      };
    }

    return status;
  }
}

module.exports = ToolOrchestrator;