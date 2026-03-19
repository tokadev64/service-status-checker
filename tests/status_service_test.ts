import { assertEquals, assertMatch } from '@std/assert';
import fc from 'fast-check';
import { collectStatuses } from '../src/server/status_service.ts';
import { serviceDefinitions } from '../src/shared/services.ts';

const toneByIndicator = {
  degraded_performance: 'yellow',
  major_outage: 'red',
  operational: 'green',
  partial_outage: 'yellow',
  under_maintenance: 'yellow',
  unknown: 'gray',
} as const;

Deno.test('collectStatuses returns the full service list', async () => {
  const response = await collectStatuses(async (input) => {
    const url = String(input);

    if (url.includes('status.cloud.microsoft/api/feed/mac')) {
      return new Response(
        `
          <rss>
            <channel>
              <item>
                <title>Microsoft Admin Center</title>
                <pubDate>Wed, 18 Mar 2026 16:20:00 Z</pubDate>
                <status>Available</status>
              </item>
            </channel>
          </rss>
        `,
        { status: 200 },
      );
    }

    return new Response(
      JSON.stringify({
        page: { updated_at: '2026-03-15T10:00:00.000Z' },
        status: {
          description: 'All Systems Operational',
          indicator: 'none',
        },
        components: [],
      }),
      { status: 200 },
    );
  });

  assertEquals(response.services.length, serviceDefinitions.length);
  assertEquals(
    response.services.find((service) => service.key === 'zoom')?.indicator,
    'operational',
  );
  assertEquals(
    response.services.find((service) => service.key === 'miro')?.indicator,
    'operational',
  );
  assertEquals(
    response.services.find((service) => service.key === 'microsoft365')
      ?.indicator,
    'operational',
  );
});

Deno.test('Cloudflare minor indicator is normalized to degraded performance', async () => {
  const response = await collectStatuses(async (input) => {
    const url = String(input);

    if (url.includes('www.cloudflarestatus.com')) {
      return new Response(
        JSON.stringify({
          page: { updated_at: '2026-03-19T00:10:00.000Z' },
          status: {
            description: 'Minor Service Outage',
            indicator: 'minor',
          },
          components: [],
        }),
        { status: 200 },
      );
    }

    return new Response(
      JSON.stringify({
        page: { updated_at: '2026-03-15T10:00:00.000Z' },
        status: {
          description: 'All Systems Operational',
          indicator: 'none',
        },
        components: [],
      }),
      { status: 200 },
    );
  });

  const cloudflare = response.services.find(
    (service) => service.key === 'cloudflare',
  );
  assertEquals(cloudflare?.indicator, 'degraded_performance');
  assertEquals(cloudflare?.presentation.tone, 'yellow');
});

Deno.test('non operational state always keeps a JST timestamp label', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom<ServiceIndicatorForTests>(
        'degraded_performance',
        'partial_outage',
        'major_outage',
        'under_maintenance',
      ),
      async (indicator) => {
        const response = await collectStatuses(async () => {
          return new Response(
            JSON.stringify({
              page: { updated_at: '2026-03-15T10:00:00.000Z' },
              status: {
                description: 'Incident',
                indicator,
              },
              components: [],
            }),
            { status: 200 },
          );
        });

        for (const service of response.services) {
          if (service.indicator === 'operational') {
            continue;
          }

          assertMatch(
            service.sinceLabel ?? '',
            /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/,
          );
        }
      },
    ),
  );
});

