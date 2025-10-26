import { getTranslation } from '../i18n/translations';
import { functionApi } from './functionCallingService';

type TranslationFunc = (key: string, substitutions?: Record<string, string>) => string;

const calculate = (num1: number, operator: string, num2: number): string | number => {
    switch (operator) {
        case '+': return num1 + num2;
        case '-': return num1 - num2;
        case '*': return num1 * num2;
        case '/':
            if (num2 === 0) return 'division_by_zero';
            return num1 / num2;
        default: return 'invalid_operator';
    }
}

export const getOfflineResponse = async (prompt: string, t: TranslationFunc): Promise<string> => {
    const lowerCasePrompt = prompt.toLowerCase().trim();

    // 1. Check for math operations
    const mathRegex = /^\s*(\d+\.?\d*)\s*([+\-*/])\s*(\d+\.?\d*)\s*$/;
    const mathMatch = lowerCasePrompt.match(mathRegex);

    if (mathMatch) {
        const num1 = parseFloat(mathMatch[1]);
        const operator = mathMatch[2];
        const num2 = parseFloat(mathMatch[3]);
        const result = calculate(num1, operator, num2);

        if (typeof result === 'number') {
            return t('offline_math_result', { result: result.toString() });
        } else if (result === 'division_by_zero') {
            return t('offline_math_divide_by_zero');
        } else {
            return t('offline_math_error');
        }
    }

    // 2. Check for reminder command
    const reminderMatch = prompt.match(/remind me in (\d+)\s*(second|minute|hour)s? to (.+)/i);
    if (reminderMatch) {
        const value = parseInt(reminderMatch[1], 10);
        const unit = reminderMatch[2].toLowerCase();
        const title = reminderMatch[3].trim();

        let delayInSeconds = 0;
        if (unit === 'second') delayInSeconds = value;
        else if (unit === 'minute') delayInSeconds = value * 60;
        else if (unit === 'hour') delayInSeconds = value * 3600;
        
        if (delayInSeconds > 0 && title) {
            const result = await functionApi.createReminder(title, delayInSeconds);
            if (result.status === 'success') {
                return t('funcReminderSet', { title, time: `${value} ${unit}(s)` });
            } else {
                if ((result as any).code === 'PERMISSION_DENIED') {
                    return t('funcReminderPermissionDenied');
                }
                return t('funcReminderError', { message: result.message || 'Unknown error' });
            }
        }
    }

    // 3. Check for keywords
    const keywordMap: { [key: string]: string[] } = {
        'offline_greeting': ['hello', 'hi', 'hey', '你好'],
        'offline_how_are_you': ['how are you', 'how is it going', 'how are you doing', '你好嗎'],
        'offline_thank_you': ['thank you', 'thanks', 'thank u', '謝謝'],
        'offline_goodbye': ['bye', 'goodbye', 'see you', '再見'],
    };

    for (const key in keywordMap) {
        if (keywordMap[key].some(keyword => lowerCasePrompt.includes(keyword))) {
            return t(key);
        }
    }

    // 4. Default response
    return t('offline_unknown');
};