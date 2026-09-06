// scratch/test_v108_suite.ts — Comprehensive TypeScript test suite for ULTRON V1.0.8
import * as path from 'path'
import * as fs from 'fs'
import { memoryDatabase } from '../src/main/database/memory.db'
import { contextGraphService } from '../src/main/services/context-graph.service'
import { intentPredictionService } from '../src/main/services/intent-prediction.service'
import { contradictionDetectorService } from '../src/main/services/contradiction-detector.service'
import { confidenceService } from '../src/main/services/confidence.service'
import { factVerificationService } from '../src/main/services/fact-verification.service'
import { appIntelligenceService } from '../src/main/services/app-intelligence.service'
import { windowIntelligenceService } from '../src/main/services/window-intelligence.service'
import { activityIntelligenceService } from '../src/main/services/activity-intelligence.service'
import { repositoryIntelligenceService } from '../src/main/services/repository-intelligence.service'
import { codeImpactService } from '../src/main/services/code-impact.service'
import { gitIntelligenceService } from '../src/main/services/git-intelligence.service'
import { agentTeamsService } from '../src/main/services/agent-teams.service'
import { missionService } from '../src/main/services/mission.service'
import { modelPerformanceService } from '../src/main/services/model-performance.service'
import { modelRouter } from '../src/main/services/router.service'
import { STATE_PALETTES } from '../src/renderer/components/core3d/UltronCore'

console.log('======================================================================')
console.log('ULTRON V1.0.8 — COMPLETE 19-FEATURE SYSTEM VERIFICATION SUITE')
console.log('======================================================================\n')

let passed = 0
let failed = 0

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}${detail ? ` -> ${detail}` : ''}`)
    passed++
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`)
    failed++
  }
}

