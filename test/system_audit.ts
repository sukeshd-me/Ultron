// test/system_audit.ts — Automated 32-Point Subsystem Verification & Telemetry Audit
import * as path from 'path'
import * as fs from 'fs'
import { execSync } from 'child_process'

// Import ULTRON services, registry, and memory engine
import { MemoryDatabase } from '../src/main/database/memory.db'
import { MemoryService } from '../src/main/services/memory.service'
import { commandRegistry } from '../src/main/services/command.registry'
import { powershellService } from '../src/main/services/powershell.service'
import { appsService } from '../src/main/services/apps.service'
import { filesystemService } from '../src/main/services/filesystem.service'
import { modelService } from '../src/main/services/model.service'
import { agentService } from '../src/main/services/agent.service'

export interface AuditRecord {
  testNumber: number
  testName: string
  action: string
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'N/A'
  durationMs: number
  details: string
  error?: string
}

const auditRecords: AuditRecord[] = []

function logRecord(rec: AuditRecord) {
  auditRecords.push(rec)
  const icon = rec.status === 'PASS' ? '✅' : rec.status === 'FAIL' ? '❌' : rec.status === 'BLOCKED' ? '🛡️' : '⚠️'
  console.log(`${icon} [Test ${rec.testNumber.toString().padStart(2, '0')}] ${rec.testName.padEnd(35)} : ${rec.status.padEnd(7)} (${rec.durationMs.toFixed(1).padStart(7)}ms) — ${rec.details}`)
}

