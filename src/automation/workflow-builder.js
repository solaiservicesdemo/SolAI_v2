/**
 * 🔄 SolAI Workflow Automation Builder
 * Visual workflow creation and execution engine
 */

const Logger = require('../core/logger');
const { v4: uuidv4 } = require('uuid');

class WorkflowBuilder {
  constructor(toolOrchestrator, memoryManager) {
    this.toolOrchestrator = toolOrchestrator;
    this.memoryManager = memoryManager;
    this.logger = new Logger('WorkflowBuilder');
    
    this.workflows = new Map();
    this.executionHistory = new Map();
    
    this.setupWorkflowTemplates();
    this.setupTriggerEngine();
  }

  async initialize() {
    this.logger.info('🔄 Initializing workflow automation builder...');
    
    try {
      await this.loadSavedWorkflows();
      await this.initializeTriggerEngine();
      
      this.logger.info('✅ Workflow builder initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize workflow builder', error);
      throw error;
    }
  }

  setupWorkflowTemplates() {
    // PRE-BUILT TEMPLATES for common real estate workflows
    this.templates = {
      lead_nurturing: {
        name: 'Lead Nurturing Sequence',
        description: 'Automated follow-up sequence for new leads',
        category: 'sales',
        steps: [
          {
            id: 'welcome_email',
            type: 'action',
            tool: 'gmail',
            action: 'send_email',
            parameters: {
              template: 'welcome_new_lead',
              personalizedGreeting: true
            },
            delay: 0
          },
          {
            id: 'wait_3_days',
            type: 'delay',
            duration: '3d'
          },
          {
            id: 'follow_up_call',
            type: 'action',
            tool: 'twilio',
            action: 'schedule_call',
            parameters: {
              purpose: 'lead_qualification',
              preferredTime: 'business_hours'
            }
          },
          {
            id: 'wait_1_week',
            type: 'delay',
            duration: '1w'
          },
          {
            id: 'market_update',
            type: 'action',
            tool: 'market_analyzer',
            action: 'generate_market_report',
            parameters: {
              personalized: true,
              format: 'email_friendly'
            }
          }
        ],
        triggers: [
          {
            type: 'crm_event',
            event: 'new_lead_added',
            conditions: {
              lead_source: ['website', 'referral'],
              status: 'new'
            }
          }
        ]
      },

      client_onboarding: {
        name: 'Client Onboarding Process',
        description: 'Complete onboarding workflow for new clients',
        category: 'client_management',
        steps: [
          {
            id: 'welcome_package',
            type: 'action',
            tool: 'gmail',
            action: 'send_email',
            parameters: {
              template: 'client_welcome_package',
              attachments: ['client_guide.pdf', 'process_overview.pdf']
            }
          },
          {
            id: 'schedule_consultation',
            type: 'action',
            tool: 'calendar',
            action: 'create_meeting',
            parameters: {
              title: 'Initial Client Consultation',
              duration: '60min',
              type: 'discovery_meeting'
            }
          },
          {
            id: 'crm_setup',
            type: 'action',
            tool: 'crm',
            action: 'create_client_profile',
            parameters: {
              status: 'active_client',
              communication_preferences: 'auto_detect'
            }
          },
          {
            id: 'preference_survey',
            type: 'action',
            tool: 'gmail',
            action: 'send_survey',
            parameters: {
              survey_type: 'property_preferences',
              deadline: '1w'
            },
            delay: '1d'
          }
        ],
        triggers: [
          {
            type: 'contract_signed',
            conditions: {
              contract_type: 'buyer_agreement'
            }
          }
        ]
      },

      property_analysis: {
        name: 'Property Analysis Workflow',
        description: 'Comprehensive property evaluation and reporting',
        category: 'analysis',
        steps: [
          {
            id: 'market_analysis',
            type: 'parallel_actions',
            actions: [
              {
                tool: 'market_analyzer',
                action: 'comparative_analysis',
                parameters: { radius: '1mi', similar_properties: 5 }
              },
              {
                tool: 'market_analyzer', 
                action: 'price_history',
                parameters: { years: 2 }
              },
              {
                tool: 'document_processor',
                action: 'extract_property_details',
                parameters: { include_photos: true }
              }
            ]
          },
          {
            id: 'generate_report',
            type: 'action',
            tool: 'document_processor',
            action: 'create_analysis_report',
            parameters: {
              format: 'comprehensive',
              include_recommendations: true,
              client_friendly: true
            }
          },
          {
            id: 'client_notification',
            type: 'action',
            tool: 'gmail',
            action: 'send_email',
            parameters: {
              subject: 'Property Analysis Complete',
              attach_report: true,
              schedule_review_meeting: true
            }
          }
        ],
        triggers: [
          {
            type: 'property_added',
            conditions: {
              client_requested_analysis: true
            }
          }
        ]
      },

      transaction_coordination: {
        name: 'Transaction Coordination',
        description: 'End-to-end transaction management workflow',
        category: 'transactions',
        steps: [
          {
            id: 'contract_review',
            type: 'action',
            tool: 'document_processor',
            action: 'review_contract',
            parameters: {
              check_compliance: true,
              extract_key_dates: true
            }
          },
          {
            id: 'timeline_creation',
            type: 'action',
            tool: 'calendar',
            action: 'create_transaction_timeline',
            parameters: {
              include_milestones: true,
              set_reminders: true
            }
          },
          {
            id: 'stakeholder_notification',
            type: 'parallel_actions',
            actions: [
              {
                tool: 'gmail',
                action: 'notify_lender',
                parameters: { include_timeline: true }
              },
              {
                tool: 'gmail', 
                action: 'notify_title_company',
                parameters: { include_documents: true }
              },
              {
                tool: 'twilio',
                action: 'client_update',
                parameters: { method: 'sms', include_next_steps: true }
              }
            ]
          }
        ],
        triggers: [
          {
            type: 'contract_executed',
            conditions: {
              all_parties_signed: true
            }
          }
        ]
      }
    };
  }

