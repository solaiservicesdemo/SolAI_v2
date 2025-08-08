/**
 * 🤖 SolAI v2 Enterprise Server
 * Professional Conversational Intelligence for Real Estate
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const Logger = require('./core/logger');
const ConversationEngine = require('./engine/conversation-engine');
const MemoryManager = require('./memory/memory-manager');
const PersonalityEngine = require('./personality/personality-engine');
const ToolOrchestrator = require('./tools/tool-orchestrator');
const HealthMonitor = require('./monitoring/health-monitor');

class SolAIServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.logger = new Logger('SolAI-Server');
    
    this.setupMiddleware();
    this.initializeComponents();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }));
    
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://solai-airwrecka-demo.ngrok.app'] 
        : true,
      credentials: true
    }));
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  async initializeComponents() {
    try {
      this.logger.info('🚀 Initializing SolAI v2 Enterprise...');
      
      // Initialize core systems
      this.memoryManager = new MemoryManager();
      await this.memoryManager.initialize();
      
      this.personalityEngine = new PersonalityEngine();
      await this.personalityEngine.initialize();
      
      this.toolOrchestrator = new ToolOrchestrator(this.memoryManager);
      await this.toolOrchestrator.initialize();
      
      this.conversationEngine = new ConversationEngine(
        this.memoryManager,
        this.personalityEngine,
        this.toolOrchestrator
      );
      await this.conversationEngine.initialize();
      
      this.healthMonitor = new HealthMonitor({
        memoryManager: this.memoryManager,
        conversationEngine: this.conversationEngine,
        toolOrchestrator: this.toolOrchestrator
      });
      
      this.logger.info('✅ All systems initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize components', error);
      throw error;
    }
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        system: 'SolAI Enterprise'
      });
    });

    // Main conversation endpoint
    this.app.post('/api/conversation', async (req, res) => {
      try {
        const startTime = Date.now();
        const { message, sessionId, context = {} } = req.body;

        if (!message) {
          return res.status(400).json({
            success: false,
            error: 'Message is required'
          });
        }

        this.logger.info('💬 Processing conversation', { 
          sessionId: sessionId?.substring(0, 8) + '...',
          messageLength: message.length 
        });

        const response = await this.conversationEngine.processMessage({
          message,
          sessionId: sessionId || `session_${Date.now()}`,
          context,
          timestamp: new Date().toISOString()
        });

        const responseTime = Date.now() - startTime;
        
        this.logger.info('✅ Conversation processed', {
          responseTime: `${responseTime}ms`,
          success: response.success,
          toolsUsed: response.toolsUsed?.length || 0
        });

        res.json({
          ...response,
          responseTime,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        this.logger.error('❌ Conversation processing failed', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'SolAI encountered an issue processing your request'
        });
      }
    });

    // Memory management endpoints
    this.app.get('/api/memory/:sessionId', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const context = await this.memoryManager.getConversationContext(sessionId);
        
        res.json({
          success: true,
          context: context || null
        });
      } catch (error) {
        this.logger.error('❌ Memory retrieval failed', error);
        res.status(500).json({ success: false, error: 'Memory retrieval failed' });
      }
    });

    // Personality customization endpoint
    this.app.post('/api/personality/configure', async (req, res) => {
      try {
        const { sessionId, personalityConfig } = req.body;
        await this.personalityEngine.configurePersonality(sessionId, personalityConfig);
        
        res.json({
          success: true,
          message: 'Personality configuration updated'
        });
      } catch (error) {
        this.logger.error('❌ Personality configuration failed', error);
        res.status(500).json({ success: false, error: 'Personality configuration failed' });
      }
    });

    // System metrics endpoint
    this.app.get('/api/metrics', async (req, res) => {
      try {
        const metrics = await this.healthMonitor.getSystemMetrics();
        res.json({
          success: true,
          metrics,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        this.logger.error('❌ Metrics retrieval failed', error);
        res.status(500).json({ success: false, error: 'Metrics retrieval failed' });
      }
    });

    // Serve the dashboard
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // Catch-all for client-side routing
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      this.logger.error('🚨 Unhandled error', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'SolAI encountered an unexpected error'
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `${req.method} ${req.path} is not available`
      });
    });
  }

  async start() {
    try {
      const server = this.app.listen(this.port, () => {
        this.logger.info(`🚀 SolAI v2 Enterprise running on http://localhost:${this.port}`);
        this.logger.info('💡 Ready for intelligent conversations!');
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        this.logger.info('🛑 Shutting down gracefully...');
        server.close(() => {
          this.logger.info('✅ Server closed');
          process.exit(0);
        });
      });

    } catch (error) {
      this.logger.error('❌ Failed to start server', error);
      process.exit(1);
    }
  }
}

// Start the server
const solai = new SolAIServer();
solai.start().catch(error => {
  console.error('Fatal error starting SolAI:', error);
  process.exit(1);
});

module.exports = SolAIServer;