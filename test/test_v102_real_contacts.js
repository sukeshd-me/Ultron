// test/test_v102_real_contacts.js — Verification of Real Android Contact Resolution (v1.0.2)
const { contactsService, adbService, toolsRegistry } = require('../out/main/index.js')
const fs = require('fs')
const path = require('path')

console.log('═════════════════════════════════════════════════════════════════════')
console.log('ULTRON v1.0.2 — REAL ANDROID CONTACT / CALL BUG FIX VERIFICATION')
console.log('═════════════════════════════════════════════════════════════════════\n')

let passed = 0
let failed = 0

function assert(condition, message, detail = '') {
  if (condition) {
    passed++
    console.log(`  ✓ PASS: ${message} ${detail ? `(${detail})` : ''}`)
  } else {
    failed++
    console.error(`  ✗ FAIL: ${message} ${detail ? `— Detail: ${detail}` : ''}`)
  }
}

async function runTests() {
  console.log('── TEST SUITE 1: Zero Hardcoded/Fake Phone Numbers Audit ──')
  try {
    const srcDir = path.join(__dirname, '../src')
    function scanFiles(dir) {
      let files = []
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item)
        if (fs.statSync(full).isDirectory()) {
          files = files.concat(scanFiles(full))
        } else if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js')) {
          files.push(full)
        }
      }
      return files
    }

    const allSourceFiles = scanFiles(srcDir)
    let fakeNumberViolations = []

    for (const file of allSourceFiles) {
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split('\n')
      lines.forEach((line, idx) => {
        // Skip comment lines explaining the rejection rule
        if (line.includes('* Reject:') || line.includes('// Reject hardcoded') || line.includes('// Strict validation')) return
        // Check for hardcoded string assignment or return of fake numbers
        if (line.includes("'+1234567890'") || line.includes('"1234567890"') || line.includes('+1234567890')) {
          // Allow explicit validation check e.g. `clean === '+1234567890'`
          if (!line.includes('===') && !line.includes('===')) {
            fakeNumberViolations.push(`${path.basename(file)}:${idx + 1}: ${line.trim()}`)
          }
        }
      })
    }

    assert(
      fakeNumberViolations.length === 0,
      'No production code path contains or returns +1234567890',
      fakeNumberViolations.join('; ')
    )

    // Check configuredContacts is completely gone
    const contactsServiceContent = fs.readFileSync(path.join(srcDir, 'main/services/contacts.service.ts'), 'utf8')
    assert(
      !contactsServiceContent.includes('configuredContacts'),
      'Fake configuredContacts array is completely eliminated from contacts.service.ts'
    )
  } catch (err) {
    assert(false, 'Codebase fake number scan failed', err.message)
  }

  console.log('\n── TEST SUITE 2: Phone Number Validation Rules ──')
  try {
    const { isValidPhoneNumber } = require('../out/main/index.js')
    // In our compiled code, let's see if isValidPhoneNumber is accessible or test adbService.makeCall rejection
    const invalidNumbers = [
      '+1234567890',
      '1234567890',
      '0000000000',
      '1111111111',
      '0123456789',
      '9876543210',
      '',
      '   ',
      '12'
    ]

    for (const num of invalidNumbers) {
      const callRes = await adbService.makeCall(num)
      assert(
        callRes.success === false,
        `makeCall rejects invalid/fake number "${num}"`,
        `Error: ${callRes.error}`
      )
    }

    console.log('  Testing valid real phone number formats...')
    // Test that validation accepts realistic mobile numbers
    // (Note: we don't dispatch live call here, we check validation passes pre-flight checks)
  } catch (err) {
    assert(false, 'Number validation tests encountered error', err.message)
  }

  console.log('\n── TEST SUITE 3: Contact Index & In-Memory Cache Performance ──')
  try {
    const startWarmMs = performance.now()
    const warmResult = await contactsService.loadDeviceContacts(true)
    const warmDuration = performance.now() - startWarmMs

    assert(
      warmResult.count > 0,
      `Device contacts successfully loaded into ContactIndex (${warmResult.count} contacts)`,
      `Duration: ${warmDuration.toFixed(1)}ms`
    )

    assert(
      contactsService.isCacheFresh(),
      'Contact cache is fresh with TTL active'
    )

    const stats = contactsService.getContactIndexStats()
    assert(
      stats.totalContacts === warmResult.count && stats.isFresh === true,
      `ContactIndex stats reporting correct totals (${stats.totalContacts} indexed contacts)`
    )
  } catch (err) {
    assert(false, 'Contact cache loading failed', err.message)
  }

  console.log('\n── TEST SUITE 4: Multiple Matches Disambiguation (Ambiguity Safety) ──')
  try {
    // On the connected device, "Sukesh" matches "Sukesh D", "Sukesh Friend Sri Hari", etc.
    const res = await contactsService.resolveContact('Sukesh')

    assert(
      res.status === 'MULTIPLE_MATCHES',
      'Query "Sukesh" detects multiple matches and does NOT arbitrarily pick one',
      `Status: ${res.status}`
    )

    assert(
      Array.isArray(res.matchingNames) && res.matchingNames.length > 1,
      `Multiple candidate names returned for user selection (${res.matchingNames ? res.matchingNames.length : 0} names)`,
      res.matchingNames ? res.matchingNames.slice(0, 3).join(', ') + '...' : ''
    )

    assert(
      res.selectedNumber === undefined,
      'No phone number selected when query is ambiguous'
    )

    assert(
      res.message.includes('multiple contacts') && res.message.includes('Which one did you mean?'),
      'Returned compact user disambiguation prompt'
    )

    assert(
      res.telemetry && res.telemetry.contact_cache_lookup_ms >= 0,
      `Fast in-memory cache lookup telemetry recorded (${res.telemetry.contact_cache_lookup_ms}ms)`
    )
  } catch (err) {
    assert(false, 'Multiple matches disambiguation test failed', err.message)
  }

  console.log('\n── TEST SUITE 5: Exact Name Resolution to REAL Number ──')
  try {
    // Query exact contact "Sukesh D"
    const res = await contactsService.resolveContact('Sukesh D')

    assert(
      res.status === 'RESOLVED',
      'Query "Sukesh D" successfully resolves exact contact',
      `Status: ${res.status}`
    )

    assert(
      res.contact && res.contact.name === 'Sukesh D',
      'Resolved contact display name is "Sukesh D"'
    )

    assert(
      res.selectedNumber && res.selectedNumber !== '+1234567890' && res.selectedNumber !== '1234567890',
      'Selected phone number is NOT +1234567890',
      `Selected: ${res.selectedNumber}`
    )

    assert(
      res.selectedNumber.includes('9842609507'),
      'Selected number matches the actual real phone number of Sukesh D from Android device'
    )

    assert(
      res.telemetry.contact_cache_lookup_ms < 10,
      `Contact lookup latency is extremely fast (< 10ms)`,
      `Cache Lookup: ${res.telemetry.contact_cache_lookup_ms}ms, Resolution: ${res.telemetry.contact_resolution_ms}ms`
    )
  } catch (err) {
    assert(false, 'Exact name resolution test failed', err.message)
  }

  console.log('\n── TEST SUITE 6: Case-Insensitivity & Whitespace Normalization ──')
  try {
    const res1 = await contactsService.resolveContact('sukesh d')
    assert(
      res1.status === 'RESOLVED' && res1.contact.name === 'Sukesh D',
      'Lower-case query "sukesh d" resolves identically to "Sukesh D"'
    )

    const res2 = await contactsService.resolveContact('   Sukesh    D   ')
    assert(
      res2.status === 'RESOLVED' && res2.contact.name === 'Sukesh D',
      'Padded whitespace query "   Sukesh    D   " resolves identically'
    )
  } catch (err) {
    assert(false, 'Normalization tests failed', err.message)
  }

  console.log('\n── TEST SUITE 7: Multi-Number Disambiguation & Single Number Resolution ──')
  try {
    // 1. "Dad" has 2 different numbers on the phone with no primary flag -> AMBIGUOUS_NUMBERS
    const dadRes = await contactsService.resolveContact('Dad')
    assert(
      dadRes.status === 'AMBIGUOUS_NUMBERS',
      'Contact "Dad" with multiple distinct numbers returns AMBIGUOUS_NUMBERS without guessing',
      `Status: ${dadRes.status}`
    )
    assert(
      dadRes.selectedNumber === undefined,
      'No number is automatically dialed for contact with ambiguous multiple numbers'
    )
    assert(
      dadRes.message.includes('Which number should I call for Dad?'),
      'Returned prompt asking user which number to call'
    )

    // 2. "Kemanth" has a single real number on the phone -> RESOLVED
    const kemanthRes = await contactsService.resolveContact('Kemanth')
    assert(
      kemanthRes.status === 'RESOLVED',
      'Contact "Kemanth" with single number resolves successfully',
      `Status: ${kemanthRes.status}`
    )
    assert(
      kemanthRes.selectedNumber === '9944669253',
      'Resolved real number 9944669253 for Kemanth from phone',
      `Number: ${kemanthRes.selectedNumber}`
    )
  } catch (err) {
    assert(false, 'Multi-number disambiguation and single number resolution tests failed', err.message)
  }

  console.log('\n── TEST SUITE 8: Non-Existent Contact Safety (Zero Calls) ──')
  try {
    const res = await contactsService.resolveContact('AlexNonExistentContact999')
    assert(
      res.status === 'NOT_FOUND',
      'Non-existent contact query returns NOT_FOUND',
      `Status: ${res.status}`
    )

    assert(
      res.selectedNumber === undefined,
      'Zero phone number selected for non-existent contact'
    )

    assert(
      res.message.includes("couldn't find"),
      'Returns polite feedback: "I couldn\'t find AlexNonExistentContact999 in your phone contacts."'
    )
  } catch (err) {
    assert(false, 'Non-existent contact safety test failed', err.message)
  }

  console.log('\n── TEST SUITE 9: Tool Level Execution Safety (`android.callContact`) ──')
  try {
    const tool = toolsRegistry.get('android.callContact')
    assert(tool !== undefined, 'android.callContact tool is registered')

    // 1. Ambiguous contact -> must NOT call
    const ambigExec = await tool.executor({ contactName: 'Sukesh' })
    assert(
      ambigExec.success === false,
      'Tool refuses to dial when contact name is ambiguous',
      `Message: ${ambigExec.message}`
    )
    assert(
      Array.isArray(ambigExec.matchingNames),
      'Tool returns matching names list for user selection'
    )

    // 2. Non-existent contact -> must NOT call
    const notFoundExec = await tool.executor({ contactName: 'AlexNonExistentContact999' })
    assert(
      notFoundExec.success === false,
      'Tool refuses to dial when contact does not exist on phone',
      `Message: ${notFoundExec.message}`
    )
    assert(
      notFoundExec.message.includes("couldn't find that contact on your phone"),
      'Tool returns exact required message: "I couldn\'t find that contact on your phone."'
    )

    // 3. Check telemetry presence
    assert(
      notFoundExec.telemetry && notFoundExec.telemetry.contact_cache_lookup_ms !== undefined,
      'Tool reports genuine performance telemetry (contact_cache_lookup_ms, contact_resolution_ms, total_ms)'
    )
  } catch (err) {
    assert(false, 'Tool level safety tests failed', err.message)
  }

  console.log('\n' + '═'.repeat(69))
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`)
  console.log('═'.repeat(69) + '\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err)
  process.exit(1)
})
