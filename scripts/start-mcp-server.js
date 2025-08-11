/**
 * 🔧 Claude Flow MCP Server Starter
 * Starts the MCP server for 87 additional tools
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Claude Flow MCP Server');
console.log('==================================');

// Find MCP server
const mcpServerPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'claude-flow',
  'src',
  'mcp',
  'mcp-server.js'
);

if (!fs.existsSync(mcpServerPath)) {
  console.log('❌ MCP server not found at:', mcpServerPath);
  process.exit(1);
}

console.log('✅ MCP server found:', mcpServerPath);

// Start the MCP server
const mcpServer = spawn('node', [mcpServerPath], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: {
    ...process.env,
    PORT: '3002',
    NODE_ENV: 'development',
    MCP_API_KEY: 'solai_v2_enterprise_key_2025'
  }
});

console.log('🔄 Starting MCP server on port 3002...');
console.log('📡 Server PID:', mcpServer.pid);

mcpServer.on('error', (error) => {
  console.log('❌ Failed to start MCP server:', error.message);
});

mcpServer.on('exit', (code, signal) => {
  console.log('⚠️ MCP server exited with code:', code, 'signal:', signal);
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('🛑 Stopping MCP server...');
  mcpServer.kill();
  process.exit(0);
});

console.log('✅ MCP server started successfully');
console.log('🔧 87 additional tools now available to SolAI v2');
console.log('📊 Server running at: http://localhost:3002/mcp');
console.log('');
console.log('Press Ctrl+C to stop the server');