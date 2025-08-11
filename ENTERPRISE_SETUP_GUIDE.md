# 🚀 SolAI v2 Enterprise Setup Guide

## 📋 Quick Start Commands

### Standard Development Mode
```bash
npm run dev
```
- **Tools Available:** 6 Super-tools only
- **Memory:** Local in-memory + Supabase + Pinecone  
- **Use Case:** Basic real estate conversations

### Enterprise Mode (Recommended)
```bash
npm run start:enterprise
```
- **Tools Available:** 93 Total (6 Super + 87 Claude Flow MCP)
- **Memory:** Redis + Supabase + Pinecone (distributed)
- **Services:** Auto-starts Redis + Claude Flow MCP server
- **Use Case:** Full enterprise capabilities including web scraping, lead generation

## 🛠️ Enterprise Architecture

### Three-Tier Memory System
1. **Working Memory (Redis)** - Distributed memory across instances
2. **Session Memory (Supabase)** - Persistent conversation history  
3. **Semantic Memory (Pinecone)** - Long-term learning and context

### 93 Available Tools

#### 6 Super-Tools (Core RealEstate AI Integration)
1. **Gmail Integration** - Email automation and templates
2. **Twilio SMS/Voice** - Multi-channel communication
3. **Calendar Management** - Appointment scheduling and reminders
4. **CRM Integration** - Lead management and client tracking
5. **Document Processor** - Contract analysis and generation
6. **Market Analyzer** - Property valuation and market insights

#### 87 Claude Flow MCP Tools (Extended Automation)
- **Web Scraping & Data Collection**
  - Property listing scrapers (MLS, Zillow, etc.)
  - Market research automation
  - Lead generation from public sources
  - Competitor analysis tools

- **Document & File Operations**
  - PDF processing and generation
  - Bulk file operations
  - Template automation
  - Digital signature workflows

- **Communication & Marketing**
  - Social media automation
  - Email template generation
  - SMS campaign management
  - Content creation tools

- **Data Processing & Analysis**
  - Spreadsheet automation
  - Database connections
  - Visualization engines
  - Report generation

## 🔧 Service Configuration

### Redis Configuration
```env
# .env file
REDIS_URL=redis://localhost:6379
```
- **Purpose:** Distributed memory for multi-instance deployments
- **Fallback:** In-memory storage when Redis unavailable
- **Production:** Use Redis Cloud or AWS ElastiCache

### Claude Flow MCP Configuration  
```env
# .env file
CLAUDE_FLOW_ENDPOINT=http://localhost:3002/mcp
CLAUDE_FLOW_API_KEY=solai_v2_enterprise_key_2025
CLAUDE_FLOW_HIVE=true
```
- **Server:** Auto-started on port 3002
- **Tools:** 87 additional enterprise automation capabilities
- **Hive Mode:** Enabled for advanced workflows

## 🎯 Web Scraping & Property Search Capabilities

### Property Listing Search
The enterprise mode includes specialized tools for:

```javascript
// Example: Search Coronado properties under $3M
"Show me listings in Coronado under 3 million"
```

**Available Scrapers:**
- MLS data extraction
- Zillow property information
- Realtor.com listings  
- Public records access
- Market trend analysis
- Comparable sales data

### Automated Lead Generation
```javascript
// Example workflows enabled:
- Scrape new listings matching client criteria
- Extract contact information from public sources  
- Generate personalized outreach campaigns
- Track engagement and follow-up schedules
```

## 📊 Tool Orchestration

### Intelligent Tool Selection
SolAI v2 automatically selects the best combination of tools based on:
- **Request Context:** Understanding what the user needs
- **Tool Availability:** Checking which services are online
- **Performance Optimization:** Load balancing across tools
- **Fallback Strategies:** Alternative tools when primary fails

### Example Tool Combinations

#### Property Research Workflow
1. **Web Scraper** → Extract property data
2. **Market Analyzer** → Analyze comparable sales  
3. **Document Processor** → Generate property report
4. **Gmail** → Send report to client

