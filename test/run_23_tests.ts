// test/run_23_tests.ts — Verification of all 23 user test commands
import { agentService } from '../src/main/services/agent.service'
import * as fs from 'fs'
import * as path from 'path'

interface TestResultRecord {
  id: number
  command: string
  parsedIntent: string
  selectedAction: string
  executionResult: string
  stdoutStderr?: string
  durationMs: number
  totalLatencyMs: number
  status: 'PASS' | 'FAIL' | 'BLOCKED/N/A'
}

const COMMANDS = [
  "what time is it",
  "what is today's date",
  "show cpu",
  "show memory",
  "show disk usage",
  "show wifi status",
  "show network adapters",
  "show my ip",
  "change brightness to 100",
  "change brightness to 50",
  "open calculator",
  "open notepad",
  "open file explorer",
  "open settings",
  "create a ULTRON_TEST folder",
  "create a test file",
  "read the test file",
  "copy the test file",
  "move the test file",
  "search for the test file",
  "delete ONLY the test artifacts",
  "open calculator and search youtube and bing",
  "run a safe compound command containing 3+ actions"
]

async function runTests() {
  console.log('='.repeat(80))
  console.log('ULTRON DETERMINISTIC LOCAL INTENT ROUTER — 23 COMMAND AUDIT')
  console.log('='.repeat(80))

  const records: TestResultRecord[] = []

  for (let i = 0; i < COMMANDS.length; i++) {
    const cmd = COMMANDS[i]
    const testNum = i + 1
    console.log(`\n[${testNum}/23] Testing: "${cmd}"`)

    const start = performance.now()
    try {
      const res = await agentService.executeIntent(cmd)
      const totalLatency = parseFloat((performance.now() - start).toFixed(2))

      if (!res.handled) {
        console.error(`  ❌ FAILED: Not handled by local intent router! Fell through to LLM.`)
        records.push({
          id: testNum,
          command: cmd,
          parsedIntent: 'UNHANDLED_FALLBACK_TO_LLM',
          selectedAction: 'NONE',
          executionResult: 'Fell through to LLM fallback',
          durationMs: 0,
          totalLatencyMs: totalLatency,
          status: 'FAIL'
        })
        continue
      }

      const report = res.report
      const tasks = report?.tasks || []
      const taskNames = tasks.map((t) => t.name).join(' | ')
      const categories = tasks.map((t) => t.category).join(' | ')
      const isSuccess = tasks.every((t) => t.status === 'COMPLETED')
      const totalTaskDur = report?.totalDurationMs ?? totalLatency

      let stdoutStderr = ''
      let resultSummary = ''

      for (const t of tasks) {
        const r = t.result
        if (r?.stdout) stdoutStderr += `[stdout: ${r.stdout.trim().slice(0, 100)}] `
        if (r?.stderr) stdoutStderr += `[stderr: ${r.stderr.trim().slice(0, 100)}] `
        if (r?.data?.error) stdoutStderr += `[error: ${r.data.error}] `

        // Specific result checks
        if (r?.data) {
          if (r.commandId === 'system.brightness.set') {
            if (r.data.supported) {
              resultSummary += `Brightness set to ${r.data.targetBrightness}% (verified: ${r.data.currentBrightness}%) `
            } else {
              resultSummary += `Brightness unsupported: ${r.data.error} `
            }
          } else if (r.commandId === 'system.time') {
            resultSummary += `Time: ${r.data.time} `
          } else if (r.commandId === 'system.date') {
            resultSummary += `Date: ${r.data.date} `
          } else if (r.commandId === 'system.cpu') {
            resultSummary += `CPU: ${r.data.name}, Load: ${r.data.loadPercentage}% `
          } else if (r.commandId === 'system.memory') {
            resultSummary += `RAM: ${r.data.usedGB}/${r.data.totalGB} GB (${r.data.percentUsed}%) `
          } else if (r.commandId === 'system.disk') {
            resultSummary += `Disks: ${r.data.disks?.length || 0} drives detected `
          } else if (r.commandId === 'network.wifi.status') {
            resultSummary += `Wi-Fi: ${r.data.state}, SSID: ${r.data.ssid} `
          } else if (r.commandId === 'network.adapters') {
            resultSummary += `Adapters: ${r.data.count} adapters `
          } else if (r.commandId === 'network.ip') {
            resultSummary += `IP: ${r.data.primaryIP} `
          } else if (r.commandId === 'settings.main') {
            resultSummary += `Settings launched: ${r.data.uri} `
          } else {
            resultSummary += JSON.stringify(r.data).slice(0, 80)
          }
        } else if (r?.path || r?.destination || r?.matches) {
          if (r.matches) resultSummary += `Found ${r.totalMatches} matches for '${r.query}' `
          if (r.path) resultSummary += `Path: ${r.path} `
          if (r.destination) resultSummary += `Dest: ${r.destination} `
        } else if (r?.app) {
          resultSummary += `App '${r.app}' launched (PID: ${r.pid || 'detached'}) `
        } else if (r?.url) {
          resultSummary += `Web search launched: ${r.url} `
        }
      }

      let status: 'PASS' | 'FAIL' | 'BLOCKED/N/A' = isSuccess ? 'PASS' : 'FAIL'

      // If brightness was unsupported by display hardware, record BLOCKED/N/A as requested
      if (cmd.includes('brightness')) {
        const brightnessTask = tasks.find(t => t.command.includes('brightness'))
        if (brightnessTask?.result?.data?.supported === false) {
          status = 'BLOCKED/N/A'
        }
      }

      console.log(`  ✓ Handled locally: ${taskNames}`)
      console.log(`  ✓ Result: ${resultSummary || 'Completed'}`)
      console.log(`  ✓ Duration: ${totalTaskDur}ms | Total Latency: ${totalLatency}ms | Status: ${status}`)

      records.push({
        id: testNum,
        command: cmd,
        parsedIntent: taskNames,
        selectedAction: categories,
        executionResult: resultSummary.trim() || 'Success',
        stdoutStderr: stdoutStderr.trim() || undefined,
        durationMs: totalTaskDur,
        totalLatencyMs: totalLatency,
        status
      })
    } catch (err: any) {
      console.error(`  ❌ EXCEPTION:`, err.message)
      records.push({
        id: testNum,
        command: cmd,
        parsedIntent: 'ERROR_DURING_EXECUTION',
        selectedAction: 'NONE',
        executionResult: err.message,
        durationMs: 0,
        totalLatencyMs: parseFloat((performance.now() - start).toFixed(2)),
        status: 'FAIL'
      })
    }
  }

  // Save audit log to JSON
  const outPath = path.join(__dirname, 'test_23_results.json')
  fs.writeFileSync(outPath, JSON.stringify(records, null, 2))
  console.log(`\nAudit results written to: ${outPath}`)

  console.log('\n' + '='.repeat(80))
  console.log('SUMMARY TABLE')
  console.log('='.repeat(80))
  console.log('| # | Command | Intent | Result | Latency | Status |')
  console.log('|---|---|---|---|---|---|')
  for (const r of records) {
    console.log(`| ${r.id} | ${r.command} | ${r.parsedIntent.slice(0, 30)} | ${r.executionResult.slice(0, 35)} | ${r.totalLatencyMs}ms | ${r.status} |`)
  }
}

runTests().catch(console.error)
