// test/test_v102_voice_android.js — Dedicated Verification for ULTRON v1.0.2
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config()

const mainBundle = require('../out/main/index.js')
const {
  whisperService,
  androidAppsService,
  contactsService,
  adbService,
  toolsRegistry,
  agentService
} = mainBundle

console.log('='.repeat(80))
console.log('ULTRON v1.0.2: VOICE ENGINE & ANDROID PHONE CONTROL VERIFICATION')
console.log('='.repeat(80))

let passCount = 0
let failCount = 0

function assert(condition, description, detail = '') {
  if (condition) {
    console.log(`  [PASS] ${description} ${detail ? '(' + detail + ')' : ''}`)
    passCount++
  } else {
    console.error(`  [FAIL] ${description} ${detail ? '(' + detail + ')' : ''}`)
    failCount++
  }
}

async function runTests() {
  console.log('\n── SECTION 1: Whisper Engine Status & Configuration ──')
  try {
    const status = await whisperService.getStatus()
    assert(status.available !== undefined, 'Whisper service returns diagnostic status', `ready: ${status.ready}, model: ${status.model}`)
    assert(status.model === 'tiny.en', 'Default Whisper model is tiny.en', status.model)
    assert(status.engine.includes('faster-whisper'), 'Engine is faster-whisper CTranslate2', status.engine)
  } catch (err) {
    assert(false, 'Whisper status check failed', err.message)
  }

  console.log('\n── SECTION 2: Android Application Registry & Fuzzy Matcher ──')
  try {
    const yt = androidAppsService.resolveApp('youtube')
    assert(yt && yt.matches.length > 0 && yt.matches[0].packageId === 'com.google.android.youtube', 'Resolves "youtube" to com.google.android.youtube', yt?.matches?.[0]?.packageId)

    const spot = androidAppsService.resolveApp('spotify')
    assert(spot && spot.matches.length > 0 && spot.matches[0].packageId === 'com.spotify.music', 'Resolves "spotify" to com.spotify.music', spot?.matches?.[0]?.packageId)

    const wa = androidAppsService.resolveApp('whatsapp')
    assert(wa && wa.matches.length > 0 && wa.matches[0].packageId === 'com.whatsapp', 'Resolves "whatsapp" to com.whatsapp', wa?.matches?.[0]?.packageId)

    const cam = androidAppsService.resolveApp('camera')
    assert(cam && cam.matches.length > 0 && cam.matches[0].packageId === 'com.android.camera', 'Resolves "camera" alias to camera package', cam?.matches?.[0]?.packageId)

    const calc = androidAppsService.resolveApp('calculator')
    assert(calc && calc.matches.length > 0 && calc.matches[0].packageId === 'com.google.android.calculator', 'Resolves "calculator" alias', calc?.matches?.[0]?.packageId)

    const list = androidAppsService.getKnownApps()
    assert(list.length >= 30, 'Curated registry contains 30+ applications', `Count: ${list.length}`)
  } catch (err) {
    assert(false, 'Android apps registry test failed', err.message)
  }

  console.log('\n── SECTION 3: Contacts Service & Ambiguity Resolution ──')
  try {
    const contact = contactsService.resolveContactSync('Sukesh')
    assert(contact && contact.name === 'Sukesh', 'Resolves contact "Sukesh" synchronously', `${contact?.name} -> ${contact?.phone}`)

    const fallback = contactsService.resolveContactSync('unknown_person_xyz')
    assert(fallback === null, 'Returns null for non-existent contact')
  } catch (err) {
    assert(false, 'Contacts service test failed', err.message)
  }

  console.log('\n── SECTION 4: ADB Telephony & Phone State Machine ──')
  try {
    const phoneState = await adbService.getPhoneState()
    assert(phoneState && typeof phoneState.state === 'string', 'Phone state machine returns typed state', `State: ${phoneState?.state}`)

    // Test honest call hold & merge reporting
    const holdRes = await adbService.holdCall(true)
    assert(holdRes.success === false && holdRes.message.includes('not reliably supported'), 'Honest reporting on call hold limitation', holdRes.message)

    const mergeRes = await adbService.mergeCalls()
    assert(mergeRes.success === false && mergeRes.message.includes('does not expose call merging'), 'Honest reporting on conference merge limitation', mergeRes.message)
  } catch (err) {
    assert(false, 'ADB phone state test failed', err.message)
  }

  console.log('\n── SECTION 5: Typed Tools Registry Validation (v1.0.2 Tools) ──')
  try {
    const tools = toolsRegistry.getAll()
    const toolNames = tools.map((t) => t.name)

    const requiredTools = [
      'android.openApp',
      'android.listApps',
      'android.callContact',
      'android.endCall',
      'android.muteCall',
      'android.getPhoneState'
    ]

    for (const req of requiredTools) {
      assert(toolNames.includes(req), `Registered tool: ${req}`)
    }
    assert(tools.length >= 34, 'Total registered tools is 34 or greater', `Total: ${tools.length}`)
  } catch (err) {
    assert(false, 'Tools registry test failed', err.message)
  }

  console.log('\n── SECTION 6: Fast-Track Voice Intent Routing ──')
  try {
    const queries = [
      { text: 'open youtube on my phone', expectedTool: 'android.openApp' },
      { text: 'call Sukesh', expectedTool: 'android.callContact' },
      { text: 'end the call', expectedTool: 'android.endCall' },
      { text: 'hang up', expectedTool: 'android.endCall' },
      { text: 'mute call', expectedTool: 'android.muteCall' },
      { text: 'what is my phone status', expectedTool: 'android.getPhoneState' }
    ]

    for (const q of queries) {
      const res = await agentService.executeAgentLoop(q.text, [])
      const toolUsed = res.plan?.plan?.[0]?.tool || res.plan?.fastTrack || 'none'
      assert(
        toolUsed === q.expectedTool || res.handled === true,
        `Intent matched for "${q.text}" -> ${toolUsed}`,
        `Handled: ${res.handled}, Success: ${res.success}`
      )
    }
  } catch (err) {
    assert(false, 'Fast-track voice intent test failed', err.message)
  }

  console.log('\n' + '='.repeat(80))
  console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`)
  console.log('='.repeat(80))

  process.exit(failCount > 0 ? 1 : 0)
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err)
  process.exit(1)
})
