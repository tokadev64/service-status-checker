import { serviceDefinitions } from '../shared/services.ts';
import type {
  ServiceDefinition,
  ServiceStatus,
  StatusResponse,
} from '../shared/types.ts';
import {
  createFallbackStatus,
  parseAwsHealthResponse,
  parseBetterStackDocument,
  parseBitwardenStatusDocument,
  parseGoogleCloudIncidents,
  parseGoogleWorkspaceIncidents,
  parseHumanStatusDocument,
  parseInstatusDocument,
  parseMicrosoftFeed,
  parsePagerDutyDashboard,
  parseSimpleUpStatus,
  parseStatuspageSummary,
} from './status-source-parsers.ts';
import type {
  AwsHealthResponse,
  GoogleCloudIncident,
  GoogleWorkspaceIncident,
  PagerDutyDashboardData,
  SimpleUpStatusResponse,
  StatuspageSummary,
} from './status-source-types.ts';

export async function collectStatuses(
  fetchImpl: typeof fetch = fetch,
): Promise<StatusResponse> {
  const checkedAt = new Date().toISOString();
  const services = await Promise.all(
    serviceDefinitions.map((definition) =>
      fetchServiceStatus(definition, fetchImpl, checkedAt),
    ),
  );

  return {
    checkedAt,
    checkedAtLabel: toJstLabel(checkedAt),
    services,
  };
}

async function fetchServiceStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  if (!definition.summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  try {
    switch (definition.sourceKind) {
      case 'google-cloud':
        return await fetchGoogleCloudStatus(definition, fetchImpl, checkedAt);
      case 'google-workspace':
        return await fetchGoogleWorkspaceStatus(
          definition,
          fetchImpl,
          checkedAt,
        );
      case 'pagerduty':
        return await fetchPagerDutyStatus(definition, fetchImpl, checkedAt);
      case 'aws-health':
        return await fetchAwsHealthStatus(definition, fetchImpl, checkedAt);
      case 'microsoft-feed':
        return await fetchMicrosoftFeedStatus(definition, fetchImpl, checkedAt);
      case 'slack-status':
        return await fetchSlackStatus(definition, fetchImpl, checkedAt);
      case 'docker-statusio':
        return await fetchDockerStatus(definition, fetchImpl, checkedAt);
      case 'simple-up-status':
        return await fetchSimpleUpStatus(definition, fetchImpl, checkedAt);
      case 'bitwarden-status':
        return await fetchBitwardenStatus(definition, fetchImpl, checkedAt);
      case 'betterstack-status':
        return await fetchBetterStackStatus(definition, fetchImpl, checkedAt);
      case 'instatus-status':
        return await fetchInstatusStatus(definition, fetchImpl, checkedAt);
      default:
        return await fetchStatuspageStatus(definition, fetchImpl, checkedAt);
    }
  } catch {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }
}

