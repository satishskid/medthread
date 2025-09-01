import * as webllm from '@mlc-ai/web-llm';

// WebLLM engine instance
let engine: webllm.MLCEngine | null = null;
let isInitializing = false;
let initializationError: string | null = null;

// Available models - using TinyLlama for fast loading
const MODELS = {
  tiny: 'TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC',
  small: 'Llama-2-7b-chat-hf-q4f16_1-MLC',
  medium: 'Llama-2-13b-chat-hf-q4f16_1-MLC'
};

// Current model configuration
const DEFAULT_MODEL = MODELS.tiny;

// Initialize WebLLM engine
export const initWebLLM = async (): Promise<void> => {
  if (engine || isInitializing) {
    console.log('🤖 WebLLM already initialized or initializing');
    return;
  }

  isInitializing = true;
  initializationError = null;

  try {
    console.log('🤖 Initializing WebLLM with TinyLlama model...');
    
    // Create engine with progress callback
    engine = new webllm.MLCEngine();
    
    // Initialize with model
    await engine.reload(DEFAULT_MODEL, {
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });
    
    console.log('✅ WebLLM initialized successfully');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    initializationError = errorMsg;
    console.error('❌ WebLLM initialization failed:', errorMsg);
    engine = null;
  } finally {
    isInitializing = false;
  }
};

// Get WebLLM status
export const getWebLLMStatus = (): { 
  isReady: boolean; 
  isInitializing: boolean; 
  error: string | null;
  model: string;
} => {
  return {
    isReady: !!engine,
    isInitializing,
    error: initializationError,
    model: DEFAULT_MODEL
  };
};

// Main local AI function
export const localAI = async (prompt: string): Promise<string> => {
  // If engine is not ready, try to initialize
  if (!engine && !isInitializing) {
    console.log('🔄 WebLLM not ready, attempting initialization...');
    await initWebLLM();
  }

  // If still not ready after initialization attempt, return fallback
  if (!engine) {
    console.warn('⚠️ WebLLM not available, using fallback response');
    return generateFallbackResponse(prompt);
  }

  try {
    console.log('🤖 Processing with WebLLM...');
    
    // Format prompt for chat completion
    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    // Generate response
    const response = await engine.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: false
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in WebLLM response');
    }

    console.log('✅ WebLLM response generated');
    return content;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ WebLLM generation failed:', errorMsg);
    return generateFallbackResponse(prompt, errorMsg);
  }
};

// Fallback response when WebLLM is not available
const generateFallbackResponse = (prompt: string, error?: string): string => {
  const truncatedPrompt = prompt.substring(0, 150) + (prompt.length > 150 ? '...' : '');
  
  return `[Local AI Fallback Response]\n\n` +
    `Received prompt: "${truncatedPrompt}"\n\n` +
    `${error ? `Error: ${error}\n\n` : ''}` +
    `This is a fallback response. The local AI model (WebLLM) is either not loaded or encountered an error. ` +
    `In a production environment, this would be processed by a local TinyLlama model running in your browser.\n\n` +
    `To enable full local AI processing, ensure WebLLM can download and initialize the model properly.`;
};

// Cleanup function
export const cleanupWebLLM = async (): Promise<void> => {
  if (engine) {
    try {
      // Note: MLCEngine doesn't have a direct cleanup method in current version
      // The engine will be garbage collected when set to null
      engine = null;
      console.log('🧹 WebLLM engine cleaned up');
    } catch (error) {
      console.warn('Warning during WebLLM cleanup:', error);
    }
  }
};