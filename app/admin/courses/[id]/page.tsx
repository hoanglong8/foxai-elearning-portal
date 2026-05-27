export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getDemoCourses } from '@/lib/demo-db'
import { CourseForm } from '@/components/admin/CourseForm'
import { LessonManager } from '@/components/admin/LessonManager'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let course: { id: string; title: string; description: string; category: string; level: string; emoji: string; is_published: boolean } | null = null
  let lessons: { id: string; title: string; content: string; duration_minutes: number; order_index: number }[] = []

  if (isDemoMode) {
    const demoCourse = getDemoCourses().find((c) => c.id === id)
    if (!demoCourse) notFound()
    course = demoCourse
    lessons = [] // demo lessons stored client-side only for now
  } else {
    const supabase = await createClient()
    const [c, l] = await Promise.all([
      supabase.from('db_courses').select('id, title, description, category, level, emoji, is_published').eq('id', id).single(),
      supabase.from('db_lessons').select('id, title, content, duration_minutes, order_index, video_url').eq('course_id', id).order('order_index'),
    ])
    course = c.data
    lessons = l.data ?? []
  }

  if (!course) notFound()

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/courses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Danh sách khóa học
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa khóa học</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-gray-700 mb-4">Thông tin khóa học</h2>
          <CourseForm course={course} />
        </div>
        <div>
          <h2 className="font-semibold text-gray-700 mb-4">Bài học ({lessons.length})</h2>
          <LessonManager courseId={id} lessons={lessons} />
        </div>
      </div>
    </div>
  )
}
