import {
  type ComputedRef,
  computed,
  type InjectionKey,
  inject,
  onMounted,
  onUnmounted,
  provide,
  type Ref,
  ref,
} from 'vue';
import type {
  PresentationTone,
  ServiceStatus,
  StatusResponse,
} from '../shared/types.ts';
import {
  defaultNotificationRuleSettings,
  type NotificationRuleKey,
  type NotificationRuleSettings,
  shouldNotifyOnTransition,
} from './dashboard-notifications.ts';

const POLL_INTERVAL_MS = 30_000;
const TIME_ZONE_STORAGE_KEY = 'dashboard-time-zone';
const NOTIFICATION_STORAGE_KEY = 'dashboard-notifications-enabled';
const NOTIFICATION_RULES_STORAGE_KEY = 'dashboard-notification-rules';
const NOTIFICATION_RULES_VERSION_KEY = 'dashboard-notification-rules-version';
const NOTIFICATION_RULES_VERSION = '2';

type TimeZoneMode = 'jst' | 'utc';

interface DashboardContextValue {
  checkedAtLabel: ComputedRef<string>;
  errorMessage: Ref<string>;
  isLoading: Ref<boolean>;
  notificationEnabled: Ref<boolean>;
  notificationRules: Ref<NotificationRuleSettings>;
  notificationPermission: Ref<NotificationPermission | 'unsupported'>;
  services: ComputedRef<ServiceStatus[]>;
  setNotificationRuleGroup: (
    keys: readonly NotificationRuleKey[],
    enabled: boolean,
  ) => void;
  setNotificationRule: (key: NotificationRuleKey, enabled: boolean) => void;
  toggleNotifications: () => Promise<void>;
  timeZoneMode: Ref<TimeZoneMode>;
  setTimeZoneMode: (mode: TimeZoneMode) => void;
}

const dashboardContextKey: InjectionKey<DashboardContextValue> =
  Symbol('dashboard-context');

export function provideDashboardContext() {
  const data = ref<StatusResponse | null>(null);
  const errorMessage = ref('');
  const isLoading = ref(false);
  const notificationEnabled = ref(false);
  const notificationRules = ref<NotificationRuleSettings>({
    ...defaultNotificationRuleSettings,
  });
  const notificationPermission = ref<NotificationPermission | 'unsupported'>(
    'default',
  );
  const timeZoneMode = ref<TimeZoneMode>('jst');
  const previousIndicators = ref<Map<string, PresentationTone> | null>(null);
  let timerId: number | undefined;

  async function load() {
    isLoading.value = true;

    try {
      const response = await fetch('/api/status');

      if (!response.ok) {
        throw new Error(`status ${response.status}`);
      }

      const nextData = (await response.json()) as StatusResponse;
      notifyServiceTransitions(nextData.services);
      data.value = nextData;
      errorMessage.value = '';
    } catch (error) {
      console.error(error);
      errorMessage.value = '状態取得に失敗しました';
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    const savedTimeZone = window.localStorage.getItem(TIME_ZONE_STORAGE_KEY);
    if (savedTimeZone === 'jst' || savedTimeZone === 'utc') {
      timeZoneMode.value = savedTimeZone;
    }
    const savedNotificationFlag = window.localStorage.getItem(
      NOTIFICATION_STORAGE_KEY,
    );
    notificationEnabled.value = savedNotificationFlag === 'true';
    const savedRules = window.localStorage.getItem(
      NOTIFICATION_RULES_STORAGE_KEY,
    );
    const savedRulesVersion = window.localStorage.getItem(
      NOTIFICATION_RULES_VERSION_KEY,
    );
    if (savedRules && savedRulesVersion === NOTIFICATION_RULES_VERSION) {
      notificationRules.value = parseNotificationRules(savedRules);
    } else {
      notificationRules.value = { ...defaultNotificationRuleSettings };
      persistNotificationRules();
    }
    notificationPermission.value = getNotificationPermission();

    void load();
    timerId = window.setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);
  });

  onUnmounted(() => {
    if (timerId !== undefined) {
      window.clearInterval(timerId);
    }
  });

  function setTimeZoneMode(mode: TimeZoneMode) {
    timeZoneMode.value = mode;
    window.localStorage.setItem(TIME_ZONE_STORAGE_KEY, mode);
  }

  async function toggleNotifications() {
    if (!isNotificationSupported()) {
      notificationPermission.value = 'unsupported';
      notificationEnabled.value = false;
      return;
    }

    if (notificationEnabled.value) {
      notificationEnabled.value = false;
      window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'false');
      return;
    }

    if (Notification.permission === 'default') {
      notificationPermission.value = await Notification.requestPermission();
    } else {
      notificationPermission.value = Notification.permission;
    }

    if (notificationPermission.value !== 'granted') {
      notificationEnabled.value = false;
      window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'false');
      return;
    }

    notificationEnabled.value = true;
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'true');
  }

  function setNotificationRule(key: NotificationRuleKey, enabled: boolean) {
    notificationRules.value = {
      ...notificationRules.value,
      [key]: enabled,
    };
    persistNotificationRules();
  }

  function setNotificationRuleGroup(
    keys: readonly NotificationRuleKey[],
    enabled: boolean,
  ) {
    const nextRules = { ...notificationRules.value };
    for (const key of keys) {
      nextRules[key] = enabled;
    }
    notificationRules.value = nextRules;
    persistNotificationRules();
  }

  function persistNotificationRules() {
    window.localStorage.setItem(
      NOTIFICATION_RULES_STORAGE_KEY,
      JSON.stringify(notificationRules.value),
    );
    window.localStorage.setItem(
      NOTIFICATION_RULES_VERSION_KEY,
      NOTIFICATION_RULES_VERSION,
    );
  }

  function notifyServiceTransitions(nextServices: ServiceStatus[]) {
    const nextIndicators = new Map(
      nextServices.map((service) => [service.key, service.presentation.tone]),
    );

    if (!previousIndicators.value) {
      previousIndicators.value = nextIndicators;
      return;
    }

    if (
      !notificationEnabled.value ||
      notificationPermission.value !== 'granted' ||
      !isNotificationSupported()
    ) {
      previousIndicators.value = nextIndicators;
      return;
    }

    for (const service of nextServices) {
      const previousTone = previousIndicators.value.get(service.key);
      const nextTone = service.presentation.tone;

      if (
        !previousTone ||
        !shouldNotifyOnTransition(
          previousTone,
          nextTone,
          notificationRules.value,
        )
      ) {
        continue;
      }

      new Notification(service.name, {
        body: service.presentation.label,
        tag: `service-status-${service.key}`,
      });
    }

    previousIndicators.value = nextIndicators;
  }

  const context: DashboardContextValue = {
    checkedAtLabel: computed(() =>
      data.value?.checkedAt
        ? formatTimestampLabel(data.value.checkedAt, timeZoneMode.value)
        : '未取得',
    ),
    errorMessage,
    isLoading,
    notificationEnabled,
    notificationRules,
    notificationPermission,
    services: computed(() =>
      (data.value?.services ?? []).map((service) => ({
        ...service,
        checkedAtLabel: formatTimestampLabel(
          service.checkedAt,
          timeZoneMode.value,
        ),
        sinceLabel: service.since
          ? formatTimestampLabel(service.since, timeZoneMode.value)
          : undefined,
      })),
    ),
    setNotificationRuleGroup,
    setNotificationRule,
    toggleNotifications,
    timeZoneMode,
    setTimeZoneMode,
  };

  provide(dashboardContextKey, context);
  return context;
}