#### Lead Generation Workflow  
1. **Web Scraper** → Find potential leads
2. **CRM** → Store lead information
3. **Twilio** → Send initial contact SMS
4. **Calendar** → Schedule follow-up calls

## 🔒 Security & Compliance

### Enterprise Security Features
- **Audit Trail:** All actions logged with compliance tracking
- **Execution Sandbox:** Safe tool execution environment
- **Rate Limiting:** Prevents API abuse
- **Circuit Breakers:** Automatic failover protection
- **Data Encryption:** All sensitive data encrypted at rest

### Compliance Frameworks
- SOX (Sarbanes-Oxley)
- GDPR (General Data Protection Regulation) 
- HIPAA (Health Insurance Portability and Accountability Act)
- PCI DSS (Payment Card Industry Data Security Standard)

## 🚀 Performance Optimizations

### Caching Strategy
- **Smart Invalidation:** Automatic cache management
- **5-minute TTL:** Optimal balance of fresh data and performance
- **500 item limit:** Memory-efficient caching

### Load Balancing
- **Tool Load Distribution:** Prevents any single tool from being overwhelmed
- **Max 5 concurrent per tool:** Maintains responsiveness
- **Global 20 concurrent limit:** System stability

### Circuit Breaker Protection
- **Auto-failover:** Switches to backup tools when primary fails
- **Recovery Testing:** Automatically retests failed services
- **Health Monitoring:** Real-time service status tracking

## 📈 Monitoring & Health Checks

### Available Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Service status  
curl http://localhost:3000/api/status

# Tool availability
curl http://localhost:3000/api/tools/status
```

### Log Monitoring
- **Winston Logging:** Structured application logs
- **Performance Metrics:** Response time tracking
- **Error Tracking:** Automatic error categorization
- **Compliance Events:** Audit trail monitoring

## 🔧 Troubleshooting

### Common Issues

#### Redis Connection Failed
```bash
# Check if Redis is running
docker ps | grep redis

# Restart Redis
npm run setup:redis
```

#### MCP Server Not Responding  
```bash
# Check MCP server status
curl http://localhost:3002/health

# Restart MCP server
npm run start:mcp
```

#### Tool Execution Timeouts
- Check internet connectivity for web scraping tools
- Verify API keys are configured correctly
- Review rate limiting settings in .env

### Enterprise Mode Verification
```bash
# Start enterprise mode
npm run start:enterprise

# Verify all services started
# Look for these success messages:
# ✅ Redis: Persistent memory
# ✅ Claude Flow: 87 MCP tools  
# ✅ Super-tools: 6 enterprise tools
# ✅ Total capability: 93 tools
```

## 📞 Team Support

### Development Team Workflow
1. **Use Enterprise Mode:** Always run `npm run start:enterprise` for full capabilities
2. **Test Web Scraping:** Verify property search functionality regularly
3. **Monitor Logs:** Check console for any service failures
4. **Performance Testing:** Use health endpoints to verify system status

### Production Deployment
1. **Redis Setup:** Configure production Redis instance
2. **Environment Variables:** Set all required API keys
3. **Load Testing:** Verify system can handle expected traffic
4. **Monitoring Setup:** Configure alerting for service failures

---

## ⚡ Ready to Use

Your SolAI v2 Enterprise system is now configured with:
- ✅ **93 Total Tools** (6 Super + 87 MCP)
- ✅ **Web Scraping** for property listings and lead generation  
- ✅ **Distributed Memory** with Redis + Supabase + Pinecone
- ✅ **Enterprise Security** with audit trails and sandboxing
- ✅ **Auto-Failover** and performance optimization
- ✅ **Compliance Monitoring** for enterprise requirements

**Start the full enterprise system:**
```bash
npm run start:enterprise
```

**Access the application:**
- Main Interface: http://localhost:3000
- MCP Tools API: http://localhost:3002/mcp
- Health Status: http://localhost:3000/api/health