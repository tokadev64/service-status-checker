export type ServiceIndicator =
  | 'operational'
  | 'degraded_performance'
  | 'partial_outage'
  | 'major_outage'
  | 'under_maintenance'
  | 'unknown';

export type PresentationTone = 'green' | 'yellow' | 'red' | 'gray';
export type ServiceCategory =
  | 'core-infra'
  | 'developer-platform'
  | 'ai'
  | 'work-collaboration'
  | 'business-apps';
export type ServiceSourceKind =
  | 'statuspage'
  | 'google-cloud'
  | 'google-workspace'
  | 'pagerduty'
  | 'aws-health'
  | 'microsoft-feed'
  | 'slack-status'
  | 'docker-statusio'
  | 'simple-up-status'
  | 'bitwarden-status'
  | 'betterstack-status'
  | 'instatus-status';

export interface ServiceDefinition {
  key: string;
  name: string;
  category: ServiceCategory;
  statusUrl: string;
  summaryUrl?: string;
  sourceKind: ServiceSourceKind;
  componentName?: string;
}

export interface ServiceStatus {
  key: string;
  name: string;
  category: ServiceCategory;
  statusUrl: string;
  indicator: ServiceIndicator;
  checkedAt: string;
  checkedAtLabel: string;
  since?: string;
  sinceLabel?: string;
  regions?: string[];
  presentation: {
    tone: PresentationTone;
    icon: string;
    label: string;
  };
}

export interface StatusResponse {
  checkedAt: string;
  checkedAtLabel: string;
  services: ServiceStatus[];
}