  setupTriggerEngine() {
    this.triggerEngine = {
      active: new Map(),
      handlers: {
        'crm_event': this.handleCRMTrigger.bind(this),
        'time_based': this.handleTimeTrigger.bind(this),
        'conversation': this.handleConversationTrigger.bind(this),
        'property_added': this.handlePropertyTrigger.bind(this),
        'contract_signed': this.handleContractTrigger.bind(this),
        'contract_executed': this.handleContractTrigger.bind(this)
      },
      queue: [],
      processing: false
    };
  }

  async createWorkflow(workflowDefinition, userId) {
    try {
      const workflowId = uuidv4();
      
      const workflow = {
        id: workflowId,
        name: workflowDefinition.name,
        description: workflowDefinition.description,
        category: workflowDefinition.category,
        steps: workflowDefinition.steps,
        triggers: workflowDefinition.triggers,
        createdBy: userId,
        createdAt: new Date(),
        active: true,
        executionCount: 0
      };

      // Validate workflow structure
      const validation = this.validateWorkflow(workflow);
      if (!validation.valid) {
        throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
      }

      // Store workflow
      this.workflows.set(workflowId, workflow);
      
      // Register triggers
      await this.registerWorkflowTriggers(workflow);
      
      this.logger.info('✅ Workflow created successfully', {
        workflowId,
        name: workflow.name,
        stepCount: workflow.steps.length,
        triggerCount: workflow.triggers.length
      });
      
      return { success: true, workflowId, workflow };
      
    } catch (error) {
      this.logger.error('❌ Failed to create workflow', error);
      return { success: false, error: error.message };
    }
  }

