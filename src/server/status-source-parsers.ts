import type {
  ServiceDefinition,
  ServiceIndicator,
  ServiceStatus,
} from '../shared/types.ts';
import type {
  AwsHealthResponse,
  GoogleCloudIncident,
  GoogleWorkspaceIncident,
  MicrosoftFeedItem,
  PagerDutyDashboardData,
  SimpleUpStatusResponse,
  StatuspageSummary,
} from './status-source-types.ts';

interface CreateServiceStatusInput {
  checkedAt: string;
  definition: ServiceDefinition;
  description: string;
  indicator: ServiceIndicator;
  regions?: string[];
  since?: string;
}

export function parseStatuspageSummary(
  definition: ServiceDefinition,
  checkedAt: string,
  summary: StatuspageSummary,
): ServiceStatus {
  const componentName = definition.componentName?.toLowerCase();
  const component = componentName
    ? summary.components?.find((item) =>
        item.name.toLowerCase().includes(componentName),
      )
    : undefined;
  const indicator = normalizeIndicator(
    component?.status ?? summary.status.indicator,
  );
  const since = component?.updated_at ?? summary.page.updated_at;
  const regions = extractStatuspageRegions(summary, definition.category);

  return createServiceStatus({
    checkedAt,
    definition,
    description: summary.status.description,
    indicator,
    regions,
    since: indicator === 'operational' ? undefined : since,
  });
}

export function parseGoogleCloudIncidents(
  definition: ServiceDefinition,
  checkedAt: string,
  incidents: GoogleCloudIncident[],
): ServiceStatus {
  const activeIncident = incidents.find((incident) => !incident.end);

  if (!activeIncident) {
    return createServiceStatus({
      checkedAt,
      definition,
      description: 'Available',
      indicator: 'operational',
    });
  }

  const indicator = googleSeverityToIndicator(activeIncident);
  const description = activeIncident.external_desc ?? 'Service disruption';
  const regions = extractGoogleCloudRegions(activeIncident);

  return createServiceStatus({
    checkedAt,
    definition,
    description,
    indicator,
    regions,
    since: activeIncident.begin,
  });
}

export function parseGoogleWorkspaceIncidents(
  definition: ServiceDefinition,
  checkedAt: string,
  incidents: GoogleWorkspaceIncident[],
): ServiceStatus {
  const activeIncident = incidents.find((incident) => !incident.end);

  if (!activeIncident) {
    return createServiceStatus({
      checkedAt,
      definition,
      description: 'Available',
      indicator: 'operational',
    });
  }

  return createServiceStatus({
    checkedAt,
    definition,
    description: googleWorkspaceDescription(activeIncident),
    indicator: googleStatusImpactToIndicator(
      activeIncident.status_impact,
      activeIncident.severity,
    ),
    since: activeIncident.most_recent_update?.when ?? activeIncident.begin,
  });
}

export function parsePagerDutyDashboard(
  definition: ServiceDefinition,
  checkedAt: string,
  pageData: PagerDutyDashboardData,
): ServiceStatus {
  const headline =
    pageData.layout?.layout_settings?.statusPage?.globalStatusHeadline?.trim() ??
    '';
  const indicator = pagerDutyHeadlineToIndicator(headline);

  return createServiceStatus({
    checkedAt,
    definition,
    description: headline || 'Status unavailable',
    indicator,
    since: indicator === 'operational' ? undefined : checkedAt,
  });
}

export function parseAwsHealthResponse(
  definition: ServiceDefinition,
  checkedAt: string,
  events: AwsHealthResponse,
): ServiceStatus {
  const activeEvent = events.find(
    (event) => awsStatusToIndicator(event.status) !== 'operational',
  );

  if (!activeEvent) {
    return createServiceStatus({
      checkedAt,
      definition,
      description: 'Service is operating normally',
      indicator: 'operational',
    });
  }

  const indicator = awsStatusToIndicator(activeEvent.status);
  const latestLog = activeEvent.event_log?.at(-1);
  const sinceSource = latestLog?.timestamp ?? activeEvent.date;
  const description =
    latestLog?.summary?.trim() ||
    activeEvent.summary?.trim() ||
    'Service disruption';

  return createServiceStatus({
    checkedAt,
    definition,
    description,
    indicator,
    regions: normalizeRegionList([activeEvent.region_name]),
    since:
      typeof sinceSource === 'string' || typeof sinceSource === 'number'
        ? fromUnixSecondsString(String(sinceSource))
        : checkedAt,
  });
}

