<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import githubLogo from '../assets/logos/github-black.svg';
import jpFlag from '../assets/logos/jp.svg';
import { useDashboardContext } from '../composables/useDashboardContext.ts';

const dashboard = useDashboardContext();
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads this binding */
const githubLogoUrl = githubLogo;
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads this binding */
const jpFlagUrl = jpFlag;
const checkedAtLabel = dashboard.checkedAtLabel;
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads these bindings */
const checkedAtParts = computed(() => {
  const value = checkedAtLabel.value;
  const separator = value.lastIndexOf(' ');

  if (separator === -1) {
    return {
      timestamp: value,
      timezone: '',
    };
  }

  return {
    timestamp: value.slice(0, separator),
    timezone: value.slice(separator + 1),
  };
});
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads these bindings */
const isLoading = dashboard.isLoading;
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads these bindings */
const notificationEnabled = dashboard.notificationEnabled;
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads these bindings */
const notificationPermission = dashboard.notificationPermission;
const notificationRules = dashboard.notificationRules;
const timeZoneMode = dashboard.timeZoneMode;
const helpPanelOpen = ref(false);
const helpPanelRef = ref<HTMLElement | null>(null);
const notificationPanelOpen = ref(false);
const notificationPanelRef = ref<HTMLElement | null>(null);

const incidentRuleKeys = [
  'success_to_warning',
  'success_to_alert',
  'unknown_to_warning',
  'unknown_to_alert',
  'warning_to_alert',
] as const;
const recoveryRuleKeys = ['alert_to_success'] as const;

const incidentRulesEnabled = computed(() =>
  incidentRuleKeys.every((key) => notificationRules.value[key]),
);
const recoveryRulesEnabled = computed(() =>
  recoveryRuleKeys.every((key) => notificationRules.value[key]),
);
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads this binding */
const helpTitle = computed(() =>
  timeZoneMode.value === 'jst' ? '使い方' : 'How to use',
);
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads this binding */
const helpItems = computed(() =>
  timeZoneMode.value === 'jst'
    ? [
        '公式 status page の情報のみを集約しています。各サービスから公式ページへ移動できます。',
        'データ更新は 5 分おきです。',
        '各行を開くと、現在の状態、影響リージョン、発生時刻を確認できます。',
        'ブラウザ通知はベルの設定から変更できます。',
      ]
    : [
        'Official status only. Each service links to its own status page.',
        'Data is refreshed every 5 minutes.',
        'Open a row to check current status, affected regions, and incident timing.',
        'Browser notifications can be configured from the bell settings.',
      ],
);
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads this binding */
const incidentRulesPartial = computed(
  () =>
    !incidentRulesEnabled.value &&
    incidentRuleKeys.some((key) => notificationRules.value[key]),
);
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads this binding */
const recoveryRulesPartial = computed(
  () =>
    !recoveryRulesEnabled.value &&
    recoveryRuleKeys.some((key) => notificationRules.value[key]),
);
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads this binding */
function ruleGroupIcon(allEnabled: boolean, partiallyEnabled: boolean) {
  if (allEnabled) {
    return 'check_box';
  }

  if (partiallyEnabled) {
    return 'indeterminate_check_box';
  }

  return 'check_box_outline_blank';
}

/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads this binding */
function toggleIncidentGroup() {
  dashboard.setNotificationRuleGroup(
    incidentRuleKeys,
    !incidentRulesEnabled.value,
  );
}

/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads this binding */
function toggleRecoveryGroup() {
  dashboard.setNotificationRuleGroup(
    recoveryRuleKeys,
    !recoveryRulesEnabled.value,
  );
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;

  if (helpPanelOpen.value && helpPanelRef.value?.contains(target) !== true) {
    helpPanelOpen.value = false;
  }

  if (
    notificationPanelOpen.value &&
    notificationPanelRef.value?.contains(target) !== true
  ) {
    notificationPanelOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown);
});
</script>

