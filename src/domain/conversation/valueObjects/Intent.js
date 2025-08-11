/**
 * Intent Value Object
 * Represents a classified user intent with confidence and metadata
 */

class Intent {
  constructor(primaryIntent, confidence, subIntents = [], entities = {}, metadata = {}) {
    // Validation
    if (!primaryIntent || typeof primaryIntent !== 'string') {
      throw new Error('Primary intent is required and must be a string');
    }
    
    if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
      throw new Error('Confidence must be a number between 0 and 1');
    }

    this.primaryIntent = primaryIntent.toLowerCase().trim();
    this.confidence = confidence;
    this.subIntents = subIntents.map(sub => ({
      intent: sub.intent?.toLowerCase()?.trim() || sub,
      confidence: sub.confidence || 0.5
    }));
    this.entities = this.validateEntities(entities);
    this.metadata = metadata;
    this.timestamp = new Date();
    
    // Intent classification
    this.category = this.classifyIntentCategory(primaryIntent);
    this.priority = this.determineIntentPriority(primaryIntent, entities);
    this.complexity = this.assessIntentComplexity(primaryIntent, subIntents, entities);
  }

  validateEntities(entities) {
    const validatedEntities = {};
    
    // Common real estate entities
    if (entities.location) {
      validatedEntities.location = this.normalizeLocation(entities.location);
    }
    
    if (entities.budget) {
      validatedEntities.budget = this.normalizeBudget(entities.budget);
    }
    
    if (entities.propertyType) {
      validatedEntities.propertyType = this.normalizePropertyType(entities.propertyType);
    }
    
    if (entities.timeline) {
      validatedEntities.timeline = this.normalizeTimeline(entities.timeline);
    }
    
    if (entities.bedrooms) {
      validatedEntities.bedrooms = parseInt(entities.bedrooms) || null;
    }
    
    if (entities.bathrooms) {
      validatedEntities.bathrooms = parseFloat(entities.bathrooms) || null;
    }
    
    // Copy other entities as-is
    Object.keys(entities).forEach(key => {
      if (!validatedEntities.hasOwnProperty(key)) {
        validatedEntities[key] = entities[key];
      }
    });
    
    return validatedEntities;
  }

  normalizeLocation(location) {
    if (typeof location === 'string') {
      return {
        raw: location,
        normalized: location.toLowerCase().trim(),
        type: this.detectLocationType(location)
      };
    }
    return location;
  }

  detectLocationType(location) {
    const cityPatterns = /\b(coronado|downtown|la jolla|del mar|encinitas|carlsbad)\b/i;
    const neighborhoodPatterns = /\b(village|bay|beach|hills|park)\b/i;
    
    if (cityPatterns.test(location)) return 'city';
    if (neighborhoodPatterns.test(location)) return 'neighborhood';
    return 'general';
  }

  normalizeBudget(budget) {
    if (typeof budget === 'string') {
      // Extract numeric value and convert to number
      const match = budget.match(/[\d,]+/);
      const numeric = match ? parseInt(match[0].replace(/,/g, '')) : null;
      
      let multiplier = 1;
      if (budget.toLowerCase().includes('million') || budget.toLowerCase().includes('mil')) {
        multiplier = 1000000;
      } else if (budget.toLowerCase().includes('k')) {
        multiplier = 1000;
      }
      
      return {
        raw: budget,
        numeric: numeric ? numeric * multiplier : null,
        range: this.extractBudgetRange(budget)
      };
    }
    
    if (typeof budget === 'number') {
      return {
        raw: budget.toString(),
        numeric: budget,
        range: null
      };
    }
    
    return budget;
  }

  extractBudgetRange(budgetString) {
    const rangePattern = /(\$?[\d,]+(?:\.\d+)?)\s*(?:to|-)?\s*(\$?[\d,]+(?:\.\d+)?)/i;
    const match = budgetString.match(rangePattern);
    
    if (match) {
      const min = parseFloat(match[1].replace(/[$,]/g, ''));
      const max = parseFloat(match[2].replace(/[$,]/g, ''));
      return { min, max };
    }
    
    // Single value with "under"
    const underPattern = /under\s*\$?([\d,]+(?:\.\d+)?)/i;
    const underMatch = budgetString.match(underPattern);
    if (underMatch) {
      const max = parseFloat(underMatch[1].replace(/,/g, ''));
      return { min: null, max };
    }
    
    return null;
  }

  normalizePropertyType(propertyType) {
    const typeMap = {
      'condo': 'condominium',
      'townhouse': 'townhome',
      'single family': 'single_family_home',
      'apartment': 'apartment',
      'multi-family': 'multi_family'
    };
    
    const normalized = propertyType.toLowerCase().trim();
    return {
      raw: propertyType,
      normalized: typeMap[normalized] || normalized,
      category: this.categorizePropertyType(normalized)
    };
  }

  categorizePropertyType(propertyType) {
    if (['condo', 'condominium', 'apartment'].includes(propertyType)) return 'multi_unit';
    if (['house', 'single_family_home', 'single family'].includes(propertyType)) return 'single_family';
    if (['townhouse', 'townhome'].includes(propertyType)) return 'attached';
    return 'other';
  }

  normalizeTimeline(timeline) {
    return {
      raw: timeline,
      urgency: this.assessTimelineUrgency(timeline),
      estimated_days: this.extractTimelineDays(timeline)
    };
  }

  assessTimelineUrgency(timeline) {
    const urgent = /\b(asap|immediately|urgent|now|today)\b/i;
    const soon = /\b(soon|within.*week|this week|next week)\b/i;
    const moderate = /\b(month|months|within.*month)\b/i;
    
    if (urgent.test(timeline)) return 'urgent';
    if (soon.test(timeline)) return 'soon';
    if (moderate.test(timeline)) return 'moderate';
    return 'flexible';
  }

  extractTimelineDays(timeline) {
    const dayPattern = /(\d+)\s*days?/i;
    const weekPattern = /(\d+)\s*weeks?/i;
    const monthPattern = /(\d+)\s*months?/i;
    
    let match = timeline.match(dayPattern);
    if (match) return parseInt(match[1]);
    
    match = timeline.match(weekPattern);
    if (match) return parseInt(match[1]) * 7;
    
    match = timeline.match(monthPattern);
    if (match) return parseInt(match[1]) * 30;
    
    return null;
  }

  classifyIntentCategory(intent) {
    const categories = {
      'communication': ['greeting', 'farewell', 'appreciation', 'question'],
      'search': ['property_search', 'market_search', 'lead_search'],
      'transaction': ['property_buy', 'property_sell', 'property_rent'],
      'analysis': ['market_analysis', 'property_valuation', 'comparative_analysis'],
      'management': ['client_management', 'calendar_management', 'document_processing'],
      'automation': ['email_automation', 'sms_automation', 'workflow_automation'],
      'support': ['task_coordination', 'help_request', 'troubleshooting']
    };
    
    for (const [category, intents] of Object.entries(categories)) {
      if (intents.some(categoryIntent => intent.includes(categoryIntent))) {
        return category;
      }
    }
    
    return 'general';
  }

  determineIntentPriority(intent, entities) {
    // High priority intents
    const highPriority = ['urgent', 'emergency', 'critical', 'asap'];
    if (highPriority.some(keyword => intent.includes(keyword))) {
      return 'high';
    }
    
    // Client-facing actions are medium-high priority
    const clientFacing = ['client', 'appointment', 'meeting', 'showing'];
    if (clientFacing.some(keyword => intent.includes(keyword))) {
      return 'medium-high';
    }
    
    // Revenue-generating activities are medium priority
    const revenueGenerating = ['property_search', 'lead_generation', 'market_analysis'];
    if (revenueGenerating.some(keyword => intent.includes(keyword))) {
      return 'medium';
    }
    
    // Timeline entities affect priority
    if (entities.timeline?.urgency === 'urgent') return 'high';
    if (entities.timeline?.urgency === 'soon') return 'medium-high';
    
    return 'normal';
  }

  assessIntentComplexity(primaryIntent, subIntents, entities) {
    let complexityScore = 1; // Base complexity
    
    // Multiple sub-intents increase complexity
    complexityScore += subIntents.length * 0.5;
    
    // Rich entities increase complexity
    const entityCount = Object.keys(entities).length;
    complexityScore += entityCount * 0.3;
    
    // Certain intents are inherently complex
    const complexIntents = [
      'market_analysis', 'document_processing', 'workflow_automation',
      'lead_generation', 'property_valuation'
    ];
    
    if (complexIntents.some(complex => primaryIntent.includes(complex))) {
      complexityScore += 1;
    }
    
    // Normalize to low/medium/high
    if (complexityScore >= 3) return 'high';
    if (complexityScore >= 2) return 'medium';
    return 'low';
  }

  // Business Logic Methods

  requiresTools() {
    const toolRequiringCategories = [
      'search', 'transaction', 'analysis', 'management', 'automation'
    ];
    return toolRequiringCategories.includes(this.category);
  }

  requiresImmediateResponse() {
    return this.priority === 'high' || this.entities.timeline?.urgency === 'urgent';
  }

  isClientFacing() {
    const clientFacingIntents = [
      'appointment', 'meeting', 'showing', 'client_communication'
    ];
    return clientFacingIntents.some(intent => this.primaryIntent.includes(intent));
  }

  getExpectedProcessingTime() {
    const baseTime = {
      'low': 1000,      // 1 second
      'medium': 3000,   // 3 seconds
      'high': 8000      // 8 seconds
    };
    
    let time = baseTime[this.complexity] || baseTime.medium;
    
    // Adjust for tool requirements
    if (this.requiresTools()) {
      time *= 2;
    }
    
    // Adjust for priority
    if (this.priority === 'high') {
      time *= 0.5; // Process faster
    }
    
    return time;
  }

  // Utility Methods

  equals(other) {
    return other instanceof Intent &&
           this.primaryIntent === other.primaryIntent &&
           Math.abs(this.confidence - other.confidence) < 0.01;
  }

  toString() {
    return `Intent(${this.primaryIntent}, confidence=${this.confidence.toFixed(2)}, category=${this.category})`;
  }

  toJSON() {
    return {
      primaryIntent: this.primaryIntent,
      confidence: this.confidence,
      subIntents: this.subIntents,
      entities: this.entities,
      category: this.category,
      priority: this.priority,
      complexity: this.complexity,
      metadata: this.metadata,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    const intent = new Intent(
      json.primaryIntent,
      json.confidence,
      json.subIntents || [],
      json.entities || {},
      json.metadata || {}
    );
    
    if (json.timestamp) {
      intent.timestamp = new Date(json.timestamp);
    }
    
    return intent;
  }
}

module.exports = Intent;