/**
 * 🚀 SolAI v2 Development Startup Script
 * Helps verify configuration and start the system
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Logger = require('../src/core/logger');

class DevStartup {
  constructor() {
    this.logger = new Logger('DevStartup');
    this.errors = [];
    this.warnings = [];
  }

  async run() {
    console.log('🤖 SolAI v2 Enterprise - Development Startup');
    console.log('=====================================\n');

    try {
      await this.checkEnvironment();
      await this.checkDependencies();
      await this.validateConfiguration();
      await this.checkServices();
      
      if (this.errors.length === 0) {
        console.log('✅ All checks passed! Starting SolAI v2...\n');
        this.startApplication();
      } else {
        console.log('❌ Startup failed due to errors:');
        this.errors.forEach(error => console.log(`   - ${error}`));
        console.log('\nPlease fix the above issues and try again.');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Startup script failed:', error.message);
      process.exit(1);
    }
  }

  async checkEnvironment() {
    console.log('🔍 Checking environment...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1));
    
    if (majorVersion < 18) {
      this.errors.push(`Node.js 18+ required, found ${nodeVersion}`);
    } else {
      console.log(`   ✓ Node.js ${nodeVersion}`);
    }

    // Check .env file
    if (!fs.existsSync(path.join(process.cwd(), '.env'))) {
      this.errors.push('.env file not found. Copy .env.example to .env and configure.');
    } else {
      console.log('   ✓ .env file found');
    }
  }

  async checkDependencies() {
    console.log('📦 Checking dependencies...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
      const nodeModules = fs.existsSync(path.join(process.cwd(), 'node_modules'));
      
      if (!nodeModules) {
        this.errors.push('node_modules not found. Run "npm install" first.');
      } else {
        console.log('   ✓ Dependencies installed');
      }
      
    } catch (error) {
      this.errors.push('Cannot read package.json');
    }
  }

  async validateConfiguration() {
    console.log('⚙️ Validating configuration...');
    
    const requiredEnvVars = [
      'OPENROUTER_API_KEY',
      'REDIS_URL',
      'SUPABASE_URL', 
      'SUPABASE_ANON_KEY'
    ];

    const optionalEnvVars = [
      'GMAIL_API_ENDPOINT',
      'TWILIO_API_ENDPOINT', 
      'CLAUDE_FLOW_API_KEY'
    ];

    // Check required variables
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        this.errors.push(`Required environment variable ${envVar} not set`);
      } else {
        console.log(`   ✓ ${envVar} configured`);
      }
    }

    // Check optional variables
    for (const envVar of optionalEnvVars) {
      if (!process.env[envVar]) {
        this.warnings.push(`Optional ${envVar} not configured - some features may be limited`);
      } else {
        console.log(`   ✓ ${envVar} configured`);
      }
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
  }

  async checkServices() {
    console.log('🔧 Checking external services...');
    
    // These are basic connectivity checks - full validation happens during startup
    console.log('   ℹ️  Service connectivity will be verified during startup');
    console.log('   ℹ️  Redis: ' + (process.env.REDIS_URL || 'redis://localhost:6379'));
    console.log('   ℹ️  Supabase: ' + (process.env.SUPABASE_URL || 'not configured'));
  }

  startApplication() {
    console.log('🚀 Starting SolAI v2 Enterprise...\n');
    
    // Start the main application
    require('../src/server');
  }
}

// Run if called directly
if (require.main === module) {
  const startup = new DevStartup();
  startup.run();
}

module.exports = DevStartup;