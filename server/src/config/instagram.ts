import dotenv from 'dotenv';

dotenv.config();

interface InstagramConfig {
  appId: string;
  appSecret: string;
  accessToken: string;
  businessId: string;
  configured: boolean;
}

let cachedConfig: InstagramConfig | null = null;
let configVerified = false;

function loadConfig(): InstagramConfig {
  return {
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
    businessId: process.env.INSTAGRAM_BUSINESS_ID || '',
    get configured() {
      return !!(this.appId && this.appSecret && this.accessToken && this.businessId);
    },
  };
}

export function verificarConfiguracion(): boolean {
  if (configVerified) return cachedConfig?.configured ?? false;
  cachedConfig = loadConfig();
  configVerified = true;
  return cachedConfig.configured;
}

export function getConfig(): InstagramConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
    configVerified = true;
  }
  return cachedConfig;
}
