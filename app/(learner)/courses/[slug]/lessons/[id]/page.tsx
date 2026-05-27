import { createClient } from '@/lib/supabase/server'
import { getCourseBySlug, getPrevLesson, getNextLesson } from '@/lib/courses-data'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { LessonSidebar } from '@/components/courses/LessonSidebar'
import { MarkCompleteButton } from '@/components/courses/MarkCompleteButton'
import { MarkdownContent } from '@/components/courses/MarkdownContent'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params

  // Try static course first
  const staticCourse = getCourseBySlug(slug)

  if (!isDemoMode) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    if (staticCourse) {
      const lesson = staticCourse.lessons.find((l) => l.id === id)
      if (!lesson) notFound()

      const { data: enrollment } = await supabase
        .from('enrollments').select('id')
        .eq('user_id', user.id).eq('course_id', staticCourse.id).maybeSingle()
      if (!enrollment) redirect(`/courses/${slug}`)

      const { data: pr } = await supabase
        .from('user_progress').select('lesson_id, completed')
        .eq('user_id', user.id).eq('course_id', staticCourse.id)
      const progressRows = pr ?? []
      const completedIds = new Set(progressRows.filter((p) => p.completed).map((p) => p.lesson_id))
      const isCompleted = completedIds.has(lesson.id)
      const prevLesson = getPrevLesson(slug, id)
      const nextLesson = getNextLesson(slug, id)
      const currentIdx = staticCourse.lessons.findIndex((l) => l.id === id)

      return (
        <LessonView
          courseTitle={staticCourse.title}
          courseEmoji={staticCourse.emoji}
          slug={slug}
          lesson={{ id: lesson.id, title: lesson.title, duration_minutes: lesson.duration_minutes, content: lesson.content }}
          courseId={staticCourse.id}
          allLessons={staticCourse.lessons.map(l => ({ id: l.id, title: l.title, duration_minutes: l.duration_minutes }))}
          completedIds={completedIds}
          isCompleted={isCompleted}
          currentIdx={currentIdx}
          totalCount={staticCourse.lessons.length}
          prevLessonId={prevLesson?.id}
          nextLessonId={nextLesson?.id}
        />
      )
    }

    // Try db_courses
    const { data: dbCourse } = await supabase
      .from('db_courses')
      .select('id, title, slug, emoji')
      .eq('slug', slug)
      .single()
    if (!dbCourse) notFound()

    const { data: dbLesson } = await supabase
      .from('db_lessons')
      .select('id, title, content, duration_minutes, order_index')
      .eq('id', id)
      .eq('course_id', dbCourse.id)
      .single()
    if (!dbLesson) notFound()

    const { data: enrollment } = await supabase
      .from('enrollments').select('id')
      .eq('user_id', user.id).eq('course_id', dbCourse.id).maybeSingle()
    if (!enrollment) redirect(`/courses/${slug}`)

    const { data: allDbLessons } = await supabase
      .from('db_lessons')
      .select('id, title, duration_minutes, order_index')
      .eq('course_id', dbCourse.id)
      .order('order_index')

    const { data: pr } = await supabase
      .from('user_progress').select('lesson_id, completed')
      .eq('user_id', user.id).eq('course_id', dbCourse.id)

    const lessons = allDbLessons ?? []
    const completedIds = new Set((pr ?? []).filter((p) => p.completed).map((p) => p.lesson_id))
    const isCompleted = completedIds.has(dbLesson.id)
    const currentIdx = lessons.findIndex((l) => l.id === id)
    const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : undefined
    const nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : undefined

    return (
      <LessonView
        courseTitle={dbCourse.title}
        courseEmoji={dbCourse.emoji ?? '📚'}
        slug={slug}
        lesson={{ id: dbLesson.id, title: dbLesson.title, duration_minutes: dbLesson.duration_minutes, content: dbLesson.content }}
        courseId={dbCourse.id}
        allLessons={lessons}
        completedIds={completedIds}
        isCompleted={isCompleted}
        currentIdx={currentIdx}
        totalCount={lessons.length}
        prevLessonId={prevLesson?.id}
        nextLessonId={nextLesson?.id}
      />
    )
  }

  // Demo mode
  if (!staticCourse) notFound()
  const lesson = staticCourse.lessons.find((l) => l.id === id)
  if (!lesson) notFound()
  const prevLesson = getPrevLesson(slug, id)
  const nextLesson = getNextLesson(slug, id)
  const currentIdx = staticCourse.lessons.findIndex((l) => l.id === id)

  return (
    <LessonView
      courseTitle={staticCourse.title}
      courseEmoji={staticCourse.emoji}
      slug={slug}
      lesson={{ id: lesson.id, title: lesson.title, duration_minutes: lesson.duration_minutes, content: lesson.content }}
      courseId={staticCourse.id}
      allLessons={staticCourse.lessons.map(l => ({ id: l.id, title: l.title, duration_minutes: l.duration_minutes }))}
      completedIds={new Set()}
      isCompleted={false}
      currentIdx={currentIdx}
      totalCount={staticCourse.lessons.length}
      prevLessonId={prevLesson?.id}
      nextLessonId={nextLesson?.id}
    />
  )
}

function LessonView({
  courseTitle,
  courseEmoji,
  slug,
  lesson,
  courseId,
  allLessons,
  completedIds,
  isCompleted,
  currentIdx,
  totalCount,
  prevLessonId,
  nextLessonId,
}: {
  courseTitle: string
  courseEmoji: string
  slug: string
  lesson: { id: string; title: string; duration_minutes: number; content: string }
  courseId: string
  allLessons: { id: string; title: string; duration_minutes: number }[]
  completedIds: Set<string>
  isCompleted: boolean
  currentIdx: number
  totalCount: number
  prevLessonId?: string
  nextLessonId?: string
}) {
  const sidebarCourse = { title: courseTitle, emoji: courseEmoji, slug, lessons: allLessons }

  return (
    <div className="flex h-screen overflow-hidden">
      <LessonSidebar
        course={sidebarCourse}
        currentLessonId={lesson.id}
        completedIds={completedIds}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/courses" className="hover:text-gray-600 transition-colors">Khóa học</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/courses/${slug}`} className="hover:text-gray-600 transition-colors truncate max-w-[200px]">
              {courseTitle}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-600 truncate max-w-[200px]">{lesson.title}</span>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <span>Bài {currentIdx + 1}/{totalCount}</span>
              <span>·</span>
              <Clock className="w-3.5 h-3.5" />
              <span>{lesson.duration_minutes} phút</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
            <MarkdownContent content={lesson.content} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              {prevLessonId ? (
                <Link
                  href={`/courses/${slug}/lessons/${prevLessonId}`}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Bài trước
                </Link>
              ) : null}
            </div>

            <MarkCompleteButton
              courseId={courseId}
              lessonId={lesson.id}
              isCompleted={isCompleted}
              nextLessonHref={nextLessonId ? `/courses/${slug}/lessons/${nextLessonId}` : `/courses/${slug}`}
              nextLessonLabel={nextLessonId ? 'Bài tiếp theo' : 'Hoàn thành khóa học'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
