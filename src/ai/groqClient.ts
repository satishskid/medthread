import { localAI } from './webllmClient';

// Demo GROQ API key - loaded from environment variables
const DEMO_GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || '';

// In-memory storage for user's GROQ API key (premium tier)
let userGroqKey: string | null = null;

// Set user's GROQ API key (in-memory only)
export const setUserGroqKey = (apiKey: string | null): void => {
  userGroqKey = apiKey;
  console.log(apiKey ? '🔐 User GROQ key set (premium mode)' : '🔓 User GROQ key cleared');
};

// Get current GROQ key status
export const getGroqKeyStatus = (): { hasUserKey: boolean; isDemoMode: boolean } => {
  return {
    hasUserKey: !!userGroqKey,
    isDemoMode: !userGroqKey
  };
};

// Main AI call function with fallback logic
export const callAI = async (messages: any[], systemPrompt: string): Promise<string> => {
  try {
    // Try user's GROQ key first (premium mode)
    if (userGroqKey) {
      console.log('🚀 Using user GROQ key (premium mode)');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userGroqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response generated.';
      } else {
        console.warn('⚠️ User GROQ key failed, falling back to demo mode');
        return await callAIDemo(messages, systemPrompt);
      }
    }

    // Fallback to demo mode
    console.log('📱 Using demo mode (local AI)');
    return await callAIDemo(messages, systemPrompt);

  } catch (error) {
    console.error('❌ AI call failed:', error);
    // Final fallback to demo mode
    return await callAIDemo(messages, systemPrompt);
  }
};

// Demo mode using local AI or demo GROQ key
export const callAIDemo = async (messages: any[], systemPrompt: string): Promise<string> => {
  try {
    // Try demo GROQ key if available
    if (DEMO_GROQ_API_KEY) {
      console.log('🎯 Using demo GROQ key');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEMO_GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response generated.';
      }
    }

    // Final fallback to local AI
    console.log('🏠 Using local AI (WebLLM)');
    const combinedPrompt = `${systemPrompt}\n\nUser: ${messages[messages.length - 1]?.content || 'Hello'}`;
    return await localAI(combinedPrompt);

  } catch (error) {
    console.error('❌ Demo AI call failed:', error);
    return 'I apologize, but I\'m currently experiencing technical difficulties. Please try again later or check your API configuration.';
  }
};