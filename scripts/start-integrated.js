/**
 * 🚀 SolAI v2 Enterprise Integrated Startup
 * Starts main server with embedded Claude Flow MCP server
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting SolAI v2 Enterprise with Integrated Claude Flow MCP');
console.log('================================================================');

// Start Claude Flow MCP server in background
const mcpServerPath = path.join(__dirname, '..', 'node_modules', 'claude-flow', 'src', 'mcp', 'mcp-server.js');

if (!fs.existsSync(mcpServerPath)) {
  console.log('❌ Claude Flow MCP server not found, starting without MCP tools');
  startMainServer();
  return;
}

console.log('🔧 Starting embedded Claude Flow MCP server...');

const mcpServer = spawn('node', [mcpServerPath], {
  stdio: 'pipe',
  env: {
    ...process.env,
    PORT: '3002',
    NODE_ENV: 'development',
    MCP_API_KEY: 'solai_v2_enterprise_key_2025'
  },
  detached: true
});

mcpServer.stdout.on('data', (data) => {
  console.log(`MCP: ${data.toString().trim()}`);
});

mcpServer.stderr.on('data', (data) => {
  console.log(`MCP Error: ${data.toString().trim()}`);
});

// Give MCP server time to start, then start main server
setTimeout(() => {
  console.log('🤖 Starting SolAI v2 main server...');
  startMainServer();
}, 2000);

function startMainServer() {
  const mainServer = spawn('node', [path.join(__dirname, '..', 'src', 'server.js')], {
    stdio: 'inherit',
    env: {
      ...process.env,
      CLAUDE_FLOW_ENDPOINT: 'http://localhost:3002/mcp',
      CLAUDE_FLOW_API_KEY: 'solai_v2_enterprise_key_2025'
    }
  });

  mainServer.on('exit', (code) => {
    console.log('🛑 Main server exited, shutting down MCP server...');
    if (mcpServer && !mcpServer.killed) {
      mcpServer.kill();
    }
    process.exit(code);
  });
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('🛑 Shutting down SolAI v2 Enterprise...');
  if (mcpServer && !mcpServer.killed) {
    mcpServer.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down SolAI v2 Enterprise...');
  if (mcpServer && !mcpServer.killed) {
    mcpServer.kill();
  }
  process.exit(0);
});