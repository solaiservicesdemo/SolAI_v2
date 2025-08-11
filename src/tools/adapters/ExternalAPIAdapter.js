/**
 * 🌐 External API Adapter - Generic REST/GraphQL/Webhook Integration
 * BMAD Architecture: Flexible adapter for external APIs and services
 */

const BaseToolAdapter = require('./BaseToolAdapter');
const axios = require('axios');

class ExternalAPIAdapter extends BaseToolAdapter {
  constructor(toolConfig, auditTrail, apiConfig) {
    super(toolConfig, auditTrail);
    this.apiConfig = apiConfig;
    this.httpClient = null;
    this.authToken = null;
    this.tokenExpiryTime = null;
    this.webhookEndpoints = new Map();
    this.responseCache = new Map();
    this.cacheTimeout = apiConfig.cacheTimeout || 300000; // 5 minutes default
  }

  async establishConnection() {
    this.logger.info(`Establishing external API connection: ${this.toolConfig.name}`);
    
    try {
      // Initialize HTTP client with proper configuration
      await this.initializeHttpClient();
      
      // Handle authentication
      await this.authenticateAPI();
      
      // Set up webhooks if configured
      await this.setupWebhooks();
      
      // Test API connectivity
      await this.validateAPIConnection();
      
      this.logger.info(`External API connection established: ${this.toolConfig.name}`);
      
    } catch (error) {
      this.logger.error(`Failed to establish external API connection: ${this.toolConfig.name}`, error);
      throw error;
    }
  }

