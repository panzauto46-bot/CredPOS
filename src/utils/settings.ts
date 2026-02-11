// Settings storage for app preferences
export interface AppSettings {
    currency: string;
    currencySymbol: string;
    currencyLocale: string;
}

const SETTINGS_KEY = 'credpos_settings';

export const CURRENCIES = [
    { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar' },
    { code: 'IDR', symbol: 'Rp', locale: 'id-ID', name: 'Indonesian Rupiah' },
    { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro' },
    { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen' },
    { code: 'SGD', symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar' },
    { code: 'MYR', symbol: 'RM', locale: 'ms-MY', name: 'Malaysian Ringgit' },
    { code: 'THB', symbol: '฿', locale: 'th-TH', name: 'Thai Baht' },
    { code: 'PHP', symbol: '₱', locale: 'en-PH', name: 'Philippine Peso' },
    { code: 'VND', symbol: '₫', locale: 'vi-VN', name: 'Vietnamese Dong' },
    { code: 'INR', symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
    { code: 'AUD', symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
];

const DEFAULT_SETTINGS: AppSettings = {
    currency: 'USD',
    currencySymbol: '$',
    currencyLocale: 'en-US',
};

export const settingsStorage = {
    getSettings: (): AppSettings => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return DEFAULT_SETTINGS;
    },

    saveSettings: (settings: AppSettings): void => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    },

    setCurrency: (currencyCode: string): void => {
        const currency = CURRENCIES.find(c => c.code === currencyCode);
        if (currency) {
            const settings = settingsStorage.getSettings();
            settings.currency = currency.code;
            settings.currencySymbol = currency.symbol;
            settings.currencyLocale = currency.locale;
            settingsStorage.saveSettings(settings);
        }
    },

    formatCurrency: (amount: number): string => {
        const settings = settingsStorage.getSettings();
        return new Intl.NumberFormat(settings.currencyLocale, {
            style: 'currency',
            currency: settings.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    },
};

// QRIS Image Storage
const QRIS_KEY = 'credpos_qris_image';

export const qrisStorage = {
    getQrisImage: (): string | null => {
        try {
            return localStorage.getItem(QRIS_KEY);
        } catch (error) {
            console.error('Error loading QRIS image:', error);
            return null;
        }
    },

    saveQrisImage: (base64Image: string): void => {
        try {
            localStorage.setItem(QRIS_KEY, base64Image);
        } catch (error) {
            console.error('Error saving QRIS image:', error);
        }
    },

    removeQrisImage: (): void => {
        try {
            localStorage.removeItem(QRIS_KEY);
        } catch (error) {
            console.error('Error removing QRIS image:', error);
        }
    },

    hasQrisImage: (): boolean => {
        return !!localStorage.getItem(QRIS_KEY);
    },
};
