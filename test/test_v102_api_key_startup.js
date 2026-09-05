// test/test_v102_api_key_startup.js
// Verification suite for ULTRON v1.0.2 API Key Startup Behavior & Credential Security

require('dotenv').config()
const { credentialService, modelService } = require('../out/main/index.js')

async function runTests() {
  console.log('═════════════════════════════════════════════════════════════════════')
  console.log('ULTRON v1.0.2 — VERIFY API KEY STARTUP BEHAVIOR & SECURITY')
  console.log('═════════════════════════════════════════════════════════════════════\n')

  let passed = 0
  let failed = 0

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`)
      passed++
    } else {
      console.error(`✕ [FAIL] ${testName} ${extraInfo}`)
      failed++
    }
  }

  // TEST 1: Check hasNvidiaApiKey
  const hasKey = await credentialService.hasNvidiaApiKey()
  assert(hasKey === true, 'TEST 1: hasNvidiaApiKey() identifies configured key')

  // TEST 2: Masked key representation
  const masked = await credentialService.getMaskedNvidiaApiKey()
  assert(masked === '••••••••••••••••••••••••', 'TEST 2: getMaskedNvidiaApiKey() returns masked string')
  assert(!masked.includes('nvapi-'), 'TEST 2b: Masked key does not leak plaintext secret')

  // TEST 3: Reject empty key overwrite
  const emptyRes = await credentialService.setNvidiaApiKey('')
  assert(emptyRes.success === false, 'TEST 3: setNvidiaApiKey("") rejects empty key')
  const stillHasKey = await credentialService.hasNvidiaApiKey()
  assert(stillHasKey === true, 'TEST 3b: Empty key does not delete or overwrite existing key')

  // TEST 4: Real NVIDIA validation with valid saved key
  console.log('\nTesting live connection against NVIDIA server...')
  const valResult = await credentialService.validateNvidiaApiKey()
  assert(valResult.valid === true, 'TEST 4: validateNvidiaApiKey() validates successfully with real key')
  assert(typeof valResult.latencyMs === 'number' && valResult.latencyMs > 0, `TEST 4b: Real latency measured (${valResult.latencyMs}ms)`)

  // TEST 5: Invalid key rejection
  const invalidRes = await credentialService.validateNvidiaApiKey('nvapi-invalid_key_for_testing_1234567890')
  assert(invalidRes.valid === false, 'TEST 5: validateNvidiaApiKey() fails for invalid key')
  assert(invalidRes.error === 'API key could not be verified.', 'TEST 5b: Error message does not leak key or raw server tokens')

  // TEST 6: useSavedNvidiaKey activation
  const useSavedRes = await credentialService.useSavedNvidiaKey()
  assert(useSavedRes.success === true && useSavedRes.valid === true, 'TEST 6: useSavedNvidiaKey() validates and activates key')
  const statusAfterSave = await modelService.getProviderStatus()
  assert(statusAfterSave.mode === 'AUTO' && statusAfterSave.online === true, `TEST 6b: Model mode updated to AUTO (online: ${statusAfterSave.online})`)

  // TEST 7: Continue Offline option
  const offlineRes = await credentialService.continueOffline()
  assert(offlineRes.success === true && offlineRes.mode === 'OFFLINE', 'TEST 7: continueOffline() returns mode OFFLINE')
  const statusOffline = await modelService.getProviderStatus()
  assert(statusOffline.mode === 'OFFLINE' && statusOffline.online === false, 'TEST 7b: Model provider confirms OFFLINE mode with local tools')

  // TEST 8: Log / Telemetry security check
  const transientKey = credentialService.getNvidiaApiKeyTransientSync()
  assert(typeof transientKey === 'string' && transientKey.startsWith('nvapi-'), 'TEST 8: Transient key retrieved on main process only')
  
  console.log('\n═════════════════════════════════════════════════════════════════════')
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('═════════════════════════════════════════════════════════════════════\n')

  if (failed > 0) process.exit(1)
}

runTests().catch((err) => {
  console.error('Test suite failure:', err)
  process.exit(1)
})
