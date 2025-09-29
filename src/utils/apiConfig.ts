// API Configuration and Key Management
export interface APIKeys {
  geminiApiKey?: string;
  replicateApiKey?: string;
}

// Store API keys in localStorage for this demo
export const getAPIKeys = (): APIKeys => {
  return {
    geminiApiKey: localStorage.getItem('geminiApiKey') || undefined,
    replicateApiKey: localStorage.getItem('replicateApiKey') || undefined,
  };
};

export const setAPIKey = (service: 'gemini' | 'replicate', key: string) => {
  localStorage.setItem(`${service}ApiKey`, key);
};

export const hasRequiredKeys = (): boolean => {
  const keys = getAPIKeys();
  return Boolean(keys.geminiApiKey && keys.replicateApiKey);
};