import { createClient } from '@/lib/supabase/server'
import { getCourseBySlug } from '@/lib/courses-data'
import { CATEGORY_LABELS, CATEGORY_COLORS, LEVEL_LABELS } from '@/types'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EnrollButton } from '@/components/courses/EnrollButton'
import { BookOpen, Clock, CheckCircle2, Circle, ChevronLeft } from 'lucide-react'

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

export default async function CourseOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Try static course first
  const staticCourse = getCourseBySlug(slug)

  if (!isDemoMode) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // If static course found, use original logic
    if (staticCourse) {
      const { data: e } = await supabase
        .from('enrollments').select('id')
        .eq('user_id', user.id).eq('course_id', staticCourse.id).maybeSingle()
      const { data: pr } = await supabase
        .from('user_progress').select('lesson_id, completed')
        .eq('user_id', user.id).eq('course_id', staticCourse.id)

      const completedIds = new Set((pr ?? []).filter((p) => p.completed).map((p) => p.lesson_id))
      const completedCount = completedIds.size
      const totalCount = staticCourse.lessons.length
      const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      const totalMins = staticCourse.lessons.reduce((s, l) => s + l.duration_minutes, 0)
      const isEnrolled = !!e
      const firstLesson = staticCourse.lessons[0]
      const nextLesson = staticCourse.lessons.find((l) => !completedIds.has(l.id)) ?? firstLesson

      return <CourseDetail
        course={staticCourse}
        lessons={staticCourse.lessons.map(l => ({ id: l.id, title: l.title, duration_minutes: l.duration_minutes }))}
        completedIds={completedIds}
        completedCount={completedCount}
        totalCount={totalCount}
        pct={pct}
        totalMins={totalMins}
        isEnrolled={isEnrolled}
        nextLessonId={nextLesson?.id}
        firstLessonId={firstLesson?.id}
        slug={slug}
      />
    }

    // Try db_courses
    const { data: dbCourse } = await supabase
      .from('db_courses')
      .select('id, slug, title, description, category, level, emoji, is_published')
      .eq('slug', slug)
      .single()

    if (!dbCourse) notFound()

    const { data: dbLessons } = await supabase
      .from('db_lessons')
      .select('id, title, duration_minutes, order_index')
      .eq('course_id', dbCourse.id)
      .order('order_index')

    const lessons = dbLessons ?? []

    const { data: e } = await supabase
      .from('enrollments').select('id')
      .eq('user_id', user.id).eq('course_id', dbCourse.id).maybeSingle()
    const { data: pr } = await supabase
      .from('user_progress').select('lesson_id, completed')
      .eq('user_id', user.id).eq('course_id', dbCourse.id)

    const completedIds = new Set((pr ?? []).filter((p) => p.completed).map((p) => p.lesson_id))
    const completedCount = completedIds.size
    const totalCount = lessons.length
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    const totalMins = lessons.reduce((s, l) => s + (l.duration_minutes ?? 10), 0)
    const isEnrolled = !!e
    const firstLesson = lessons[0]
    const nextLesson = lessons.find((l) => !completedIds.has(l.id)) ?? firstLesson

    return <CourseDetail
      course={dbCourse}
      lessons={lessons}
      completedIds={completedIds}
      completedCount={completedCount}
      totalCount={totalCount}
      pct={pct}
      totalMins={totalMins}
      isEnrolled={isEnrolled}
      nextLessonId={nextLesson?.id}
      firstLessonId={firstLesson?.id}
      slug={slug}
    />
  }

  // Demo mode
  if (!staticCourse) notFound()
  const completedIds = new Set<string>()
  return <CourseDetail
    course={staticCourse}
    lessons={staticCourse.lessons.map(l => ({ id: l.id, title: l.title, duration_minutes: l.duration_minutes }))}
    completedIds={completedIds}
    completedCount={0}
    totalCount={staticCourse.lessons.length}
    pct={0}
    totalMins={staticCourse.lessons.reduce((s, l) => s + l.duration_minutes, 0)}
    isEnrolled={true}
    nextLessonId={staticCourse.lessons[0]?.id}
    firstLessonId={staticCourse.lessons[0]?.id}
    slug={slug}
  />
}

function CourseDetail({
  course,
  lessons,
  completedIds,
  completedCount,
  totalCount,
  pct,
  totalMins,
  isEnrolled,
  nextLessonId,
  firstLessonId,
  slug,
}: {
  course: { id: string; title: string; description: string; category: string; level: string; emoji: string }
  lessons: { id: string; title: string; duration_minutes: number }[]
  completedIds: Set<string>
  completedCount: number
  totalCount: number
  pct: number
  totalMins: number
  isEnrolled: boolean
  nextLessonId?: string
  firstLessonId?: string
  slug: string
}) {
  const cat = course.category as keyof typeof CATEGORY_LABELS
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/courses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="w-4 h-4" /> Quay lại khóa học
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
        <div className="flex items-start gap-5">
          <span className="text-5xl">{course.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 mb-2 flex-wrap">
              <Badge className={CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600'} variant="secondary">
                {CATEGORY_LABELS[cat] ?? course.category}
              </Badge>
              <Badge variant="outline">{LEVEL_LABELS[course.level as keyof typeof LEVEL_LABELS] ?? course.level}</Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-500 text-sm">{course.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-50 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> {totalCount} bài học
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> {totalMins} phút
          </span>
        </div>

        {isEnrolled && totalCount > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-600 font-medium">Tiến độ của bạn</span>
              <span className="text-blue-600 font-semibold">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-gray-400 mt-1">{completedCount}/{totalCount} bài hoàn thành</p>
          </div>
        )}

        <div className="mt-5">
          {isEnrolled ? (
            nextLessonId ? (
              <Link
                href={`/courses/${slug}/lessons/${nextLessonId}`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
              >
                {completedCount > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </Link>
            ) : (
              <p className="text-sm text-gray-500">Khóa học chưa có bài học nào.</p>
            )
          ) : (
            <EnrollButton courseId={course.id} courseSlug={slug} firstLessonId={firstLessonId} />
          )}
        </div>
      </div>

      {lessons.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nội dung khóa học</h2>
          <div className="space-y-2">
            {lessons.map((lesson, idx) => {
              const done = completedIds.has(lesson.id)
              return (
                <div key={lesson.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 group">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700">
                      {idx + 1}. {lesson.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {lesson.duration_minutes} phút
                  </span>
                  {isEnrolled && (
                    <Link
                      href={`/courses/${slug}/lessons/${lesson.id}`}
                      className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      Xem
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
