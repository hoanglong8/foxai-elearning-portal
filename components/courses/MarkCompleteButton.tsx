'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, ChevronRight } from 'lucide-react'

interface Props {
  courseId: string
  lessonId: string
  isCompleted: boolean
  nextLessonHref: string
  nextLessonLabel: string
}

export function MarkCompleteButton({ courseId, lessonId, isCompleted, nextLessonHref, nextLessonLabel }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(isCompleted)

  async function handleComplete() {
    if (done) {
      router.push(nextLessonHref)
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      completed: true,
      completed_at: new Date().toISOString(),
    })

    setDone(true)
    setLoading(false)
    router.refresh()
    router.push(nextLessonHref)
  }

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : done ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <CheckCircle2 className="w-4 h-4" />
      )}
      {done ? nextLessonLabel : 'Đánh dấu hoàn thành'}
      {done && <ChevronRight className="w-4 h-4" />}
    </button>
  )
}
