// src/lib/config.js
/**
 * Configuration management for different environments
 * This allows us to manage configuration parameters in one place
 */

// Environment detection
const environment = process.env.NODE_ENV || 'development';

// Base configuration applicable to all environments
const baseConfig = {
  // API configurations
  api: {
    timeout: 30000, // 30 seconds
    retries: 3,
  },
  
  // AI service configurations
  ai: {
    // OpenAI configurations
    openai: {
      model: 'gpt-4-turbo',
      fallbackModel: 'gpt-3.5-turbo',
      maxTokens: 4000,
      temperature: 0.1
    },
    
    // HuggingFace configurations
    huggingface: {
      enabledModels: [
        'deepseek-ai/deepseek-coder-33b-instruct',
        'mistralai/Mistral-7B-Instruct-v0.2'
      ]
    }
  },
  
  // Analysis configurations
  analysis: {
    cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    useMultiAI: true,
    enableTools: true,
    maxCodeSize: 500 * 1024, // 500KB max code size
  },
  
  // Rate limiting configurations
  rateLimit: {
    analysis: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 10 // 10 requests per window
    },
    aiPatches: {
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 5 // 5 requests per window
    },
    general: {
      windowMs: 60 * 1000, // 1 minute
      max: 60 // 60 requests per window
    }
  },
  
  // Feature flags
  features: {
    multiAiConsensus: true,
    aiPatchGeneration: true,
    certificateMinting: true,
    historicalAnalysis: true
  }
};

// Environment-specific configurations
const environmentConfigs = {
  // Development environment
  development: {
    logLevel: 'debug',
    ai: {
      openai: {
        model: 'gpt-3.5-turbo', // Use cheaper model in development
        maxTokens: 2000
      }
    },
    analysis: {
      cacheExpiry: 10 * 60 * 1000, // 10 minutes in development
    },
    rateLimit: {
      // More lenient rate limits for development
      analysis: {
        max: 20
      }
    }
  },
  
  // Test environment
  test: {
    logLevel: 'info',
    ai: {
      openai: {
        model: 'gpt-3.5-turbo'
      }
    },
    analysis: {
      // Don't cache in test environment
      cacheExpiry: 0
    }
  },
  
  // Production environment
  production: {
    logLevel: 'warn',
    // Stricter rate limits in production
    rateLimit: {
      analysis: {
        windowMs: 5 * 60 * 1000,
        max: 5 // 5 requests per 5 minutes
      },
      aiPatches: {
        windowMs: 10 * 60 * 1000,
        max: 3 // 3 requests per 10 minutes
      }
    }
  }
};

// Merge base config with environment-specific config
function createConfig(env) {
  const envConfig = environmentConfigs[env] || {};
  
  // Deep merge objects
  const mergeObjects = (target, source) => {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = mergeObjects(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  };
  
  function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
  
  return mergeObjects(baseConfig, envConfig);
}

// Create and export the configuration
const config = createConfig(environment);

// Export for use in the application - ES Modules only
export default config;