export function parseHumanStatusDocument(
  definition: ServiceDefinition,
  checkedAt: string,
  description: string,
): ServiceStatus {
  const indicator = humanStatusToIndicator(description);

  return createServiceStatus({
    checkedAt,
    definition,
    description: description || 'Status unavailable',
    indicator,
    since: indicator === 'operational' ? undefined : checkedAt,
  });
}

export function parseMicrosoftFeed(
  definition: ServiceDefinition,
  checkedAt: string,
  item: MicrosoftFeedItem,
): ServiceStatus {
  const status = item.status?.trim() ?? '';
  const indicator = microsoftFeedStatusToIndicator(status);

  return createServiceStatus({
    checkedAt,
    definition,
    description: status || item.title?.trim() || 'Status unavailable',
    indicator,
    since:
      indicator === 'operational'
        ? undefined
        : item.pubDate
          ? new Date(item.pubDate).toISOString()
          : checkedAt,
  });
}

export function parseSimpleUpStatus(
  definition: ServiceDefinition,
  checkedAt: string,
  summary: SimpleUpStatusResponse,
): ServiceStatus {
  const rawStatus = summary.page?.status?.trim().toUpperCase() ?? '';
  const indicator = simpleUpStatusToIndicator(rawStatus);

  return createServiceStatus({
    checkedAt,
    definition,
    description: simpleUpStatusLabel(rawStatus),
    indicator,
    since: indicator === 'operational' ? undefined : checkedAt,
  });
}

export function parseBitwardenStatusDocument(
  definition: ServiceDefinition,
  checkedAt: string,
  description: string,
): ServiceStatus {
  const indicator = bitwardenStatusToIndicator(description);

  return createServiceStatus({
    checkedAt,
    definition,
    description,
    indicator,
    since: indicator === 'operational' ? undefined : checkedAt,
  });
}

export function parseBetterStackDocument(
  definition: ServiceDefinition,
  checkedAt: string,
  rawStatus: string,
): ServiceStatus {
  const indicator = betterStackStatusToIndicator(rawStatus);

  return createServiceStatus({
    checkedAt,
    definition,
    description: betterStackStatusLabel(rawStatus),
    indicator,
    since: indicator === 'operational' ? undefined : checkedAt,
  });
}

export function parseInstatusDocument(
  definition: ServiceDefinition,
  checkedAt: string,
  rawStatus: string,
): ServiceStatus {
  const indicator = instatusStatusToIndicator(rawStatus);

  return createServiceStatus({
    checkedAt,
    definition,
    description: instatusStatusLabel(rawStatus),
    indicator,
    since: indicator === 'operational' ? undefined : checkedAt,
  });
}

export function createFallbackStatus(
  definition: ServiceDefinition,
  checkedAt: string,
  indicator: ServiceIndicator,
): ServiceStatus {
  return {
    key: definition.key,
    name: definition.name,
    category: definition.category,
    statusUrl: definition.statusUrl,
    indicator,
    checkedAt,
    checkedAtLabel: toJstLabel(checkedAt),
    since: checkedAt,
    sinceLabel: toJstLabel(checkedAt),
    regions: undefined,
    presentation: toPresentation(indicator, '状態を判定できませんでした'),
  };
}

function createServiceStatus({
  checkedAt,
  definition,
  description,
  indicator,
  regions,
  since,
}: CreateServiceStatusInput): ServiceStatus {
  return {
    key: definition.key,
    name: definition.name,
    category: definition.category,
    statusUrl: definition.statusUrl,
    indicator,
    checkedAt,
    checkedAtLabel: toJstLabel(checkedAt),
    since: indicator === 'operational' ? undefined : since,
    sinceLabel:
      indicator === 'operational' || !since ? undefined : toJstLabel(since),
    regions:
      definition.category === 'core-infra' && indicator !== 'operational'
        ? normalizeRegionList(regions)
        : undefined,
    presentation: toPresentation(indicator, description),
  };
}

function extractStatuspageRegions(
  summary: StatuspageSummary,
  category: ServiceDefinition['category'],
) {
  if (category !== 'core-infra') {
    return undefined;
  }

  const degradedLeafNames =
    summary.components
      ?.filter(
        (component) =>
          component.group !== true &&
          normalizeIndicator(component.status) !== 'operational',
      )
      .map((component) => component.name) ?? [];

  if (degradedLeafNames.length > 0) {
    return degradedLeafNames;
  }

  return summary.components
    ?.filter(
      (component) =>
        component.group === true &&
        normalizeIndicator(component.status) !== 'operational',
    )
    .map((component) => component.name);
}

