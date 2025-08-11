/**
 * 🔧 Redis Setup Script
 * Sets up Redis for SolAI v2 persistent memory
 */

const { spawn } = require('child_process');
const Redis = require('ioredis');

console.log('🚀 SolAI v2 Redis Setup');
console.log('=====================');

// Test Redis connection
async function testRedisConnection() {
  try {
    console.log('🔍 Testing Redis connection...');
    
    const redis = new Redis('redis://localhost:6379', {
      connectTimeout: 3000,
      lazyConnect: false,
      maxRetriesPerRequest: 1
    });
    
    await redis.ping();
    console.log('✅ Redis server is running on localhost:6379');
    
    // Test basic operations
    await redis.set('solai:test', 'connection_test');
    const testValue = await redis.get('solai:test');
    
    if (testValue === 'connection_test') {
      console.log('✅ Redis read/write operations working');
      await redis.del('solai:test');
    }
    
    redis.disconnect();
    return true;
  } catch (error) {
    console.log('❌ Redis connection failed:', error.message);
    return false;
  }
}

// Setup instructions for different platforms
function showSetupInstructions() {
  console.log('');
  console.log('💡 REDIS SETUP OPTIONS:');
  console.log('');
  
  console.log('🪟 WINDOWS:');
  console.log('1. Download Redis from: https://github.com/microsoftarchive/redis/releases');
  console.log('2. Install and start Redis service');
  console.log('3. Or use Windows Subsystem for Linux (WSL)');
  
  console.log('');
  console.log('🐳 DOCKER (Recommended):');
  console.log('docker run -d --name solai-redis -p 6379:6379 redis:alpine');
  
  console.log('');
  console.log('☁️ CLOUD OPTIONS:');
  console.log('• Redis Cloud (free tier): https://redis.com/redis-enterprise-cloud/');
  console.log('• AWS ElastiCache');
  console.log('• Google Cloud Memorystore');
  
  console.log('');
  console.log('🔧 FOR DEVELOPMENT:');
  console.log('• System works without Redis (uses in-memory storage)');
  console.log('• Redis adds: persistence, multi-instance support, better performance');
}

// Create Redis configuration
function createRedisConfig() {
  const fs = require('fs');
  const path = require('path');
  
  const redisConfig = `# Redis Configuration for SolAI v2
# Optimized for conversational AI workloads

# Memory and persistence
maxmemory 256mb
maxmemory-policy allkeys-lru
save 300 10
save 60 1000

# Network
bind 127.0.0.1
port 6379
timeout 300

# Logging
loglevel notice
logfile ""

# Performance
tcp-keepalive 300
databases 16
`;

  const configPath = path.join(process.cwd(), 'redis.conf');
  fs.writeFileSync(configPath, redisConfig);
  console.log('📁 Redis config created: redis.conf');
  return configPath;
}

// Main setup function
async function setupRedis() {
  const isConnected = await testRedisConnection();
  
  if (isConnected) {
    console.log('🎉 Redis is ready for SolAI v2!');
    console.log('');
    console.log('🔧 To enable Redis in SolAI:');
    console.log('Add to your .env file:');
    console.log('REDIS_URL=redis://localhost:6379');
    return true;
  } else {
    console.log('');
    console.log('🔧 Redis setup required...');
    showSetupInstructions();
    
    // Create config file for when they set it up
    createRedisConfig();
    
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Install Redis using one of the options above');
    console.log('2. Start Redis server');
    console.log('3. Run this script again to verify connection');
    console.log('4. Add REDIS_URL=redis://localhost:6379 to your .env file');
    
    return false;
  }
}

// Run the setup
setupRedis().then(success => {
  if (success) {
    console.log('');
    console.log('✅ Redis setup complete!');
    process.exit(0);
  } else {
    console.log('');
    console.log('⚠️  Manual Redis setup required');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});