Deno.test('custom source adapters preserve indicator and tone mapping', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        awsStatus: fc.constantFrom<AwsStatusForTests>('0', '1', '2', '3', '4'),
        betterStackStatus: fc.constantFrom<BetterStackStatusForTests>(
          'operational',
          'degraded-performance',
          'partial-outage',
          'major-outage',
          'under-maintenance',
        ),
        instatusStatus: fc.constantFrom<InstatusStatusForTests>(
          'UP',
          'DEGRADEDPERFORMANCE',
          'PARTIALOUTAGE',
          'MAJOROUTAGE',
          'UNDERMAINTENANCE',
        ),
        simpleUpStatus: fc.constantFrom<SimpleUpStatusForTests>(
          'UP',
          'DEGRADED',
          'MAINTENANCE',
          'DOWN',
        ),
      }),
      async ({
        awsStatus,
        betterStackStatus,
        instatusStatus,
        simpleUpStatus,
      }) => {
        const response = await collectStatuses(async (input) => {
          const url = String(input);

          if (url.includes('status.pagerduty.com')) {
            return new Response(
              `
                <html>
                  <script id="data" type="application/json">
                    {"layout":{"layout_settings":{"statusPage":{"globalStatusHeadline":"Everything is running smoothly"}}}}
                  </script>
                </html>
              `,
              { status: 200 },
            );
          }

          if (url.includes('slack-status.com')) {
            return new Response(
              '<html><body><h1>Slack is up and running</h1></body></html>',
              { status: 200 },
            );
          }

          if (url.includes('dockerstatus.com')) {
            return new Response(
              '<html><body><strong id="statusbar_text">All Systems Operational</strong></body></html>',
              { status: 200 },
            );
          }

          if (url.includes('status.aws.amazon.com/data.json')) {
            const body = JSON.stringify([
              {
                summary: 'Increased Error Rates',
                date: '1772369485',
                status: awsStatus,
                event_log: [
                  {
                    summary: 'Increased Error Rates',
                    status: awsStatus,
                    timestamp: '1772369485',
                  },
                ],
              },
            ]);
            return new Response(new TextEncoder().encode(body), {
              status: 200,
            });
          }

          if (url.includes('status.cloud.microsoft/api/feed/mac')) {
            return new Response(
              `
                <rss>
                  <channel>
                    <item>
                      <title>Microsoft Admin Center</title>
                      <pubDate>Wed, 18 Mar 2026 16:20:00 Z</pubDate>
                      <status>Available</status>
                    </item>
                  </channel>
                </rss>
              `,
              { status: 200 },
            );
          }

          if (url.includes('status.cloud.google.com/incidents.json')) {
            return new Response(
              JSON.stringify([
                {
                  begin: '2026-03-18T00:00:00+00:00',
                  external_desc: 'Service disruption',
                  status_impact: 'SERVICE_DISRUPTION',
                  severity: 'medium',
                },
              ]),
              { status: 200 },
            );
          }

          if (url.includes('google.com/appsstatus/dashboard/incidents.json')) {
            return new Response(
              JSON.stringify([
                {
                  begin: '2026-03-18T01:00:00+00:00',
                  service_name: 'Gmail',
                  status_impact: 'SERVICE_DISRUPTION',
                  severity: 'medium',
                  most_recent_update: {
                    when: '2026-03-18T01:15:00+00:00',
                  },
                },
              ]),
              { status: 200 },
            );
          }

          if (url.includes('denostatus.com/api/v2/summary.json')) {
            return new Response(
              JSON.stringify({
                page: {
                  status: simpleUpStatus,
                },
              }),
              { status: 200 },
            );
          }

          if (url.includes('status.bitwarden.com')) {
            return new Response(
              `
                <aside class='operational state-bar'>
                  <span class='status'>Operating Normally</span>
                </aside>
              `,
              { status: 200 },
            );
          }

          if (url.includes('status.i.moneyforward.com')) {
            return new Response(
              `
                <link rel="icon" type="image/png" href="https://uptime.betterstack.com/assets/status_pages_v2/favicons/${betterStackStatus}-5a610d11.png" />
                <meta property="og:image" content="https://status.i.moneyforward.com/assets/status_pages/og_${betterStackStatus}-05cd8ea3.png" />
              `,
              { status: 200 },
            );
          }

          if (url.includes('status.magicpod.com')) {
            return new Response(
              `
                <script>
                  self.__next_f.push([1,"4:[\\"$\\",\\"body\\",null,{\\"children\\":[\\"$\\",\\"$L11\\",null,{\\"site\\":{\\"status\\":\\"${instatusStatus}\\",\\"mainStatus\\":\\"${instatusStatus}\\"}}]}]"])
                </script>
              `,
              { status: 200 },
            );
          }

          return new Response(
            JSON.stringify({
              page: { updated_at: '2026-03-15T10:00:00.000Z' },
              status: {
                description: 'All Systems Operational',
                indicator: 'none',
              },
              components: [],
            }),
            { status: 200 },
          );
        });

        const moneyForward = response.services.find(
          (service) => service.key === 'money-forward',
        );
        const magicPod = response.services.find(
          (service) => service.key === 'magicpod',
        );
        const aws = response.services.find((service) => service.key === 'aws');
        const deno = response.services.find(
          (service) => service.key === 'deno',
        );

        const expectedAwsIndicator = awsIndicatorMap[awsStatus];
        const expectedMoneyForwardIndicator =
          betterStackIndicatorMap[betterStackStatus];
        const expectedMagicPodIndicator = instatusIndicatorMap[instatusStatus];
        const expectedDenoIndicator = simpleUpIndicatorMap[simpleUpStatus];

        assertEquals(aws?.indicator, expectedAwsIndicator);
        assertEquals(
          aws?.presentation.tone,
          toneByIndicator[expectedAwsIndicator],
        );
        assertEquals(moneyForward?.indicator, expectedMoneyForwardIndicator);
        assertEquals(
          moneyForward?.presentation.tone,
          toneByIndicator[expectedMoneyForwardIndicator],
        );
        assertEquals(magicPod?.indicator, expectedMagicPodIndicator);
        assertEquals(
          magicPod?.presentation.tone,
          toneByIndicator[expectedMagicPodIndicator],
        );
        assertEquals(deno?.indicator, expectedDenoIndicator);
        assertEquals(
          deno?.presentation.tone,
          toneByIndicator[expectedDenoIndicator],
        );
      },
    ),
  );
});

