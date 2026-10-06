import React from 'react'

// { items: [{key, score}] }  ->  { [key]: score }
export const scoresFromResult = (result) => {
  const scores = {}
  ;(result?.items || []).forEach((item) => {
    scores[item.key] = item.score
  })
  return scores
}

const RubricMarksForm = ({ title, stageRubric, scores = {}, onChange }) => {
  if (!stageRubric) return null

  if (!stageRubric.enabled) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-600">
        Marks are turned off for this stage by your department. You can approve without assigning marks.
      </div>
    )
  }

  const fields = stageRubric.fields || []
  const maxTotal = fields.reduce((sum, f) => sum + Number(f.max || 0), 0)
  const total = fields.reduce((sum, f) => sum + (Number(scores[f.key]) || 0), 0)

  const handleChange = (field, raw) => {
    if (raw === '') {
      onChange({ ...scores, [field.key]: '' })
      return
    }
    const n = parseFloat(raw)
    if (Number.isNaN(n)) return
    onChange({ ...scores, [field.key]: Math.min(Math.max(n, 0), Number(field.max)) })
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h5 className="font-semibold text-gray-900 mb-4">
        {title || 'Marks Assignment'} (Max: {maxTotal})
      </h5>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {field.label}
              <span className="text-gray-500 ml-1">(Max: {field.max})</span>
            </label>
            <input
              type="number"
              min="0"
              max={field.max}
              step="0.5"
              value={scores[field.key] ?? ''}
              placeholder="0"
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
        <span className="font-semibold text-gray-900">Total</span>
        <span className="text-2xl font-bold text-blue-600">
          {total.toFixed(1)} / {maxTotal}
        </span>
      </div>
    </div>
  )
}

export default RubricMarksForm