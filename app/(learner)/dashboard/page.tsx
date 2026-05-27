import { createClient } from '@/lib/supabase/server'
import { COURSES } from '@/lib/courses-data'
import { isDemoMode, DEMO_ENROLLMENTS, DEMO_PROGRESS } from '@/lib/demo'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/types'
import { BookOpen, CheckCircle2, Clock, Flame } from 'lucide-react'

type DbCourse = {
  id: string
  slug: string
  title: string
  description: string
  category: string
  level: string
  emoji: string
}

export default async function DashboardPage() {
  let profile = { full_name: 'Nguyễn Hoàng Long', role: 'learner' }
  let enrollments = DEMO_ENROLLMENTS
  let progressRows = DEMO_PROGRESS
  let dbCourses: DbCourse[] = []

  if (!isDemoMode) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [p, e, pr, dbc] = await Promise.all([
      supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
      supabase.from('enrollments').select('course_id, enrolled_at, completed_at').eq('user_id', user.id),
      supabase.from('user_progress').select('lesson_id, course_id, completed').eq('user_id', user.id),
      supabase.from('db_courses').select('id, slug, title, description, category, level, emoji').eq('is_published', true),
    ])

    profile = p.data ?? profile
    enrollments = e.data ?? []
    progressRows = pr.data ?? []
    dbCourses = dbc.data ?? []
  }

  const enrolledCourseIds = new Set((enrollments ?? []).map((e) => e.course_id))
  const completedLessonIds = new Set(
    (progressRows ?? []).filter((p) => p.completed).map((p) => p.lesson_id)
  )

  // Enrolled static courses
  const enrolledStaticCourses = COURSES.filter((c) => enrolledCourseIds.has(c.id)).map((c) => {
    const completed = c.lessons.filter((l) => completedLessonIds.has(l.id)).length
    const total = c.lessons.length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return {
      id: c.id, slug: c.slug, title: c.title, emoji: c.emoji,
      category: c.category, completed, total, pct,
      nextLessonId: c.lessons.find((l) => !completedLessonIds.has(l.id))?.id,
      nextLessonTitle: c.lessons.find((l) => !completedLessonIds.has(l.id))?.title,
    }
  })

  // Enrolled db courses
  const enrolledDbCourses = dbCourses.filter((c) => enrolledCourseIds.has(c.id)).map((c) => {
    const completedInCourse = (progressRows ?? []).filter((p) => p.course_id === c.id && p.completed).length
    return {
      id: c.id, slug: c.slug, title: c.title, emoji: c.emoji,
      category: c.category, completed: completedInCourse, total: 0, pct: 0,
      nextLessonId: undefined as string | undefined,
      nextLessonTitle: undefined as string | undefined,
    }
  })

  const allEnrolledCourses = [...enrolledStaticCourses, ...enrolledDbCourses]

  const totalCompleted = completedLessonIds.size
  const totalEnrolled = enrolledCourseIds.size
  const totalMins = COURSES.reduce((s, c) => s + c.lessons.reduce((a, l) => a + l.duration_minutes, 0), 0)
  const totalCourses = COURSES.length + dbCourses.length

  const firstName = profile?.full_name?.split(' ').pop() ?? 'bạn'
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Xin chào, {firstName} 👋
          </h1>
          <p className="text-gray-500 mt-1">Tiếp tục hành trình học tập của bạn hôm nay.</p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            ⚙️ Admin Panel
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalEnrolled}</p>
              <p className="text-xs text-gray-500">Khóa đã đăng ký</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCompleted}</p>
              <p className="text-xs text-gray-500">Bài học hoàn thành</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalMins} phút</p>
              <p className="text-xs text-gray-500">Tổng thời gian học</p>
            </div>
          </div>
        </div>
      </div>

      {/* In-progress courses */}
      {allEnrolledCourses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tiếp tục học</h2>
          <div className="space-y-4">
            {allEnrolledCourses.map((course) => (
              <Link
                key={course.id}
                href={course.nextLessonId
                  ? `/courses/${course.slug}/lessons/${course.nextLessonId}`
                  : `/courses/${course.slug}`}
                className="flex items-center gap-4 bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="text-3xl shrink-0">{course.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                      {course.title}
                    </h3>
                    <Badge
                      className={CATEGORY_COLORS[course.category as keyof typeof CATEGORY_COLORS] ?? 'bg-gray-100 text-gray-600'}
                      variant="secondary"
                    >
                      {CATEGORY_LABELS[course.category as keyof typeof CATEGORY_LABELS] ?? course.category}
                    </Badge>
                  </div>
                  {course.total > 0 ? (
                    <>
                      <div className="flex items-center gap-3">
                        <Progress value={course.pct} className="flex-1 h-2" />
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {course.completed}/{course.total} bài
                        </span>
                      </div>
                      {course.nextLessonTitle && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Tiếp theo: {course.nextLessonTitle}
                        </p>
                      )}
                      {course.pct === 100 && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">Nhấn để xem nội dung khóa học</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Explore courses CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="font-semibold text-lg mb-1">Khám phá khóa học mới</h2>
        <p className="text-blue-100 text-sm mb-4">
          {totalCourses} khóa học từ AI, Kỹ thuật đến Sales & Quy trình nội bộ FOXAI.
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 bg-white text-blue-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Xem tất cả khóa học
        </Link>
      </div>
    </div>
  )
}