type ServiceIndicatorForTests =
  | 'degraded_performance'
  | 'partial_outage'
  | 'major_outage'
  | 'under_maintenance';

type BetterStackStatusForTests =
  | 'operational'
  | 'degraded-performance'
  | 'partial-outage'
  | 'major-outage'
  | 'under-maintenance';

type InstatusStatusForTests =
  | 'UP'
  | 'DEGRADEDPERFORMANCE'
  | 'PARTIALOUTAGE'
  | 'MAJOROUTAGE'
  | 'UNDERMAINTENANCE';

type SimpleUpStatusForTests = 'UP' | 'DEGRADED' | 'MAINTENANCE' | 'DOWN';
type AwsStatusForTests = '0' | '1' | '2' | '3' | '4';

const awsIndicatorMap = {
  '0': 'operational',
  '1': 'degraded_performance',
  '2': 'partial_outage',
  '3': 'major_outage',
  '4': 'operational',
} as const satisfies Record<AwsStatusForTests, string>;

const betterStackIndicatorMap = {
  'degraded-performance': 'degraded_performance',
  'major-outage': 'major_outage',
  operational: 'operational',
  'partial-outage': 'partial_outage',
  'under-maintenance': 'under_maintenance',
} as const satisfies Record<BetterStackStatusForTests, string>;

const instatusIndicatorMap = {
  DEGRADEDPERFORMANCE: 'degraded_performance',
  MAJOROUTAGE: 'major_outage',
  PARTIALOUTAGE: 'partial_outage',
  UNDERMAINTENANCE: 'under_maintenance',
  UP: 'operational',
} as const satisfies Record<InstatusStatusForTests, string>;

const simpleUpIndicatorMap = {
  DEGRADED: 'partial_outage',
  DOWN: 'major_outage',
  MAINTENANCE: 'under_maintenance',
  UP: 'operational',
} as const satisfies Record<SimpleUpStatusForTests, string>;