async function runSystemAudit() {
  console.log('='.repeat(95))
  console.log('       ULTRON — WINDOWS 11 POWER CONTROL 32-POINT REAL-TIME AUDIT & BENCHMARK')
  console.log('='.repeat(95))

  const testTempFolder = path.join(process.cwd(), 'ULTRON_AUDIT_TEMP')
  const testFilePath = path.join(testTempFolder, 'audit_sample.txt')
  const copyFilePath = path.join(testTempFolder, 'audit_sample_copy.txt')
  const moveFilePath = path.join(testTempFolder, 'audit_sample_moved.txt')

  // Clean initial state
  if (fs.existsSync(testTempFolder)) {
    fs.rmSync(testTempFolder, { recursive: true, force: true })
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Current time
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('system.time')
    const dur = performance.now() - start
    const pass = res.success && Boolean(res.data?.time)
    logRecord({
      testNumber: 1,
      testName: 'Current Time',
      action: 'system.time (Get-Date)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Time returned: '${res.data.time}'` : 'Failed to query system time',
      error: res.error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Current date
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('system.date')
    const dur = performance.now() - start
    const pass = res.success && Boolean(res.data?.date)
    logRecord({
      testNumber: 2,
      testName: 'Current Date',
      action: 'system.date (Get-Date)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Date returned: '${res.data.date}'` : 'Failed to query system date',
      error: res.error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 3. CPU information
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('system.cpu')
    const dur = performance.now() - start
    const pass = res.success && res.data?.cores > 0
    logRecord({
      testNumber: 3,
      testName: 'CPU Information',
      action: 'system.cpu (Win32_Processor)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `${res.data.name} | Cores: ${res.data.cores} | Load: ${res.data.loadPercentage}%` : 'Failed CPU query',
      error: res.error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 4. RAM information
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('system.memory')
    const dur = performance.now() - start
    const pass = res.success && res.data?.totalGB > 0
    logRecord({
      testNumber: 4,
      testName: 'RAM Information',
      action: 'system.memory (Win32_OperatingSystem)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Total: ${res.data.totalGB} GB | Used: ${res.data.usedGB} GB (${res.data.percentUsed}%) | Free: ${res.data.freeGB} GB` : 'Failed RAM query',
      error: res.error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Disk information
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('system.disk')
    const dur = performance.now() - start
    const pass = res.success && Array.isArray(res.data?.disks) && res.data.disks.length > 0
    logRecord({
      testNumber: 5,
      testName: 'Disk Information',
      action: 'system.disk (Win32_LogicalDisk)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Drives: ${res.data.disks.map((d: any) => `${d.drive} (${d.freeGB}/${d.sizeGB} GB)`).join(', ')}` : 'Failed Disk query',
      error: res.error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Process list
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('system.processes', { limit: 5 })
    const dur = performance.now() - start
    const pass = res.success && Array.isArray(res.data?.processes) && res.data.processes.length > 0
    logRecord({
      testNumber: 6,
      testName: 'Process List',
      action: 'system.processes (Get-Process)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Retrieved top ${res.data.processes.length} processes (Top: ${res.data.processes[0]?.ProcessName})` : 'Failed process query',
      error: res.error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 7. Network adapter list
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('network.adapters')
    const dur = performance.now() - start
    const pass = res.success && Array.isArray(res.data?.adapters) && res.data.adapters.length > 0
    logRecord({
      testNumber: 7,
      testName: 'Network Adapter List',
      action: 'network.adapters (Get-NetAdapter)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Found ${res.data.count} adapters (Primary: ${res.data.adapters[0]?.Name})` : 'Failed adapter query',
      error: res.error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 8. Wi-Fi status
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('network.wifi.status')
    const dur = performance.now() - start
    const pass = res.success && Boolean(res.data?.state)
    logRecord({
      testNumber: 8,
      testName: 'Wi-Fi Status',
      action: 'network.wifi.status (netsh wlan)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `State: ${res.data.state} | SSID: ${res.data.ssid} | Signal: ${res.data.signal}` : 'Failed Wi-Fi query',
      error: res.error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 9. IP information
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('network.ip')
    const dur = performance.now() - start
    const pass = res.success && Boolean(res.data?.primaryIP)
    logRecord({
      testNumber: 9,
      testName: 'IP Information',
      action: 'network.ip (Get-NetIPAddress)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Primary IP: ${res.data.primaryIP} (${res.data.interfaces.length} interfaces)` : 'Failed IP query',
      error: res.error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 10. Listening ports
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('security.ports')
    const dur = performance.now() - start
    const pass = res.success && Array.isArray(res.data?.ports) && res.data.ports.length > 0
    logRecord({
      testNumber: 10,
      testName: 'Listening Ports',
      action: 'security.ports (Get-NetTCPConnection)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Discovered ${res.data.count} listening ports (Sample: ${res.data.ports.slice(0, 3).map((p: any) => p.port).join(', ')})` : 'Failed ports query',
      error: res.error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 11. Firewall status
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('security.firewall')
    const dur = performance.now() - start
    const pass = res.success && Array.isArray(res.data?.profiles) && res.data.profiles.length > 0
    logRecord({
      testNumber: 11,
      testName: 'Firewall Status',
      action: 'security.firewall (Get-NetFirewallProfile)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Status: ${res.data.status} (${res.data.profiles.length} profiles)` : 'Failed firewall query',
      error: res.error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 12. Windows Defender status
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('security.defender')
    const dur = performance.now() - start
    const pass = res.success && res.data?.antivirusEnabled !== undefined
    logRecord({
      testNumber: 12,
      testName: 'Windows Defender Status',
      action: 'security.defender (Get-MpComputerStatus)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Antivirus: ${res.data.antivirusEnabled} | RealTimeProtection: ${res.data.realTimeProtection}` : 'Failed Defender query',
      error: res.error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 13. Open Notepad
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await appsService.launch('notepad')
    const dur = performance.now() - start
    const pass = res.success
    try {
      execSync('taskkill /F /IM notepad.exe', { stdio: 'ignore' })
    } catch {}
    logRecord({
      testNumber: 13,
      testName: 'Open Notepad',
      action: 'appsService.launch("notepad")',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Launched successfully (PID: ${res.pid || 'Detached'}), cleaned process` : 'Failed to launch notepad'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 14. Open Calculator
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await appsService.launch('calculator')
    const dur = performance.now() - start
    const pass = res.success
    try {
      execSync('taskkill /F /IM CalculatorApp.exe', { stdio: 'ignore' })
    } catch {}
    logRecord({
      testNumber: 14,
      testName: 'Open Calculator',
      action: 'appsService.launch("calculator")',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Launched successfully (PID: ${res.pid || 'Detached'}), cleaned process` : 'Failed to launch calculator'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 15. Open File Explorer
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await appsService.launch('explorer')
    const dur = performance.now() - start
    const pass = res.success
    logRecord({
      testNumber: 15,
      testName: 'Open File Explorer',
      action: 'appsService.launch("explorer")',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Launched without blocking (PID: ${res.pid || 'Detached'})` : 'Failed to launch explorer'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 16. Create test folder
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await filesystemService.createFolder(testTempFolder)
    const dur = performance.now() - start
    const pass = res.success && fs.existsSync(testTempFolder)
    logRecord({
      testNumber: 16,
      testName: 'Create Test Folder',
      action: `filesystemService.createFolder("${testTempFolder}")`,
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Created directory at: ${res.path}` : 'Failed to create folder'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 17. Create test file
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const content = 'ULTRON WINDOWS 11 CONTROL AUDIT VERIFICATION TIMESTAMP: ' + Date.now()
    const res = await filesystemService.createFile(testFilePath, content)
    const dur = performance.now() - start
    const pass = res.success && fs.existsSync(testFilePath) && res.size > 0
    logRecord({
      testNumber: 17,
      testName: 'Create Test File',
      action: `filesystemService.createFile("${testFilePath}")`,
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Created file (${res.size} bytes)` : 'Failed to create file'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 18. Read test file
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await filesystemService.readFile(testFilePath)
    const dur = performance.now() - start
    const pass = res.success && res.content.includes('ULTRON WINDOWS 11 CONTROL AUDIT')
    logRecord({
      testNumber: 18,
      testName: 'Read Test File',
      action: `filesystemService.readFile("${testFilePath}")`,
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Read verified (${res.size} bytes, content verified)` : 'Failed to read file'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 19. Copy test file
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await filesystemService.copyItem(testFilePath, copyFilePath)
    const dur = performance.now() - start
    const pass = res.success && fs.existsSync(copyFilePath)
    logRecord({
      testNumber: 19,
      testName: 'Copy Test File',
      action: `filesystemService.copyItem(src, copy)`,
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Copied to: ${res.destination}` : 'Failed to copy file'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 20. Move test file
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await filesystemService.moveItem(copyFilePath, moveFilePath)
    const dur = performance.now() - start
    const pass = res.success && fs.existsSync(moveFilePath) && !fs.existsSync(copyFilePath)
    logRecord({
      testNumber: 20,
      testName: 'Move Test File',
      action: `filesystemService.moveItem(copy, moved)`,
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Moved successfully to: ${res.destination}` : 'Failed to move file'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 21. Search for test file
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await filesystemService.searchFiles('audit_sample_moved', testTempFolder)
    const dur = performance.now() - start
    const pass = res.totalMatches > 0
    logRecord({
      testNumber: 21,
      testName: 'Search for Test File',
      action: `filesystemService.searchFiles("audit_sample_moved")`,
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Found ${res.totalMatches} match in test tree` : 'Failed to find moved file'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 22. Delete ONLY the test file
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await filesystemService.deleteItem(moveFilePath)
    // Also clean the original test file and directory
    await filesystemService.deleteItem(testFilePath)
    await filesystemService.deleteItem(testTempFolder)
    const dur = performance.now() - start
    const pass = res.success && !fs.existsSync(moveFilePath) && !fs.existsSync(testTempFolder)
    logRecord({
      testNumber: 22,
      testName: 'Delete ONLY Test File',
      action: `filesystemService.deleteItem(file) + clean folder`,
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? 'Safely deleted test files and purged temporary audit directory' : 'Failed to clean test files'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 23. Open Windows Settings
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('settings.main')
    const dur = performance.now() - start
    const pass = res.success
    logRecord({
      testNumber: 23,
      testName: 'Open Windows Settings',
      action: 'commandRegistry.execute("settings.main")',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Dispatched ms-settings: URI (${dur.toFixed(1)}ms)` : 'Failed to launch settings'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 24. LLM request
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const hasKey = modelService.isConfigured()
    if (!hasKey) {
      logRecord({
        testNumber: 24,
        testName: 'LLM Request',
        action: 'modelService.chat (Cloud Inference)',
        status: 'N/A',
        durationMs: performance.now() - start,
        details: 'No NVIDIA API key configured; cloud LLM test skipped honestly per user specification'
      })
    } else {
      let receivedResponse = false
      let fullContent = ''
      try {
        await new Promise<void>((resolve, reject) => {
          modelService.chat(
            [{ role: 'user', content: 'Say "ULTRON_TEST_CONFIRMED" in one word.' }],
            {
              onChunk: (c) => { fullContent += c },
              onDone: () => { receivedResponse = true; resolve() },
              onError: (err) => { reject(new Error(err)) }
            }
          )
        })
        const dur = performance.now() - start
        logRecord({
          testNumber: 24,
          testName: 'LLM Request',
          action: 'modelService.chat (Cloud Inference)',
          status: receivedResponse ? 'PASS' : 'FAIL',
          durationMs: dur,
          details: `Inference verified: '${fullContent.trim().slice(0, 40)}'`
        })
      } catch (err: any) {
        logRecord({
          testNumber: 24,
          testName: 'LLM Request',
          action: 'modelService.chat (Cloud Inference)',
          status: 'FAIL',
          durationMs: performance.now() - start,
          details: `API call failed: ${err.message}`,
          error: err.message
        })
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 25. Streaming
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const hasKey = modelService.isConfigured()
    if (!hasKey) {
      logRecord({
        testNumber: 25,
        testName: 'Streaming',
        action: 'modelService.chat (Stream chunks)',
        status: 'N/A',
        durationMs: performance.now() - start,
        details: 'No NVIDIA API key configured; stream verification skipped per guidelines'
      })
    } else {
      let chunkCount = 0
      try {
        await new Promise<void>((resolve, reject) => {
          modelService.chat(
            [{ role: 'user', content: 'Count from 1 to 5.' }],
            {
              onChunk: () => { chunkCount++ },
              onDone: () => resolve(),
              onError: (err) => reject(new Error(err))
            }
          )
        })
        const dur = performance.now() - start
        logRecord({
          testNumber: 25,
          testName: 'Streaming',
          action: 'modelService.chat (Stream chunks)',
          status: chunkCount > 0 ? 'PASS' : 'FAIL',
          durationMs: dur,
          details: `Streamed ${chunkCount} chunks successfully`
        })
      } catch (err: any) {
        logRecord({
          testNumber: 25,
          testName: 'Streaming',
          action: 'modelService.chat (Stream chunks)',
          status: 'FAIL',
          durationMs: performance.now() - start,
          details: `Streaming error: ${err.message}`,
          error: err.message
        })
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 26. Memory storage
  // ─────────────────────────────────────────────────────────────
  const auditDbPath = path.join(process.cwd(), 'data', 'audit_32_test_memory.sqlite')
  if (fs.existsSync(auditDbPath)) fs.unlinkSync(auditDbPath)
  let auditDb = new MemoryDatabase(auditDbPath)
  let auditMem = new MemoryService(auditDb)

  {
    const start = performance.now()
    const m1 = await auditMem.saveMemory({
      category: 'conversation',
      content: 'User requested: Show my CPU usage and disk breakdown',
      metadata: { session: 'session-audit-32' }
    })
    const m2 = await auditMem.saveMemory({
      category: 'fact',
      key: 'user:project',
      content: 'User is developing ULTRON command center.'
    })
    const m3 = await auditMem.saveMemory({
      category: 'task',
      content: 'Execution report: 3 tasks succeeded in 84ms'
    })
    const dur = performance.now() - start
    const pass = Boolean(m1.id && m2.id && m3.id)
    logRecord({
      testNumber: 26,
      testName: 'Memory Storage',
      action: 'memoryService.saveMemory (conversation, fact, task)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? 'Successfully stored conversation, identity fact, and task records' : 'Failed to store memories'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 27. Memory retrieval
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const results = await auditMem.searchMemories({ query: 'developing ULTRON' })
    const dur = performance.now() - start
    const pass = results.length > 0 && results[0].content.includes('developing ULTRON')
    logRecord({
      testNumber: 27,
      testName: 'Memory Retrieval',
      action: 'memoryService.searchMemories({ query })',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Retrieved ${results.length} record(s): '${results[0].content}'` : 'Failed to retrieve memory'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 28. Memory persistence after restart
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    // Close and re-open SQLite database
    auditDb.close()
    const reopenedDb = new MemoryDatabase(auditDbPath)
    const reopenedMem = new MemoryService(reopenedDb)
    const facts = await reopenedMem.listMemories({ category: 'fact' })
    const dur = performance.now() - start
    const pass = facts.records.length > 0 && facts.records[0].key === 'user:project'
    reopenedDb.close()
    if (fs.existsSync(auditDbPath)) fs.unlinkSync(auditDbPath)
    logRecord({
      testNumber: 28,
      testName: 'Memory Persistence After Restart',
      action: 'Database close -> Reconnect -> Query records',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Verified ${facts.total} record(s) persisted across connection cycle` : 'Failed memory persistence check'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 29. IPC error handling
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    let errorCaught = false
    try {
      // Test missing required argument handling in command registry
      const res = await commandRegistry.execute('network.wifi.connect', { ssid: '' })
      if (!res.success) errorCaught = true
    } catch {
      errorCaught = true
    }
    const dur = performance.now() - start
    logRecord({
      testNumber: 29,
      testName: 'IPC Error Handling',
      action: 'commandRegistry.execute with missing required params',
      status: errorCaught ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: errorCaught ? 'Correctly caught missing parameter error with structured rejection' : 'Failed to catch error'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 30. PowerShell timeout handling
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await powershellService.execute('Start-Sleep -Seconds 10', { timeoutMs: 400 })
    const dur = performance.now() - start
    const pass = !res.success && dur < 2000
    logRecord({
      testNumber: 30,
      testName: 'PowerShell Timeout Handling',
      action: 'powershellService.execute (400ms timeout on 10s sleep)',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Timeout aborted cleanly in ${dur.toFixed(1)}ms without blocking process` : 'Failed timeout test'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 31. Invalid command handling
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const res = await commandRegistry.execute('nonexistent.fake.command.id')
    const dur = performance.now() - start
    const pass = !res.success && res.error?.includes('Unknown command')
    logRecord({
      testNumber: 31,
      testName: 'Invalid Command Handling',
      action: 'commandRegistry.execute("nonexistent.fake.command.id")',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? `Safely rejected: '${res.error}'` : 'Failed invalid command check'
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 32. Permission-denied / Policy Rejection handling
  // ─────────────────────────────────────────────────────────────
  {
    const start = performance.now()
    const shutdownRes = await commandRegistry.execute('system.shutdown')
    const sysDelRes = await commandRegistry.execute('filesystem.delete', { path: 'C:\\Windows' })
    const dur = performance.now() - start
    const pass = !shutdownRes.success && !sysDelRes.success
    logRecord({
      testNumber: 32,
      testName: 'Permission-Denied Handling',
      action: 'Rejection of system.shutdown and C:\\Windows deletion',
      status: pass ? 'PASS' : 'FAIL',
      durationMs: dur,
      details: pass ? 'Policy strictly blocked dangerous operations (Shutdown & Protected System Deletion)' : 'Safety policy failed to block dangerous commands'
    })
  }

  console.log('\n' + '='.repeat(95))
  console.log('                            AUDIT SUMMARY STATISTICS')
  console.log('='.repeat(95))

  const total = auditRecords.length
  const passCount = auditRecords.filter((r) => r.status === 'PASS').length
  const failCount = auditRecords.filter((r) => r.status === 'FAIL').length
  const blockedCount = auditRecords.filter((r) => r.status === 'BLOCKED').length
  const naCount = auditRecords.filter((r) => r.status === 'N/A').length

  const measuredTimes = auditRecords.map((r) => r.durationMs)
  const avgTime = measuredTimes.reduce((a, b) => a + b, 0) / total
  const fastest = Math.min(...measuredTimes)
  const slowest = Math.max(...measuredTimes)

  console.log(`TOTAL TESTS:              ${total}`)
  console.log(`PASS:                     ${passCount}`)
  console.log(`FAIL:                     ${failCount}`)
  console.log(`BLOCKED:                  ${blockedCount}`)
  console.log(`N/A:                      ${naCount}`)
  console.log(`AVERAGE EXECUTION TIME:   ${avgTime.toFixed(2)}ms`)
  console.log(`FASTEST:                  ${fastest.toFixed(2)}ms`)
  console.log(`SLOWEST:                  ${slowest.toFixed(2)}ms`)
  console.log('='.repeat(95))

  return {
    total,
    passCount,
    failCount,
    blockedCount,
    naCount,
    avgTime,
    fastest,
    slowest,
    auditRecords
  }
}

runSystemAudit().catch((err) => {
  console.error('Audit fatal error:', err)
})
