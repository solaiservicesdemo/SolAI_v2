/**
 * 🔌 MCP Tool Adapter - Real Model Context Protocol Integration
 * BMAD Architecture: Proper MCP server communication with actual tool execution
 */

const BaseToolAdapter = require('./BaseToolAdapter');
const axios = require('axios');
const WebSocket = require('ws');

class MCPToolAdapter extends BaseToolAdapter {
  constructor(toolConfig, auditTrail, mcpConfig) {
    super(toolConfig, auditTrail);
    this.mcpConfig = mcpConfig;
    this.mcpClient = null;
    this.wsConnection = null;
    this.connectionRetries = 0;
    this.maxConnectionRetries = 5;
    this.supportedMethods = new Set();
    this.serverCapabilities = null;
  }

  async establishConnection() {
    this.logger.info(`Connecting to MCP server: ${this.mcpConfig.endpoint}`);
    
    try {
      // First try HTTP connection for initial handshake
      await this.connectHTTP();
      
      // Then establish WebSocket for real-time communication
      await this.connectWebSocket();
      
      // Discover server capabilities
      await this.discoverCapabilities();
      
      this.logger.info('MCP connection established successfully');
      
    } catch (error) {
      this.connectionRetries++;
      
      if (this.connectionRetries < this.maxConnectionRetries) {
        this.logger.warn(`MCP connection failed, retrying... (${this.connectionRetries}/${this.maxConnectionRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000 * this.connectionRetries));
        return this.establishConnection();
      }
      
      throw new Error(`Failed to connect to MCP server after ${this.maxConnectionRetries} attempts: ${error.message}`);
    }
  }

  async connectHTTP() {
    const healthEndpoint = `${this.mcpConfig.endpoint}/health`;
    
    try {
      const response = await axios.get(healthEndpoint, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${this.mcpConfig.apiKey}`,
          'User-Agent': 'SolAI-v2-Enterprise'
        }
      });

      if (response.status !== 200) {
        throw new Error(`MCP server health check failed: ${response.status}`);
      }

      this.logger.debug('MCP HTTP connection verified');
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('MCP server is not running or not accessible');
      }
      throw error;
    }
  }

  async connectWebSocket() {
    const wsEndpoint = this.mcpConfig.endpoint.replace('http', 'ws') + '/ws';
    
    return new Promise((resolve, reject) => {
      try {
        this.wsConnection = new WebSocket(wsEndpoint, {
          headers: {
            'Authorization': `Bearer ${this.mcpConfig.apiKey}`
          }
        });

        this.wsConnection.on('open', () => {
          this.logger.debug('MCP WebSocket connection established');
          this.setupWebSocketHandlers();
          resolve();
        });

        this.wsConnection.on('error', (error) => {
          this.logger.error('MCP WebSocket connection error', error);
          reject(error);
        });

        this.wsConnection.on('close', () => {
          this.logger.warn('MCP WebSocket connection closed');
          this.handleConnectionLoss();
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  setupWebSocketHandlers() {
    this.wsConnection.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleWebSocketMessage(message);
      } catch (error) {
        this.logger.error('Failed to parse WebSocket message', error);
      }
    });

    this.wsConnection.on('pong', () => {
      this.logger.debug('MCP server pong received');
    });

    // Send periodic pings to keep connection alive
    setInterval(() => {
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        this.wsConnection.ping();
      }
    }, 30000);
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'tool_result':
        this.handleToolResult(message);
        break;
      case 'tool_error':
        this.handleToolError(message);
        break;
      case 'server_notification':
        this.handleServerNotification(message);
        break;
      default:
        this.logger.debug('Unknown WebSocket message type', message.type);
    }
  }

  async discoverCapabilities() {
    try {
      const response = await this.sendMCPRequest('list_tools', {});
      
      if (response.tools) {
        this.serverCapabilities = response;
        this.supportedMethods = new Set(response.tools.map(tool => tool.name));
        
        this.logger.info('MCP server capabilities discovered', {
          toolCount: response.tools.length,
          tools: Array.from(this.supportedMethods)
        });
      }
      
    } catch (error) {
      this.logger.error('Failed to discover MCP server capabilities', error);
      throw error;
    }
  }

  async performHealthCheck() {
    try {
      const startTime = Date.now();
      
      // Test basic MCP communication
      const response = await this.sendMCPRequest('ping', {});
      
      const latency = Date.now() - startTime;
      
      return {
        healthy: response.status === 'ok',
        latency,
        serverInfo: response.serverInfo,
        toolsAvailable: this.supportedMethods.size
      };
      
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        latency: -1
      };
    }
  }

  async validateParameters(action, parameters) {
    await super.validateParameters(action, parameters);
    
    // Check if the tool method is available on the MCP server
    if (!this.supportedMethods.has(action)) {
      throw new Error(`MCP tool method '${action}' is not supported by the connected server`);
    }

    // Validate parameters against MCP tool schema if available
    const toolSchema = this.getToolSchema(action);
    if (toolSchema) {
      await this.validateAgainstSchema(parameters, toolSchema);
    }
  }

  getToolSchema(action) {
    if (!this.serverCapabilities?.tools) {
      return null;
    }
    
    const tool = this.serverCapabilities.tools.find(t => t.name === action);
    return tool?.inputSchema;
  }

  async validateAgainstSchema(parameters, schema) {
    // Basic schema validation - in production, use a proper JSON schema validator
    if (schema.required) {
      const missingRequired = schema.required.filter(field => !(field in parameters));
      if (missingRequired.length > 0) {
        throw new Error(`Missing required parameters: ${missingRequired.join(', ')}`);
      }
    }

    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in parameters) {
          await this.validateFieldType(parameters[field], fieldSchema, field);
        }
      }
    }
  }

  async validateFieldType(value, schema, fieldName) {
    if (schema.type === 'string' && typeof value !== 'string') {
      throw new Error(`Parameter '${fieldName}' must be a string`);
    }
    
    if (schema.type === 'number' && typeof value !== 'number') {
      throw new Error(`Parameter '${fieldName}' must be a number`);
    }
    
    if (schema.type === 'array' && !Array.isArray(value)) {
      throw new Error(`Parameter '${fieldName}' must be an array`);
    }
  }

  async executeAction(action, parameters, context, executionId) {
    this.logger.debug(`Executing MCP tool action: ${action}`, { executionId, parameters });
    
    try {
      // Prepare MCP request
      const mcpRequest = {
        method: 'call_tool',
        params: {
          name: action,
          arguments: parameters
        },
        id: executionId
      };

      // Send request to MCP server
      const result = await this.sendMCPRequest('call_tool', mcpRequest.params, executionId);

      // Process and validate result
      return this.processToolResult(result, action, executionId);
      
    } catch (error) {
      this.logger.error(`MCP tool execution failed: ${action}`, {
        executionId,
        error: error.message,
        parameters
      });
      throw error;
    }
  }

  async sendMCPRequest(method, params, requestId = null) {
    const id = requestId || `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request = {
      jsonrpc: '2.0',
      method,
      params,
      id
    };

    try {
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        // Use WebSocket for real-time communication
        return await this.sendWebSocketRequest(request);
      } else {
        // Fall back to HTTP
        return await this.sendHTTPRequest(request);
      }
      
    } catch (error) {
      this.logger.error('MCP request failed', { method, error: error.message });
      throw error;
    }
  }

  async sendWebSocketRequest(request) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MCP WebSocket request timeout'));
      }, 30000);

      const messageHandler = (data) => {
        try {
          const response = JSON.parse(data.toString());
          
          if (response.id === request.id) {
            clearTimeout(timeout);
            this.wsConnection.removeListener('message', messageHandler);
            
            if (response.error) {
              reject(new Error(`MCP Error: ${response.error.message}`));
            } else {
              resolve(response.result);
            }
          }
        } catch (error) {
          reject(error);
        }
      };

      this.wsConnection.on('message', messageHandler);
      this.wsConnection.send(JSON.stringify(request));
    });
  }

  async sendHTTPRequest(request) {
    const response = await axios.post(this.mcpConfig.endpoint + '/rpc', request, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.mcpConfig.apiKey}`
      }
    });

    if (response.data.error) {
      throw new Error(`MCP Error: ${response.data.error.message}`);
    }

    return response.data.result;
  }

  processToolResult(result, action, executionId) {
    // Validate result structure
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid MCP tool result format');
    }

    // Log successful execution
    this.logger.debug(`MCP tool executed successfully: ${action}`, {
      executionId,
      resultType: typeof result,
      hasContent: !!result.content
    });

    return {
      content: result.content || result,
      isText: result.isText || typeof result.content === 'string',
      metadata: {
        tool: action,
        mcpServer: this.mcpConfig.endpoint,
        executionTime: result.executionTime,
        serverVersion: this.serverCapabilities?.serverInfo?.version
      }
    };
  }

  handleToolResult(message) {
    this.logger.debug('MCP tool result received', message.id);
    // Tool results are handled in sendWebSocketRequest promise resolution
  }

  handleToolError(message) {
    this.logger.error('MCP tool error received', message);
    // Tool errors are handled in sendWebSocketRequest promise rejection
  }

  handleServerNotification(message) {
    this.logger.info('MCP server notification', message);
    
    if (message.notification === 'capabilities_changed') {
      this.discoverCapabilities().catch(error => {
        this.logger.error('Failed to rediscover capabilities after server notification', error);
      });
    }
  }

  handleConnectionLoss() {
    this.logger.warn('MCP connection lost, attempting to reconnect...');
    this.initialized = false;
    
    // Attempt to reconnect
    setTimeout(() => {
      this.establishConnection().catch(error => {
        this.logger.error('Failed to reconnect to MCP server', error);
      });
    }, 5000);
  }

  async cleanup() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    
    this.logger.info('MCP tool adapter cleanup completed');
  }

  getConnectionStatus() {
    return {
      connected: this.initialized,
      httpHealthy: true, // Would check actual HTTP endpoint
      wsConnected: this.wsConnection?.readyState === WebSocket.OPEN,
      serverCapabilities: !!this.serverCapabilities,
      supportedTools: Array.from(this.supportedMethods),
      connectionRetries: this.connectionRetries
    };
  }
}

module.exports = MCPToolAdapter;