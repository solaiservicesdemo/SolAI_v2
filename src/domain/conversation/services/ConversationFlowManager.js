/**
 * Conversation Flow Manager
 * Enterprise conversation flow orchestration with state machines and context awareness
 */

const Logger = require('../../../core/logger');
const { v4: uuidv4 } = require('uuid');

class ConversationFlowManager {
  constructor() {
    this.logger = new Logger('ConversationFlowManager');
    this.initialized = false;
    
    // Active conversation flows by session ID
    this.activeFlows = new Map();
    
    // Flow definitions and state machines
    this.flowDefinitions = new Map();
    this.stateTransitions = new Map();
    
    // Flow execution engine
    this.executionEngine = {
      activeStates: new Map(),
      transitions: new Map(),
      conditions: new Map(),
      actions: new Map()
    };
    
    // Context management
    this.contextManagers = new Map();
    
    // Performance tracking
    this.metrics = {
      totalFlowsStarted: 0,
      totalFlowsCompleted: 0,
      averageFlowDuration: 0,
      stateTransitionCounts: new Map(),
      flowSuccessRates: new Map()
    };
    
    this.setupFlowDefinitions();
    this.setupStateTransitions();
    this.setupExecutionActions();
  }

  async initialize() {
    this.logger.info('🔄 Initializing conversation flow manager...');
    
    try {
      await this.validateFlowDefinitions();
      await this.initializeContextManagers();
      await this.setupFlowAnalytics();
      
      this.initialized = true;
      this.logger.info('✅ Conversation flow manager initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize conversation flow manager', error);
      throw error;
    }
  }