function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function getNotificationPermission(): NotificationPermission | 'unsupported' {
  return isNotificationSupported() ? Notification.permission : 'unsupported';
}

function parseNotificationRules(rawValue: string): NotificationRuleSettings {
  try {
    const parsed = JSON.parse(rawValue) as Partial<NotificationRuleSettings>;
    const hasNewRuleKey =
      'success_to_warning' in parsed ||
      'success_to_alert' in parsed ||
      'unknown_to_warning' in parsed ||
      'unknown_to_alert' in parsed ||
      'warning_to_alert' in parsed ||
      'alert_to_success' in parsed;

    if (!hasNewRuleKey) {
      return { ...defaultNotificationRuleSettings };
    }

    return {
      success_to_warning:
        parsed.success_to_warning ??
        defaultNotificationRuleSettings.success_to_warning,
      success_to_alert:
        parsed.success_to_alert ??
        defaultNotificationRuleSettings.success_to_alert,
      unknown_to_warning:
        parsed.unknown_to_warning ??
        defaultNotificationRuleSettings.unknown_to_warning,
      unknown_to_alert:
        parsed.unknown_to_alert ??
        defaultNotificationRuleSettings.unknown_to_alert,
      warning_to_alert:
        parsed.warning_to_alert ??
        defaultNotificationRuleSettings.warning_to_alert,
      alert_to_success:
        parsed.alert_to_success ??
        defaultNotificationRuleSettings.alert_to_success,
    };
  } catch {
    return { ...defaultNotificationRuleSettings };
  }
}

function formatTimestampLabel(value: string, mode: TimeZoneMode) {
  const date = new Date(value);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: mode === 'jst' ? 'Asia/Tokyo' : 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const day = parts.find((part) => part.type === 'day')?.value ?? '00';
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';

  return `${year}-${month}-${day} ${hour}:${minute} ${mode.toUpperCase()}`;
}

export function useDashboardContext() {
  const context = inject(dashboardContextKey);

  if (!context) {
    throw new Error('Dashboard context is not provided');
  }

  return context;
}
