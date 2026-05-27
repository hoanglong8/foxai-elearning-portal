'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createQuestion, updateQuestion, deleteQuestion } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string[]
  correct_index: number
  order_index: number
}

function QuestionForm({
  question,
  onSave,
  onCancel,
}: {
  question?: Question
  onSave: (q: Question) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(question?.question ?? '')
  const [options, setOptions] = useState<string[]>(question?.options ?? ['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(question?.correct_index ?? 0)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    if (!text.trim()) { setError('Vui lòng nhập câu hỏi'); return }
    if (options.some((o) => !o.trim())) { setError('Vui lòng nhập đủ 4 đáp án'); return }
    setError(null)
    startTransition(async () => {
      if (question?.id) {
        const res = await updateQuestion({ id: question.id, question: text, options, correct_index: correctIndex })
        if (res.error) { setError(res.error); return }
        onSave({ ...question, question: text, options, correct_index: correctIndex })
      } else {
        onSave({ id: '', question: text, options, correct_index: correctIndex, order_index: 0 })
      }
    })
  }

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Câu hỏi *</Label>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="VD: Thứ tự ưu tiên trong quy trình sales là?" className="text-sm" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Đáp án (chọn đáp án đúng)</Label>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
              className="w-4 h-4 text-blue-600"
            />
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              correctIndex === i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {String.fromCharCode(65 + i)}
            </span>
            <Input
              value={opt}
              onChange={(e) => {
                const next = [...options]
                next[i] = e.target.value
                setOptions(next)
              }}
              placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
              className="text-sm h-8 flex-1"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? 'Đang lưu...' : question?.id ? 'Lưu' : 'Thêm câu hỏi'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Hủy</Button>
      </div>
    </div>
  )
}

export function QuizEditor({ lessonId, courseId }: { lessonId: string; courseId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    supabase.from('db_questions')
      .select('id, question, options, correct_index, order_index')
      .eq('lesson_id', lessonId)
      .order('order_index')
      .then(({ data }) => {
        setQuestions((data ?? []).map((q) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string),
        })))
        setLoading(false)
      })
  }, [lessonId])

  async function handleAddSave(q: Question) {
    const res = await createQuestion({
      lesson_id: lessonId, course_id: courseId,
      question: q.question, options: q.options,
      correct_index: q.correct_index, order_index: questions.length,
    })
    if ('id' in res && res.id) {
      setQuestions((prev) => [...prev, { ...q, id: res.id!, order_index: prev.length }])
    }
    setAddingNew(false)
  }

  function handleEditSave(updated: Question) {
    setQuestions((prev) => prev.map((q) => q.id === updated.id ? updated : q))
    setEditingId(null)
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteQuestion(id)
      setQuestions((prev) => prev.filter((q) => q.id !== id))
    })
  }

  if (loading) return <p className="text-xs text-gray-400 py-2">Đang tải...</p>

  return (
    <div className="space-y-3">
      {questions.length === 0 && !addingNew && (
        <p className="text-xs text-gray-400 py-2">Chưa có câu hỏi trắc nghiệm nào.</p>
      )}

      {questions.map((q, idx) => (
        <div key={q.id}>
          {editingId === q.id ? (
            <QuestionForm question={q} onSave={handleEditSave} onCancel={() => setEditingId(null)} />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{idx + 1}. {q.question}</p>
                  <div className="mt-2 space-y-1">
                    {q.options.map((opt, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                        i === q.correct_index ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-500'
                      }`}>
                        {i === q.correct_index
                          ? <Check className="w-3 h-3 shrink-0" />
                          : <span className="w-3 h-3 shrink-0" />
                        }
                        <span className="font-semibold mr-1">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditingId(q.id)} className="p-1 text-gray-400 hover:text-blue-600">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(q.id)} disabled={isPending} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {addingNew && (
        <QuestionForm onSave={handleAddSave} onCancel={() => setAddingNew(false)} />
      )}

      {!addingNew && (
        <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => setAddingNew(true)}>
          <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi trắc nghiệm
        </Button>
      )}
    </div>
  )
}
