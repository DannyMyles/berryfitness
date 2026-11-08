'use client'

import { Plus, Trash2, Users } from 'lucide-react'

interface TrainersInputProps {
  value: string[]
  onChange: (trainers: string[]) => void
}

export default function TrainersInput({ value, onChange }: TrainersInputProps) {
  const trainers = value.length > 0 ? value : ['']

  const updateAt = (index: number, next: string) => {
    onChange(trainers.map((t, i) => (i === index ? next : t)))
  }

  const removeAt = (index: number) => {
    const remaining = trainers.filter((_, i) => i !== index)
    onChange(remaining.length > 0 ? remaining : [''])
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" />
        Trainer(s) *
      </label>
      <div className="space-y-2">
        {trainers.map((trainer, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={trainer}
              onChange={(e) => updateAt(index, e.target.value)}
              placeholder={`Trainer ${index + 1} name`}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              required
            />
            {trainers.length > 1 && (
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Remove trainer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...trainers, ''])}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:text-accent-700"
      >
        <Plus className="h-4 w-4" />
        Add Trainer
      </button>
    </div>
  )
}