  validateWorkflow(workflow) {
    const errors = [];
    
    if (!workflow.name) errors.push('Workflow name is required');
    if (!workflow.steps || workflow.steps.length === 0) errors.push('Workflow must have at least one step');
    if (!workflow.triggers || workflow.triggers.length === 0) errors.push('Workflow must have at least one trigger');
    
    // Validate steps
    workflow.steps.forEach((step, index) => {
      if (!step.type) errors.push(`Step ${index + 1}: type is required`);
      if (step.type === 'action' && !step.tool) errors.push(`Step ${index + 1}: tool is required for action steps`);
      if (step.type === 'delay' && !step.duration) errors.push(`Step ${index + 1}: duration is required for delay steps`);
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async registerWorkflowTriggers(workflow) {
    for (const trigger of workflow.triggers) {
      const triggerId = `${workflow.id}_${trigger.type}`;
      this.triggerEngine.active.set(triggerId, {
        workflowId: workflow.id,
        trigger,
        workflow
      });
      
      this.logger.debug('Trigger registered', { triggerId, type: trigger.type });
    }
  }

  async executeWorkflow(workflowId, triggerData = {}) {
    const executionId = uuidv4();
    const timer = this.logger.startTimer(`workflow-execution-${executionId}`);
    
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      if (!workflow.active) {
        throw new Error(`Workflow ${workflowId} is not active`);
      }

      this.logger.info('🔄 Executing workflow', {
        workflowId,
        executionId,
        name: workflow.name,
        stepCount: workflow.steps.length
      });

      // Initialize execution context
      const executionContext = {
        executionId,
        workflowId,
        startTime: new Date(),
        triggerData,
        variables: {},
        stepResults: new Map(),
        status: 'running'
      };

      // Store execution history
      this.executionHistory.set(executionId, executionContext);

      // Execute workflow steps
      const result = await this.executeWorkflowSteps(workflow.steps, executionContext);

      // Update execution status
      executionContext.status = result.success ? 'completed' : 'failed';
      executionContext.endTime = new Date();
      executionContext.duration = executionContext.endTime - executionContext.startTime;

      // Update workflow statistics
      workflow.executionCount++;
      workflow.lastExecuted = new Date();

      timer.end(`Workflow executed: ${result.success ? 'SUCCESS' : 'FAILED'}`);

      return {
        success: result.success,
        executionId,
        result: result.data,
        stepsExecuted: result.stepsExecuted,
        duration: executionContext.duration
      };

    } catch (error) {
      timer.end('Workflow execution failed');
      this.logger.error('❌ Workflow execution failed', error, { workflowId, executionId });
      
      return {
        success: false,
        executionId,
        error: error.message
      };
    }
  }

  async executeWorkflowSteps(steps, context) {
    const results = [];
    let stepsExecuted = 0;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      try {
        this.logger.debug(`Executing step ${i + 1}/${steps.length}`, {
          stepId: step.id,
          type: step.type,
          executionId: context.executionId
        });

        let stepResult;

        switch (step.type) {
          case 'action':
            stepResult = await this.executeAction(step, context);
            break;
          case 'parallel_actions':
            stepResult = await this.executeParallelActions(step, context);
            break;
          case 'delay':
            stepResult = await this.executeDelay(step, context);
            break;
          case 'condition':
            stepResult = await this.executeCondition(step, context);
            if (!stepResult.proceed) {
              this.logger.info('Workflow stopped due to condition', { stepId: step.id });
              break;
            }
            break;
          default:
            throw new Error(`Unknown step type: ${step.type}`);
        }

        // Store step result
        context.stepResults.set(step.id, stepResult);
        results.push(stepResult);
        stepsExecuted++;

        // Handle step delay
        if (step.delay && step.delay !== 0) {
          await this.executeDelay({ duration: step.delay }, context);
        }

      } catch (error) {
        this.logger.error(`Step execution failed`, error, {
          stepId: step.id,
          stepIndex: i + 1,
          executionId: context.executionId
        });

        return {
          success: false,
          stepsExecuted,
          data: results,
          error: error.message,
          failedStep: step.id
        };
      }
    }

    return {
      success: true,
      stepsExecuted,
      data: results
    };
  }

  async executeAction(step, context) {
    try {
      // Use tool orchestrator to execute the action
      const toolRequest = {
        intent: step.action,
        tool: step.tool,
        parameters: this.resolveParameters(step.parameters, context),
        context: {
          workflowExecution: true,
          executionId: context.executionId,
          stepId: step.id
        }
      };

      const result = await this.toolOrchestrator.coordinateTools(toolRequest);
      
      return {
        success: result.success,
        stepId: step.id,
        tool: step.tool,
        action: step.action,
        result: result.results,
        executionTime: result.executionTime
      };

    } catch (error) {
      this.logger.error('Action execution failed', error);
      throw error;
    }
  }

  async executeParallelActions(step, context) {
    try {
      const promises = step.actions.map(action => this.executeAction({
        id: `${step.id}_${action.tool}_${action.action}`,
        type: 'action',
        tool: action.tool,
        action: action.action,
        parameters: action.parameters
      }, context));

      const results = await Promise.allSettled(promises);
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const totalCount = results.length;

      return {
        success: successCount > 0, // At least one action succeeded
        stepId: step.id,
        type: 'parallel_actions',
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }),
        successRate: (successCount / totalCount) * 100
      };

    } catch (error) {
      this.logger.error('Parallel actions execution failed', error);
      throw error;
    }
  }

  async executeDelay(step, context) {
    const duration = this.parseDuration(step.duration);
    
    this.logger.debug('Executing delay', { 
      duration: step.duration, 
      milliseconds: duration,
      stepId: step.id 
    });

    // In a real implementation, you might use a job queue for long delays
    if (duration < 60000) { // Less than 1 minute - execute immediately
      await new Promise(resolve => setTimeout(resolve, duration));
    } else {
      // For longer delays, schedule the continuation
      this.logger.info('Long delay scheduled', { duration: step.duration });
      // TODO: Implement job scheduling for long delays
    }

    return {
      success: true,
      stepId: step.id,
      type: 'delay',
      duration: step.duration
    };
  }

  async executeCondition(step, context) {
    // Evaluate condition logic
    const conditionMet = this.evaluateCondition(step.condition, context);
    
    return {
      success: true,
      stepId: step.id,
      type: 'condition',
      conditionMet,
      proceed: conditionMet
    };
  }

  resolveParameters(parameters, context) {
    // Replace variables in parameters with context values
    if (typeof parameters === 'string') {
      return parameters.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
        return context.variables[variable] || context.triggerData[variable] || match;
      });
    }
    
    if (typeof parameters === 'object' && parameters !== null) {
      const resolved = {};
      for (const [key, value] of Object.entries(parameters)) {
        resolved[key] = this.resolveParameters(value, context);
      }
      return resolved;
    }
    
    return parameters;
  }

  parseDuration(duration) {
    // Convert duration strings to milliseconds
    const units = {
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000,
      'w': 604800000
    };

    const match = duration.match(/^(\d+)([smhdw])$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  evaluateCondition(condition, context) {
    // Simple condition evaluation
    // In a real implementation, this would be more sophisticated
    return true; // Placeholder
  }

  // Trigger handlers
  async handleCRMTrigger(triggerData) {
    this.logger.debug('Handling CRM trigger', triggerData);
    // Process CRM events and trigger appropriate workflows
  }

  async handleTimeTrigger(triggerData) {
    this.logger.debug('Handling time trigger', triggerData);
    // Process time-based triggers
  }

  async handleConversationTrigger(triggerData) {
    this.logger.debug('Handling conversation trigger', triggerData);
    // Process conversation-based triggers
  }

  async handlePropertyTrigger(triggerData) {
    this.logger.debug('Handling property trigger', triggerData);
    // Process property-related triggers
  }

  async handleContractTrigger(triggerData) {
    this.logger.debug('Handling contract trigger', triggerData);
    // Process contract-related triggers
  }

  async loadSavedWorkflows() {
    // Load workflows from storage
    this.logger.debug('Loading saved workflows');
    // TODO: Implement persistence layer
  }

  async initializeTriggerEngine() {
    this.logger.debug('Initializing trigger engine');
    this.triggerEngine.processing = true;
  }

  // Public API methods
  async getWorkflowTemplates() {
    return Object.values(this.templates);
  }

  async getActiveWorkflows() {
    return Array.from(this.workflows.values()).filter(w => w.active);
  }

  async getExecutionHistory(limit = 50) {
    return Array.from(this.executionHistory.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  async getWorkflowStatus(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return { error: 'Workflow not found' };
    }

    return {
      id: workflow.id,
      name: workflow.name,
      active: workflow.active,
      executionCount: workflow.executionCount,
      lastExecuted: workflow.lastExecuted,
      triggers: workflow.triggers.length
    };
  }
}

module.exports = WorkflowBuilder;