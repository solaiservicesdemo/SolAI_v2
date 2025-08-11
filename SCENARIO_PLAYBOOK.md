# 🎭 SolAI v2 Scenario Playbook
## AI Behavior Examples & Expected Responses

> **For Team Testing**: Use these scenarios to validate AI responses match expected professional behavior

---

## 🏠 Real Estate Purchase Scenarios

### Scenario: Condo Search Request
**User Input:** `"Hi, can you help me find a 2BR condo in Coronado?"`

**Expected AI Behavior:**
- ✅ **Smart Assumptions**: Assumes market-rate budget, standard timeline, typical 2BR features
- ✅ **No Over-Clarification**: Should NOT ask "What's your budget? When do you need it?"
- ✅ **Comprehensive Response**: Uses RE_BUY_TEMPLATE with 6-section structure
- ✅ **Tool Usage**: May call property search tools (minimal API calls)

**Sample Expected Response Structure:**
```
1) Snapshot: $800K-1.2M range, pet-friendly 2BR, vacation rental potential
2) Top Picks: 3-5 buildings with prices, HOA, walkability  
3) Rental Reality: STR policies, occupancy estimates
4) Risks & Trade-offs: Inventory scarcity, assessments
5) Monthly Cost: P&I, HOA, taxes ballpark
6) Next Steps: Building shortlist, tours, pre-qual
```

---

## 📅 Appointment Scenarios

### Scenario: Client Meeting Request
**User Input:** `"I need to schedule a client meeting with John tomorrow at 2pm"`

**Expected AI Behavior:**
- ✅ **NEVER Promise**: Should NOT say "I'll schedule you for 2pm tomorrow"
- ✅ **Confirmation Language**: "I'd be happy to check your availability for tomorrow at 2pm. Let me reach out and confirm within 30 minutes."
- ✅ **4-Phase Protection**: Client Request → Realtor Response → Lead Confirmation → Calendar Creation
- ✅ **Tool Usage**: Creates notification for realtor approval

### Scenario: Appointment Counter-Offer
**User Input:** `"The client wants to reschedule to Friday at 10am instead"`

**Expected AI Behavior:**
- ✅ **Smart Assumptions**: Same meeting type, this Friday, similar duration
- ✅ **Counter-Offer Processing**: Creates notification with options for realtor
- ✅ **No Direct Confirmation**: Requires realtor approval before confirming with client

---

## 💬 Conversational Scenarios

### Scenario: Simple Greeting
**User Input:** `"Hi there!"`

**Expected AI Behavior:**
- ✅ **0 API Calls**: Should not trigger any external tool calls
- ✅ **Conversational Intent**: Recognized as greeting, not task request
- ✅ **Professional Welcome**: Warm but professional response
- ✅ **Offer Assistance**: End with "What can I help you with today?"

### Scenario: Appreciation
**User Input:** `"Thanks so much for your help!"`

**Expected AI Behavior:**
- ✅ **0 API Calls**: Pure conversational response
- ✅ **Gracious Response**: Professional acknowledgment
- ✅ **Follow-up Offer**: "Is there anything else I can help you with?"

---

## 🧠 Memory & Context Scenarios

### Scenario: Memory Reference
**User Input:** `"Remember that client I mentioned yesterday?"`

**Expected AI Behavior:**
- ✅ **0 API Calls**: Pure memory retrieval, no tools needed
- ✅ **Context Search**: Searches conversation history and memory
- ✅ **Professional Response**: "Yes, I remember our conversation about..."
- ✅ **Context Continuation**: References specific details from previous discussion

### Scenario: Follow-up Question
**User Input:** `"What were those HOA fees you mentioned?"`

**Expected AI Behavior:**
- ✅ **Memory Search**: Retrieves previous conversation context
- ✅ **Specific Answer**: Provides the exact figures discussed
- ✅ **No Re-clarification**: Doesn't ask "Which property?" if clear from context

---

## 🚫 Communication Preference Scenarios

### Scenario: "No Questions" Request
**User Input:** `"Just answer, no questions please"`

**Expected AI Behavior:**
- ✅ **Question Budget = 0**: Will not ask ANY follow-up questions
- ✅ **Smart Assumptions**: Makes reasonable assumptions and states them
- ✅ **Preference Memory**: Remembers this preference for future interactions

### Scenario: Concise Mode Request  
**User Input:** `"Keep it short please, low attention span"`

**Expected AI Behavior:**
- ✅ **Concise Mode ON**: Activates brief response mode
- ✅ **Word Limit**: Max 120 words, bullet points preferred
- ✅ **Preference Memory**: Saves concise_mode preference

---

## 🔧 Tool Integration Scenarios

### Scenario: Property Analysis Request
**User Input:** `"Can you analyze the market trends for Coronado condos?"`

**Expected AI Behavior:**
- ✅ **Tool Coordination**: Calls market analysis tools
- ✅ **Smart Selection**: Only calls tools needed for market data
- ✅ **Professional Synthesis**: Combines tool results into coherent response

### Scenario: Document Request
**User Input:** `"I need the purchase agreement template"`

**Expected AI Behavior:**
- ✅ **Tool Usage**: Accesses document management tools
- ✅ **Professional Delivery**: Provides document with context
- ✅ **Follow-up Offer**: "Would you like me to help fill it out?"

---

## ⚠️ Edge Cases to Test

### Invalid/Problematic Inputs
- **Empty Messages**: Should request valid input
- **Nonsense Text**: Should ask for clarification professionally
- **Aggressive Language**: Should remain professional, de-escalate

### System Stress Tests
- **Rapid Messages**: Should handle without breaking
- **Very Long Messages**: Should process appropriately  
- **Mixed Languages**: Should respond appropriately

### Appointment Edge Cases
- **Unreasonable Times**: Should offer alternatives professionally
- **Conflicting Schedules**: Should identify conflicts, offer solutions
- **Missing Details**: Should make reasonable assumptions, not over-ask

---

## 📊 Success Metrics

### Response Quality Indicators
- ✅ **Professional Tone**: Always business-appropriate
- ✅ **Context Awareness**: References previous conversation
- ✅ **Smart Assumptions**: Avoids obvious questions
- ✅ **Actionable Responses**: Provides next steps when relevant

### Technical Performance Indicators  
- ✅ **API Efficiency**: 75% reduction in unnecessary calls
- ✅ **Response Speed**: Under 3 seconds for conversational responses
- ✅ **Memory Accuracy**: Correctly retrieves relevant context
- ✅ **Tool Coordination**: Uses appropriate tools for each task

### Business Logic Validation
- ✅ **Appointment Protection**: Never promises without confirmation
- ✅ **Professional Boundaries**: Doesn't overstep realtor authority  
- ✅ **Client Relationship Safety**: Responses protect professional relationships
- ✅ **Cost Efficiency**: Minimizes external API usage while maintaining quality

---

## 🎯 Testing Instructions

1. **Run each scenario** and verify AI behavior matches expectations
2. **Check API call logs** to ensure optimization is working (75% reduction)
3. **Validate appointment handling** - ensure no direct promises are made
4. **Test conversation flow** - verify smart assumptions prevent over-questioning
5. **Verify memory persistence** - ensure context carries across interactions

**🚨 Red Flags to Watch For:**
- AI making appointment promises without confirmation
- Excessive API calls for simple conversational responses
- Over-clarification that interrupts conversation flow
- Loss of context between interactions
- Unprofessional or casual tone in business contexts