/**
 * 🤖 SolAI v2 Minimal Server - Just to get something working
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    components: {
      server: 'running',
      memory: 'in-memory',
      tools: 'basic-mode'
    }
  });
});

// Basic conversation endpoint (mock for now)
app.post('/api/conversation', (req, res) => {
  const { message } = req.body;
  
  res.json({
    success: true,
    content: `I received your message: "${message}". The system is running in basic mode. Full enterprise features are being configured.`,
    sessionId: req.body.sessionId,
    toolsUsed: [],
    confidence: 1.0
  });
});

// Start server
app.listen(port, () => {
  console.log('🚀 SolAI v2 Minimal Server Started');
  console.log(`📊 Dashboard: http://localhost:${port}`);
  console.log(`🩺 Health: http://localhost:${port}/api/health`);
  console.log('');
  console.log('✅ Ready for basic testing');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  process.exit(0);
});