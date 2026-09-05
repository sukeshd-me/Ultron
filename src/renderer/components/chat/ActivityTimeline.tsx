// src/renderer/components/chat/ActivityTimeline.tsx — Claude-style collapsible activity timeline
import React, { useState } from 'react'
import { ActivityTimelineItem, TimelineItemStatus } from '../../../shared/types'
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Search,
  Check
} from 'lucide-react'

interface ActivityTimelineProps {
  items: ActivityTimelineItem[]
  totalDurationMs?: number
  defaultExpanded?: boolean
}

export function ActivityTimelineView({
  items,
  totalDurationMs,
  defaultExpanded = false
}: ActivityTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (!items || items.length === 0) return null

  const computedTotalDuration =
    totalDurationMs ??
    items.reduce((acc, curr) => acc + (curr.durationMs || 0), 0)

  const isAllCompleted = items.every(
    (i) => i.status === 'COMPLETED' || i.status === 'VERIFYING'
  )
  const hasFailure = items.some((i) => i.status === 'FAILED')
  const lastItem = items[items.length - 1]

  const getStatusIcon = (status: TimelineItemStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 size={13} className="timeline-icon text-emerald-400" />
      case 'FAILED':
        return <AlertCircle size={13} className="timeline-icon text-rose-400" />
      case 'EXECUTING':
      case 'PLANNING':
      case 'UNDERSTANDING':
        return <Zap size={13} className="timeline-icon text-cyan-400 animate-pulse" />
      case 'VERIFYING':
        return <Check size={13} className="timeline-icon text-teal-300" />
      case 'WAITING':
      default:
        return <Clock size={13} className="timeline-icon text-amber-400" />
    }
  }

  return (
    <div className="activity-timeline-container">
      {/* Compact Header / Toggle Row */}
      <div
        className="activity-timeline-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className="activity-header-left">
          <Activity size={14} className="timeline-header-icon" />
          <span className="activity-summary-dot" />
          <span className="activity-summary-text">
            {hasFailure ? (
              <span className="text-rose-400">Action failed</span>
            ) : isAllCompleted ? (
              <span>
                <strong>{items.length} actions</strong> completed
              </span>
            ) : (
              <span>{lastItem?.title || 'Processing...'}</span>
            )}
          </span>
          <span className="activity-duration-badge">
            {computedTotalDuration > 0
              ? `${computedTotalDuration.toFixed(0)}ms`
              : 'realtime'}
          </span>
        </div>

        <button
          type="button"
          className="activity-expand-btn"
          aria-label={isExpanded ? 'Hide activity' : 'View activity'}
        >
          <span className="expand-label">
            {isExpanded ? 'Hide activity' : 'View activity'}
          </span>
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expanded Step-by-Step Action List */}
      {isExpanded && (
        <div className="activity-timeline-body animate-fadeIn">
          <div className="activity-timeline-rail">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`activity-step-row status-${item.status.toLowerCase()}`}
              >
                <div className="activity-step-node">
                  {getStatusIcon(item.status)}
                  {idx < items.length - 1 && <div className="activity-connector-line" />}
                </div>

                <div className="activity-step-content">
                  <div className="activity-step-title-row">
                    <span className="activity-step-title">{item.title}</span>
                    <span className="activity-step-duration">
                      {item.durationMs !== undefined ? `${item.durationMs}ms` : ''}
                    </span>
                  </div>
                  {item.detail && (
                    <div className="activity-step-detail">{item.detail}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="activity-timeline-footer">
            <span className="activity-footer-tag">AUDIT LOG • ZERO PRIVACY LEAKAGE</span>
            <span className="activity-footer-timing">
              Total Duration: {computedTotalDuration.toFixed(1)}ms
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