  setupFlowDefinitions() {
    // Real Estate Property Search Flow
    this.flowDefinitions.set('property_search', {
      id: 'property_search',
      name: 'Property Search Assistant',
      description: 'Guides users through comprehensive property search process',
      initialState: 'gathering_requirements',
      finalStates: ['search_completed', 'search_cancelled'],
      contextRequirements: ['location', 'budget', 'propertyType'],
      estimatedDuration: 300000, // 5 minutes
      
      states: {
        gathering_requirements: {
          name: 'Gathering Search Requirements',
          type: 'input_collection',
          required_context: [],
          optional_context: ['timeline', 'specificNeeds'],
          actions: ['collect_location', 'collect_budget', 'collect_property_type'],
          transitions: ['requirements_complete', 'need_more_info', 'user_cancelled']
        },
        
        refining_criteria: {
          name: 'Refining Search Criteria',
          type: 'clarification',
          required_context: ['location', 'budget'],
          actions: ['clarify_preferences', 'suggest_alternatives'],
          transitions: ['criteria_confirmed', 'back_to_requirements', 'user_cancelled']
        },
        
        executing_search: {
          name: 'Executing Property Search',
          type: 'tool_execution',
          required_context: ['location', 'budget', 'propertyType'],
          tools: ['web_scraper', 'market_analyzer'],
          actions: ['search_properties', 'analyze_results'],
          transitions: ['search_successful', 'search_failed', 'refine_search']
        },
        
        presenting_results: {
          name: 'Presenting Search Results',
          type: 'output_presentation',
          actions: ['format_results', 'provide_analysis', 'suggest_next_steps'],
          transitions: ['results_accepted', 'refine_search', 'schedule_viewing']
        },
        
        search_completed: {
          name: 'Search Process Completed',
          type: 'final',
          actions: ['store_preferences', 'schedule_follow_up']
        },
        
        search_cancelled: {
          name: 'Search Process Cancelled',
          type: 'final',
          actions: ['cleanup_context', 'offer_alternatives']
        }
      }
    });

    // Client Onboarding Flow
    this.flowDefinitions.set('client_onboarding', {
      id: 'client_onboarding',
      name: 'Client Onboarding Process',
      description: 'Comprehensive client intake and CRM integration',
      initialState: 'collecting_basic_info',
      finalStates: ['onboarding_complete', 'onboarding_cancelled'],
      contextRequirements: ['client_name', 'contact_info'],
      estimatedDuration: 600000, // 10 minutes
      
      states: {
        collecting_basic_info: {
          name: 'Collecting Basic Information',
          type: 'input_collection',
          actions: ['collect_name', 'collect_contact', 'collect_preferences'],
          transitions: ['basic_info_complete', 'need_more_info']
        },
        
        gathering_requirements: {
          name: 'Understanding Client Needs',
          type: 'requirement_analysis',
          actions: ['assess_needs', 'identify_goals', 'set_timeline'],
          transitions: ['requirements_clear', 'need_clarification']
        },
        
        crm_integration: {
          name: 'CRM Integration',
          type: 'tool_execution',
          tools: ['crm', 'calendar'],
          actions: ['create_client_profile', 'schedule_follow_up'],
          transitions: ['integration_complete', 'integration_failed']
        },
        
        onboarding_complete: {
          name: 'Onboarding Complete',
          type: 'final',
          actions: ['send_welcome_email', 'create_action_plan']
        }
      }
    });

    // Market Analysis Flow
    this.flowDefinitions.set('market_analysis', {
      id: 'market_analysis',
      name: 'Real Estate Market Analysis',
      description: 'Comprehensive market research and reporting',
      initialState: 'defining_analysis_scope',
      finalStates: ['analysis_complete', 'analysis_cancelled'],
      contextRequirements: ['analysis_location', 'analysis_type'],
      
      states: {
        defining_analysis_scope: {
          name: 'Defining Analysis Scope',
          type: 'input_collection',
          actions: ['collect_location', 'define_analysis_type', 'set_parameters'],
          transitions: ['scope_defined', 'need_more_info']
        },
        
        data_collection: {
          name: 'Collecting Market Data',
          type: 'tool_execution',
          tools: ['web_scraper', 'market_analyzer', 'document_processor'],
          actions: ['gather_listings', 'collect_sales_data', 'research_trends'],
          transitions: ['data_collected', 'data_collection_failed']
        },
        
        analysis_processing: {
          name: 'Processing Market Analysis',
          type: 'analysis',
          actions: ['analyze_trends', 'calculate_metrics', 'generate_insights'],
          transitions: ['analysis_ready', 'need_more_data']
        },
        
        report_generation: {
          name: 'Generating Analysis Report',
          type: 'output_generation',
          tools: ['document_processor'],
          actions: ['create_report', 'format_visualizations'],
          transitions: ['report_ready', 'report_failed']
        },
        
        analysis_complete: {
          name: 'Market Analysis Complete',
          type: 'final',
          actions: ['deliver_report', 'store_insights']
        }
      }
    });
  }

  setupStateTransitions() {
    // Property Search Flow Transitions
    this.stateTransitions.set('property_search', {
      gathering_requirements: {
        requirements_complete: {
          target: 'refining_criteria',
          condition: 'has_minimum_requirements',
          action: 'validate_requirements'
        },
        need_more_info: {
          target: 'gathering_requirements',
          condition: 'missing_critical_info',
          action: 'request_missing_info'
        },
        user_cancelled: {
          target: 'search_cancelled',
          condition: 'user_wants_to_cancel',
          action: 'cleanup_and_cancel'
        }
      },
      
      refining_criteria: {
        criteria_confirmed: {
          target: 'executing_search',
          condition: 'criteria_acceptable',
          action: 'prepare_search'
        },
        back_to_requirements: {
          target: 'gathering_requirements',
          condition: 'major_changes_needed',
          action: 'reset_requirements'
        }
      },
      
      executing_search: {
        search_successful: {
          target: 'presenting_results',
          condition: 'has_search_results',
          action: 'prepare_results'
        },
        search_failed: {
          target: 'refining_criteria',
          condition: 'search_returned_no_results',
          action: 'suggest_criteria_adjustment'
        },
        refine_search: {
          target: 'refining_criteria',
          condition: 'user_wants_refinement',
          action: 'capture_refinement_feedback'
        }
      },
      
      presenting_results: {
        results_accepted: {
          target: 'search_completed',
          condition: 'user_satisfied_with_results',
          action: 'finalize_search'
        },
        refine_search: {
          target: 'refining_criteria',
          condition: 'user_wants_different_results',
          action: 'capture_new_preferences'
        },
        schedule_viewing: {
          target: 'search_completed',
          condition: 'user_wants_to_schedule',
          action: 'initiate_scheduling_flow'
        }
      }
    });

    // Add transitions for other flows...
    this.setupClientOnboardingTransitions();
    this.setupMarketAnalysisTransitions();
  }

