// test/test_v103_agent_intelligence.js — Comprehensive verification of ULTRON v1.0.3 Conversational Agent & Tools
const { intentService, agentService, toolsRegistry, adbService, contactsService } = require('../out/main/index.js')

async function runTests() {
  console.log('═════════════════════════════════════════════════════════════════════════')
  console.log('ULTRON v1.0.3 — INTELLIGENT PERSONAL AI AGENT TEST SUITE')
  console.log('═════════════════════════════════════════════════════════════════════════\n')

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${message}`)
      failed++
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 1: Conversational & Knowledge Queries (Removal of Repetitive Fallback Bug)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('── SUITE 1: Conversational & Knowledge Queries (No Repetitive Fallback) ──')

  const conversationalQueries = [
    {
      query: 'Hi',
      expectedKeyword: 'ULTRON'
    },
    {
      query: 'Hello ULTRON',
      expectedKeyword: 'assist'
    },
    {
      query: 'What can you do?',
      expectedKeyword: 'PC, connected Android phone'
    },
    {
      query: 'control my phone',
      expectedKeyword: 'Android phone'
    },
    {
      query: 'Who are you?',
      expectedKeyword: 'UPAI Technologies'
    },
    {
      query: 'What is RAM?',
      expectedKeyword: 'Random Access Memory'
    },
    {
      query: "What's the difference between RAM and storage?",
      expectedKeyword: 'temporary'
    },
    {
      query: 'What is Windows?',
      expectedKeyword: 'operating system'
    },
    {
      query: 'Explain cybersecurity',
      expectedKeyword: 'protecting'
    },
    {
      query: 'Why is my PC slow?',
      expectedKeyword: 'CPU'
    },
    {
      query: 'Help me write a Python program',
      expectedKeyword: 'Python'
    }
  ]

  const forbiddenFallback = "I didn't understand that command. Try asking me to open an app, check your system, or control your phone."

  for (const item of conversationalQueries) {
    const res = await agentService.executeAgentLoop(item.query, [])
    assert(res.handled === true, `Query "${item.query}" marked as handled`)
    assert(typeof res.naturalResponse === 'string' && res.naturalResponse.length > 10, `Query "${item.query}" returned non-empty response`)
    assert(!res.naturalResponse.includes(forbiddenFallback), `Query "${item.query}" does NOT return the old repetitive command fallback`)
    assert(res.naturalResponse.toLowerCase().includes(item.expectedKeyword.toLowerCase()), `Query "${item.query}" contains relevant concept ("${item.expectedKeyword}")`)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 2: Multi-Step & Compound Commands Decomposition
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n── SUITE 2: Multi-Step & Compound Tasks Decomposition & Execution ──')

  // Case 2.1: "Check my phone battery and open YouTube"
  const compound1 = intentService.resolve('Check my phone battery and open YouTube')
  assert(compound1.detected_intent === 'compound.task', '"Check my phone battery and open YouTube" detected as compound.task')
  assert(Array.isArray(compound1.compoundIntents) && compound1.compoundIntents.length === 2, 'Compound 1 decomposed into 2 intents')
  assert(compound1.compoundIntents[0].tool === 'android.getBattery', 'Compound 1 step 1 maps to android.getBattery')
  assert(compound1.compoundIntents[1].tool === 'android.openApp', 'Compound 1 step 2 maps to android.openApp')

  // Case 2.2: "Open VS Code and tell me my CPU usage"
  const compound2 = intentService.resolve('Open VS Code and tell me my CPU usage')
  assert(compound2.detected_intent === 'compound.task', '"Open VS Code and tell me my CPU usage" detected as compound.task')
  assert(compound2.compoundIntents.length === 2, 'Compound 2 decomposed into 2 intents')
  assert(compound2.compoundIntents[0].tool === 'apps.open', 'Compound 2 step 1 maps to apps.open')
  assert(compound2.compoundIntents[1].tool === 'system.getCpu', 'Compound 2 step 2 maps to system.getCpu')

  // Case 2.3: "Check CPU, RAM, and disk usage"
  const compound3 = intentService.resolve('Check CPU, RAM, and disk usage')
  assert(compound3.detected_intent === 'compound.task', '"Check CPU, RAM, and disk usage" detected as compound.task')
  assert(compound3.compoundIntents.length === 3, 'Compound 3 decomposed into 3 telemetry intents')
  assert(compound3.compoundIntents[0].tool === 'system.getCpu', 'Step 1 is system.getCpu')
  assert(compound3.compoundIntents[1].tool === 'system.getMemory', 'Step 2 is system.getMemory')
  assert(compound3.compoundIntents[2].tool === 'system.getDisk', 'Step 3 is system.getDisk')

  // Execute compound telemetry test in parallel
  const execCompound3 = await agentService.executeAgentLoop('Check CPU, RAM, and disk usage', [])
  assert(execCompound3.handled === true, 'Parallel telemetry executed and handled')
  assert(execCompound3.results.length === 3, 'All 3 telemetry tools executed')
  assert(execCompound3.results.every((r) => r.success), 'All 3 tools succeeded')
  assert(execCompound3.naturalResponse.includes('CPU') && execCompound3.naturalResponse.includes('RAM'), 'Cohesive natural response synthesizes CPU and RAM')

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 3: Multi-Turn Conversation Context & Anaphora Resolution
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n── SUITE 3: Multi-Turn Conversation Context & Pronoun Resolution ──')

  // Simulate Turn 1: Check phone battery
  intentService.setContext({
    lastTarget: 'android',
    lastAction: 'get_battery',
    lastEntity: { type: 'battery', value: 72 }
  })

  // Turn 2: "Is that low?"
  const turn2 = intentService.resolve('Is that low?')
  assert(turn2.detected_intent === 'conversational.battery_evaluation', '"Is that low?" resolved to conversational.battery_evaluation')
  assert(turn2.directResponse.includes('72%') && turn2.directResponse.includes('not low'), '"Is that low?" correctly evaluates 72% battery level')

  // Turn 3: "Open YouTube on it" -> "it" resolves to Android phone
  const turn3 = intentService.resolve('Open YouTube on it')
  assert(turn3.detected_target === 'android', '"Open YouTube on it" resolved target to android')
  assert(turn3.tool === 'android.openApp', '"Open YouTube on it" mapped to android.openApp')

  // Turn 4: "Now check the battery" -> "now" follow-up on phone
  const turn4 = intentService.resolve('Now check the battery')
  assert(turn4.detected_target === 'android', '"Now check the battery" resolved target to android')
  assert(turn4.tool === 'android.getBattery', '"Now check the battery" mapped to android.getBattery')

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 4: Target Disambiguation (PC vs Phone)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n── SUITE 4: Target Disambiguation (PC vs Phone) ──')

  intentService.clearContext()
  // When phone is connected and user says "Open Chrome" without specifying device:
  intentService.setContext({ isPhoneConnected: true, lastTarget: undefined })

  const disambig = intentService.resolve('Open Chrome')
  assert(disambig.needsClarification === true, '"Open Chrome" with connected phone flags needsClarification')
  assert(disambig.clarificationQuestion.includes('PC or phone'), 'Clarification asks user whether to open on PC or phone')

  // Follow-up: User responds "My phone"
  const followUpPhone = intentService.resolve('My phone')
  assert(followUpPhone.detected_target === 'android', 'Follow-up "My phone" resolves target to android')
  assert(followUpPhone.tool === 'android.openApp', 'Follow-up "My phone" maps to android.openApp')
  assert(followUpPhone.args.appName.toLowerCase().includes('chrome'), 'Follow-up "My phone" preserves Chrome app name')

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 5: Consequential Action Safety Gate
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n── SUITE 5: Consequential Action Safety Gate ──')

  const powerAction = await agentService.executeAgentLoop('turn off my phone', [])
  assert(powerAction.handled === true, '"turn off my phone" was handled')
  assert(powerAction.confirmationCard !== undefined, 'ConfirmationCard produced for high-risk action')
  assert(powerAction.confirmationCard.action === 'power_off', 'ConfirmationCard action is power_off')
  assert(powerAction.confirmationCard.risk === 'high', 'ConfirmationCard risk is high')
  assert(powerAction.naturalResponse.includes('turn off your phone'), 'Natural response prompts for explicit user confirmation')

  // Confirming action with "cancel"
  const cancelAction = await agentService.executeAgentLoop('cancel', [])
  assert(cancelAction.handled === true, 'Cancel confirmation handled')
  assert(cancelAction.naturalResponse.includes('cancelled'), 'Natural response confirms cancellation')

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 6: Memory Management (Remember / Forget)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n── SUITE 6: Memory Management (Remember / Forget) ──')

  const memStore = intentService.resolve('Remember that I prefer dark mode')
  assert(memStore.detected_intent === 'memory.store', '"Remember that I prefer dark mode" detected as memory.store')
  assert(memStore.args.content.includes('dark mode'), 'Fact content extracted correctly')

  const memForget = intentService.resolve('Forget that')
  assert(memForget.detected_intent === 'memory.delete', '"Forget that" detected as memory.delete')

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 7: Real Phone Connection & Zero Fake Numbers
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n── SUITE 7: Real Phone Contacts & Zero Fake Numbers Verification ──')

  const devices = await adbService.getDevicesWithDetails().catch(() => ({ devices: [] }))
  console.log(`  📱 Detected attached devices: ${devices.devices?.length || 0}`)

  if (devices.devices && devices.devices.length > 0) {
    const dev = devices.devices[0]
    console.log(`  📱 Device: ${dev.manufacturer} ${dev.model} (${dev.id}) - State: ${dev.state}`)

    // 7.1 Verify multiple contacts handling for "Sukesh"
    const sukeshRes = await contactsService.resolveContact('Sukesh')
    console.log(`  📱 Contacts matching "Sukesh": status=${sukeshRes.status}, count=${sukeshRes.matchingNames?.length || 0}`)
    assert(sukeshRes.status === 'MULTIPLE_MATCHES', 'Found multiple contacts matching "Sukesh" (ambiguity safety)')

    // 7.2 Resolve unambiguous contact "Sukesh D"
    const sukeshDRes = await contactsService.resolveContact('Sukesh D')
    assert(sukeshDRes.status === 'RESOLVED', 'Contact "Sukesh D" resolved unambiguously')
    assert(sukeshDRes.selectedNumber !== '+1234567890', 'Resolved phone number is NEVER +1234567890')
    assert(/^[+]?[0-9]{7,15}$/.test(sukeshDRes.selectedNumber.replace(/[\s-]/g, '')), `Resolved real valid phone number: ${sukeshDRes.selectedNumber}`)

    // 7.3 Non-existent contact
    const notFound = await contactsService.resolveContact('TotallyNonExistentContact999XYZ')
    assert(notFound.status === 'NOT_FOUND', 'Non-existent contact returns NOT_FOUND')
    assert(!notFound.selectedNumber, 'No phone number resolved for non-existent contact')

    // 7.4 Battery reading from actual device
    const batteryRes = await toolsRegistry.execute('android.getBattery', {})
    assert(batteryRes.success === true, 'Real Android battery reading succeeded')
    assert(typeof batteryRes.data?.level === 'number', `Battery level is a valid number: ${batteryRes.data?.level}%`)
  } else {
    console.log('  ⚠️ (No physical ADB device currently attached during test run)')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 8: Real Telemetry Audit
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n── SUITE 8: Performance Telemetry Verification ──')
  const telemetryTest = await agentService.executeAgentLoop('check CPU', [])
  assert(telemetryTest.telemetry !== undefined, 'Telemetry object present')
  assert(typeof telemetryTest.telemetry.understandingMs === 'number', `understandingMs: ${telemetryTest.telemetry.understandingMs}ms`)
  assert(typeof telemetryTest.telemetry.toolExecutionMs === 'number', `toolExecutionMs: ${telemetryTest.telemetry.toolExecutionMs}ms`)
  assert(typeof telemetryTest.telemetry.totalMs === 'number', `totalMs: ${telemetryTest.telemetry.totalMs}ms`)

  // ─────────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n═════════════════════════════════════════════════════════════════════════')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('═════════════════════════════════════════════════════════════════════════')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})
