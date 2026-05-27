'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

interface Props {
  courseId: string
  courseSlug: string
  firstLessonId?: string
}

export function EnrollButton({ courseId, courseSlug, firstLessonId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleEnroll() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('enrollments').upsert({
      user_id: user.id,
      course_id: courseId,
    })

    router.refresh()
    if (firstLessonId) {
      router.push(`/courses/${courseSlug}/lessons/${firstLessonId}`)
    }
  }

  return (
    <Button
      onClick={handleEnroll}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 h-auto rounded-xl"
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        <BookOpen className="w-4 h-4 mr-2" />
      )}
      {loading ? 'Đang đăng ký...' : 'Đăng ký khóa học'}
    </Button>
  )
}
