import { assertEquals } from '@std/assert';
import {
  parseAwsHealthResponse,
  parseGoogleCloudIncidents,
  parseStatuspageSummary,
} from '../src/server/status-source-parsers.ts';
import { serviceDefinitions } from '../src/shared/services.ts';

const checkedAt = '2026-03-19T01:40:00.000Z';

Deno.test('AWS Health API payload keeps region in the parsed status', () => {
  const definition = serviceDefinitions.find(
    (service) => service.key === 'aws',
  );
  if (!definition) {
    throw new Error('aws definition not found');
  }

  const status = parseAwsHealthResponse(definition, checkedAt, [
    {
      date: '1772369485',
      region_name: 'UAE',
      status: '3',
      summary: 'Increased Error Rates',
      event_log: [
        {
          status: 3,
          summary: 'Power issues in me-central-1',
          timestamp: '1772369485',
        },
      ],
    },
  ]);

  assertEquals(status.indicator, 'major_outage');
  assertEquals(status.regions, ['UAE']);
  assertEquals(status.presentation.label, 'Power issues in me-central-1');
});

Deno.test('Google Cloud incidents keep affected regions and zones', () => {
  const definition = serviceDefinitions.find(
    (service) => service.key === 'google-cloud',
  );
  if (!definition) {
    throw new Error('google-cloud definition not found');
  }

  const status = parseGoogleCloudIncidents(definition, checkedAt, [
    {
      begin: '2026-03-18T00:00:00+00:00',
      external_desc: 'Service disruption',
      severity: 'medium',
      status_impact: 'SERVICE_DISRUPTION',
      currently_affected_locations: [
        { id: 'us-east1', title: 'South Carolina (us-east1)' },
        { id: 'us-east1-b', title: 'us-east1-b' },
      ],
      updates: [
        {
          affected_locations: [
            { id: 'us-east1', title: 'South Carolina (us-east1)' },
            { id: 'us-east1-c', title: 'us-east1-c' },
          ],
        },
      ],
    },
  ]);

  assertEquals(status.indicator, 'partial_outage');
  assertEquals(status.regions, [
    'South Carolina (us-east1)',
    'us-east1-b',
    'us-east1-c',
  ]);
});

Deno.test('Statuspage summary keeps degraded infra components as regions', () => {
  const definition = serviceDefinitions.find(
    (service) => service.key === 'hashicorp',
  );
  if (!definition) {
    throw new Error('hashicorp definition not found');
  }

  const status = parseStatuspageSummary(definition, checkedAt, {
    page: { updated_at: '2026-03-19T01:00:00.000Z' },
    status: {
      description: 'Partial System Outage',
      indicator: 'critical',
    },
    components: [
      {
        name: 'AWS-us-east-1',
        status: 'partial_outage',
        updated_at: '2026-03-19T00:50:00.000Z',
      },
      {
        name: 'Azure-Japan East',
        status: 'degraded_performance',
        updated_at: '2026-03-19T00:52:00.000Z',
      },
      {
        name: 'AWS-us-west-2',
        status: 'operational',
        updated_at: '2026-03-19T00:55:00.000Z',
      },
    ],
  });

  assertEquals(status.indicator, 'partial_outage');
  assertEquals(status.regions, ['AWS-us-east-1', 'Azure-Japan East']);
});
