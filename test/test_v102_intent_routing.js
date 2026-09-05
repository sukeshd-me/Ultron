// test/test_v102_intent_routing.js — Comprehensive verification of ULTRON v1.0.2 Intent Routing
const { intentService } = require('../out/main/index.js')

console.log('═════════════════════════════════════════════════════════════════════')
console.log('ULTRON v1.0.2 — VERIFY AGENT UNDERSTANDING / INTENT ROUTING TEST')
console.log('═════════════════════════════════════════════════════════════════════\n')

const testCases = [
  {
    id: 1,
    command: 'turn off my phone',
    expectedTarget: 'android',
    expectedIntent: 'android.power_off',
    expectedTool: 'android.powerOff',
    expectedConfirmation: true
  },
  {
    id: 2,
    command: 'switch off my phone',
    expectedTarget: 'android',
    expectedIntent: 'android.power_off',
    expectedTool: 'android.powerOff',
    expectedConfirmation: true
  },
  {
    id: 3,
    command: 'open YouTube on my phone',
    expectedTarget: 'android',
    expectedIntent: 'android.open_app',
    expectedTool: 'android.openApp',
    expectedArg: { key: 'appName', val: 'YouTube' },
    expectedConfirmation: false
  },
  {
    id: 4,
    command: 'call Sukesh',
    expectedTarget: 'android',
    expectedIntent: 'android.call_contact',
    expectedTool: 'android.callContact',
    expectedArg: { key: 'contactName', val: 'Sukesh' },
    expectedConfirmation: false
  },
  {
    id: 5,
    command: 'end call',
    expectedTarget: 'android',
    expectedIntent: 'android.end_call',
    expectedTool: 'android.endCall',
    expectedConfirmation: false
  },
  {
    id: 6,
    command: 'mute call',
    expectedTarget: 'android',
    expectedIntent: 'android.mute_call',
    expectedTool: 'android.muteCall',
    expectedArg: { key: 'mute', val: true },
    expectedConfirmation: false
  },
  {
    id: 7,
    command: 'hold call',
    expectedTarget: 'android',
    expectedIntent: 'android.hold_call',
    expectedTool: 'android.holdCall',
    expectedArg: { key: 'hold', val: true },
    expectedConfirmation: false
  },
  {
    id: 8,
    command: 'what is my phone battery',
    expectedTarget: 'android',
    expectedIntent: 'android.get_battery',
    expectedTool: 'android.getBattery',
    expectedConfirmation: false
  },
  {
    id: 9,
    command: 'connect my phone',
    expectedTarget: 'android',
    expectedIntent: 'android.connect',
    expectedTool: 'adb.connect',
    expectedConfirmation: false
  },
  {
    id: 10,
    command: 'open Notepad',
    expectedTarget: 'windows',
    expectedIntent: 'windows.open_app',
    expectedTool: 'apps.open',
    expectedConfirmation: false
  },
  {
    id: 11,
    command: 'check my CPU',
    expectedTarget: 'system',
    expectedIntent: 'system.get_cpu',
    expectedTool: 'system.getCpu',
    expectedConfirmation: false
  },
  {
    id: 12,
    command: 'what time is it',
    expectedTarget: 'system',
    expectedIntent: 'system.get_time',
    expectedTool: 'system.getTime',
    expectedConfirmation: false
  },
  // Section 4 Disambiguation Tests
  {
    id: 13,
    command: 'turn off my PC',
    expectedTarget: 'windows',
    expectedIntent: 'windows.power_off',
    expectedConfirmation: true
  },
  {
    id: 14,
    command: 'open Chrome',
    expectedTarget: 'windows',
    expectedIntent: 'windows.open_app',
    expectedTool: 'apps.open',
    expectedConfirmation: false
  },
  {
    id: 15,
    command: 'open Chrome on my phone',
    expectedTarget: 'android',
    expectedIntent: 'android.open_app',
    expectedTool: 'android.openApp',
    expectedConfirmation: false
  },
  // Section 9 Contextual Fallback Test
  {
    id: 16,
    command: 'xyzabc something',
    expectedTarget: 'unknown',
    expectedIntent: 'unknown',
    expectedConfirmation: false
  }
]

let passed = 0
let failed = 0

testCases.forEach((tc) => {
  const res = intentService.resolve(tc.command)

  let ok = true
  const errors = []

  if (res.detected_target !== tc.expectedTarget) {
    ok = false
    errors.push(`Target mismatch: expected '${tc.expectedTarget}', got '${res.detected_target}'`)
  }

  if (res.detected_intent !== tc.expectedIntent) {
    ok = false
    errors.push(`Intent mismatch: expected '${tc.expectedIntent}', got '${res.detected_intent}'`)
  }

  if (tc.expectedTool && res.tool !== tc.expectedTool) {
    ok = false
    errors.push(`Tool mismatch: expected '${tc.expectedTool}', got '${res.tool}'`)
  }

  if (res.requiresConfirmation !== tc.expectedConfirmation) {
    ok = false
    errors.push(`Confirmation mismatch: expected ${tc.expectedConfirmation}, got ${res.requiresConfirmation}`)
  }

  if (tc.expectedArg) {
    if (res.args[tc.expectedArg.key] !== tc.expectedArg.val) {
      ok = false
      errors.push(`Arg mismatch for ${tc.expectedArg.key}: expected '${tc.expectedArg.val}', got '${res.args[tc.expectedArg.key]}'`)
    }
  }

  if (ok) {
    passed++
    console.log(`✓ Test ${tc.id}: "${tc.command}"`)
    console.log(`  -> TARGET: ${res.detected_target} | INTENT: ${res.detected_intent} | TOOL: ${res.tool || 'none'} | CONFIRM: ${res.requiresConfirmation}`)
  } else {
    failed++
    console.error(`✗ Test ${tc.id}: "${tc.command}"`)
    errors.forEach((e) => console.error(`  - ${e}`))
  }
})

console.log(`\n=====================================================================`)
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`)
console.log(`=====================================================================`)

if (failed > 0) {
  process.exit(1)
}
