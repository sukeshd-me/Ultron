// src/main/services/context-graph.service.ts — Personal Context Graph for ULTRON V1.0.8
import { memoryDatabase } from '../database/memory.db'
import {
  ContextNode,
  ContextEdge,
  ContextEntityType,
  ContextGraphQueryResult
} from '../../shared/types'

export class ContextGraphService {
  /**
   * Register or update an entity node in the Personal Context Graph
   */
  registerEntity(entityType: ContextEntityType, entityId: string, label: string, metadata?: Record<string, any>): ContextNode {
    return memoryDatabase.addContextNode({
      id: `node-${entityType.toLowerCase()}-${Buffer.from(entityId).toString('base64url').slice(0, 16)}`,
      entityType,
      entityId,
      label,
      metadata
    })
  }

  /**
   * Connect two entities with a typed, weighted relationship
   */
  linkEntities(
    sourceNodeId: string,
    targetNodeId: string,
    relationType: string,
    weight = 1.0,
    metadata?: Record<string, any>
  ): ContextEdge {
    return memoryDatabase.addContextEdge({
      sourceId: sourceNodeId,
      targetId: targetNodeId,
      relationType,
      weight,
      metadata
    })
  }

  /**
   * Link entity by type and identifier directly
   */
  linkByTypeAndId(
    srcType: ContextEntityType,
    srcId: string,
    tgtType: ContextEntityType,
    tgtId: string,
    relation: string,
    weight = 1.0
  ): ContextEdge | null {
    const src = memoryDatabase.getContextNode(srcType, srcId)
    const tgt = memoryDatabase.getContextNode(tgtType, tgtId)
    if (!src || !tgt) return null
    return this.linkEntities(src.id, tgt.id, relation, weight)
  }

  /**
   * Query connected entities for a specific entity or node
   */
  getConnected(entityTypeOrNodeId: string, entityId?: string): { nodes: ContextNode[]; edges: ContextEdge[] } {
    let targetNodeId = entityTypeOrNodeId
    if (entityId) {
      const node = memoryDatabase.getContextNode(entityTypeOrNodeId as ContextEntityType, entityId)
      if (!node) return { nodes: [], edges: [] }
      targetNodeId = node.id
    }
    return memoryDatabase.getConnectedEntities(targetNodeId)
  }

  /**
   * Natural language query across the context graph:
   * e.g., "What is connected to my ULTRON project?" or "What tasks belong to this project?"
   */
  query(queryText: string): ContextGraphQueryResult {
    const res = memoryDatabase.queryContextGraph(queryText)
    const entityNames = res.nodes.map(n => `${n.label} (${n.entityType})`).slice(0, 5).join(', ')
    const answer = res.nodes.length > 0
      ? `Connected context for "${queryText}": ${entityNames}${res.nodes.length > 5 ? ` and ${res.nodes.length - 5} more` : ''}. Connected relationships: ${res.edges.length}.`
      : `No connected entities found in Context Graph matching "${queryText}".`
    return {
      ...res,
      answer
    }
  }

  /**
   * Sync existing ULTRON entities (workspaces, goals, tasks, automations) into the Context Graph
   */
  syncExistingEntities(): { nodesIndexed: number; edgesCreated: number } {
    let nodesIndexed = 0
    let edgesCreated = 0

    try {
      // 1. Workspaces
      const workspaces = memoryDatabase.getWorkspaces ? memoryDatabase.getWorkspaces() : []
      for (const ws of workspaces) {
        const node = this.registerEntity('WORKSPACE', ws.id || ws.name, ws.name, { path: ws.path })
        nodesIndexed++
        if (ws.path) {
          const folderNode = this.registerEntity('FOLDER', ws.path, path.basename(ws.path), { fullPath: ws.path })
          nodesIndexed++
          this.linkEntities(node.id, folderNode.id, 'CONTAINS_FOLDER')
          edgesCreated++
        }
      }

      // 2. Goals
      const goals = memoryDatabase.getGoals ? memoryDatabase.getGoals() : []
      for (const g of goals) {
        const gNode = this.registerEntity('GOAL', g.id, g.title, { project: g.project, status: g.status })
        nodesIndexed++
        if (g.project) {
          const pNode = this.registerEntity('PROJECT', g.project, g.project)
          nodesIndexed++
          this.linkEntities(pNode.id, gNode.id, 'HAS_GOAL')
          edgesCreated++
        }
      }

      // 3. Automations
      const automations = memoryDatabase.getAutomations ? memoryDatabase.getAutomations() : []
      for (const a of automations) {
        this.registerEntity('AUTOMATION', a.id, a.name, { trigger: a.trigger_type, enabled: a.enabled })
        nodesIndexed++
      }

      // 4. Default Project ULTRON
      const ultronProject = this.registerEntity('PROJECT', 'ultron', 'ULTRON Command Center', {
        repo: 'UPAI Technologies / Ultron',
        platform: 'Windows'
      })
      nodesIndexed++

      const gitRepo = this.registerEntity('GIT_REPO', 'git-ultron', 'sukeshd-me/Ultron', {
        branch: 'main'
      })
      nodesIndexed++
      this.linkEntities(ultronProject.id, gitRepo.id, 'HAS_REPOSITORY')
      edgesCreated++
    } catch (err) {
      console.warn('[ContextGraphService] Sync error:', err)
    }

    return { nodesIndexed, edgesCreated }
  }
}

export const contextGraphService = new ContextGraphService()