  setupClientOnboardingTransitions() {
    this.stateTransitions.set('client_onboarding', {
      collecting_basic_info: {
        basic_info_complete: {
          target: 'gathering_requirements',
          condition: 'has_required_contact_info',
          action: 'validate_contact_info'
        },
        need_more_info: {
          target: 'collecting_basic_info',
          condition: 'missing_required_fields',
          action: 'request_required_info'
        }
      },
      
      gathering_requirements: {
        requirements_clear: {
          target: 'crm_integration',
          condition: 'has_clear_requirements',
          action: 'prepare_crm_data'
        },
        need_clarification: {
          target: 'gathering_requirements',
          condition: 'requirements_unclear',
          action: 'ask_clarifying_questions'
        }
      },
      
      crm_integration: {
        integration_complete: {
          target: 'onboarding_complete',
          condition: 'crm_integration_successful',
          action: 'finalize_onboarding'
        },
        integration_failed: {
          target: 'gathering_requirements',
          condition: 'crm_integration_failed',
          action: 'handle_integration_failure'
        }
      }
    });
  }

  setupMarketAnalysisTransitions() {
    this.stateTransitions.set('market_analysis', {
      defining_analysis_scope: {
        scope_defined: {
          target: 'data_collection',
          condition: 'has_analysis_parameters',
          action: 'initialize_data_collection'
        },
        need_more_info: {
          target: 'defining_analysis_scope',
          condition: 'incomplete_scope',
          action: 'request_scope_details'
        }
      },
      
      data_collection: {
        data_collected: {
          target: 'analysis_processing',
          condition: 'sufficient_data_collected',
          action: 'start_analysis'
        },
        data_collection_failed: {
          target: 'defining_analysis_scope',
          condition: 'data_collection_error',
          action: 'handle_collection_failure'
        }
      },
      
      analysis_processing: {
        analysis_ready: {
          target: 'report_generation',
          condition: 'analysis_complete',
          action: 'prepare_report_generation'
        },
        need_more_data: {
          target: 'data_collection',
          condition: 'insufficient_data',
          action: 'collect_additional_data'
        }
      },
      
      report_generation: {
        report_ready: {
          target: 'analysis_complete',
          condition: 'report_generated',
          action: 'finalize_analysis'
        },
        report_failed: {
          target: 'analysis_processing',
          condition: 'report_generation_error',
          action: 'retry_report_generation'
        }
      }
    });
  }

