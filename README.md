# 🤖 SolAI v2 Enterprise

> **Professional Conversational Intelligence for Real Estate Professionals**

SolAI v2 transforms from "glorified tool calling" to genuine conversational intelligence using **BMAD Method + Claude Flow integration**. Built for enterprise real estate teams who need an AI that thinks, remembers, and adapts.

\![SolAI v2 Architecture](https://img.shields.io/badge/Architecture-Enterprise--Grade-blue) \![Claude Flow](https://img.shields.io/badge/Claude--Flow-87--MCP--Tools-green) \![BMAD Method](https://img.shields.io/badge/BMAD--Method-Systematic--Development-orange)

## 🌟 Key Features

### 🧠 **Conversational Intelligence**
- **Pattern Recognition**: Advanced intent detection and emotional context analysis
- **State Management**: Sophisticated conversation flow with memory persistence
- **Adaptive Responses**: Dynamic personality that adjusts to user communication style

### 💾 **Three-Tier Memory System**
- **Working Memory** (Redis): <5 minutes, instant access
- **Session Memory** (Supabase): Days/weeks, conversation persistence  
- **Long-term Memory** (Pinecone): Permanent, semantic search capabilities

### 🎭 **Personality Engine**
- **Adaptive Traits**: Professional, curious, helpful, transparent
- **Communication Styles**: Matches user formality, detail preferences
- **AI-Powered**: Gemini-2.5-Flash primary, Claude-3.5-Haiku fallback

### 🔧 **Tool Orchestrator**
- **Existing Super-Tools**: Gmail, Twilio, Calendar, CRM, Document Processor, Market Analyzer
- **Claude Flow Integration**: 87 MCP tools with hive-mind orchestration.
- **Intelligent Coordination**: Parallel execution, sequential chaining, workflow automation

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Redis** (for working memory)
- **Supabase Account** (for session memory)
- **OpenRouter API Key** (for AI models)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/SolAI_v2.git
cd SolAI_v2
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API keys and database credentials
```

4. **Set up database**
```bash
npm run setup:database
```

5. **Start the system**
```bash
npm run dev          # Full validation and startup
npm run dev:fast     # Fast boot mode (skips validations)
npm run dev:watch    # Auto-restart on changes
```

6. **Access dashboard**
```
http://localhost:3000
```

## 🚀 Performance Features

### **Boot Time Optimization**
- **Parallel initialization**: 60-70% faster startup
- **Lazy model loading**: Models initialize only when needed
- **Response caching**: Intelligent caching for repeated queries

### **Development Scripts**
```bash
npm run performance  # Measure boot time
npm run validate     # Run all tests
npm run health       # Check system health
```

## 🔧 Configuration

### Required Environment Variables

```bash
# AI Models
OPENROUTER_API_KEY=your_key_here

# Memory Systems  
REDIS_URL=redis://localhost:6379
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Existing Super-Tools (from RealEstate AI Enterprise)
GMAIL_API_ENDPOINT=http://localhost:3001/gmail
TWILIO_API_ENDPOINT=http://localhost:3001/twilio
CRM_API_ENDPOINT=http://localhost:3001/crm
```

**Built with 🧠 Intelligence • 💾 Memory • 🎭 Personality**

*SolAI v2 - Where conversation meets intelligence*