function extractGoogleCloudRegions(incident: GoogleCloudIncident) {
  return normalizeRegionList([
    ...(incident.currently_affected_locations?.map(
      (location) => location.title,
    ) ?? []),
    ...(incident.previously_affected_locations?.map(
      (location) => location.title,
    ) ?? []),
    ...(incident.most_recent_update?.affected_locations?.map(
      (location) => location.title,
    ) ?? []),
    ...(incident.updates?.flatMap(
      (update) =>
        update.affected_locations?.map((location) => location.title) ?? [],
    ) ?? []),
  ]);
}

function normalizeRegionList(regions: Array<string | undefined> | undefined) {
  if (!regions || regions.length === 0) {
    return undefined;
  }

  const unique = [
    ...new Set(
      regions
        .map((region) => region?.trim())
        .filter((region): region is string => Boolean(region)),
    ),
  ];

  return unique.length > 0 ? unique : undefined;
}

function normalizeIndicator(input: string | undefined): ServiceIndicator {
  switch (input) {
    case 'none':
    case 'operational':
      return 'operational';
    case 'minor':
    case 'degraded_performance':
      return 'degraded_performance';
    case 'major':
    case 'critical':
    case 'partial_outage':
      return 'partial_outage';
    case 'major_outage':
      return 'major_outage';
    case 'under_maintenance':
      return 'under_maintenance';
    default:
      return 'unknown';
  }
}

function googleSeverityToIndicator(
  incident: GoogleCloudIncident,
): ServiceIndicator {
  if (
    incident.status_impact === 'SERVICE_OUTAGE' ||
    incident.severity === 'high'
  ) {
    return 'major_outage';
  }

  if (
    incident.status_impact === 'SERVICE_DISRUPTION' ||
    incident.severity === 'medium'
  ) {
    return 'partial_outage';
  }

  return 'degraded_performance';
}

function googleStatusImpactToIndicator(
  statusImpact: GoogleWorkspaceIncident['status_impact'],
  severity: GoogleWorkspaceIncident['severity'],
): ServiceIndicator {
  if (statusImpact === 'SERVICE_OUTAGE' || severity === 'high') {
    return 'major_outage';
  }

  if (statusImpact === 'SERVICE_DISRUPTION' || severity === 'medium') {
    return 'partial_outage';
  }

  if (statusImpact === 'SERVICE_INFORMATION' || severity === 'low') {
    return 'degraded_performance';
  }

  return 'unknown';
}

function googleWorkspaceDescription(incident: GoogleWorkspaceIncident) {
  const serviceName = incident.service_name?.trim();

  if (serviceName && serviceName !== 'Multiple Products') {
    return `${serviceName} incident`;
  }

  return serviceName === 'Multiple Products'
    ? 'Multiple products incident'
    : 'Active incident';
}

function pagerDutyHeadlineToIndicator(headline: string): ServiceIndicator {
  const lower = headline.toLowerCase();

  if (
    lower.includes('smoothly') ||
    lower.includes('operational') ||
    lower.includes('available')
  ) {
    return 'operational';
  }

  if (lower.includes('major') || lower.includes('outage')) {
    return 'major_outage';
  }

  return 'partial_outage';
}

function humanStatusToIndicator(description: string): ServiceIndicator {
  const lower = description.toLowerCase();

  if (
    lower.includes('up and running') ||
    lower.includes('all systems operational') ||
    lower.includes('operating normally') ||
    lower.includes('smoothly')
  ) {
    return 'operational';
  }

  if (
    lower.includes('major outage') ||
    lower.includes('service outage') ||
    lower.includes('down')
  ) {
    return 'major_outage';
  }

  if (
    lower.includes('partial') ||
    lower.includes('degraded') ||
    lower.includes('minor')
  ) {
    return 'partial_outage';
  }

  return 'unknown';
}

function microsoftFeedStatusToIndicator(status: string): ServiceIndicator {
  const normalized = status.trim().toLowerCase();

  if (normalized === 'available') {
    return 'operational';
  }

  if (
    normalized.includes('degradation') ||
    normalized.includes('degraded') ||
    normalized.includes('advisory')
  ) {
    return 'degraded_performance';
  }

  if (normalized.includes('interruption') || normalized.includes('outage')) {
    return 'major_outage';
  }

  return 'unknown';
}

function simpleUpStatusToIndicator(rawStatus: string): ServiceIndicator {
  switch (rawStatus) {
    case 'UP':
      return 'operational';
    case 'DEGRADED':
      return 'partial_outage';
    case 'MAINTENANCE':
      return 'under_maintenance';
    case 'DOWN':
      return 'major_outage';
    default:
      return 'unknown';
  }
}

