import React, { useEffect, useState } from 'react'
import { rubricService } from '../../services/rubricService'
import { Plus, Trash2, ArrowUp, ArrowDown, Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react'

const TABS = [
  { id: 'registration', label: 'Initial / Registration', hint: 'Marks given when the mentor approves the registration and synopsis.' },
  { id: 'mpr', label: 'MPR 1-3', hint: 'One rubric that is used for each of MPR 1, MPR 2 and MPR 3.' },
  { id: 'midSem', label: 'Mid Semester', hint: 'Marks given when the mentor approves the mid-semester evaluation.' },
  { id: 'finalReport', label: 'Final Report', hint: 'Marks given when the mentor approves the final report.' }
]

let uidCounter = 0
const newUid = () => `row-${++uidCounter}`

const toEditable = (stages) => {
  const out = {}
  TABS.forEach(({ id }) => {
    const s = stages?.[id] || { enabled: true, fields: [] }
    out[id] = {
      enabled: s.enabled !== false,
      fields: (s.fields || []).map((f) => ({ ...f, _uid: newUid() }))
    }
  })
  return out
}

const toPayload = (stages) => {
  const out = {}
  TABS.forEach(({ id }) => {
    out[id] = {
      enabled: stages[id].enabled,
      fields: stages[id].fields.map((f) => ({
        key: f.key,
        label: String(f.label || '').trim(),
        max: Number(f.max)
      }))
    }
  })
  return out
}

const validate = (stages) => {
  for (const tab of TABS) {
    const stage = stages[tab.id]
    if (stage.enabled && stage.fields.length === 0) {
      return `${tab.label}: add at least one field or turn this stage off`
    }
    const seen = new Set()
    for (const f of stage.fields) {
      const label = String(f.label || '').trim()
      if (!label) return `${tab.label}: every field needs a name`
      if (seen.has(label.toLowerCase())) return `${tab.label}: duplicate field name "${label}"`
      seen.add(label.toLowerCase())
      const max = Number(f.max)
      if (!Number.isFinite(max) || max < 0.5 || max > 1000) {
        return `${tab.label}: max marks for "${label}" must be between 0.5 and 1000`
      }
    }
  }
  return ''
}

const RubricManagement = () => {
  const [stages, setStages] = useState(null)
  const [version, setVersion] = useState(0)
  const [isDefault, setIsDefault] = useState(true)
  const [activeTab, setActiveTab] = useState('registration')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const applyServerData = (data) => {
    setStages(toEditable(data.stages))
    setVersion(data.version || 0)
    setIsDefault(!!data.isDefault)
    setDirty(false)
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await rubricService.getMine()
      if (res.success) applyServerData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load rubric')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const edit = (stageId, updater) => {
    setStages((prev) => ({ ...prev, [stageId]: updater(prev[stageId]) }))
    setDirty(true)
    setSuccess('')
  }

  const updateField = (stageId, uid, patch) =>
    edit(stageId, (s) => ({ ...s, fields: s.fields.map((f) => (f._uid === uid ? { ...f, ...patch } : f)) }))

  const addField = (stageId) =>
    edit(stageId, (s) => ({ ...s, fields: [...s.fields, { _uid: newUid(), label: '', max: 10 }] }))

  const removeField = (stageId, uid) =>
    edit(stageId, (s) => ({ ...s, fields: s.fields.filter((f) => f._uid !== uid) }))

  const moveField = (stageId, index, dir) =>
    edit(stageId, (s) => {
      const target = index + dir
      if (target < 0 || target >= s.fields.length) return s
      const fields = [...s.fields]
      ;[fields[index], fields[target]] = [fields[target], fields[index]]
      return { ...s, fields }
    })

  const toggleEnabled = (stageId) => edit(stageId, (s) => ({ ...s, enabled: !s.enabled }))

  const handleSave = async () => {
    setError('')
    setSuccess('')
    const problem = validate(stages)
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    try {
      const res = await rubricService.save(toPayload(stages), version)
      if (res.success) {
        applyServerData(res.data)
        setSuccess('Rubric saved. It applies to all marks assigned from now on.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save rubric')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Reset all four stages to the default rubric? Marks already given are not changed.')) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await rubricService.reset()
      if (res.success) {
        applyServerData(res.data)
        setSuccess('Rubric reset to default.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset rubric')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !stages) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const tab = TABS.find((t) => t.id === activeTab)
  const stage = stages[activeTab]
  const stageTotal = stage.fields.reduce((sum, f) => sum + (Number(f.max) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marks Rubric</h1>
          <p className="text-gray-600">
            Define the mark fields your mentors use. {isDefault && '(Currently using the default rubric.)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4 mr-1" /> Reset to default
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="btn-primary flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save rubric'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg p-3">
        Changes apply to marks assigned from now on. Submissions that are already graded keep the
        fields they were graded with, and Excel exports use this rubric for column names.
      </div>

      {error && (
        <div className="flex items-start bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <div className="flex-1">{error}</div>
          {error.includes('changed by someone else') && (
            <button type="button" onClick={load} className="underline ml-3">Reload</button>
          )}
        </div>
      )}
      {success && (
        <div className="flex items-center bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
          <CheckCircle className="h-4 w-4 mr-2" /> {success}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-600">{tab.hint}</p>
          <label className="flex items-center text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={stage.enabled}
              onChange={() => toggleEnabled(activeTab)}
              className="mr-2 h-4 w-4"
            />
            Assign marks for this stage
          </label>
        </div>

        {stage.enabled ? (
          <>
            <div className="space-y-2">
              {stage.fields.map((f, index) => (
                <div key={f._uid} className="flex items-center gap-2">
                  <span className="w-6 text-sm text-gray-400 text-right">{index + 1}.</span>
                  <input
                    type="text"
                    value={f.label}
                    maxLength={120}
                    placeholder="Field name (e.g. Daily Diary)"
                    onChange={(e) => updateField(activeTab, f._uid, { label: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    min="0.5"
                    max="1000"
                    step="0.5"
                    value={f.max}
                    onChange={(e) => updateField(activeTab, f._uid, { max: e.target.value })}
                    className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Max marks"
                  />
                  <button type="button" onClick={() => moveField(activeTab, index, -1)} disabled={index === 0}
                    className="p-2 text-gray-500 hover:text-gray-800 disabled:opacity-30" aria-label="Move up">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => moveField(activeTab, index, 1)} disabled={index === stage.fields.length - 1}
                    className="p-2 text-gray-500 hover:text-gray-800 disabled:opacity-30" aria-label="Move down">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => removeField(activeTab, f._uid)}
                    className="p-2 text-red-500 hover:text-red-700" aria-label="Remove field">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => addField(activeTab)}
                disabled={stage.fields.length >= 30}
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-40"
              >
                <Plus className="h-4 w-4 mr-1" /> Add field
              </button>
              <div className="text-sm text-gray-700">
                Total marks for this stage: <span className="font-bold text-gray-900">{stageTotal}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Mentors will approve this stage without assigning marks, and it is left out of the Excel report.
          </p>
        )}
      </div>
    </div>
  )
}

export default RubricManagement