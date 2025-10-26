import { FunctionDeclaration, Type } from '@google/genai';

// Define available functions
export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'getCurrentWeather',
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: {
          type: Type.STRING,
          description: 'The city and state, e.g., San Francisco, CA',
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'setLightBrightness',
    parameters: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.NUMBER,
          description: 'The brightness level from 0 (off) to 100 (full).',
        },
        color: {
            type: Type.STRING,
            description: 'Optional color of the light, e.g., "warm white", "daylight", "blue".'
        }
      },
      required: ['level'],
    },
  },
  {
    name: 'createReminder',
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: 'The title or subject of the reminder.'
            },
            delayInSeconds: {
                type: Type.NUMBER,
                description: 'The delay in seconds from now to show the reminder. The model must calculate this from the user\'s prompt (e.g., "in 5 minutes" is 300 seconds).'
            }
        },
        required: ['title', 'delayInSeconds']
    }
  },
  {
      name: 'translate',
      parameters: {
          type: Type.OBJECT,
          properties: {
              text: {
                  type: Type.STRING,
                  description: 'The text to be translated.'
              },
              targetLanguage: {
                  type: Type.STRING,
                  description: 'The target language for translation, e.g., "Spanish", "Japanese".'
              }
          },
          required: ['text', 'targetLanguage']
      }
  },
  {
    name: 'saveFavoriteArticle',
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: 'The title of the article.'
            },
            url: {
                type: Type.STRING,
                description: 'The URL of the article to save.'
            }
        },
        required: ['title', 'url']
    }
  }
];

// Mock function implementations
export const functionApi = {
  getCurrentWeather: (location: string) => {
    const weathers = ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Windy'];
    const randomTemp = Math.floor(Math.random() * 35);
    const randomCondition = weathers[Math.floor(Math.random() * weathers.length)];
    return { temperature: `${randomTemp}°C`, condition: randomCondition };
  },
  setLightBrightness: (level: number, color?: string) => {
    return { status: 'OK', brightness: level, color: color || 'default' };
  },
  createReminder: async (title: string, delayInSeconds: number) => {
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        return { status: 'error', message: 'Notifications or Service Workers are not supported in this browser.' };
      }

      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'denied') {
        return {
          status: 'error',
          code: 'PERMISSION_DENIED',
          message: 'Notification permission has been denied. Please guide the user to go to their browser\'s site settings to enable notifications for this website, and then try again.'
        };
      }

      const registration = await navigator.serviceWorker.ready;
      // FIX: Call `postMessage` on the active ServiceWorker instance (`registration.active`) instead of on the ServiceWorkerRegistration object.
      registration.active?.postMessage({
        action: 'scheduleNotification',
        title: title,
        delayInSeconds: delayInSeconds,
      });

      return { status: 'success', reminder: `Reminder for '${title}' scheduled to go off in ${delayInSeconds} seconds.` };
    } catch (error) {
        console.error('Error setting reminder:', error);
        return { status: 'error', message: 'Failed to set reminder.' };
    }
  },
  translate: (text: string, targetLanguage: string) => {
    return { status: 'success', translatedText: `(Mock translation of '${text}' to ${targetLanguage})` };
  },
  saveFavoriteArticle: (title: string, url: string) => {
    // In a real app, you'd save this to a database or local storage.
    console.log(`Saving article: "${title}" from ${url}`);
    return { status: 'success', message: `Article '${title}' saved successfully.` };
  }
};