function simpleUpStatusLabel(rawStatus: string) {
  switch (rawStatus) {
    case 'UP':
      return 'All systems operational';
    case 'DEGRADED':
      return 'Service degraded';
    case 'MAINTENANCE':
      return 'Maintenance in progress';
    case 'DOWN':
      return 'Service outage';
    default:
      return 'Status unavailable';
  }
}

function awsStatusToIndicator(
  status: string | number | undefined,
): ServiceIndicator {
  switch (String(status ?? '')) {
    case '0':
    case '4':
      return 'operational';
    case '1':
      return 'degraded_performance';
    case '2':
      return 'partial_outage';
    case '3':
      return 'major_outage';
    default:
      return 'unknown';
  }
}

function bitwardenStatusToIndicator(description: string): ServiceIndicator {
  const lower = description.toLowerCase();

  if (lower.includes('operating normally') || lower.includes('operational')) {
    return 'operational';
  }

  if (lower.includes('maintenance')) {
    return 'under_maintenance';
  }

  if (lower.includes('degraded') || lower.includes('partial')) {
    return 'partial_outage';
  }

  if (lower.includes('outage') || lower.includes('down')) {
    return 'major_outage';
  }

  return 'unknown';
}

function betterStackStatusToIndicator(rawStatus: string): ServiceIndicator {
  switch (rawStatus) {
    case 'operational':
      return 'operational';
    case 'degraded':
    case 'degraded-performance':
      return 'degraded_performance';
    case 'partial':
    case 'partial-outage':
      return 'partial_outage';
    case 'major':
    case 'major-outage':
    case 'outage':
      return 'major_outage';
    case 'maintenance':
    case 'under-maintenance':
      return 'under_maintenance';
    default:
      return 'unknown';
  }
}

function betterStackStatusLabel(rawStatus: string) {
  switch (rawStatus) {
    case 'operational':
      return 'Operating Normally';
    case 'degraded':
    case 'degraded-performance':
      return 'Degraded Performance';
    case 'partial':
    case 'partial-outage':
      return 'Partial Outage';
    case 'major':
    case 'major-outage':
    case 'outage':
      return 'Major Outage';
    case 'maintenance':
    case 'under-maintenance':
      return 'Under Maintenance';
    default:
      return 'Status unavailable';
  }
}

function instatusStatusToIndicator(rawStatus: string): ServiceIndicator {
  switch (rawStatus) {
    case 'UP':
    case 'OPERATIONAL':
      return 'operational';
    case 'HASISSUES':
    case 'DEGRADED':
    case 'DEGRADEDPERFORMANCE':
      return 'degraded_performance';
    case 'PARTIALOUTAGE':
      return 'partial_outage';
    case 'DOWN':
    case 'MAJOROUTAGE':
      return 'major_outage';
    case 'UNDERMAINTENANCE':
    case 'MAINTENANCE':
      return 'under_maintenance';
    default:
      return 'unknown';
  }
}

function instatusStatusLabel(rawStatus: string) {
  switch (rawStatus) {
    case 'UP':
    case 'OPERATIONAL':
      return 'All Systems Operational';
    case 'HASISSUES':
    case 'DEGRADED':
    case 'DEGRADEDPERFORMANCE':
      return 'Degraded Performance';
    case 'PARTIALOUTAGE':
      return 'Partial Outage';
    case 'DOWN':
    case 'MAJOROUTAGE':
      return 'Major Outage';
    case 'UNDERMAINTENANCE':
    case 'MAINTENANCE':
      return 'Under Maintenance';
    default:
      return 'Status unavailable';
  }
}

function toPresentation(indicator: ServiceIndicator, description: string) {
  switch (indicator) {
    case 'operational':
      return {
        tone: 'green',
        icon: '✓',
        label: description || '稼働中',
      } as const;
    case 'degraded_performance':
    case 'partial_outage':
    case 'under_maintenance':
      return {
        tone: 'yellow',
        icon: '!',
        label: description || '一部影響あり',
      } as const;
    case 'major_outage':
      return {
        tone: 'red',
        icon: '‼',
        label: description || '大規模障害',
      } as const;
    default:
      return { tone: 'gray', icon: '?', label: description || '不明' } as const;
  }
}

function toJstLabel(value: string) {
  const date = new Date(value);
  const jst = new Date(
    date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }),
  );

  const year = jst.getFullYear();
  const month = String(jst.getMonth() + 1).padStart(2, '0');
  const day = String(jst.getDate()).padStart(2, '0');
  const hours = String(jst.getHours()).padStart(2, '0');
  const minutes = String(jst.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function fromUnixSecondsString(value: string) {
  const timestamp = Number(value);
  return Number.isNaN(timestamp)
    ? new Date().toISOString()
    : new Date(timestamp * 1000).toISOString();
}
