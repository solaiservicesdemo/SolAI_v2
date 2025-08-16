/**
 * 🔌 MCP Client - Direct Communication with Claude Flow MCP Server
 * Simple HTTP client following Claude Flow MCP standards
 */

const Logger = require('../core/logger');

class MCPClient {
  constructor(mcpEndpoint = 'http://localhost:3002') {
    this.mcpEndpoint = mcpEndpoint;
    this.logger = new Logger('MCPClient');
    this.toolPrefix = 'mcp__claude-flow__';
  }

  /**
   * Execute MCP tool following Claude Flow standards
   * @param {string} toolName - Tool name (without mcp prefix)
   * @param {Object} parameters - Tool parameters
   * @returns {Promise<Object>} Tool execution result
   */
  async executeTool(toolName, parameters = {}) {
    const fullToolName = this.toolPrefix + toolName;
    
    this.logger.debug(`🔧 Executing MCP tool: ${fullToolName}`, { parameters });
    
    try {
      // Claude Flow MCP server expects simple executeTool calls
      const response = await fetch(`${this.mcpEndpoint}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'executeTool',
          params: {
            name: fullToolName,
            arguments: parameters
          }
        })
      });

      if (!response.ok) {
        throw new Error(`MCP server responded with ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      this.logger.info(`✅ MCP tool executed successfully: ${fullToolName}`, {
        success: result.success || true,
        resultType: typeof result
      });
      
      return {
        success: true,
        tool: fullToolName,
        result: result,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error(`❌ MCP tool execution failed: ${fullToolName}`, error);
      
      return {
        success: false,
        tool: fullToolName,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test MCP server connectivity
   */
  async testConnection() {
    try {
      // Test with simple swarm_init tool
      const result = await this.executeTool('swarm_init', {
        topology: 'test',
        maxAgents: 1
      });
      
      return result.success;
    } catch (error) {
      this.logger.error('❌ MCP connection test failed', error);
      return false;
    }
  }

  /**
   * Execute email tool (real estate automation)
   */
  async sendEmail(to, subject, body) {
    return await this.executeTool('email_processor', {
      action: 'send_email',
      to,
      subject,
      body
    });
  }

  /**
   * Execute task management tool
   */
  async createTask(title, description, priority = 'medium') {
    return await this.executeTool('task_manager', {
      action: 'create_task',
      title,
      description,
      priority
    });
  }

  /**
   * Execute neural analyzer tool
   */
  async analyzeContent(content, analysisType = 'general') {
    return await this.executeTool('neural_analyzer', {
      action: 'analyze_content',
      content,
      analysis_type: analysisType
    });
  }
}

module.exports = MCPClient;