async function fetchStatuspageStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  const { summaryUrl } = definition;
  if (!summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const response = await fetchImpl(summaryUrl, {
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    return createFallbackStatus(definition, checkedAt, 'major_outage');
  }

  const summary = (await response.json()) as StatuspageSummary;
  return parseStatuspageSummary(definition, checkedAt, summary);
}

async function fetchGoogleCloudStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  const { summaryUrl } = definition;
  if (!summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const response = await fetchImpl(summaryUrl, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    return createFallbackStatus(definition, checkedAt, 'major_outage');
  }

  const incidents = (await response.json()) as GoogleCloudIncident[];
  return parseGoogleCloudIncidents(definition, checkedAt, incidents);
}

async function fetchGoogleWorkspaceStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  const { summaryUrl } = definition;
  if (!summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const response = await fetchImpl(summaryUrl, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    return createFallbackStatus(definition, checkedAt, 'major_outage');
  }

  const incidents = (await response.json()) as GoogleWorkspaceIncident[];
  return parseGoogleWorkspaceIncidents(definition, checkedAt, incidents);
}

async function fetchPagerDutyStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  const { summaryUrl } = definition;
  if (!summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const response = await fetchImpl(summaryUrl, {
    headers: { accept: 'text/html,application/xhtml+xml' },
  });

  if (!response.ok) {
    return createFallbackStatus(definition, checkedAt, 'major_outage');
  }

  const html = await response.text();
  const dataMatch = html.match(
    /<script id="data" type="application\/json">(.+?)<\/script>/s,
  );

  if (!dataMatch) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const pageData = JSON.parse(dataMatch[1]) as PagerDutyDashboardData;
  return parsePagerDutyDashboard(definition, checkedAt, pageData);
}

async function fetchAwsHealthStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  const { summaryUrl } = definition;
  if (!summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const response = await fetchImpl(summaryUrl, {
    headers: { accept: 'application/json,text/plain,*/*' },
  });

  if (!response.ok) {
    return createFallbackStatus(definition, checkedAt, 'major_outage');
  }

  const buffer = await response.arrayBuffer();
  const text = decodePossiblyUtf16(buffer);
  const events = JSON.parse(text) as AwsHealthResponse;
  return parseAwsHealthResponse(definition, checkedAt, events);
}

async function fetchSlackStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  const { summaryUrl } = definition;
  if (!summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const response = await fetchImpl(summaryUrl, {
    headers: { accept: 'text/html,application/xhtml+xml' },
  });

  if (!response.ok) {
    return createFallbackStatus(definition, checkedAt, 'major_outage');
  }

  const html = await response.text();
  const title = matchHtmlText(html, /<h1[^>]*>(.*?)<\/h1>/s);
  return parseHumanStatusDocument(
    definition,
    checkedAt,
    title || 'Status unavailable',
  );
}

async function fetchMicrosoftFeedStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  const { summaryUrl } = definition;
  if (!summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const response = await fetchImpl(summaryUrl, {
    headers: { accept: 'application/rss+xml,application/xml,text/xml' },
  });

  if (!response.ok) {
    return createFallbackStatus(definition, checkedAt, 'major_outage');
  }

  const xml = await response.text();
  return parseMicrosoftFeed(definition, checkedAt, {
    pubDate: matchHtmlText(xml, /<pubDate>\s*(.*?)\s*<\/pubDate>/i),
    status: matchHtmlText(xml, /<status>\s*(.*?)\s*<\/status>/i),
    title: matchHtmlText(xml, /<title>\s*(.*?)\s*<\/title>/i),
  });
}

async function fetchDockerStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  const { summaryUrl } = definition;
  if (!summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const response = await fetchImpl(summaryUrl, {
    headers: { accept: 'text/html,application/xhtml+xml' },
  });

  if (!response.ok) {
    return createFallbackStatus(definition, checkedAt, 'major_outage');
  }

  const html = await response.text();
  const title = matchHtmlText(
    html,
    /<strong id="statusbar_text">(.*?)<\/strong>/s,
  );
  return parseHumanStatusDocument(
    definition,
    checkedAt,
    title || 'Status unavailable',
  );
}

async function fetchSimpleUpStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  const { summaryUrl } = definition;
  if (!summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const response = await fetchImpl(summaryUrl, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    return createFallbackStatus(definition, checkedAt, 'major_outage');
  }

  const summary = (await response.json()) as SimpleUpStatusResponse;
  return parseSimpleUpStatus(definition, checkedAt, summary);
}

async function fetchBitwardenStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  const { summaryUrl } = definition;
  if (!summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const response = await fetchImpl(summaryUrl, {
    headers: { accept: 'text/html,application/xhtml+xml' },
  });

  if (!response.ok) {
    return createFallbackStatus(definition, checkedAt, 'major_outage');
  }

  const html = await response.text();
  const description =
    matchHtmlText(
      html,
      /<aside class='[^']*state-bar[^']*'>[\s\S]*?<span class='status'>\s*(.*?)\s*<\/span>/,
    ) ||
    matchHtmlText(
      html,
      /<aside class="[^"]*state-bar[^"]*">[\s\S]*?<span class="status">\s*(.*?)\s*<\/span>/,
    ) ||
    matchHtmlText(html, /<span class=['"]status['"]>\s*(.*?)\s*<\/span>/) ||
    'Status unavailable';
  return parseBitwardenStatusDocument(definition, checkedAt, description);
}

async function fetchBetterStackStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  const { summaryUrl } = definition;
  if (!summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const response = await fetchImpl(summaryUrl, {
    headers: { accept: 'text/html,application/xhtml+xml' },
  });

  if (!response.ok) {
    return createFallbackStatus(definition, checkedAt, 'major_outage');
  }

  const html = await response.text();
  const faviconStatus =
    html.match(
      /status_pages_v2\/favicons\/([a-z]+(?:-[a-z]+)*)(?:-[a-z0-9]+)?/,
    )?.[1] ??
    html.match(/status_pages\/og_([a-z]+(?:-[a-z]+)*)(?:-[a-z0-9]+)?/)?.[1];
  const rawStatus = faviconStatus ?? 'unknown';
  return parseBetterStackDocument(definition, checkedAt, rawStatus);
}

async function fetchInstatusStatus(
  definition: ServiceDefinition,
  fetchImpl: typeof fetch,
  checkedAt: string,
): Promise<ServiceStatus> {
  const { summaryUrl } = definition;
  if (!summaryUrl) {
    return createFallbackStatus(definition, checkedAt, 'unknown');
  }

  const response = await fetchImpl(summaryUrl, {
    headers: { accept: 'text/html,application/xhtml+xml' },
  });

  if (!response.ok) {
    return createFallbackStatus(definition, checkedAt, 'major_outage');
  }

  const html = await response.text();
  const rawStatus =
    html.match(/\\"mainStatus\\":\\"([A-Z_]+)\\"/)?.[1] ??
    html.match(/"mainStatus":"([A-Z_]+)"/)?.[1] ??
    html.match(/\\"status\\":\\"([A-Z_]+)\\"/)?.[1] ??
    html.match(/"status":"([A-Z_]+)"/)?.[1] ??
    'UNKNOWN';
  return parseInstatusDocument(definition, checkedAt, rawStatus);
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

function decodePossiblyUtf16(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes);
  }

  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16').decode(bytes);
  }

  if (bytes[0] === 0) {
    return new TextDecoder('utf-16be').decode(bytes);
  }

  if (bytes[1] === 0) {
    return new TextDecoder('utf-16le').decode(bytes);
  }

  return new TextDecoder().decode(bytes);
}

function matchHtmlText(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  if (!match?.[1]) {
    return '';
  }

  return match[1]
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
