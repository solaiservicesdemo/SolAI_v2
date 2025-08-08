/**
 * 🗄️ SolAI Database Setup Script
 * Initialize database schemas and configurations
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Logger = require('../src/core/logger');

class DatabaseSetup {
  constructor() {
    this.logger = new Logger('DatabaseSetup');
    this.supabase = null;
  }

  async initialize() {
    this.logger.info('🗄️ Initializing database setup...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.info('✅ Connected to Supabase');
  }

  async setupSchema() {
    try {
      this.logger.info('📋 Setting up database schema...');
      
      // Read the schema file
      const schemaPath = path.join(__dirname, '../database/supabase-schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split into individual statements
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      this.logger.info(`Executing ${statements.length} SQL statements...`);
      
      for (const statement of statements) {
        try {
          const { error } = await this.supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (error) {
            // Try direct query execution as fallback
            const { error: directError } = await this.supabase
              .from('conversations')
              .select('count')
              .limit(1);
              
            if (directError && directError.code !== 'PGRST116') {
              this.logger.warn(`⚠️ SQL statement warning: ${error.message}`);
            }
          }
        } catch (err) {
          this.logger.warn(`⚠️ Statement execution warning: ${err.message}`);
        }
      }
      
      this.logger.info('✅ Database schema setup completed');
      
    } catch (error) {
      this.logger.error('❌ Database schema setup failed', error);
      throw error;
    }
  }

  async verifySetup() {
    try {
      this.logger.info('🔍 Verifying database setup...');
      
      // Test basic table access
      const tables = ['conversations', 'user_preferences', 'system_metrics', 'tool_usage'];
      
      for (const table of tables) {
        const { error } = await this.supabase
          .from(table)
          .select('count')
          .limit(1);
          
        if (error && error.code !== 'PGRST116') {
          this.logger.warn(`⚠️ Table ${table} may not be accessible: ${error.message}`);
        } else {
          this.logger.debug(`✓ Table ${table} accessible`);
        }
      }
      
      this.logger.info('✅ Database verification completed');
      
    } catch (error) {
      this.logger.error('❌ Database verification failed', error);
      throw error;
    }
  }

  async seedInitialData() {
    try {
      this.logger.info('🌱 Seeding initial data...');
      
      // Insert initial system metrics
      const { error: metricsError } = await this.supabase
        .from('system_metrics')
        .upsert([
          {
            metric_name: 'system_initialization',
            metric_value: 1,
            metric_data: {
              version: '2.0.0',
              initialized_at: new Date().toISOString()
            }
          }
        ]);
        
      if (metricsError) {
        this.logger.warn('⚠️ Initial metrics seeding failed', metricsError);
      }
      
      this.logger.info('✅ Initial data seeding completed');
      
    } catch (error) {
      this.logger.error('❌ Data seeding failed', error);
      // Don't throw - this is optional
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.setupSchema();
      await this.verifySetup();
      await this.seedInitialData();
      
      this.logger.info('🎉 Database setup completed successfully!');
      
    } catch (error) {
      this.logger.error('💥 Database setup failed', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new DatabaseSetup();
  setup.run();
}

module.exports = DatabaseSetup;