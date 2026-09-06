import { memoryDatabase } from '../database/memory.db'
import { ProjectDecision, ProjectTimelineItem } from '../../shared/types'
import { powerShellService } from './powershell.service'

export class ProjectIntelligenceService {
  recordDecision(projectName: string, title: string, context: string, decision: string, rationale: string): ProjectDecision {
    const content = JSON.stringify({ context, decision, rationale })
    const rec = memoryDatabase.recordProjectIntelligence({
      projectName,
      workspacePath: '',
      type: 'decision',
      title,
      content
    })
    return {
      id: rec.id,
      projectName,
      title,
      context,
      decision,
      rationale,
      timestamp: rec.createdAt
    }
  }

  getDecisions(projectName: string): ProjectDecision[] {
    const items = memoryDatabase.listProjectIntelligence(projectName, 'decision')
    return items.map((i: any) => {
      let parsed = { context: '', decision: '', rationale: '' }
      try {
        parsed = JSON.parse(i.content)
      } catch {
        parsed.decision = i.content
      }
      return {
        id: i.id,
        projectName: i.projectName,
        title: i.title,
        context: parsed.context,
        decision: parsed.decision,
        rationale: parsed.rationale,
        timestamp: i.createdAt
      }
    })
  }

  async getProjectHistory(projectName: string, workspacePath: string): Promise<ProjectTimelineItem[]> {
    const timeline: ProjectTimelineItem[] = []

    // 1. Fetch decisions from DB
    const decisions = this.getDecisions(projectName)
    for (const d of decisions) {
      timeline.push({
        id: d.id,
        projectName,
        type: 'decision',
        title: d.title,
        summary: `Decision: ${d.decision} (Rationale: ${d.rationale})`,
        timestamp: d.timestamp
      })
    }

    // 2. Fetch Git commit history if workspace exists
    if (workspacePath) {
      try {
        const gitRes = await powerShellService.execute(
          'git log -n 5 --pretty=format:"%h|%s|%an|%at"',
          workspacePath
        )
        if (gitRes.success && gitRes.stdout) {
          const lines = gitRes.stdout.trim().split('\n')
          for (const line of lines) {
            const [hash, msg, author, timeSec] = line.split('|')
            if (hash && msg) {
              timeline.push({
                id: `git-${hash}`,
                projectName,
                type: 'git_commit',
                title: `Git: ${msg}`,
                summary: `Commit ${hash} by ${author}`,
                timestamp: Number(timeSec) * 1000 || Date.now()
              })
            }
          }
        }
      } catch (err) {
        console.warn('[ProjectIntelligence] Git inspect failed:', err)
      }
    }

    // Sort descending by timestamp
    timeline.sort((a, b) => b.timestamp - a.timestamp)
    return timeline
  }
}

export const projectIntelligenceService = new ProjectIntelligenceService()
