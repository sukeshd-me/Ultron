import React, { useState, useEffect } from 'react'
import {
  Activity,
  Cpu,
  Database,
  Wifi,
  Smartphone,
  CheckCircle2,
  Clock,
  Radio,
  Sliders
} from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import { CATALOG_MODELS } from '../models/ModelSelectorMorph'

interface RealSystemTelemetry {
  cpu: number | null
  memory: {
    totalGB: number
    usedGB: number
    percentUsed: number
  } | null
  network: {
    online: boolean
    adapter: string | null
    speed: string | null // null = Unavailable
  } | null
}

interface RealPhoneDevice {
  connected: boolean
  state: 'device' | 'unauthorized' | 'offline' | 'disconnected'
  model: string | null
  manufacturer: string | null
  androidVersion: string | null
  batteryLevel: number | null
}

export function RightPanel() {
  const { settings } = useSettingsStore()

  // Real System Telemetry
  const [telemetry, setTelemetry] = useState<RealSystemTelemetry>({
    cpu: null,
    memory: null,
    network: null
  })

  // Sparkline histories (ONLY populated by real measurements, never random or fake numbers)
  const [cpuHistory, setCpuHistory] = useState<number[]>([])
  const [memHistory, setMemHistory] = useState<number[]>([])

  // Real Phone State (default: disconnected, zero fake fallback values)
  const [phoneDevice, setPhoneDevice] = useState<RealPhoneDevice>({
    connected: false,
    state: 'disconnected',
    model: null,
    manufacturer: null,
    androidVersion: null,
    batteryLevel: null
  })

  // Provider State
  const [providerOnline, setProviderOnline] = useState<boolean>(true)
  const [providerMode, setProviderMode] = useState<string>('AUTO')

  // Real Local System Clock
  const [clockTime, setClockTime] = useState<string>('')
  const [clockDate, setClockDate] = useState<string>('')

  // Active Model Name
  const currentModelId = settings.ai?.model || 'nvidia/nemotron-3.5-lightning-30b-a3b'
  const activeModel = CATALOG_MODELS.find((m) => m.id === currentModelId) || CATALOG_MODELS[0]

  // 1. Real System Clock Ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setClockTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      )
      setClockDate(
        now.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      )
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  // 2. Poll Real System Telemetry (CPU, Memory, Network)
  useEffect(() => {
    let isMounted = true

    const fetchTelemetry = async () => {
      try {
        const ultron = (window as any).ultron
        if (ultron?.system?.getRealTelemetry) {
          const res = await ultron.system.getRealTelemetry()
          if (!isMounted || !res) return

          setTelemetry({
            cpu: typeof res.cpu === 'number' ? res.cpu : null,
            memory: res.memory || null,
            network: res.network || null
          })

          if (typeof res.cpu === 'number') {
            setCpuHistory((prev) => [...prev.slice(-15), res.cpu])
          }
          if (res.memory?.percentUsed != null) {
            setMemHistory((prev) => [...prev.slice(-15), res.memory.percentUsed])
          }
        }
      } catch (err) {
        if (isMounted) {
          setTelemetry((prev) => ({ ...prev, cpu: null, memory: null }))
        }
      }
    }

    fetchTelemetry()
    const interval = setInterval(fetchTelemetry, 2500)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // 3. Poll Real Phone State via ADB
  useEffect(() => {
    let isMounted = true

    const fetchAdbDevice = async () => {
      try {
        const ultron = (window as any).ultron
        if (ultron?.adb?.getDevices) {
          const res = await ultron.adb.getDevices()
          if (!isMounted) return

          if (res?.devices && Array.isArray(res.devices) && res.devices.length > 0) {
            const dev = res.devices[0]
            if (dev.state === 'device') {
              setPhoneDevice({
                connected: true,
                state: 'device',
                model: dev.model || 'Android Device',
                manufacturer: dev.manufacturer || null,
                androidVersion: dev.androidVersion || null,
                batteryLevel: dev.battery?.level != null ? dev.battery.level : null
              })
            } else if (dev.state === 'unauthorized') {
              setPhoneDevice({
                connected: false,
                state: 'unauthorized',
                model: dev.id || 'Unauthorized Device',
                manufacturer: null,
                androidVersion: null,
                batteryLevel: null
              })
            } else {
              setPhoneDevice({
                connected: false,
                state: 'offline',
                model: dev.id || null,
                manufacturer: null,
                androidVersion: null,
                batteryLevel: null
              })
            }
          } else {
            // No phone connected: pure unavailable state, NO fake fallback
            setPhoneDevice({
              connected: false,
              state: 'disconnected',
              model: null,
              manufacturer: null,
              androidVersion: null,
              batteryLevel: null
            })
          }
        }
      } catch {
        if (isMounted) {
          setPhoneDevice({
            connected: false,
            state: 'disconnected',
            model: null,
            manufacturer: null,
            androidVersion: null,
            batteryLevel: null
          })
        }
      }
    }

    fetchAdbDevice()
    const interval = setInterval(fetchAdbDevice, 4000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // 4. Poll Provider Status (Online/Offline, Mode)
  useEffect(() => {
    let isMounted = true
    const checkProvider = async () => {
      try {
        const ultron = (window as any).ultron
        if (ultron?.provider?.getStatus) {
          const res = await ultron.provider.getStatus()
          if (!isMounted || !res) return
          setProviderOnline(Boolean(res.online))
          if (res.mode) setProviderMode(res.mode)
        }
      } catch {}
    }
    checkProvider()
    const interval = setInterval(checkProvider, 5000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Render SVG Sparkline
  const renderSparkline = (data: number[], strokeColor: string) => {
    if (data.length < 2) {
      return (
        <div className="sparkline-empty">
          <span>—</span>
        </div>
      )
    }
    const width = 110
    const height = 24
    const min = Math.min(...data, 0)
    const max = Math.max(...data, 100)
    const range = max - min || 1

    const points = data
      .map((val, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - ((val - min) / range) * (height - 4) - 2
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')

    return (
      <svg width={width} height={height} className="sparkline-svg" aria-hidden="true">
        <polyline fill="none" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    )
  }

  return (
    <aside className="right-panel right-panel-compact custom-scrollbar" aria-label="ULTRON Real Telemetry">
      {/* 1. Technical Clock Header */}
      <div className="panel-section clock-section">
        <div className="clock-time">{clockTime || '—:—:—'}</div>
        <div className="clock-date">{clockDate || '—'}</div>
      </div>

      {/* 2. ULTRON Status Section */}
      <div className="panel-section">
        <div className="section-header">
          <Radio size={13} className="section-icon" color="#00d4ff" />
          <span className="section-title">ULTRON</span>
        </div>

        <div className="compact-status-row">
          <span className="row-label">Status:</span>
          <span className={`row-badge ${providerOnline ? 'online' : 'offline'}`}>
            <span className="status-dot-pulse" />
            {providerOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <div className="compact-status-row">
          <span className="row-label">Mode:</span>
          <span className="row-val mode-val">{providerMode}</span>
        </div>

        <div className="compact-status-row">
          <span className="row-label">Model:</span>
          <span className="row-val model-val" title={activeModel?.name}>
            {activeModel?.shortName || '—'}
          </span>
        </div>
      </div>

      {/* 3. SYSTEM Real Telemetry Section */}
      <div className="panel-section">
        <div className="section-header">
          <Activity size={13} className="section-icon" color="#00e676" />
          <span className="section-title">SYSTEM</span>
        </div>

        {/* CPU */}
        <div className="metric-box">
          <div className="metric-box-top">
            <span className="metric-label">
              <Cpu size={11} />
              <span>CPU</span>
            </span>
            <span className="metric-value">
              {telemetry.cpu != null ? `${telemetry.cpu}%` : 'Unavailable'}
            </span>
          </div>
          {telemetry.cpu != null && (
            <div className="metric-chart-wrap">
              {renderSparkline(cpuHistory, '#00e676')}
            </div>
          )}
        </div>

        {/* Memory */}
        <div className="metric-box">
          <div className="metric-box-top">
            <span className="metric-label">
              <Database size={11} />
              <span>Memory</span>
            </span>
            <span className="metric-value">
              {telemetry.memory
                ? `${telemetry.memory.percentUsed}%`
                : 'Unavailable'}
            </span>
          </div>
          {telemetry.memory && (
            <div className="metric-sub-detail">
              <span>{telemetry.memory.usedGB} GB / {telemetry.memory.totalGB} GB</span>
            </div>
          )}
          {telemetry.memory && (
            <div className="metric-chart-wrap">
              {renderSparkline(memHistory, '#00d4ff')}
            </div>
          )}
        </div>

        {/* Network */}
        <div className="metric-box">
          <div className="metric-box-top">
            <span className="metric-label">
              <Wifi size={11} />
              <span>Network</span>
            </span>
            <span className="metric-value">
              {telemetry.network?.online ? (
                <span className="net-online">Online</span>
              ) : telemetry.network ? (
                <span className="net-offline">Offline</span>
              ) : (
                'Unavailable'
              )}
            </span>
          </div>
          <div className="metric-sub-detail">
            <span className="speed-unavailable">Speed: Unavailable</span>
          </div>
          {telemetry.network?.adapter && (
            <div className="metric-sub-detail adapter-detail">
              <span>Adapter: {telemetry.network.adapter}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. PHONE Real ADB State Section */}
      <div className="panel-section phone-section">
        <div className="section-header">
          <Smartphone size={13} className="section-icon" color="#00d4ff" />
          <span className="section-title">PHONE</span>
        </div>

        {/* Connection State */}
        <div className="compact-status-row">
          <span className="row-label">Connection:</span>
          {phoneDevice.connected ? (
            <span className="row-badge online">
              <span className="status-dot-pulse" />
              Connected
            </span>
          ) : phoneDevice.state === 'unauthorized' ? (
            <span className="row-badge warning">
              <span className="status-dot-pulse warning" />
              Unauthorized
            </span>
          ) : (
            <span className="row-badge offline">
              <span className="status-dot-pulse offline" />
              Disconnected
            </span>
          )}
        </div>

        {/* Device Name */}
        <div className="compact-status-row">
          <span className="row-label">Device:</span>
          <span className="row-val" title={phoneDevice.model || undefined}>
            {phoneDevice.model
              ? `${phoneDevice.manufacturer ? `${phoneDevice.manufacturer} ` : ''}${phoneDevice.model}`
              : '—'}
          </span>
        </div>

        {/* Battery */}
        <div className="compact-status-row">
          <span className="row-label">Battery:</span>
          <span className="row-val">
            {phoneDevice.batteryLevel != null ? `${phoneDevice.batteryLevel}%` : '—'}
          </span>
        </div>

        {/* Android Version */}
        <div className="compact-status-row">
          <span className="row-label">Android:</span>
          <span className="row-val">
            {phoneDevice.androidVersion || '—'}
          </span>
        </div>
      </div>
    </aside>
  )
}