<template>
  <section class="hero card">
    <div class="hero-row">
      <div class="hero-title-block">
        <div class="hero-title-row">
          <h1 class="app-title">ServiceStatusChecker</h1>
        </div>
      </div>
      <div class="hero-actions">
        <div ref="helpPanelRef" class="footer-help">
          <button
            type="button"
            class="footer-help-button btn btn-sm btn-ghost"
            :class="{ 'is-active': helpPanelOpen }"
            aria-label="Open help"
            @click="helpPanelOpen = !helpPanelOpen"
          >
            <span class="material-symbols-outlined">help</span>
          </button>
          <div v-if="helpPanelOpen" class="footer-help-menu card">
            <p class="hero-help-title">{{ helpTitle }}</p>
            <ul class="hero-help-list">
              <li v-for="item in helpItems" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
        <a
          class="footer-github btn btn-sm btn-ghost"
          href="https://github.com/tokadev64/service-status-checker"
          target="_blank"
          rel="noreferrer"
          aria-label="Open GitHub repository"
        >
          <img :src="githubLogoUrl" alt="" aria-hidden="true" />
        </a>
        <div ref="notificationPanelRef" class="notification-panel">
          <button
            type="button"
            class="notification-toggle btn btn-sm"
            :class="{ 'is-active': notificationEnabled }"
            :aria-label="
              notificationEnabled
                ? 'Disable notifications'
                : 'Enable notifications'
            "
            :title="
              notificationPermission === 'denied'
                ? 'Notifications are blocked by the browser'
                : notificationEnabled
                  ? 'Notifications enabled'
                  : 'Notifications disabled'
            "
            @click="dashboard.toggleNotifications"
          >
            <span class="material-symbols-outlined">
              {{
                notificationEnabled
                  ? 'notifications_active'
                  : 'notifications_off'
              }}
            </span>
            <span class="notification-toggle-label">
              {{ notificationEnabled ? 'ON' : 'OFF' }}
            </span>
          </button>
          <button
            type="button"
            class="notification-config-toggle btn btn-sm btn-ghost btn-square"
            :class="{ 'is-active': notificationPanelOpen }"
            aria-label="Open notification settings"
            @click="notificationPanelOpen = !notificationPanelOpen"
          >
            <span class="material-symbols-outlined">tune</span>
          </button>
          <div v-if="notificationPanelOpen" class="notification-config-menu card">
            <div class="notification-rule-group">
              <div class="notification-group-label">
                <button
                  type="button"
                  class="notification-group-toggle btn btn-ghost btn-xs btn-square"
                  :aria-pressed="incidentRulesEnabled"
                  @click="toggleIncidentGroup"
                >
                  <span class="material-symbols-outlined">
                    {{ ruleGroupIcon(incidentRulesEnabled, incidentRulesPartial) }}
                  </span>
                </button>
                <span>Incident</span>
              </div>
            </div>
            <label class="notification-rule is-nested">
              <input
                type="checkbox"
                :checked="notificationRules.success_to_warning"
                @change="
                  dashboard.setNotificationRule(
                    'success_to_warning',
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
              <span>
                <span class="notification-status is-success">Success</span>
                →
                <span class="notification-status is-warning">Warning</span>
              </span>
            </label>
            <label class="notification-rule is-nested">
              <input
                type="checkbox"
                :checked="notificationRules.success_to_alert"
                @change="
                  dashboard.setNotificationRule(
                    'success_to_alert',
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
              <span>
                <span class="notification-status is-success">Success</span>
                →
                <span class="notification-status is-alert">Alert</span>
              </span>
            </label>
            <label class="notification-rule is-nested">
              <input
                type="checkbox"
                :checked="notificationRules.unknown_to_warning"
                @change="
                  dashboard.setNotificationRule(
                    'unknown_to_warning',
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
              <span>
                <span class="notification-status is-unknown">Unknown</span>
                →
                <span class="notification-status is-warning">Warning</span>
              </span>
            </label>
            <label class="notification-rule is-nested">
              <input
                type="checkbox"
                :checked="notificationRules.unknown_to_alert"
                @change="
                  dashboard.setNotificationRule(
                    'unknown_to_alert',
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
              <span>
                <span class="notification-status is-unknown">Unknown</span>
                →
                <span class="notification-status is-alert">Alert</span>
              </span>
            </label>
            <label class="notification-rule is-nested">
              <input
                type="checkbox"
                :checked="notificationRules.warning_to_alert"
                @change="
                  dashboard.setNotificationRule(
                    'warning_to_alert',
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
              <span>
                <span class="notification-status is-warning">Warning</span>
                →
                <span class="notification-status is-alert">Alert</span>
              </span>
            </label>
            <div class="notification-rule-group">
              <div class="notification-group-label">
                <button
                  type="button"
                  class="notification-group-toggle btn btn-ghost btn-xs btn-square"
                  :aria-pressed="recoveryRulesEnabled"
                  @click="toggleRecoveryGroup"
                >
                  <span class="material-symbols-outlined">
                    {{ ruleGroupIcon(recoveryRulesEnabled, recoveryRulesPartial) }}
                  </span>
                </button>
                <span>Recovery</span>
              </div>
            </div>
            <label class="notification-rule is-nested">
              <input
                type="checkbox"
                :checked="notificationRules.alert_to_success"
                @change="
                  dashboard.setNotificationRule(
                    'alert_to_success',
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
              <span>
                <span class="notification-status is-alert">Alert</span>
                →
                <span class="notification-status is-success">Success</span>
              </span>
            </label>
          </div>
        </div>
        <div class="timezone-toggle join" aria-label="Timezone switcher">
          <button
            type="button"
            class="timezone-button btn btn-sm join-item"
            :class="{ 'is-active': timeZoneMode === 'jst' }"
            aria-label="Show JST (UTC+9)"
            title="JST (UTC+9)"
            @click="dashboard.setTimeZoneMode('jst')"
          >
            <img class="timezone-button-flag" :src="jpFlagUrl" alt="" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="timezone-button btn btn-sm join-item"
            :class="{ 'is-active': timeZoneMode === 'utc' }"
            aria-label="Show UTC"
            title="UTC"
            @click="dashboard.setTimeZoneMode('utc')"
          >
            <span class="material-symbols-outlined timezone-button-icon">
              language
            </span>
          </button>
        </div>
        <p class="meta-row">
          <span class="meta-row-label">Last Updated:</span>
          <span class="meta-row-timestamp">{{ checkedAtParts.timestamp }}</span>
          <span class="meta-row-timezone">{{ checkedAtParts.timezone }}</span>
        </p>
      </div>
    </div>
    <span v-if="isLoading" class="sr-only">更新中</span>
  </section>
</template>
