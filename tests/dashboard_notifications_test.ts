import { assertEquals } from '@std/assert';
import { shouldNotifyOnTransition } from '../src/composables/dashboard-notifications.ts';

Deno.test('shouldNotifyOnTransition only reacts to worsening states', () => {
  assertEquals(shouldNotifyOnTransition('green', 'yellow'), true);
  assertEquals(shouldNotifyOnTransition('green', 'red'), true);
  assertEquals(shouldNotifyOnTransition('gray', 'yellow'), false);
  assertEquals(shouldNotifyOnTransition('gray', 'red'), false);
  assertEquals(shouldNotifyOnTransition('yellow', 'red'), true);
  assertEquals(shouldNotifyOnTransition('red', 'green'), true);

  assertEquals(shouldNotifyOnTransition('yellow', 'yellow'), false);
  assertEquals(shouldNotifyOnTransition('red', 'red'), false);
  assertEquals(shouldNotifyOnTransition('red', 'yellow'), false);
  assertEquals(shouldNotifyOnTransition('yellow', 'green'), false);
  assertEquals(shouldNotifyOnTransition('gray', 'green'), false);
});

Deno.test('shouldNotifyOnTransition respects per-rule settings', () => {
  assertEquals(
    shouldNotifyOnTransition('green', 'yellow', {
      success_to_warning: false,
      success_to_alert: true,
      unknown_to_warning: true,
      unknown_to_alert: true,
      warning_to_alert: true,
      alert_to_success: true,
    }),
    false,
  );
  assertEquals(
    shouldNotifyOnTransition('yellow', 'red', {
      success_to_warning: true,
      success_to_alert: true,
      unknown_to_warning: true,
      unknown_to_alert: true,
      warning_to_alert: false,
      alert_to_success: true,
    }),
    false,
  );
  assertEquals(
    shouldNotifyOnTransition('red', 'green', {
      success_to_warning: true,
      success_to_alert: true,
      unknown_to_warning: true,
      unknown_to_alert: true,
      warning_to_alert: true,
      alert_to_success: false,
    }),
    false,
  );
  assertEquals(
    shouldNotifyOnTransition('gray', 'red', {
      success_to_warning: true,
      success_to_alert: true,
      unknown_to_warning: true,
      unknown_to_alert: false,
      warning_to_alert: true,
      alert_to_success: true,
    }),
    false,
  );
});
