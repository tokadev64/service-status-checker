import type { PresentationTone } from '../shared/types.ts';

export type NotificationRuleKey =
  | 'success_to_warning'
  | 'success_to_alert'
  | 'unknown_to_warning'
  | 'unknown_to_alert'
  | 'warning_to_alert'
  | 'alert_to_success';

export interface NotificationRuleSettings {
  success_to_warning: boolean;
  success_to_alert: boolean;
  unknown_to_warning: boolean;
  unknown_to_alert: boolean;
  warning_to_alert: boolean;
  alert_to_success: boolean;
}

export const defaultNotificationRuleSettings: NotificationRuleSettings = {
  success_to_warning: true,
  success_to_alert: true,
  unknown_to_warning: false,
  unknown_to_alert: false,
  warning_to_alert: true,
  alert_to_success: true,
};

export function shouldNotifyOnTransition(
  previousTone: PresentationTone,
  nextTone: PresentationTone,
  settings: NotificationRuleSettings = defaultNotificationRuleSettings,
) {
  return (
    (settings.success_to_warning &&
      previousTone === 'green' &&
      nextTone === 'yellow') ||
    (settings.success_to_alert &&
      previousTone === 'green' &&
      nextTone === 'red') ||
    (settings.unknown_to_warning &&
      previousTone === 'gray' &&
      nextTone === 'yellow') ||
    (settings.unknown_to_alert &&
      previousTone === 'gray' &&
      nextTone === 'red') ||
    (settings.warning_to_alert &&
      previousTone === 'yellow' &&
      nextTone === 'red') ||
    (settings.alert_to_success &&
      previousTone === 'red' &&
      nextTone === 'green')
  );
}
