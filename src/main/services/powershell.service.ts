import { execFile, ChildProcess } from 'child_process'

export interface PowerShellTelemetry {
  powershellStartupMs: number
  commandExecutionMs: number
  parsingMs: number
  totalDurationMs: number
}

export interface PowerShellResult<T = any> {
  success: boolean
  commandType?: string
  stdout: string
  stderr: string
  exitCode: number
  parsedData?: T
  duration_ms: number
  telemetry: PowerShellTelemetry
  error?: string
}

export interface PowerShellOptions {
  timeoutMs?: number
  commandType?: string
  signal?: AbortSignal
  parser?: (stdout: string) => any
}

// Redact any potential API keys, passwords, or tokens from error logs
function redactSecrets(text: string): string {
  if (!text) return ''
  return text
    .replace(/(?:nvapi-[A-Za-z0-9_\-]{20,})/gi, '[REDACTED_API_KEY]')
    .replace(/(?:sk-[A-Za-z0-9_\-]{20,})/gi, '[REDACTED_SECRET]')
    .replace(/((?:password|secret|token|bearer|key)\s*[:=]\s*)[^\s,;]+/gi, '$1[REDACTED]')
}

// Clean PowerShell progress CLIXML from stderr
function sanitizeStderr(rawStderr: string): string {
  if (!rawStderr) return ''
  const cleaned = rawStderr
    .replace(/#<\s*CLIXML[\s\S]*?<\/Objs>/gi, '')
    .trim()
  return redactSecrets(cleaned)
}

export class PowerShellService {
  private runningProcesses: Map<string, ChildProcess> = new Map()

  /**
   * Execute a structured PowerShell command or script using safe Base64 Unicode encoding
   */
  async execute<T = any>(
    script: string,
    timeoutOrOptions: number | PowerShellOptions = 30000
  ): Promise<PowerShellResult<T>> {
    const startOverall = performance.now()
    const options: PowerShellOptions =
      typeof timeoutOrOptions === 'number'
        ? { timeoutMs: timeoutOrOptions }
        : timeoutOrOptions

    const timeoutMs = options.timeoutMs ?? 30000
    const commandType = options.commandType || 'generic'

    // Encode script in UTF-16LE Base64 for PowerShell -EncodedCommand (zero quoting/escaping issues)
    const encodedCommand = Buffer.from(script, 'utf16le').toString('base64')

    const execStart = performance.now()
    const startupMs = parseFloat((execStart - startOverall).toFixed(2))

    return new Promise<PowerShellResult<T>>((resolve) => {
      let proc: ChildProcess | null = null

      const timeoutTimer = setTimeout(() => {
        if (proc && !proc.killed) {
          try {
            proc.kill('SIGTERM')
          } catch {}
        }
      }, timeoutMs)

      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          if (proc && !proc.killed) {
            try {
              proc.kill('SIGTERM')
            } catch {}
          }
        })
      }

      proc = execFile(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encodedCommand],
        {
          timeout: timeoutMs,
          maxBuffer: 15 * 1024 * 1024,
          windowsHide: true
        },
        (error, stdout, rawStderr) => {
          clearTimeout(timeoutTimer)
          const execEnd = performance.now()
          const commandExecutionMs = parseFloat((execEnd - execStart).toFixed(2))

          const cleanedStdout = stdout ? stdout.trim() : ''
          const cleanedStderr = sanitizeStderr(rawStderr)

          // Parsing stage
          const parseStart = performance.now()
          let parsedData: T | undefined = undefined
          let parseError: string | undefined = undefined

          if (options.parser && cleanedStdout) {
            try {
              parsedData = options.parser(cleanedStdout)
            } catch (pErr: any) {
              parseError = `Parsing failure: ${pErr.message}`
            }
          } else if (cleanedStdout.startsWith('{') || cleanedStdout.startsWith('[')) {
            try {
              parsedData = JSON.parse(cleanedStdout)
            } catch {}
          }

          const parseEnd = performance.now()
          const parsingMs = parseFloat((parseEnd - parseStart).toFixed(2))
          const totalDurationMs = parseFloat((parseEnd - startOverall).toFixed(2))

          const isSuccess = !error && !parseError
          const errorMessage = error
            ? redactSecrets(error.message)
            : parseError || (cleanedStderr && error ? cleanedStderr : undefined)

          resolve({
            success: isSuccess,
            commandType,
            stdout: cleanedStdout,
            stderr: cleanedStderr,
            exitCode: error?.code || 0,
            parsedData,
            duration_ms: totalDurationMs,
            telemetry: {
              powershellStartupMs: startupMs,
              commandExecutionMs,
              parsingMs,
              totalDurationMs
            },
            error: errorMessage
          })
        }
      )
    })
  }

  /**
   * Cancel all currently active PowerShell processes if needed
   */
  cancelAll(): void {
    for (const [id, proc] of this.runningProcesses.entries()) {
      try {
        proc.kill('SIGKILL')
      } catch {}
      this.runningProcesses.delete(id)
    }
  }
}

export const powershellService = new PowerShellService()
export const powerShellService = powershellService