# ULTRON — OFFLINE-FIRST AGENT ARCHITECTURE & HYBRID OPERATION

**Core Principle**: ULTRON is built from the ground up to be **completely functional without an internet connection, without cloud API keys, and without external dependencies**.

---

## 1. Architectural Tiers

ULTRON operates across three flexible, resilient operational tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              TIER 1: ONLINE                            │
│           Cloud Model (NVIDIA API / OpenAI / Claude / Gemini)          │
│                                  +                                     │
│               Local Windows 11 Tools + Persistent Memory               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Fallback or Configuration)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      TIER 2: OFFLINE WITH LOCAL MODEL                  │
│       Locally Hosted LLM (Ollama:11434 / LM Studio:1234 / Llama 3)    │
│                                  +                                     │
│               Local Windows 11 Tools + Persistent Memory               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Fallback when no LLM installed)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     TIER 3: OFFLINE LOCAL TOOLS ONLY                   │
│           Deterministic Offline Capability Router (Safe Regex/AST)     │
│                                  +                                     │
│               Local Windows 11 Tools + Persistent Memory               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Model Provider Abstraction

All model logic implements the common `ModelProvider` interface:
**File**: [`src/main/services/providers/model.provider.ts`](file:///c:/Users/Sukesh%20D/Desktop/ULTRON/src/main/services/providers/model.provider.ts)

```ts
export interface ModelProvider {
  id: string
  name: string
  type: 'cloud' | 'local' | 'offline'
  isAvailable(): Promise<boolean>
  plan(
    prompt: string,
    history?: Array<{ role: string; content: string }>,
    memoryContext?: string,
    availableTools?: string[]
  ): Promise<AgentPlan>
  chat?(
    messages: Array<{ role: string; content: string }>,
    options?: { onChunk?: (chunk: string) => void; onDone?: (full: string) => void; onError?: (err: any) => void }
  ): Promise<string>
}
```

### Implementations:
1. **`CloudModelProvider`**:
   - Connects to NVIDIA AI Foundation Endpoints (`build.nvidia.com/v1`) or configured OpenAI-compatible endpoints.
   - Supplies the master `ULTRON_SYSTEM_PROMPT` and requests JSON `AgentPlan` outputs.
   - Automatically detects missing API keys or network outages and yields gracefully.
2. **`LocalModelProvider`**:
   - Probes `http://localhost:11434` (Ollama) and `http://localhost:1234` (LM Studio).
   - If an endpoint is active, queries the locally hosted model (e.g. `llama3.2`, `mistral`, `qwen2.5`) with the **exact same system prompt**.
   - Zero cloud data leakage; 100% private and offline.
3. **`OfflineCapabilityRouter`**:
   - Deterministic local intent parser and structured task planner.
   - Decomposes natural language variations into typed tool calls.
   - No neural weights required; executes in `< 1ms`.

---

## 3. Provider Selection Modes

ULTRON provides three operational modes configured in `ModelService`:
**File**: [`src/main/services/model.service.ts`](file:///c:/Users/Sukesh%20D/Desktop/ULTRON/src/main/services/model.service.ts)

| Mode | Behavior |
|:---:|---|
| **`AUTO`** *(Default)* | Attempts Local LLM first $\rightarrow$ falls back to Cloud LLM if configured $\rightarrow$ falls back to Deterministic Offline Router if no model is reachable. Pure local PC queries are fast-tracked directly to local tools. |
| **`ONLINE`** | Forces Cloud Model provider. If network or API fails, informs the user while keeping local tools functional. |
| **`OFFLINE`** | Disables cloud APIs entirely. Probes Local Model, falling back to Offline Capability Router. |

---

## 4. Intelligent Fast-Track Hybrid Routing

When ULTRON operates in `AUTO` mode, sending requests like:
- *"What time is it?"*
- *"Show CPU usage."*
- *"Open Calculator."*
- *"Create a folder on Desktop."*
- *"Show Wi-Fi status."*

to a cloud AI creates unnecessary latency (1500ms – 3500ms) and wastes tokens.

**Fast-Track Logic**:
In [`src/main/services/agent.service.ts`](file:///c:/Users/Sukesh%20D/Desktop/ULTRON/src/main/services/agent.service.ts), `isLocalOnlyRequest(input)` detects pure local PC queries. These execute **immediately through the local tool executor in under 50ms**, while requests requiring complex planning, creative writing, or web research (`research.search`, `research.youtube`) route to the AI model.

---

## 5. Offline Natural-Language Understanding

The `OfflineCapabilityRouter` parses user requests using normalization, linguistic pattern matching, and parameter extraction:

### Natural Variations Supported:
- **System Clock**: `"What time is it"`, `"What's the time"`, `"Tell me the current time"`, `"Current Windows time?"` $\rightarrow$ `system.getTime()`
- **Hardware Stats**: `"Show CPU"`, `"Show my CPU usage"`, `"Check CPU load"` $\rightarrow$ `system.getCpu()`
- **RAM**: `"Show RAM"`, `"Check memory"`, `"RAM utilization"` $\rightarrow$ `system.getMemory()`
- **Application Launching**: `"Open Calculator"`, `"Launch Calculator"`, `"Start the calculator"`, `"Can you bring up Calculator?"` $\rightarrow$ `apps.open({ app: "calculator" })`
- **Filesystem**: `"Create a folder called Projects on Desktop"` $\rightarrow$ `filesystem.createDirectory({ path: "Desktop/Projects" })`
- **Multi-Turn Context**: Remembers `lastCreatedFolder` and `lastCreatedFile` across turns so `"read info.txt"` accurately locates the file created in the preceding turn.

---

## 6. Real-Time UI Model Status Indicators

The Electron title bar and header display the live system status:

- **`● ONLINE — NVIDIA`** (Cyan): Cloud model connected and ready.
- **`● ONLINE — Local Model`** (Purple): Local Ollama/LM Studio model connected.
- **`● OFFLINE — Local Model`** (Purple): Local LLM operational without internet.
- **`● OFFLINE — Local Tools`** (Orange): Deterministic local tools active; no API key needed.
- **`● ERROR — Provider Unavailable`** (Red): Active provider unreachable.

Users can click the status indicator to toggle between `AUTO`, `ONLINE`, and `OFFLINE` modes instantaneously.
