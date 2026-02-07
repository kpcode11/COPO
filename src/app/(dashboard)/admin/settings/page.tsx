'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Alert from '@/components/ui/alert'
import Tabs from '@/components/ui/tabs'
import Badge from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/spinner'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import { Settings, Save, RotateCcw, History } from 'lucide-react'
import { DEFAULT_CONFIG, CONFIG_LABELS } from '@/constants/default-config'

interface ConfigData {
  id?: string
  coTargetPercent: number
  coTargetMarksPercent: number
  directWeightage: number
  indirectWeightage: number
  ia1Weightage: number
  ia2Weightage: number
  endSemWeightage: number
  poTargetLevel: number
  level3Threshold: number
  level2Threshold: number
  level1Threshold: number
}

interface HistoryEntry {
  id: string
  version: number
  changedBy: string
  changes: any
  createdAt: string
}

const configKeys = Object.keys(DEFAULT_CONFIG) as (keyof typeof DEFAULT_CONFIG)[]

export default function SettingsPage() {
  const [config, setConfig] = useState<ConfigData>({ ...DEFAULT_CONFIG })
  const [originalConfig, setOriginalConfig] = useState<ConfigData>({ ...DEFAULT_CONFIG })
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [configRes, historyRes] = await Promise.all([
        fetch('/api/admin/config'),
        fetch('/api/admin/config/history'),
      ])
      const configData = await configRes.json()
      const historyData = await historyRes.json()

      if (configData.config) {
        const loaded: ConfigData = { ...DEFAULT_CONFIG }
        for (const k of configKeys) {
          if (configData.config[k] !== undefined && configData.config[k] !== null) {
            ;(loaded as any)[k] = configData.config[k]
          }
        }
        loaded.id = configData.config.id
        setConfig(loaded)
        setOriginalConfig(loaded)
      }
      setHistory(historyData.history ?? [])
    } catch (err: any) {
      setError(err.message || 'Failed to load config')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  const handleChange = (key: string, value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return
    setConfig(prev => ({ ...prev, [key]: num }))
    setDirty(true)
    setSuccess(null)
  }

  const handleReset = () => {
    setConfig({ ...originalConfig })
    setDirty(false)
    setSuccess(null)
  }

  const handleResetDefaults = () => {
    setConfig({ ...DEFAULT_CONFIG, id: config.id })
    setDirty(true)
    setSuccess(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      // Validate weightages sum
      const iaSum = config.ia1Weightage + config.ia2Weightage + config.endSemWeightage
      if (Math.abs(iaSum - 1) > 0.01) {
        setError(`IA1 + IA2 + End Sem weightages must sum to 1.0 (currently ${iaSum.toFixed(2)})`)
        setSaving(false)
        return
      }
      const diSum = config.directWeightage + config.indirectWeightage
      if (Math.abs(diSum - 1) > 0.01) {
        setError(`Direct + Indirect weightages must sum to 1.0 (currently ${diSum.toFixed(2)})`)
        setSaving(false)
        return
      }
      if (config.level3Threshold <= config.level2Threshold || config.level2Threshold <= config.level1Threshold) {
        setError('Thresholds must be: Level 3 > Level 2 > Level 1')
        setSaving(false)
        return
      }

      const payload: any = {}
      for (const k of configKeys) {
        payload[k] = (config as any)[k]
      }

      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')

      setSuccess('Configuration saved successfully')
      setDirty(false)
      loadConfig()
    } catch (err: any) {
      setError(err.message || 'Failed to save config')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  const thresholdKeys = configKeys.filter(k => CONFIG_LABELS[k]?.group === 'thresholds')
  const weightageKeys = configKeys.filter(k => CONFIG_LABELS[k]?.group === 'weightages')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-gray-400" />
          <div>
            <h1 className="text-xl font-semibold">System Settings</h1>
            <p className="text-sm text-gray-500">Configure attainment thresholds, weightages, and targets</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}

      <Tabs
        tabs={[
          { id: 'thresholds', label: 'Thresholds & Targets' },
          { id: 'weightages', label: 'Weightages' },
          { id: 'history', label: 'Change History', count: history.length },
        ]}
        defaultTab="thresholds"
      >
        {(activeTab) => (
          <>
            {activeTab === 'thresholds' && (
              <Card>
                <CardHeader>
                  <CardTitle>Attainment Thresholds & Targets</CardTitle>
                  <CardDescription>Set the CO/PO target percentages and attainment level thresholds</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    {thresholdKeys.map(key => {
                      const meta = CONFIG_LABELS[key]
                      return (
                        <div key={key}>
                          <Input
                            label={meta.label}
                            type="number"
                            value={String((config as any)[key])}
                            onChange={(v) => handleChange(key, v)}
                          />
                          <p className="text-xs text-gray-400 -mt-3 mb-4">{meta.description} ({meta.unit})</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" onClick={handleResetDefaults} disabled={saving}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Reset to Defaults
                  </Button>
                  <Button variant="secondary" onClick={handleReset} disabled={!dirty || saving}>
                    Discard Changes
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={!dirty || saving}>
                    <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {activeTab === 'weightages' && (
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Weightages</CardTitle>
                  <CardDescription>Configure how IA1, IA2, End Sem, and direct/indirect assessments contribute to attainment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Internal Assessment & End Sem Weightages</h3>
                    <p className="text-xs text-gray-400 mb-3">IA1 + IA2 + End Sem must sum to 1.0</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1">
                      {['ia1Weightage', 'ia2Weightage', 'endSemWeightage'].map(key => {
                        const meta = CONFIG_LABELS[key]
                        return (
                          <div key={key}>
                            <Input
                              label={meta.label}
                              type="number"
                              value={String((config as any)[key])}
                              onChange={(v) => handleChange(key, v)}
                            />
                          </div>
                        )
                      })}
                    </div>
                    <div className="text-sm mt-1">
                      Sum: <Badge variant={Math.abs(config.ia1Weightage + config.ia2Weightage + config.endSemWeightage - 1) < 0.01 ? 'success' : 'danger'}>
                        {(config.ia1Weightage + config.ia2Weightage + config.endSemWeightage).toFixed(2)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Direct & Indirect Assessment Weightages</h3>
                    <p className="text-xs text-gray-400 mb-3">Direct + Indirect must sum to 1.0</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                      {['directWeightage', 'indirectWeightage'].map(key => {
                        const meta = CONFIG_LABELS[key]
                        return (
                          <div key={key}>
                            <Input
                              label={meta.label}
                              type="number"
                              value={String((config as any)[key])}
                              onChange={(v) => handleChange(key, v)}
                            />
                            <p className="text-xs text-gray-400 -mt-3 mb-4">{meta.description}</p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="text-sm mt-1">
                      Sum: <Badge variant={Math.abs(config.directWeightage + config.indirectWeightage - 1) < 0.01 ? 'success' : 'danger'}>
                        {(config.directWeightage + config.indirectWeightage).toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" onClick={handleResetDefaults} disabled={saving}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Reset to Defaults
                  </Button>
                  <Button variant="secondary" onClick={handleReset} disabled={!dirty || saving}>
                    Discard Changes
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={!dirty || saving}>
                    <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {activeTab === 'history' && (
              <Card>
                <CardHeader>
                  <CardTitle>Change History</CardTitle>
                  <CardDescription>Recent configuration changes (last 50)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Version</TableHeader>
                        <TableHeader>Changed By</TableHeader>
                        <TableHeader>Date</TableHeader>
                        <TableHeader>Changes</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.length === 0 ? (
                        <TableEmpty columns={4} message="No configuration changes yet" />
                      ) : (
                        history.map(h => (
                          <TableRow key={h.id}>
                            <TableCell><Badge variant="primary">v{h.version}</Badge></TableCell>
                            <TableCell className="text-sm">{h.changedBy}</TableCell>
                            <TableCell className="text-sm text-gray-500">{new Date(h.createdAt).toLocaleString()}</TableCell>
                            <TableCell className="text-xs">
                              {h.changes?.after && (
                                <div className="flex flex-wrap gap-1">
                                  {Object.keys(h.changes.after).filter(k => configKeys.includes(k as any) && h.changes.before?.[k] !== h.changes.after[k]).map(k => (
                                    <Badge key={k} variant="info">
                                      {CONFIG_LABELS[k]?.label || k}: {h.changes.before?.[k] ?? '—'} → {h.changes.after[k]}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Tabs>
    </div>
  )
}
