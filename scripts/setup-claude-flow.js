/**
 * 🔧 Claude Flow MCP Tools Setup Script
 * Configures 87 additional MCP tools for SolAI v2
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 SolAI v2 Claude Flow Setup');
console.log('============================');

// Check if Claude Flow is available
function checkClaudeFlowAvailability() {
  console.log('🔍 Checking Claude Flow availability...');
  
  const claudeFlowPaths = [
    path.join(process.cwd(), 'node_modules', 'claude-flow'),
    path.join(process.cwd(), '..', 'claude-flow'),
    path.join(process.cwd(), '..', 'AirWrecka_2025_Rebuild', 'claude-flow')
  ];
  
  for (const checkPath of claudeFlowPaths) {
    if (fs.existsSync(checkPath)) {
      console.log('✅ Claude Flow found at:', checkPath);
      
      // Check if it has MCP server capability
      const mcpServerPath = path.join(checkPath, 'src', 'mcp-server.js');
      const packageJsonPath = path.join(checkPath, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        console.log('📦 Claude Flow version:', packageJson.version);
      }
      
      if (fs.existsSync(mcpServerPath)) {
        console.log('✅ MCP server found');
        return { path: checkPath, mcpServer: mcpServerPath };
      } else {
        console.log('⚠️ MCP server not found in Claude Flow');
      }
      
      return { path: checkPath, mcpServer: null };
    }
  }
  
  console.log('❌ Claude Flow not found in expected locations');
  return null;
}

// Start Claude Flow MCP server
function startClaudeFlowMCPServer(claudeFlowInfo) {
  if (!claudeFlowInfo.mcpServer) {
    console.log('⚠️ Cannot start MCP server - not found');
    return null;
  }
  
  try {
    console.log('🔄 Starting Claude Flow MCP server...');
    
    const mcpServer = spawn('node', [claudeFlowInfo.mcpServer], {
      cwd: claudeFlowInfo.path,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: '3002',
        NODE_ENV: 'development'
      }
    });
    
    mcpServer.stdout.on('data', (data) => {
      console.log('📡 MCP Server:', data.toString().trim());
    });
    
    mcpServer.stderr.on('data', (data) => {
      console.log('⚠️ MCP Server Error:', data.toString().trim());
    });
    
    mcpServer.on('error', (error) => {
      console.log('❌ Failed to start MCP server:', error.message);
    });
    
    console.log('✅ Claude Flow MCP server starting on port 3002');
    return mcpServer;
  } catch (error) {
    console.log('❌ Error starting MCP server:', error.message);
    return null;
  }
}

// Test MCP server connection
async function testMCPConnection() {
  try {
    console.log('🔍 Testing MCP server connection...');
    
    const http = require('http');
    
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3002,
        path: '/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ MCP server is responding');
          resolve(true);
        } else {
          console.log('⚠️ MCP server returned status:', res.statusCode);
          resolve(false);
        }
      });
      
      req.on('error', (error) => {
        console.log('❌ MCP server connection failed:', error.message);
        resolve(false);
      });
      
      req.on('timeout', () => {
        console.log('⏰ MCP server connection timeout');
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  } catch (error) {
    console.log('❌ Error testing MCP connection:', error.message);
    return false;
  }
}

// Update environment configuration
function updateEnvironmentConfig() {
  console.log('🔧 Updating environment configuration...');
  
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  // Read existing .env or create new
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Add Claude Flow configuration if not present
  const claudeFlowConfig = `
# ================= CLAUDE FLOW INTEGRATION =================
CLAUDE_FLOW_ENDPOINT=http://localhost:3002/mcp
CLAUDE_FLOW_API_KEY=dev_api_key_${Date.now()}
CLAUDE_FLOW_HIVE=true
`;
  
  if (!envContent.includes('CLAUDE_FLOW_ENDPOINT')) {
    envContent += claudeFlowConfig;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment configuration updated');
  } else {
    console.log('✅ Claude Flow config already present in .env');
  }
}

// Create MCP server configuration
function createMCPServerConfig() {
  const configPath = path.join(process.cwd(), 'claude-flow-config.json');
  
  const mcpConfig = {
    server: {
      port: 3002,
      host: 'localhost'
    },
    tools: {
      enabled: true,
      categories: [
        'file-operations',
        'web-scraping', 
        'data-processing',
        'api-calls',
        'text-processing',
        'image-processing',
        'workflow-automation'
      ]
    },
    security: {
      apiKey: `dev_api_key_${Date.now()}`,
      rateLimiting: true,
      maxRequestsPerMinute: 100
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(mcpConfig, null, 2));
  console.log('📁 MCP server config created: claude-flow-config.json');
  return configPath;
}

// Main setup function
async function setupClaudeFlow() {
  const claudeFlowInfo = checkClaudeFlowAvailability();
  
  if (!claudeFlowInfo) {
    console.log('');
    console.log('❌ Claude Flow not found. Please ensure it\'s installed:');
    console.log('npm install claude-flow');
    console.log('Or check if it\'s in a parent directory');
    return false;
  }
  
  // Create configuration files
  createMCPServerConfig();
  updateEnvironmentConfig();
  
  // Try to start MCP server if available
  if (claudeFlowInfo.mcpServer) {
    const mcpServer = startClaudeFlowMCPServer(claudeFlowInfo);
    
    if (mcpServer) {
      // Wait a moment for server to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test connection
      const isConnected = await testMCPConnection();
      
      if (isConnected) {
        console.log('');
        console.log('🎉 Claude Flow MCP server is ready!');
        console.log('📊 87 additional tools now available to SolAI v2');
        return true;
      }
    }
  }
  
  console.log('');
  console.log('⚠️ MCP server setup incomplete');
  console.log('📋 Manual steps may be required:');
  console.log('1. Navigate to Claude Flow directory');
  console.log('2. Start MCP server manually');
  console.log('3. Ensure it runs on port 3002');
  
  return false;
}

// Run the setup
setupClaudeFlow().then(success => {
  if (success) {
    console.log('');
    console.log('✅ Claude Flow setup complete!');
    console.log('🔧 SolAI v2 now has access to 87 additional MCP tools');
    console.log('📡 MCP server running on http://localhost:3002');
  } else {
    console.log('');
    console.log('⚠️ Claude Flow setup needs manual configuration');
  }
}).catch(error => {
  console.error('❌ Setup failed:', error);
});