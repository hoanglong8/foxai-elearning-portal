'use client'

import { useState, useTransition } from 'react'
import { submitSurveyResponse } from '@/app/admin/actions'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface SurveyQ {
  id: string
  question: string
}

interface SurveyResponse {
  survey_id: string
  response: string
}

export function SurveyBlock({
  questions,
  initialResponses,
}: {
  questions: SurveyQ[]
  initialResponses: SurveyResponse[]
}) {
  const [responses, setResponses] = useState<Record<string, string>>(
    Object.fromEntries(initialResponses.map((r) => [r.survey_id, r.response]))
  )
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>(
    Object.fromEntries(initialResponses.map((r) => [r.survey_id, true]))
  )
  const [isPending, startTransition] = useTransition()

  if (questions.length === 0) return null

  function handleSubmit(surveyId: string) {
    const text = drafts[surveyId] ?? responses[surveyId] ?? ''
    if (!text.trim()) return
    startTransition(async () => {
      const res = await submitSurveyResponse(surveyId, text)
      if ('success' in res) {
        setResponses((prev) => ({ ...prev, [surveyId]: text }))
        setSubmitted((prev) => ({ ...prev, [surveyId]: true }))
      }
    })
  }

  return (
    <div className="mt-8 space-y-5">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm">📋</span>
        Câu hỏi khảo sát
      </h3>

      {questions.map((q, idx) => {
        const isSubmitted = submitted[q.id]
        const currentDraft = drafts[q.id] ?? responses[q.id] ?? ''

        return (
          <div key={q.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="font-medium text-gray-900 mb-3">{idx + 1}. {q.question}</p>

            <Textarea
              value={currentDraft}
              onChange={(e) => {
                setDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                if (isSubmitted) setSubmitted((prev) => ({ ...prev, [q.id]: false }))
              }}
              placeholder="Nhập câu trả lời của bạn..."
              rows={4}
              className="text-sm"
            />

            <div className="mt-3 flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => handleSubmit(q.id)}
                disabled={isPending || !currentDraft.trim()}
              >
                {isPending ? 'Đang gửi...' : isSubmitted ? 'Cập nhật' : 'Gửi câu trả lời'}
              </Button>
              {isSubmitted && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Đã ghi nhận
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
