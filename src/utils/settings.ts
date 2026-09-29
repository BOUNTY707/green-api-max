import type { InstanceSettings } from '../types';

/** Settings required to receive messages through the HTTP API (polling). */
export const REQUIRED_SETTINGS: InstanceSettings = {
  webhookUrl: '',
  incomingWebhook: 'yes',
  outgoingWebhook: 'yes',
  outgoingMessageWebhook: 'yes',
  outgoingAPIMessageWebhook: 'yes',
};

export function isReceivingConfigured(settings: Partial<InstanceSettings>): boolean {
  return (
    !settings.webhookUrl && settings.incomingWebhook === 'yes' && settings.outgoingWebhook === 'yes' // delivery / read statuses
  );
}
