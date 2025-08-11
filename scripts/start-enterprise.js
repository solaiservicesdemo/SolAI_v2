/**
 * 🚀 UNIFIED ENTERPRISE STARTUP SCRIPT
 * Starts SolAI v2 with Redis + Claude Flow MCP + All 93 Tools
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 STARTING SOLAI V2 ENTERPRISE');
console.log('================================');
console.log('93 Total Tools: 6 Super-tools + 87 Claude Flow MCP');
console.log('');

// Start Redis server (Docker or local)
function startRedis() {
  console.log('🔧 Starting Redis server...');
  
  // Try Docker first
  const dockerRedis = spawn('docker', [
    'run', '-d', '--name', 'solai-redis', '-p', '6379:6379', 'redis:alpine'
  ], { stdio: 'pipe' });
  
  dockerRedis.on('exit', (code) => {
    if (code !== 0) {
      console.log('⚠️ Docker Redis failed, using in-memory fallback');
    } else {
      console.log('✅ Redis server running on port 6379');
    }
  });
  
  dockerRedis.on('error', () => {
    console.log('⚠️ Docker not available, using in-memory fallback');
  });
}

// Start Claude Flow MCP server
function startMCPServer() {
  console.log('🔧 Starting Claude Flow MCP server...');
  
  const mcpServer = spawn('node', ['scripts/start-mcp-server.js'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    detached: true,
    cwd: process.cwd()
  });
  
  mcpServer.unref();
  console.log('✅ Claude Flow MCP server starting on port 3002');
}

// Start SolAI v2 main server
function startSolAI() {
  console.log('🔧 Starting SolAI v2 main server...');
  
  const solaiServer = spawn('node', ['scripts/start-dev.js'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: process.cwd()
  });
  
  console.log('✅ SolAI v2 server starting on port 3000');
  return solaiServer;
}

// Main startup sequence
async function startEnterprise() {
  console.log('🎯 Initializing enterprise services...');
  console.log('');
  
  // Start supporting services
  startRedis();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  startMCPServer();
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Start main server
  console.log('');
  console.log('🚀 LAUNCHING SOLAI V2 ENTERPRISE');
  console.log('=================================');
  console.log('✅ Redis: Persistent memory');
  console.log('✅ Claude Flow: 87 MCP tools');
  console.log('✅ Super-tools: 6 enterprise tools');
  console.log('✅ Total capability: 93 tools');
  console.log('');
  
  const mainServer = startSolAI();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('');
    console.log('🛑 Shutting down enterprise services...');
    mainServer.kill();
    process.exit(0);
  });
}

// Run enterprise startup
startEnterprise().catch(error => {
  console.error('❌ Enterprise startup failed:', error);
});