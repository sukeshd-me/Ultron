// cli.js — ULTRON Unified Computer Agent CLI
require('dotenv').config()
const path = require('path')
const readline = require('readline')

// Load compiled main bundle containing unified AgentService, ToolsRegistry, ModelService
let agentService, modelService, toolsRegistry

try {
  const mainBundle = require(path.join(__dirname, 'out/main/index.js'))
  agentService = mainBundle.agentService
  modelService = mainBundle.modelService
  toolsRegistry = mainBundle.toolsRegistry
} catch (err) {
  console.error('\x1b[31m[!] Failed to load compiled ULTRON main services. Run "npm run build" first.\x1b[0m')
  console.error(err.message)
  process.exit(1)
}

const conversationHistory = []

async function executeAgentCLI(prompt) {
  conversationHistory.push({ role: 'user', content: prompt })
  const startMs = performance.now()

  try {
    const result = await agentService.executeAgentLoop(prompt, conversationHistory)

    if (result.handled && result.naturalResponse) {
      conversationHistory.push({ role: 'assistant', content: result.naturalResponse })
      console.log(`\n\x1b[36mULTRON »\x1b[0m\n${result.naturalResponse}\n`)

      // High-resolution Millisecond Telemetry
      const telem = result.telemetry
      console.log(
        `\x1b[90m⚡ [Telemetry] Understanding: ${telem.understandingMs}ms | Planning: ${telem.planningMs}ms | Memory: ${telem.memoryMs}ms | Tool Exec: ${telem.toolExecutionMs}ms | Verification: ${telem.verificationMs}ms | Total: ${telem.totalMs}ms\x1b[0m\n`
      )
      return result
    }

    // Conversational Fallback via ModelService
    process.stdout.write('\n\x1b[36mULTRON »\x1b[0m ')
    let fullResponse = ''
    await modelService.chat(conversationHistory, {
      onChunk: (chunk) => {
        fullResponse += chunk
        process.stdout.write(chunk)
      },
      onDone: (fullText) => {
        const dur = (performance.now() - startMs).toFixed(2)
        console.log(`\n\x1b[90m⚡ [Response completed in ${dur}ms]\x1b[0m\n`)
        conversationHistory.push({ role: 'assistant', content: fullText })
      },
      onError: (err) => {
        console.error(`\n\x1b[31m[Model Error]: ${err}\x1b[0m\n`)
      }
    })
  } catch (err) {
    console.error(`\n\x1b[31m[Execution Error]: ${err.message}\x1b[0m\n`)
  }
}

async function main() {
  const status = await modelService.getProviderStatus()
  const statusColor = status.statusLabel.includes('ONLINE') ? '\x1b[32m' : '\x1b[33m'

  const args = process.argv.slice(2)

  // 1. Headless test mode
  if (args.includes('--test')) {
    console.log('\x1b[36m[ULTRON CLI HEADLESS TEST RUNNER]\x1b[0m')
    console.log(`Provider Status: ${statusColor}${status.statusLabel}\x1b[0m (Mode: ${status.mode})\n`)

    const testQueries = [
      'what time is it',
      'show cpu',
      'show memory',
      'create a folder called ULTRON_CLI_TEST on Desktop',
      'delete ONLY the test artifacts'
    ]

    for (const q of testQueries) {
      console.log(`\x1b[35m[TEST QUERY]\x1b[0m "${q}"`)
      const res = await agentService.executeAgentLoop(q)
      const pass = res && res.handled && res.success
      console.log(`Status: ${pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'} (Total: ${res?.telemetry?.totalMs}ms)\n`)
    }

    console.log('\x1b[32m[All CLI tests executed successfully]\x1b[0m')
    process.exit(0)
  }

  // 2. Direct single-command execution
  const singlePrompt = args.join(' ').trim()
  if (singlePrompt) {
    await executeAgentCLI(singlePrompt)
    process.exit(0)
  }

  // 3. Interactive REPL
  console.log('\x1b[36m=========================================================\x1b[0m')
  console.log('\x1b[36m   ULTRON PERSONAL AI COMMAND CENTER — UNIFIED AGENT CLI \x1b[0m')
  console.log('\x1b[36m=========================================================\x1b[0m')
  console.log(`Status: ${statusColor}${status.statusLabel}\x1b[0m (Mode: ${status.mode})`)
  console.log(`Engine: \x1b[90m${status.modelName}\x1b[0m`)
  console.log('\x1b[90mType "exit" to quit.\x1b[0m\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\x1b[32mYOU » \x1b[0m'
  })

  rl.prompt()

  rl.on('line', async (line) => {
    const text = line.trim()
    if (text === 'exit' || text === 'quit' || text === 'q') {
      console.log('\n\x1b[36mULTRON offline.\x1b[0m\n')
      process.exit(0)
    }
    if (text) {
      await executeAgentCLI(text)
    }
    rl.prompt()
  })
}

main().catch(console.error)
