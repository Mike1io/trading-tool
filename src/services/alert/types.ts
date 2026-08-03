export enum AlertThresholdUSD {
  USD_100K = 100000,
  USD_500K = 500000,
  USD_1M = 1000000,
  USD_5M = 5000000,
  USD_10M = 10000000,
}

export type NotificationChannel =
  | 'TELEGRAM'
  | 'DISCORD'
  | 'EMAIL'
  | 'WEB_PUSH'
  | 'MOBILE_PUSH';

export interface DispatchNotificationPayload {
  userId: string;
  alertId: string;
  ruleName: string;
  title: string;
  message: string;
  channels: NotificationChannel[];
  eventData: any;
  userSettings?: {
    telegramChatId?: string;
    discordWebhookUrl?: string;
    email?: string;
    webPushToken?: string;
    mobilePushToken?: string;
  };
}
