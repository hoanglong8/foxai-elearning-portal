'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createSurveyQuestion, updateSurveyQuestion, deleteSurveyQuestion } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Pencil } from 'lucide-react'

interface SurveyQ {
  id: string
  question: string
  order_index: number
}

export function SurveyEditor({ lessonId, courseId }: { lessonId: string; courseId: string }) {
  const [questions, setQuestions] = useState<SurveyQ[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [addingText, setAddingText] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    supabase.from('db_surveys')
      .select('id, question, order_index')
      .eq('lesson_id', lessonId)
      .order('order_index')
      .then(({ data }) => {
        setQuestions(data ?? [])
        setLoading(false)
      })
  }, [lessonId])

  function handleAdd() {
    if (!addingText.trim()) return
    startTransition(async () => {
      const res = await createSurveyQuestion({
        lesson_id: lessonId, course_id: courseId,
        question: addingText, order_index: questions.length,
      })
      if ('id' in res && res.id) {
        setQuestions((prev) => [...prev, { id: res.id!, question: addingText, order_index: prev.length }])
      }
      setAddingText('')
      setAddingNew(false)
    })
  }

  async function handleEdit(id: string) {
    const res = await updateSurveyQuestion({ id, question: editText })
    if (!('error' in res)) {
      setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, question: editText } : q))
      setEditingId(null)
    }
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSurveyQuestion(id)
      setQuestions((prev) => prev.filter((q) => q.id !== id))
    })
  }

  if (loading) return <p className="text-xs text-gray-400 py-2">Đang tải...</p>

  return (
    <div className="space-y-3">
      {questions.length === 0 && !addingNew && (
        <p className="text-xs text-gray-400 py-2">Chưa có câu hỏi khảo sát nào.</p>
      )}

      {questions.map((q, idx) => (
        <div key={q.id} className="bg-white rounded-lg border border-gray-200 p-3">
          {editingId === q.id ? (
            <div className="flex gap-2">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="text-sm h-8 flex-1"
                autoFocus
              />
              <Button size="sm" className="h-8" onClick={() => handleEdit(q.id)}>Lưu</Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>Hủy</Button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-800">{idx + 1}. {q.question}</p>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => { setEditingId(q.id); setEditText(q.question) }}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={isPending}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {addingNew ? (
        <div className="flex gap-2">
          <Input
            value={addingText}
            onChange={(e) => setAddingText(e.target.value)}
            placeholder="VD: Bạn cảm thấy khó khăn nhất ở bước nào?"
            className="text-sm flex-1"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd} disabled={isPending || !addingText.trim()}>
            {isPending ? '...' : 'Thêm'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAddingNew(false); setAddingText('') }}>Hủy</Button>
        </div>
      ) : (
        <Button
          size="sm" variant="outline" className="w-full gap-1 text-xs"
          onClick={() => setAddingNew(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi khảo sát
        </Button>
      )}
    </div>
  )
}