  setupExecutionActions() {
    // Context collection actions
    this.executionEngine.actions.set('collect_location', async (context) => {
      return {
        type: 'request_input',
        message: 'What area or city are you interested in? (e.g., Coronado, Downtown San Diego, La Jolla)',
        expectedType: 'location',
        validation: 'location_format'
      };
    });

    this.executionEngine.actions.set('collect_budget', async (context) => {
      return {
        type: 'request_input',
        message: 'What\'s your budget range? Please include your maximum price.',
        expectedType: 'budget',
        validation: 'budget_format'
      };
    });

    this.executionEngine.actions.set('collect_property_type', async (context) => {
      return {
        type: 'request_input',
        message: 'What type of property are you looking for? (condo, house, townhome, etc.)',
        expectedType: 'propertyType',
        validation: 'property_type_format'
      };
    });

    // Tool execution actions
    this.executionEngine.actions.set('search_properties', async (context, toolOrchestrator) => {
      return await toolOrchestrator.coordinateTools({
        intent: 'property_search',
        context: context,
        primaryTool: 'web_scraper',
        supportingTools: ['market_analyzer'],
        workflowType: 'property_search'
      });
    });

    this.executionEngine.actions.set('create_client_profile', async (context, toolOrchestrator) => {
      return await toolOrchestrator.coordinateTools({
        intent: 'client_management',
        context: context,
        primaryTool: 'crm',
        supportingTools: ['document_processor'],
        workflowType: 'client_onboarding'
      });
    });

    // Analysis actions
    this.executionEngine.actions.set('analyze_trends', async (context, toolOrchestrator) => {
      return await toolOrchestrator.coordinateTools({
        intent: 'market_analysis',
        context: context,
        primaryTool: 'market_analyzer',
        supportingTools: ['web_scraper', 'document_processor'],
        workflowType: 'market_analysis'
      });
    });

    // Condition evaluators
    this.executionEngine.conditions.set('has_minimum_requirements', (context) => {
      return context.location && (context.budget || context.priceRange);
    });

    this.executionEngine.conditions.set('has_required_contact_info', (context) => {
      return context.client_name && (context.phone || context.email);
    });

    this.executionEngine.conditions.set('has_analysis_parameters', (context) => {
      return context.analysis_location && context.analysis_type;
    });

    this.executionEngine.conditions.set('user_wants_to_cancel', (context) => {
      const cancelIndicators = ['cancel', 'stop', 'quit', 'nevermind', 'forget it'];
      const lastMessage = context.lastUserMessage?.toLowerCase() || '';
      return cancelIndicators.some(indicator => lastMessage.includes(indicator));
    });
  }

