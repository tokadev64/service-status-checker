export interface StatuspageComponent {
  name: string;
  status: string;
  updated_at?: string;
  group?: boolean;
}

export interface StatuspageSummary {
  page: {
    updated_at: string;
  };
  status: {
    description: string;
    indicator: string;
  };
  components?: StatuspageComponent[];
}

export interface GoogleStatusLocation {
  title: string;
  id: string;
}

export interface GoogleCloudIncidentUpdate {
  when?: string;
  text?: string;
  status?: string;
  affected_locations?: GoogleStatusLocation[];
}

export interface GoogleCloudIncident {
  begin: string;
  end?: string;
  severity?: 'low' | 'medium' | 'high';
  external_desc?: string;
  status_impact?:
    | 'SERVICE_INFORMATION'
    | 'SERVICE_DISRUPTION'
    | 'SERVICE_OUTAGE';
  updates?: GoogleCloudIncidentUpdate[];
  most_recent_update?: GoogleCloudIncidentUpdate;
  currently_affected_locations?: GoogleStatusLocation[];
  previously_affected_locations?: GoogleStatusLocation[];
}

export interface GoogleWorkspaceIncident {
  begin: string;
  end?: string;
  severity?: 'low' | 'medium' | 'high';
  status_impact?:
    | 'SERVICE_INFORMATION'
    | 'SERVICE_DISRUPTION'
    | 'SERVICE_OUTAGE';
  service_name?: string;
  external_desc?: string;
  most_recent_update?: GoogleCloudIncidentUpdate;
}

export interface PagerDutyDashboardData {
  layout?: {
    layout_settings?: { statusPage?: { globalStatusHeadline?: string } };
  };
}

export interface AwsHealthEventLog {
  status?: string | number;
  summary?: string;
  message?: string;
  timestamp?: string | number;
}

export interface AwsHealthEvent {
  summary?: string;
  date?: string;
  region_name?: string;
  status?: string | number;
  event_log?: AwsHealthEventLog[];
}

export type AwsHealthResponse = AwsHealthEvent[];

export interface MicrosoftFeedItem {
  title?: string;
  pubDate?: string;
  status?: string;
}

export interface SimpleUpStatusResponse {
  page?: {
    status?: string;
  };
}
