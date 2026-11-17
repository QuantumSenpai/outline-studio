export const providers = [
  { id: 'nvidia', name: 'NVIDIA', keyUrl: 'https://build.nvidia.com/', docs: 'https://docs.api.nvidia.com/nim/docs/api-quickstart',
    base: 'https://integrate.api.nvidia.com/v1', model: 'meta/llama-3.3-70b-instruct',
    steps: ['Sign in to the NVIDIA API Catalog.', 'Open a supported text model and select Get API Key.', 'Copy your key, then validate and choose an available model here.'] },
  { id: 'groq', name: 'Groq', keyUrl: 'https://console.groq.com/keys', docs: 'https://console.groq.com/docs/quickstart',
    base: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-20b',
    steps: ['Sign in to the Groq console.', 'Create an API key under API Keys.', 'Validate your key here and select a model your account can use.'] },
  { id: 'gemini', name: 'Gemini', keyUrl: 'https://aistudio.google.com/apikey', docs: 'https://aistudio.google.com/docs/api-key',
    base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-3.8-flash',
    steps: ['Sign in to Google AI Studio and select a project.', 'Create an API key; new keys use the current authorization-key flow.', 'Use a key authorized for the Gemini API, then validate it here.'] },
  { id: 'openrouter', name: 'OpenRouter', keyUrl: 'https://openrouter.ai/settings/keys', docs: 'https://openrouter.ai/docs/quickstart',
    base: 'https://openrouter.ai/api/v1', model: 'openrouter/free',
    steps: ['Sign in to OpenRouter and open API Keys.', 'Create a key with a spending limit appropriate for you.', 'Validate here and choose a model. Check its price before authorizing.'] },
] as const;
export const providerVerificationDate = '2026-11-17';
