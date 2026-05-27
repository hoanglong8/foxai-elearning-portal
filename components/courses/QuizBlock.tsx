'use client'

import { useState, useTransition } from 'react'
import { submitQuizAnswer } from '@/app/admin/actions'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Question {
  id: string
  question: string
  options: string[]
  correct_index: number
}

interface UserAnswer {
  question_id: string
  selected_index: number
  is_correct: boolean
}

export function QuizBlock({
  questions,
  initialAnswers,
}: {
  questions: Question[]
  initialAnswers: UserAnswer[]
}) {
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>(
    Object.fromEntries(initialAnswers.map((a) => [a.question_id, a]))
  )
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [isPending, startTransition] = useTransition()

  if (questions.length === 0) return null

  function handleSubmit(questionId: string) {
    const idx = selected[questionId]
    if (idx === undefined) return
    startTransition(async () => {
      const res = await submitQuizAnswer(questionId, idx)
      if ('is_correct' in res && res.is_correct !== undefined) {
        setAnswers((prev) => ({
          ...prev,
          [questionId]: { question_id: questionId, selected_index: idx, is_correct: res.is_correct as boolean },
        }))
      }
    })
  }

  return (
    <div className="mt-8 space-y-5">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm">❓</span>
        Câu hỏi trắc nghiệm
      </h3>

      {questions.map((q, idx) => {
        const answer = answers[q.id]
        const isAnswered = !!answer
        const selectedIdx = selected[q.id]

        return (
          <div key={q.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="font-medium text-gray-900 mb-4">{idx + 1}. {q.question}</p>

            <div className="space-y-2">
              {q.options.map((opt, i) => {
                let style = 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                if (isAnswered) {
                  if (i === q.correct_index) style = 'border-green-400 bg-green-50 text-green-800'
                  else if (i === answer.selected_index && !answer.is_correct) style = 'border-red-300 bg-red-50 text-red-700'
                  else style = 'border-gray-100 bg-gray-50 text-gray-400'
                } else if (selectedIdx === i) {
                  style = 'border-blue-500 bg-blue-50 text-blue-800'
                }

                return (
                  <button
                    key={i}
                    disabled={isAnswered}
                    onClick={() => setSelected((prev) => ({ ...prev, [q.id]: i }))}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm flex items-center gap-3 ${style}`}
                  >
                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                    {isAnswered && i === q.correct_index && (
                      <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto shrink-0" />
                    )}
                    {isAnswered && i === answer.selected_index && !answer.is_correct && (
                      <XCircle className="w-4 h-4 text-red-500 ml-auto shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            {!isAnswered ? (
              <Button
                size="sm"
                className="mt-3"
                onClick={() => handleSubmit(q.id)}
                disabled={selectedIdx === undefined || isPending}
              >
                Xác nhận đáp án
              </Button>
            ) : (
              <p className={`mt-3 text-sm font-medium flex items-center gap-1 ${answer.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                {answer.is_correct
                  ? <><CheckCircle2 className="w-4 h-4" /> Chính xác!</>
                  : <><XCircle className="w-4 h-4" /> Chưa đúng. Đáp án đúng là {String.fromCharCode(65 + q.correct_index)}.</>
                }
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