  async initializeHttpClient() {
    const clientConfig = {
      baseURL: this.apiConfig.baseUrl,
      timeout: this.apiConfig.timeout || 30000,
      headers: {
        'User-Agent': 'SolAI-v2-Enterprise',
        'Content-Type': 'application/json',
        ...this.apiConfig.defaultHeaders
      }
    };

    // Add authentication headers if static
    if (this.apiConfig.auth?.type === 'api_key') {
      clientConfig.headers[this.apiConfig.auth.headerName || 'Authorization'] = 
        `${this.apiConfig.auth.prefix || 'Bearer'} ${this.apiConfig.auth.apiKey}`;
    }

    // Set up interceptors
    this.httpClient = axios.create(clientConfig);
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor for authentication and logging
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          tool: this.toolConfig.name,
          headers: this.sanitizeHeaders(config.headers)
        });
        
        // Add dynamic auth token if available
        if (this.authToken && this.apiConfig.auth?.type === 'oauth') {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        
        return config;
      },
      (error) => {
        this.logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`API Response: ${response.status}`, {
          tool: this.toolConfig.name,
          url: response.config.url,
          responseSize: JSON.stringify(response.data).length
        });
        return response;
      },
      async (error) => {
        this.logger.error('API Response Error', {
          tool: this.toolConfig.name,
          status: error.response?.status,
          message: error.message
        });

        // Handle token refresh for OAuth
        if (error.response?.status === 401 && this.apiConfig.auth?.type === 'oauth') {
          try {
            await this.refreshAuthToken();
            // Retry the original request
            return this.httpClient(error.config);
          } catch (refreshError) {
            this.logger.error('Token refresh failed', refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  sanitizeHeaders(headers) {
    // Remove sensitive information from headers for logging
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  async authenticateAPI() {
    if (!this.apiConfig.auth) {
      this.logger.debug('No authentication configured for API');
      return;
    }

    switch (this.apiConfig.auth.type) {
      case 'api_key':
        // Already handled in HTTP client initialization
        break;
      
      case 'oauth':
        await this.performOAuthAuthentication();
        break;
      
      case 'basic':
        await this.performBasicAuthentication();
        break;
      
      case 'custom':
        await this.performCustomAuthentication();
        break;
      
      default:
        throw new Error(`Unsupported authentication type: ${this.apiConfig.auth.type}`);
    }
  }

  async performOAuthAuthentication() {
    const authConfig = this.apiConfig.auth;
    
    if (!authConfig.tokenEndpoint || !authConfig.clientId || !authConfig.clientSecret) {
      throw new Error('OAuth configuration incomplete');
    }

    try {
      const response = await axios.post(authConfig.tokenEndpoint, {
        grant_type: 'client_credentials',
        client_id: authConfig.clientId,
        client_secret: authConfig.clientSecret,
        scope: authConfig.scope || ''
      });

      this.authToken = response.data.access_token;
      this.tokenExpiryTime = Date.now() + (response.data.expires_in * 1000);
      
      this.logger.debug('OAuth authentication successful');
      
    } catch (error) {
      throw new Error(`OAuth authentication failed: ${error.message}`);
    }
  }

  async performBasicAuthentication() {
    const authConfig = this.apiConfig.auth;
    
    if (!authConfig.username || !authConfig.password) {
      throw new Error('Basic authentication credentials not provided');
    }

    const credentials = Buffer.from(`${authConfig.username}:${authConfig.password}`).toString('base64');
    this.httpClient.defaults.headers.Authorization = `Basic ${credentials}`;
    
    this.logger.debug('Basic authentication configured');
  }

  async performCustomAuthentication() {
    // Custom authentication logic - implement based on API requirements
    if (this.apiConfig.auth.customAuthFunction) {
      await this.apiConfig.auth.customAuthFunction(this.httpClient);
    }
    
    this.logger.debug('Custom authentication performed');
  }

  async refreshAuthToken() {
    if (this.apiConfig.auth?.type !== 'oauth') return;

    const authConfig = this.apiConfig.auth;
    
    try {
      const response = await axios.post(authConfig.tokenEndpoint, {
        grant_type: 'client_credentials',
        client_id: authConfig.clientId,
        client_secret: authConfig.clientSecret
      });

      this.authToken = response.data.access_token;
      this.tokenExpiryTime = Date.now() + (response.data.expires_in * 1000);
      
      this.logger.debug('OAuth token refreshed successfully');
      
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  async setupWebhooks() {
    if (!this.apiConfig.webhooks || this.apiConfig.webhooks.length === 0) {
      return;
    }

    for (const webhook of this.apiConfig.webhooks) {
      try {
        await this.registerWebhook(webhook);
        this.webhookEndpoints.set(webhook.event, webhook.endpoint);
      } catch (error) {
        this.logger.warn(`Failed to register webhook for ${webhook.event}`, error);
      }
    }
  }

  async registerWebhook(webhook) {
    if (!webhook.registrationEndpoint) {
      this.logger.debug(`Webhook ${webhook.event} does not require registration`);
      return;
    }

    const registrationData = {
      url: webhook.endpoint,
      events: [webhook.event],
      ...webhook.additionalData
    };

    await this.httpClient.post(webhook.registrationEndpoint, registrationData);
    this.logger.debug(`Webhook registered: ${webhook.event}`);
  }

  async validateAPIConnection() {
    if (!this.apiConfig.healthEndpoint) {
      this.logger.debug('No health endpoint configured, skipping validation');
      return;
    }

    try {
      const response = await this.httpClient.get(this.apiConfig.healthEndpoint);
      
      if (response.status >= 200 && response.status < 300) {
        this.logger.debug('API connection validation successful');
      } else {
        throw new Error(`Health check returned status: ${response.status}`);
      }
      
    } catch (error) {
      throw new Error(`API connection validation failed: ${error.message}`);
    }
  }

  async performHealthCheck() {
    try {
      const startTime = Date.now();
      
      if (this.apiConfig.healthEndpoint) {
        const response = await this.httpClient.get(this.apiConfig.healthEndpoint);
        const latency = Date.now() - startTime;
        
        return {
          healthy: response.status >= 200 && response.status < 300,
          latency,
          status: response.status,
          authenticated: !!this.authToken || this.apiConfig.auth?.type === 'api_key'
        };
      } else {
        // Simple connectivity test
        const response = await this.httpClient.get('/');
        const latency = Date.now() - startTime;
        
        return {
          healthy: true,
          latency,
          status: response.status
        };
      }
      
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        authenticated: false
      };
    }
  }

  async executeAction(action, parameters, context, executionId) {
    this.logger.debug(`Executing external API action: ${this.toolConfig.name}.${action}`, { executionId });
    
    try {
      // Check authentication token expiry
      if (this.needsTokenRefresh()) {
        await this.refreshAuthToken();
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(action, parameters);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        this.logger.debug('Returning cached result', { executionId, cacheKey });
        return cachedResult;
      }

      // Execute the API call
      const result = await this.executeAPICall(action, parameters, context);
      
      // Cache the result if cacheable
      if (this.isCacheable(action, result)) {
        this.setCachedResult(cacheKey, result);
      }

      this.logger.debug(`External API action completed: ${this.toolConfig.name}.${action}`, { executionId });
      
      return result;
      
    } catch (error) {
      this.logger.error(`External API action failed: ${this.toolConfig.name}.${action}`, { 
        executionId, 
        error: error.message 
      });
      throw error;
    }
  }

  needsTokenRefresh() {
    return this.apiConfig.auth?.type === 'oauth' && 
           this.tokenExpiryTime && 
           Date.now() >= (this.tokenExpiryTime - 60000); // Refresh 1 minute before expiry
  }

  generateCacheKey(action, parameters) {
    const keyData = {
      tool: this.toolConfig.name,
      action,
      parameters: this.normalizeCacheParameters(parameters)
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  normalizeCacheParameters(parameters) {
    // Remove non-cacheable parameters like timestamps
    const normalized = { ...parameters };
    const nonCacheableKeys = ['timestamp', 'requestId', 'sessionId'];
    
    for (const key of nonCacheableKeys) {
      delete normalized[key];
    }
    
    return normalized;
  }

  getCachedResult(cacheKey) {
    const cached = this.responseCache.get(cacheKey);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.responseCache.delete(cacheKey);
      return null;
    }
    
    return cached.result;
  }

  setCachedResult(cacheKey, result) {
    this.responseCache.set(cacheKey, {
      result,
      expiry: Date.now() + this.cacheTimeout
    });
  }

  isCacheable(action, result) {
    // Don't cache write operations or error responses
    if (action.includes('create') || action.includes('update') || action.includes('delete')) {
      return false;
    }
    
    if (!result || result.error) {
      return false;
    }
    
    return this.apiConfig.enableCaching !== false;
  }

  async executeAPICall(action, parameters, context) {
    const actionConfig = this.getActionConfig(action);
    if (!actionConfig) {
      throw new Error(`Action configuration not found: ${action}`);
    }

    const { method, endpoint, bodyTemplate, queryParams } = actionConfig;
    
    // Build the request
    const requestConfig = {
      method: method.toLowerCase(),
      url: this.interpolateEndpoint(endpoint, parameters),
      params: this.buildQueryParams(queryParams, parameters),
    };

    // Add body for POST/PUT requests
    if (['post', 'put', 'patch'].includes(requestConfig.method)) {
      requestConfig.data = this.buildRequestBody(bodyTemplate, parameters);
    }

    // Make the API call
    const response = await this.httpClient(requestConfig);
    
    // Process the response
    return this.processAPIResponse(response, action, parameters);
  }

  getActionConfig(action) {
    return this.apiConfig.actions?.[action] || this.generateGenericActionConfig(action);
  }

  generateGenericActionConfig(action) {
    // Generic configuration for common patterns
    const actionPatterns = {
      'get': { method: 'GET', endpoint: `/${action}` },
      'list': { method: 'GET', endpoint: `/${action}` },
      'create': { method: 'POST', endpoint: `/${action}` },
      'update': { method: 'PUT', endpoint: `/${action}/{id}` },
      'delete': { method: 'DELETE', endpoint: `/${action}/{id}` }
    };

    const pattern = Object.keys(actionPatterns).find(p => action.toLowerCase().includes(p));
    return pattern ? actionPatterns[pattern] : { method: 'POST', endpoint: `/${action}` };
  }

  interpolateEndpoint(endpoint, parameters) {
    let interpolated = endpoint;
    
    // Replace path parameters like {id} with actual values
    const pathParams = endpoint.match(/\{([^}]+)\}/g);
    if (pathParams) {
      for (const param of pathParams) {
        const paramName = param.slice(1, -1); // Remove { and }
        if (parameters[paramName]) {
          interpolated = interpolated.replace(param, parameters[paramName]);
        }
      }
    }
    
    return interpolated;
  }

  buildQueryParams(queryParamsConfig, parameters) {
    if (!queryParamsConfig) return {};
    
    const queryParams = {};
    
    for (const [paramName, config] of Object.entries(queryParamsConfig)) {
      if (typeof config === 'string') {
        // Simple mapping
        if (parameters[config]) {
          queryParams[paramName] = parameters[config];
        }
      } else if (config.required && !parameters[config.source]) {
        throw new Error(`Required query parameter missing: ${config.source}`);
      } else if (parameters[config.source]) {
        queryParams[paramName] = parameters[config.source];
      }
    }
    
    return queryParams;
  }

  buildRequestBody(bodyTemplate, parameters) {
    if (!bodyTemplate) return parameters;
    
    if (typeof bodyTemplate === 'string') {
      // Template string interpolation
      return this.interpolateTemplate(bodyTemplate, parameters);
    } else if (typeof bodyTemplate === 'object') {
      // Object template
      return this.interpolateObjectTemplate(bodyTemplate, parameters);
    }
    
    return parameters;
  }

  interpolateTemplate(template, parameters) {
    let result = template;
    
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return result;
  }

  interpolateObjectTemplate(template, parameters) {
    const result = {};
    
    for (const [key, value] of Object.entries(template)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const paramName = value.slice(2, -2);
        result[key] = parameters[paramName];
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  async processAPIResponse(response, action, parameters) {
    const result = {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers,
      metadata: {
        tool: this.toolConfig.name,
        action,
        responseSize: JSON.stringify(response.data).length,
        contentType: response.headers['content-type']
      }
    };

    // Apply response transformation if configured
    if (this.apiConfig.responseTransform?.[action]) {
      result.data = await this.transformResponse(result.data, this.apiConfig.responseTransform[action]);
    }

    return result;
  }

  async transformResponse(data, transformConfig) {
    if (transformConfig.extract) {
      // Extract specific fields from response
      const extracted = {};
      for (const [newKey, path] of Object.entries(transformConfig.extract)) {
        extracted[newKey] = this.extractFromPath(data, path);
      }
      return extracted;
    }
    
    if (transformConfig.map) {
      // Apply mapping function
      return Array.isArray(data) ? data.map(transformConfig.map) : transformConfig.map(data);
    }
    
    return data;
  }

  extractFromPath(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  async cleanup() {
    // Clear caches
    this.responseCache.clear();
    
    // Cancel any pending requests
    if (this.httpClient) {
      this.httpClient = null;
    }
    
    // Unregister webhooks if needed
    for (const [event, endpoint] of this.webhookEndpoints) {
      try {
        await this.unregisterWebhook(event, endpoint);
      } catch (error) {
        this.logger.warn(`Failed to unregister webhook: ${event}`, error);
      }
    }
    
    this.logger.info(`External API adapter cleanup completed: ${this.toolConfig.name}`);
  }

  async unregisterWebhook(event, endpoint) {
    // Implementation depends on the specific API
    this.logger.debug(`Webhook unregistered: ${event}`);
  }
}

module.exports = ExternalAPIAdapter;