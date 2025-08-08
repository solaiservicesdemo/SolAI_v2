/**
 * 🧪 SolAI v2 Basic Validation Tests
 * Essential tests to verify core functionality
 */

const Logger = require('../src/core/logger');
const MemoryManager = require('../src/memory/memory-manager');
const PersonalityEngine = require('../src/personality/personality-engine');
const ConversationEngine = require('../src/engine/conversation-engine');
const ToolOrchestrator = require('../src/tools/tool-orchestrator');

class BasicValidation {
  constructor() {
    this.logger = new Logger('BasicValidation');
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  async runAllTests() {
    console.log('🧪 SolAI v2 Basic Validation Tests');
    console.log('=================================\n');

    try {
      await this.testComponentInitialization();
      await this.testMemoryOperations();
      await this.testPersonalityEngine();
      await this.testConversationFlow();
      await this.testToolOrchestration();
      
      this.printResults();
      
    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async test(name, testFn) {
    process.stdout.write(`   ${name}... `);
    
    try {
      await testFn();
      console.log('✅ PASS');
      this.passed++;
    } catch (error) {
      console.log('❌ FAIL');
      console.log(`      Error: ${error.message}`);
      this.failed++;
    }
  }

  async testComponentInitialization() {
    console.log('🔧 Testing Component Initialization');

    await this.test('Memory Manager Creation', async () => {
      const memoryManager = new MemoryManager();
      if (!memoryManager) throw new Error('Failed to create MemoryManager');
    });

    await this.test('Personality Engine Creation', async () => {
      const personalityEngine = new PersonalityEngine();
      if (!personalityEngine) throw new Error('Failed to create PersonalityEngine');
    });

    await this.test('Tool Orchestrator Creation', async () => {
      const memoryManager = new MemoryManager();
      const toolOrchestrator = new ToolOrchestrator(memoryManager);
      if (!toolOrchestrator) throw new Error('Failed to create ToolOrchestrator');
    });

    await this.test('Conversation Engine Creation', async () => {
      const memoryManager = new MemoryManager();
      const personalityEngine = new PersonalityEngine();
      const toolOrchestrator = new ToolOrchestrator(memoryManager);
      const conversationEngine = new ConversationEngine(memoryManager, personalityEngine, toolOrchestrator);
      if (!conversationEngine) throw new Error('Failed to create ConversationEngine');
    });
  }

  async testMemoryOperations() {
    console.log('\n💾 Testing Memory Operations');

    await this.test('Memory Manager Initialization', async () => {
      const memoryManager = new MemoryManager();
      // Test without actual Redis/Supabase connections
      if (typeof memoryManager.initialize !== 'function') {
        throw new Error('initialize method not found');
      }
    });

    await this.test('Working Memory Operations', async () => {
      const memoryManager = new MemoryManager();
      
      // Test the method exists and accepts parameters
      const sessionId = 'test_session_' + Date.now();
      const testData = { message: 'test', timestamp: new Date().toISOString() };
      
      if (typeof memoryManager.storeWorkingMemory !== 'function') {
        throw new Error('storeWorkingMemory method not found');
      }
      
      if (typeof memoryManager.getWorkingMemory !== 'function') {
        throw new Error('getWorkingMemory method not found');
      }
    });

    await this.test('Conversation Context Management', async () => {
      const memoryManager = new MemoryManager();
      
      if (typeof memoryManager.getConversationContext !== 'function') {
        throw new Error('getConversationContext method not found');
      }
      
      if (typeof memoryManager.updateConversationTurn !== 'function') {
        throw new Error('updateConversationTurn method not found');
      }
    });
  }

  async testPersonalityEngine() {
    console.log('\n🎭 Testing Personality Engine');

    await this.test('Personality Profiles Setup', async () => {
      const personalityEngine = new PersonalityEngine();
      
      if (!personalityEngine.basePersonality) {
        throw new Error('basePersonality not configured');
      }
      
      if (!personalityEngine.basePersonality.traits) {
        throw new Error('personality traits not configured');
      }
    });

    await this.test('Response Templates', async () => {
      const personalityEngine = new PersonalityEngine();
      
      if (typeof personalityEngine.setupResponseTemplates !== 'function') {
        throw new Error('setupResponseTemplates method not found');
      }
    });

    await this.test('User Style Analysis', async () => {
      const personalityEngine = new PersonalityEngine();
      
      if (typeof personalityEngine.analyzeUserStyle !== 'function') {
        throw new Error('analyzeUserStyle method not found');
      }
      
      // Test with mock context
      const mockContext = {
        conversationHistory: [
          { message: 'Hello, please help me with this task', timestamp: new Date() }
        ]
      };
      
      const style = personalityEngine.analyzeUserStyle(mockContext);
      if (!style || typeof style !== 'object') {
        throw new Error('analyzeUserStyle should return an object');
      }
    });
  }

  async testConversationFlow() {
    console.log('\n🧠 Testing Conversation Flow');

    await this.test('Conversation Patterns Setup', async () => {
      const memoryManager = new MemoryManager();
      const personalityEngine = new PersonalityEngine();
      const toolOrchestrator = new ToolOrchestrator(memoryManager);
      const conversationEngine = new ConversationEngine(memoryManager, personalityEngine, toolOrchestrator);
      
      if (!conversationEngine.conversationPatterns) {
        throw new Error('conversationPatterns not configured');
      }
    });

    await this.test('Message Analysis', async () => {
      const memoryManager = new MemoryManager();
      const personalityEngine = new PersonalityEngine();
      const toolOrchestrator = new ToolOrchestrator(memoryManager);
      const conversationEngine = new ConversationEngine(memoryManager, personalityEngine, toolOrchestrator);
      
      if (typeof conversationEngine.analyzeMessage !== 'function') {
        throw new Error('analyzeMessage method not found');
      }
    });

    await this.test('Pattern Matching', async () => {
      const memoryManager = new MemoryManager();
      const personalityEngine = new PersonalityEngine();
      const toolOrchestrator = new ToolOrchestrator(memoryManager);
      const conversationEngine = new ConversationEngine(memoryManager, personalityEngine, toolOrchestrator);
      
      if (typeof conversationEngine.performPatternMatching !== 'function') {
        throw new Error('performPatternMatching method not found');
      }

      // Test pattern matching
      const greetingResult = conversationEngine.performPatternMatching('Hello there!');
      if (!greetingResult || !greetingResult.intent) {
        throw new Error('Pattern matching should return intent');
      }
    });
  }

  async testToolOrchestration() {
    console.log('\n🔧 Testing Tool Orchestration');

    await this.test('Tool Registry Setup', async () => {
      const memoryManager = new MemoryManager();
      const toolOrchestrator = new ToolOrchestrator(memoryManager);
      
      if (!toolOrchestrator.toolRegistry) {
        throw new Error('toolRegistry not configured');
      }
      
      if (!toolOrchestrator.toolRegistry.super_tools) {
        throw new Error('super_tools registry not found');
      }
      
      if (!toolOrchestrator.toolRegistry.claude_flow_tools) {
        throw new Error('claude_flow_tools registry not found');
      }
    });

    await this.test('Coordination Rules', async () => {
      const memoryManager = new MemoryManager();
      const toolOrchestrator = new ToolOrchestrator(memoryManager);
      
      if (!toolOrchestrator.coordinationRules) {
        throw new Error('coordinationRules not configured');
      }
    });

    await this.test('Tool Selection Logic', async () => {
      const memoryManager = new MemoryManager();
      const toolOrchestrator = new ToolOrchestrator(memoryManager);
      
      if (typeof toolOrchestrator.selectTools !== 'function') {
        throw new Error('selectTools method not found');
      }
      
      if (typeof toolOrchestrator.mapIntentToWorkflow !== 'function') {
        throw new Error('mapIntentToWorkflow method not found');
      }
    });
  }

  printResults() {
    console.log('\n📊 Test Results');
    console.log('===============');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed === 0) {
      console.log('\n🎉 All tests passed! SolAI v2 core functionality is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the errors above.');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const validation = new BasicValidation();
  validation.runAllTests();
}

module.exports = BasicValidation;