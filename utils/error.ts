
export interface ParsedError {
    key: string;
    params?: { [key: string]: string };
}

// Custom error class to carry structured i18n-friendly error information
export class ParsedApiError extends Error {
  public key: string;
  public params?: { [key: string]: string };

  constructor(key: string, params?: { [key: string]: string }) {
    // Pass a generic message to the Error constructor
    super('A parsed API error occurred.'); 
    this.name = 'ParsedApiError';
    this.key = key;
    this.params = params;
    // This line is needed to restore the prototype chain
    Object.setPrototypeOf(this, ParsedApiError.prototype);
  }
}

export const parseGoogleGenAIError = (error: any): ParsedError => {
  let message = 'An unknown error occurred. Please check the console for details.';

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  const lowerCaseMessage = message.toLowerCase();

  if (lowerCaseMessage.includes('prompt was blocked')) {
      return { key: 'error_promptBlocked' };
  }
  if (lowerCaseMessage.includes('malformed content')) {
      return { key: 'error_malformedContent' };
  }
  if (message.includes('API key not valid') || message.includes('API_KEY_INVALID')) {
    return { key: 'error_apiKeyInvalid' };
  }
  if (message.includes('quota') || message.includes('resource exhausted') || message.includes('RESOURCE_EXHAUSTED')) {
    return { key: 'error_quotaExceeded' };
  }
  if (message.includes('503') || message.includes('service is currently unavailable')) {
      return { key: 'error_serviceUnavailable' };
  }
  if (message.includes('model is not found')) {
      return { key: 'error_modelNotFound' };
  }
  if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
      return { key: 'error_networkError' };
  }
  if (message.includes('Invalid argument')) {
      return { key: 'error_invalidArgument', params: { message } };
  }

  // Fallback for generic but informative messages
  return { key: 'error_apiGeneric', params: { message } };
};