import { createClient } from '@/lib/supabase/server'
import { getCourseBySlug, getPrevLesson, getNextLesson } from '@/lib/courses-data'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { LessonSidebar } from '@/components/courses/LessonSidebar'
import { MarkCompleteButton } from '@/components/courses/MarkCompleteButton'
import { MarkdownContent } from '@/components/courses/MarkdownContent'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const course = getCourseBySlug(slug)
  if (!course) notFound()

  const lesson = course.lessons.find((l) => l.id === id)
  if (!lesson) notFound()

  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

  let progressRows: { lesson_id: string; completed: boolean }[] = []

  if (!isDemoMode) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: enrollment } = await supabase
      .from('enrollments').select('id')
      .eq('user_id', user.id).eq('course_id', course.id).maybeSingle()
    if (!enrollment) redirect(`/courses/${slug}`)

    const { data: pr } = await supabase
      .from('user_progress').select('lesson_id, completed')
      .eq('user_id', user.id).eq('course_id', course.id)
    progressRows = pr ?? []
  }

  const completedIds = new Set((progressRows ?? []).filter((p) => p.completed).map((p) => p.lesson_id))
  const isCompleted = completedIds.has(lesson.id)

  const prevLesson = getPrevLesson(slug, id)
  const nextLesson = getNextLesson(slug, id)
  const currentIdx = course.lessons.findIndex((l) => l.id === id)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar */}
      <LessonSidebar
        course={course}
        currentLessonId={id}
        completedIds={completedIds}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/courses" className="hover:text-gray-600 transition-colors">Khóa học</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/courses/${slug}`} className="hover:text-gray-600 transition-colors truncate max-w-[200px]">
              {course.title}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-600 truncate max-w-[200px]">{lesson.title}</span>
          </div>

          {/* Lesson header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <span>Bài {currentIdx + 1}/{course.lessons.length}</span>
              <span>·</span>
              <Clock className="w-3.5 h-3.5" />
              <span>{lesson.duration_minutes} phút</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
          </div>

          {/* Markdown content */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
            <MarkdownContent content={lesson.content} />
          </div>

          {/* Mark complete + navigation */}
          <div className="flex items-center justify-between gap-4">
            <div>
              {prevLesson ? (
                <Link
                  href={`/courses/${slug}/lessons/${prevLesson.id}`}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Bài trước
                </Link>
              ) : null}
            </div>

            <MarkCompleteButton
              courseId={course.id}
              lessonId={lesson.id}
              isCompleted={isCompleted}
              nextLessonHref={nextLesson ? `/courses/${slug}/lessons/${nextLesson.id}` : `/courses/${slug}`}
              nextLessonLabel={nextLesson ? 'Bài tiếp theo' : 'Hoàn thành khóa học'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