  async startFlow(flowType, sessionId, initialContext = {}, messageAnalysis) {
    try {
      const flowDefinition = this.flowDefinitions.get(flowType);
      if (!flowDefinition) {
        throw new Error(`Unknown flow type: ${flowType}`);
      }

      const flowInstance = {
        id: uuidv4(),
        type: flowType,
        sessionId: sessionId,
        definition: flowDefinition,
        currentState: flowDefinition.initialState,
        context: { ...initialContext },
        startTime: new Date(),
        lastActivity: new Date(),
        transitions: [],
        status: 'active',
        metadata: {
          triggerIntent: messageAnalysis?.intent?.primaryIntent,
          initialMessage: messageAnalysis?.message
        }
      };

      // Initialize context manager for this flow
      const contextManager = new FlowContextManager(flowInstance, this.logger);
      this.contextManagers.set(flowInstance.id, contextManager);

      // Store active flow
      this.activeFlows.set(sessionId, flowInstance);

      // Update metrics
      this.metrics.totalFlowsStarted++;
      
      this.logger.info(`Flow started: ${flowType}`, {
        flowId: flowInstance.id,
        sessionId: sessionId.substring(0, 8),
        initialState: flowInstance.currentState
      });

      // Execute initial state
      const initialStateResult = await this.executeState(flowInstance, messageAnalysis);

      return {
        success: true,
        flowId: flowInstance.id,
        currentState: flowInstance.currentState,
        stateResult: initialStateResult,
        estimatedDuration: flowDefinition.estimatedDuration
      };

    } catch (error) {
      this.logger.error('❌ Failed to start conversation flow', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processFlowMessage(sessionId, messageAnalysis, toolOrchestrator) {
    const flowInstance = this.activeFlows.get(sessionId);
    if (!flowInstance || flowInstance.status !== 'active') {
      return null; // No active flow
    }

    try {
      flowInstance.lastActivity = new Date();
      
      // Update flow context with new message analysis
      const contextManager = this.contextManagers.get(flowInstance.id);
      if (contextManager) {
        contextManager.updateWithMessage(messageAnalysis);
      }

      // Check for flow interruption or cancellation
      if (this.shouldInterruptFlow(flowInstance, messageAnalysis)) {
        return await this.handleFlowInterruption(flowInstance, messageAnalysis);
      }

      // Process state transition
      const transitionResult = await this.processStateTransition(
        flowInstance, 
        messageAnalysis, 
        toolOrchestrator
      );

      // Execute new state if transition occurred
      let stateResult = null;
      if (transitionResult.transitioned) {
        stateResult = await this.executeState(flowInstance, messageAnalysis, toolOrchestrator);
      }

      // Check if flow is complete
      if (this.isFlowComplete(flowInstance)) {
        return await this.completeFlow(flowInstance);
      }

      return {
        success: true,
        flowId: flowInstance.id,
        currentState: flowInstance.currentState,
        transitioned: transitionResult.transitioned,
        stateResult: stateResult,
        flowStatus: flowInstance.status,
        progress: this.calculateFlowProgress(flowInstance)
      };

    } catch (error) {
      this.logger.error('❌ Flow message processing failed', error);
      
      // Handle flow error
      return await this.handleFlowError(flowInstance, error);
    }
  }

  async executeState(flowInstance, messageAnalysis, toolOrchestrator = null) {
    const state = flowInstance.definition.states[flowInstance.currentState];
    if (!state) {
      throw new Error(`Invalid state: ${flowInstance.currentState}`);
    }

    this.logger.debug(`Executing state: ${flowInstance.currentState}`, {
      flowId: flowInstance.id,
      stateType: state.type
    });

    const stateResult = {
      stateName: state.name,
      stateType: state.type,
      actions: [],
      outputs: [],
      nextActions: []
    };

    // Execute state actions
    for (const actionName of state.actions || []) {
      const action = this.executionEngine.actions.get(actionName);
      if (action) {
        try {
          const actionResult = await action(
            flowInstance.context, 
            toolOrchestrator,
            messageAnalysis
          );
          
          stateResult.actions.push({
            name: actionName,
            result: actionResult,
            success: true
          });

          // Handle different action result types
          if (actionResult?.type === 'request_input') {
            stateResult.outputs.push({
              type: 'user_prompt',
              content: actionResult.message,
              expectedType: actionResult.expectedType
            });
          } else if (actionResult?.type === 'tool_result') {
            stateResult.outputs.push({
              type: 'tool_output',
              content: actionResult.content,
              toolsUsed: actionResult.toolsUsed
            });
          }

        } catch (actionError) {
          this.logger.error(`Action failed: ${actionName}`, actionError);
          stateResult.actions.push({
            name: actionName,
            error: actionError.message,
            success: false
          });
        }
      }
    }

    // Determine next possible actions based on available transitions
    const transitions = this.stateTransitions.get(flowInstance.type)?.[flowInstance.currentState];
    if (transitions) {
      stateResult.nextActions = Object.keys(transitions).map(transitionName => ({
        name: transitionName,
        description: transitions[transitionName].description || transitionName
      }));
    }

    return stateResult;
  }

  async processStateTransition(flowInstance, messageAnalysis, toolOrchestrator) {
    const transitions = this.stateTransitions.get(flowInstance.type)?.[flowInstance.currentState];
    if (!transitions) {
      return { transitioned: false, reason: 'no_transitions_available' };
    }

    // Evaluate transition conditions
    for (const [transitionName, transitionConfig] of Object.entries(transitions)) {
      if (await this.evaluateTransitionCondition(
        transitionConfig.condition, 
        flowInstance.context, 
        messageAnalysis
      )) {
        
        // Execute transition action if specified
        if (transitionConfig.action) {
          const action = this.executionEngine.actions.get(transitionConfig.action);
          if (action) {
            await action(flowInstance.context, toolOrchestrator, messageAnalysis);
          }
        }

        // Record transition
        flowInstance.transitions.push({
          from: flowInstance.currentState,
          to: transitionConfig.target,
          trigger: transitionName,
          timestamp: new Date(),
          messageAnalysis: {
            intent: messageAnalysis?.intent?.primaryIntent,
            confidence: messageAnalysis?.intent?.confidence
          }
        });

        // Update state
        const previousState = flowInstance.currentState;
        flowInstance.currentState = transitionConfig.target;

        // Update metrics
        const transitionKey = `${previousState}->${transitionConfig.target}`;
        this.metrics.stateTransitionCounts.set(
          transitionKey, 
          (this.metrics.stateTransitionCounts.get(transitionKey) || 0) + 1
        );

        this.logger.debug(`State transition: ${previousState} -> ${transitionConfig.target}`, {
          flowId: flowInstance.id,
          trigger: transitionName
        });

        return { 
          transitioned: true, 
          from: previousState, 
          to: transitionConfig.target,
          trigger: transitionName 
        };
      }
    }

    return { transitioned: false, reason: 'no_conditions_met' };
  }

  async evaluateTransitionCondition(conditionName, context, messageAnalysis) {
    const condition = this.executionEngine.conditions.get(conditionName);
    if (!condition) {
      this.logger.warn(`Unknown condition: ${conditionName}`);
      return false;
    }

    try {
      // Add message analysis to context for condition evaluation
      const enrichedContext = {
        ...context,
        lastUserMessage: messageAnalysis?.message,
        lastIntent: messageAnalysis?.intent?.primaryIntent,
        lastSentiment: messageAnalysis?.sentiment?.emotion
      };

      return await condition(enrichedContext, messageAnalysis);
    } catch (error) {
      this.logger.error(`Condition evaluation failed: ${conditionName}`, error);
      return false;
    }
  }

  shouldInterruptFlow(flowInstance, messageAnalysis) {
    // Check for explicit cancellation
    const cancelIndicators = ['cancel', 'stop', 'quit', 'end', 'nevermind'];
    const message = messageAnalysis?.message?.toLowerCase() || '';
    
    if (cancelIndicators.some(indicator => message.includes(indicator))) {
      return true;
    }

    // Check for new flow triggers that should interrupt current flow
    const highPriorityIntents = [
      'emergency', 'urgent_client_request', 'critical_issue'
    ];
    
    const currentIntent = messageAnalysis?.intent?.primaryIntent || '';
    return highPriorityIntents.some(intent => currentIntent.includes(intent));
  }

  async handleFlowInterruption(flowInstance, messageAnalysis) {
    this.logger.info(`Flow interrupted: ${flowInstance.type}`, {
      flowId: flowInstance.id,
      currentState: flowInstance.currentState,
      reason: messageAnalysis?.intent?.primaryIntent
    });

    flowInstance.status = 'interrupted';
    flowInstance.endTime = new Date();

    // Save flow state for potential resumption
    const contextManager = this.contextManagers.get(flowInstance.id);
    if (contextManager) {
      await contextManager.saveState();
    }

    return {
      success: true,
      flowId: flowInstance.id,
      status: 'interrupted',
      message: 'I understand you want to cancel or change direction. Your progress has been saved.',
      resumeOption: true
    };
  }

  isFlowComplete(flowInstance) {
    return flowInstance.definition.finalStates.includes(flowInstance.currentState);
  }

  async completeFlow(flowInstance) {
    flowInstance.status = 'completed';
    flowInstance.endTime = new Date();
    
    const duration = flowInstance.endTime - flowInstance.startTime;
    
    // Update metrics
    this.metrics.totalFlowsCompleted++;
    this.metrics.averageFlowDuration = 
      (this.metrics.averageFlowDuration * (this.metrics.totalFlowsCompleted - 1) + duration) /
      this.metrics.totalFlowsCompleted;

    // Calculate success rate
    const flowType = flowInstance.type;
    const currentStats = this.metrics.flowSuccessRates.get(flowType) || { completed: 0, total: 0 };
    currentStats.completed++;
    currentStats.total++;
    this.metrics.flowSuccessRates.set(flowType, currentStats);

    // Cleanup
    this.contextManagers.delete(flowInstance.id);
    this.activeFlows.delete(flowInstance.sessionId);

    this.logger.info(`Flow completed: ${flowInstance.type}`, {
      flowId: flowInstance.id,
      duration: duration,
      finalState: flowInstance.currentState,
      transitionCount: flowInstance.transitions.length
    });

    return {
      success: true,
      flowId: flowInstance.id,
      status: 'completed',
      duration: duration,
      finalState: flowInstance.currentState,
      summary: this.generateFlowSummary(flowInstance)
    };
  }

  async handleFlowError(flowInstance, error) {
    this.logger.error('Flow error occurred', error);

    flowInstance.status = 'error';
    flowInstance.error = {
      message: error.message,
      timestamp: new Date(),
      state: flowInstance.currentState
    };

    return {
      success: false,
      flowId: flowInstance.id,
      status: 'error',
      error: error.message,
      recoveryOptions: this.getRecoveryOptions(flowInstance)
    };
  }

  calculateFlowProgress(flowInstance) {
    const totalStates = Object.keys(flowInstance.definition.states).length;
    const currentStateIndex = Object.keys(flowInstance.definition.states)
      .indexOf(flowInstance.currentState);
    
    return {
      percentage: Math.round((currentStateIndex / totalStates) * 100),
      currentStep: currentStateIndex + 1,
      totalSteps: totalStates,
      statesCompleted: flowInstance.transitions.length,
      estimatedTimeRemaining: this.estimateRemainingTime(flowInstance)
    };
  }

  estimateRemainingTime(flowInstance) {
    const elapsed = Date.now() - flowInstance.startTime.getTime();
    const progress = this.calculateFlowProgress(flowInstance);
    
    if (progress.percentage > 0) {
      const totalEstimated = (elapsed / progress.percentage) * 100;
      return Math.max(0, totalEstimated - elapsed);
    }
    
    return flowInstance.definition.estimatedDuration || 300000; // 5 min default
  }

  generateFlowSummary(flowInstance) {
    return {
      flowType: flowInstance.type,
      duration: flowInstance.endTime - flowInstance.startTime,
      statesVisited: flowInstance.transitions.map(t => t.from).concat([flowInstance.currentState]),
      contextGathered: Object.keys(flowInstance.context).length,
      toolsUsed: this.extractToolsUsed(flowInstance),
      keyOutcomes: this.extractKeyOutcomes(flowInstance)
    };
  }

  extractToolsUsed(flowInstance) {
    const tools = new Set();
    flowInstance.definition.states.forEach(state => {
      if (state.tools) {
        state.tools.forEach(tool => tools.add(tool));
      }
    });
    return Array.from(tools);
  }

  extractKeyOutcomes(flowInstance) {
    const outcomes = [];
    
    if (flowInstance.context.searchResults) {
      outcomes.push(`Found ${flowInstance.context.searchResults.length} properties`);
    }
    
    if (flowInstance.context.client_name) {
      outcomes.push(`Client profile created for ${flowInstance.context.client_name}`);
    }
    
    if (flowInstance.context.analysis_report) {
      outcomes.push('Market analysis report generated');
    }
    
    return outcomes;
  }

  getRecoveryOptions(flowInstance) {
    return [
      {
        option: 'retry_current_state',
        description: 'Retry the current step'
      },
      {
        option: 'go_back_one_state',
        description: 'Go back to the previous step'
      },
      {
        option: 'restart_flow',
        description: 'Start the process over'
      },
      {
        option: 'cancel_flow',
        description: 'Cancel this process'
      }
    ];
  }

  // Public API methods

  getActiveFlow(sessionId) {
    return this.activeFlows.get(sessionId);
  }

  async cancelFlow(sessionId, reason = 'user_requested') {
    const flowInstance = this.activeFlows.get(sessionId);
    if (!flowInstance) {
      return { success: false, error: 'No active flow found' };
    }

    flowInstance.status = 'cancelled';
    flowInstance.endTime = new Date();
    flowInstance.cancellationReason = reason;

    this.contextManagers.delete(flowInstance.id);
    this.activeFlows.delete(sessionId);

    return { 
      success: true, 
      message: 'Flow cancelled successfully',
      flowSummary: this.generateFlowSummary(flowInstance)
    };
  }

  async validateFlowDefinitions() {
    for (const [flowType, definition] of this.flowDefinitions.entries()) {
      // Validate states reference existing transitions
      const transitions = this.stateTransitions.get(flowType);
      if (!transitions) {
        throw new Error(`Missing transitions for flow: ${flowType}`);
      }

      // Validate all states have valid transitions or are final states
      for (const stateName of Object.keys(definition.states)) {
        if (!definition.finalStates.includes(stateName) && !transitions[stateName]) {
          throw new Error(`State ${stateName} in flow ${flowType} has no transitions`);
        }
      }
    }
    
    this.logger.debug('Flow definitions validated');
  }

  async initializeContextManagers() {
    // Initialize any persistent context managers
    this.logger.debug('Context managers initialized');
  }

  async setupFlowAnalytics() {
    // Setup analytics tracking
    this.logger.debug('Flow analytics initialized');
  }

  // Analytics and reporting

  getFlowMetrics() {
    return {
      totalFlowsStarted: this.metrics.totalFlowsStarted,
      totalFlowsCompleted: this.metrics.totalFlowsCompleted,
      averageFlowDuration: this.metrics.averageFlowDuration,
      completionRate: this.metrics.totalFlowsStarted > 0 ? 
        this.metrics.totalFlowsCompleted / this.metrics.totalFlowsStarted : 0,
      activeFlows: this.activeFlows.size,
      flowSuccessRates: Object.fromEntries(this.metrics.flowSuccessRates),
      popularTransitions: this.getTopTransitions(10)
    };
  }

  getTopTransitions(limit = 10) {
    return Array.from(this.metrics.stateTransitionCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([transition, count]) => ({ transition, count }));
  }

  getHealthStatus() {
    return {
      initialized: this.initialized,
      activeFlows: this.activeFlows.size,
      availableFlowTypes: Array.from(this.flowDefinitions.keys()),
      contextManagersActive: this.contextManagers.size,
      totalActionsRegistered: this.executionEngine.actions.size,
      totalConditionsRegistered: this.executionEngine.conditions.size,
      performanceMetrics: this.getFlowMetrics()
    };
  }
}

// Flow Context Manager Helper Class
class FlowContextManager {
  constructor(flowInstance, logger) {
    this.flowInstance = flowInstance;
    this.logger = logger;
    this.contextHistory = [];
  }

  updateWithMessage(messageAnalysis) {
    // Extract and store relevant context from message analysis
    if (messageAnalysis?.intent?.entities) {
      Object.assign(this.flowInstance.context, messageAnalysis.intent.entities);
    }

    // Store historical context
    this.contextHistory.push({
      timestamp: new Date(),
      message: messageAnalysis?.message,
      intent: messageAnalysis?.intent?.primaryIntent,
      entities: messageAnalysis?.intent?.entities,
      state: this.flowInstance.currentState
    });

    // Keep context history manageable
    if (this.contextHistory.length > 20) {
      this.contextHistory.splice(0, 10); // Remove oldest 10 entries
    }
  }

  async saveState() {
    // Save current flow state for potential resumption
    const stateSnapshot = {
      flowId: this.flowInstance.id,
      sessionId: this.flowInstance.sessionId,
      currentState: this.flowInstance.currentState,
      context: this.flowInstance.context,
      transitions: this.flowInstance.transitions,
      contextHistory: this.contextHistory,
      timestamp: new Date()
    };

    // In production, this would be persisted to a database
    this.logger.debug('Flow state saved for potential resumption', {
      flowId: this.flowInstance.id
    });
  }
}

module.exports = ConversationFlowManager;