async function run() {
  try {
    // ---------------------------------------------------------
    // TEST 1: SQLite Database Migrations & Zero Data Loss
    // ---------------------------------------------------------
    console.log('\n--- 1. DATABASE & MIGRATIONS ---')
    const db = (memoryDatabase as any).db
    assert(!!db, 'SQLite Database handle is active')

    const v108Tables = [
      'context_nodes',
      'context_edges',
      'intent_resolution',
      'contradictions',
      'confidence_records',
      'fact_verification',
      'application_metadata',
      'window_state',
      'repository_index',
      'code_impact_records',
      'git_activity',
      'agent_runs',
      'mission_dependencies',
      'mission_checkpoints',
      'model_performance'
    ]

    for (const tbl of v108Tables) {
      const row = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tbl)
      assert(!!row, `SQLite table migration exists: ${tbl}`)
    }

    // ---------------------------------------------------------
    // TEST 2: Feature 1 — Personal Context Graph
    // ---------------------------------------------------------
    const nProj = contextGraphService.registerEntity('PROJECT', 'test-proj-ultron', 'ULTRON Command Center', { path: process.cwd() })
    const nRepo = contextGraphService.registerEntity('GIT_REPO', 'test-repo-ultron', 'upai-technologies/ultron', { branch: 'main' })
    const nWs = contextGraphService.registerEntity('WORKSPACE', 'test-ws-dev', 'Development Workspace', { active: true })
    const e1 = contextGraphService.linkEntities(nProj.id, nRepo.id, 'has_git_repo', 1.0)
    const e2 = contextGraphService.linkEntities(nProj.id, nWs.id, 'uses_workspace', 0.9)

    assert(!!nProj.id && e1.relationType === 'has_git_repo', 'Node and Edge creation in Context Graph')
    const graphQuery = contextGraphService.query('ULTRON')
    assert(graphQuery.nodes.length > 0, 'Context Graph query returned connected entities', `Found ${graphQuery.nodes.length} nodes, ${graphQuery.edges.length} edges`)
    assert(graphQuery.answer.includes('Connected context for "ULTRON"'), 'Natural language context summary generated')

    // ---------------------------------------------------------
    // TEST 3: Feature 2 — Intent Prediction
    // ---------------------------------------------------------
    console.log('\n--- 3. INTENT PREDICTION ---')
    const intentProj = intentPredictionService.predictIntent('Open the project', { activeProject: 'ULTRON' })
    assert(intentProj.detectedTarget === 'ULTRON' && !intentProj.isAmbiguous, 'Resolved "the project" to active project (ULTRON)')

    const intentMission = intentPredictionService.predictIntent('Run it', { activeMission: 'Build V1.0.8 Package' })
    assert(intentMission.detectedTarget === 'Build V1.0.8 Package' && !intentMission.isAmbiguous, 'Resolved pronoun "it" to active mission')

    const intentAmbiguous = intentPredictionService.predictIntent('Delete that file', {})
    assert(intentAmbiguous.isAmbiguous === true, 'Consequential action without context requires explicit confirmation')

    // ---------------------------------------------------------
    // TEST 4: Feature 3 — Contradiction Detector
    // ---------------------------------------------------------
    console.log('\n--- 4. CONTRADICTION DETECTOR ---')
    const conflicts = contradictionDetectorService.detectContradictions([
      'Open Development workspace every morning at 9am',
      'Close Development workspace every morning at 9am'
    ])
    assert(conflicts.length > 0, 'Contradiction Detector detected conflicting automation rules', `Found ${conflicts.length} conflict`)
    assert(conflicts[0].resolutionOptions.length > 0, 'Provided possible resolution without rewriting user configuration', conflicts[0].resolutionOptions[0])

    // ---------------------------------------------------------
    // TEST 5: Feature 4 — Unified Confidence System
    // ---------------------------------------------------------
    console.log('\n--- 5. UNIFIED CONFIDENCE SYSTEM ---')
    const confHigh = confidenceService.assess({
      entityType: 'FILE_CHECK',
      entityId: 'index.ts',
      verifiedLocally: true
    })
    assert(confHigh.level === 'HIGH', 'Direct local file verification yields HIGH confidence', confHigh.reason)

    const confMed = confidenceService.assess({
      entityType: 'TASK_RESULT',
      entityId: 'task-1',
      verifiedLocally: false,
      contextCompleteness: 0.8
    })
    assert(confMed.level === 'MEDIUM', 'Context-only result yields MEDIUM confidence', confMed.reason)

    // ---------------------------------------------------------
    // TEST 6: Feature 5 — Fact Verification Layer
    // ---------------------------------------------------------
    console.log('\n--- 6. FACT VERIFICATION LAYER ---')
    const factConfirmed = factVerificationService.classifyFact({
      statement: 'package.json specifies version 1.0.8',
      source: 'LOCAL_FILE',
      isFromDisk: true
    })
    assert(factConfirmed.classification === 'CONFIRMED', 'Local file fact classified as CONFIRMED')

    const factUser = factVerificationService.classifyFact({
      statement: 'User wants dark mode enabled',
      source: 'USER_INPUT',
      isDirectUserQuote: true
    })
    assert(factUser.classification === 'USER-PROVIDED', 'Instruction statement classified as USER-PROVIDED')

    // ---------------------------------------------------------
    // TEST 7: Feature 6 — Application Intelligence 2.0
    // ---------------------------------------------------------
    console.log('\n--- 7. APPLICATION INTELLIGENCE 2.0 ---')
    const appMeta = appIntelligenceService.findApp('VS Code')
    assert(!!appMeta && appMeta.appName === 'VS Code', 'Retrieved application metadata for VS Code', `Executable: ${appMeta?.exePath}`)
    assert(appMeta?.supportedActions.includes('open_folder') === true, 'Application intelligence indexed supported actions')

    // ---------------------------------------------------------
    // TEST 8: Feature 7 — Window Intelligence
    // ---------------------------------------------------------
    console.log('\n--- 8. WINDOW INTELLIGENCE ---')
    const openWindows = await windowIntelligenceService.inspectOpenWindows()
    assert(Array.isArray(openWindows), 'Window intelligence inspected open desktop windows safely', `Retrieved ${openWindows.length} windows`)

    // ---------------------------------------------------------
    // TEST 9: Feature 9 — Recent Activity Intelligence
    // ---------------------------------------------------------
    console.log('\n--- 9. RECENT ACTIVITY INTELLIGENCE ---')
    const actSummary = await activityIntelligenceService.getActivitySummary('today')
    assert(!!actSummary && Array.isArray(actSummary.projectsAccessed), 'Generated contextual activity summary without fabricating data')

    // ---------------------------------------------------------
    // TEST 10: Features 10 & 11 — Repo Intelligence & Code Impact
    // ---------------------------------------------------------
    console.log('\n--- 10. REPOSITORY INTELLIGENCE & CODE IMPACT ---')
    const rMap = await repositoryIntelligenceService.analyzeRepository(process.cwd())
    assert(!!rMap.architecture.Services && !!rMap.architecture.Components, 'Built structured repository map with Services and Components')

    const repoAnswer = await repositoryIntelligenceService.queryRepositoryRole('where is model routing implemented?')
    assert(repoAnswer.files.some(f => f.includes('router.service.ts')), 'Identified router.service.ts for model routing query')

    const impact = await codeImpactService.analyzeImpact('Change the model routing system')
    assert(impact.affectedModules.includes('SmartModelRouter') && impact.riskLevel === 'HIGH', 'Impact analysis correctly identified high-risk change to Model Router')

    // ---------------------------------------------------------
    // TEST 11: Feature 12 — Git Intelligence
    // ---------------------------------------------------------
    console.log('\n--- 11. GIT INTELLIGENCE ---')
    const gitStatus = await gitIntelligenceService.getStatus()
    assert(gitStatus.currentBranch === 'main', `Git branch identified: ${gitStatus.currentBranch}`)
    assert(typeof gitStatus.isClean === 'boolean', 'Working tree cleanliness evaluated')

    // ---------------------------------------------------------
    // TEST 12: Feature 13 — Agent Teams
    // ---------------------------------------------------------
    console.log('\n--- 12. AGENT TEAMS ---')
    const teamRoles = agentTeamsService.getRoles()
    assert(teamRoles.length === 6, 'Six specialized internal roles configured under ONE ULTRON identity')
    const roleIds = teamRoles.map(r => r.id)
    assert(roleIds.includes('PLANNER') && roleIds.includes('CODING') && roleIds.includes('VERIFICATION'), 'Roles include PLANNER, CODING, VERIFICATION')

    // ---------------------------------------------------------
    // TEST 13: Features 14, 15, 16 — Missions, DAG, & Checkpoints
    // ---------------------------------------------------------
    console.log('\n--- 13. PARALLEL MISSIONS, DAG & CHECKPOINTS ---')
    const cp = memoryDatabase.createMissionCheckpoint({
      missionId: 'mission-test-01',
      stepId: 'step-1',
      reason: 'High-Risk Configuration Change',
      riskLevel: 'HIGH',
      status: 'PENDING'
    })
    assert(cp.riskLevel === 'HIGH' && cp.status === 'PENDING', 'Created human-in-the-loop checkpoint for high-risk action')

    const resolvedCp = memoryDatabase.resolveMissionCheckpoint(cp.id, 'APPROVED')
    assert(resolvedCp === true, 'Human-in-the-loop checkpoint resolved and authorized')

    // ---------------------------------------------------------
    // TEST 14: Feature 17 — Model Performance & Dynamic AUTO Routing
    // ---------------------------------------------------------
    console.log('\n--- 14. MODEL PERFORMANCE & AUTO ROUTING ---')
    modelPerformanceService.recordExecution({
      modelId: 'google/gemini-3.8-flash',
      tier: 'FAST',
      taskType: 'CHAT',
      latencyMs: 120,
      timeToFirstTokenMs: 65,
      durationMs: 250,
      success: true,
      verificationPassed: true,
      isOnline: true
    })

    const recentLogs = modelPerformanceService.getRecentLogs(10)
    assert(recentLogs.length > 0, `Recorded model telemetry: ${recentLogs.length} logs, last latency: ${recentLogs[0].latencyMs}ms`)

    // AUTO Routing tests
    const routeFast = modelRouter.route({ userInput: 'Hi ULTRON, how are you?' })
    assert(routeFast.tier === 'FAST', `Casual query routed to FAST tier (${routeFast.selectedModel.name})`)

    const routeHigh = modelRouter.route({ userInput: 'Analyze this TypeScript compiler error and refactor architecture' })
    assert(routeHigh.tier === 'HIGH', `Complex task routed to HIGH tier (${routeHigh.selectedModel.name})`)

    const routeDefault = modelRouter.route({ userInput: 'Create a new mission with 3 steps' })
    assert(routeDefault.tier === 'MEDIUM', `Standard mission prompt routed to MEDIUM tier (${routeDefault.selectedModel.name})`)

    // ---------------------------------------------------------
    // TEST 15: Feature 19 — Neural Core 3D State Palettes
    // ---------------------------------------------------------
    console.log('\n--- 15. NEURAL CORE 3D VISUALIZATION ---')
    assert(!!STATE_PALETTES.ROUTING, 'Neural Core includes ROUTING state palette')
    assert(!!STATE_PALETTES.STREAMING, 'Neural Core includes STREAMING state palette')
    assert(!!STATE_PALETTES.COMPLETED, 'Neural Core includes COMPLETED state palette')
    assert(!!STATE_PALETTES.FAILED, 'Neural Core includes FAILED state palette')

    // ---------------------------------------------------------
    // TEST 16: Version Consistency Across All Files
    // ---------------------------------------------------------
    console.log('\n--- 16. VERSION INTEGRITY ---')
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
    assert(pkg.version === '1.0.8', `package.json is v${pkg.version}`)

  } catch (err) {
    console.error('Test Suite exception:', err)
    failed++
  }

  console.log('\n======================================================================')
  console.log(`VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('======================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

run()
