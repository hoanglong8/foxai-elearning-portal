import { createClient } from '@/lib/supabase/server'
import { COURSES, getCourseBySlug } from '@/lib/courses-data'
import { CheckCircle2, Circle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

const DEMO_PROFILES = [
  { id: '1', full_name: 'Nguyễn Hoàng Long', department: 'Delivery' },
  { id: '2', full_name: 'Nguyễn Quốc Anh', department: 'Delivery' },
  { id: '3', full_name: 'Trần Thị Bích Hoài', department: 'Delivery' },
  { id: '4', full_name: 'Vi Anh Tuấn', department: 'R&D' },
  { id: '5', full_name: 'Trần Quốc Vương', department: 'Sales' },
]
const DEMO_ENROLLMENTS = [
  { user_id: '1', course_id: 'llm-telegram-enterprise', enrolled_at: '2024-01-10' },
  { user_id: '2', course_id: 'llm-telegram-enterprise', enrolled_at: '2024-01-11' },
  { user_id: '2', course_id: 'foxai-onboarding', enrolled_at: '2024-01-11' },
  { user_id: '3', course_id: 'foxai-onboarding', enrolled_at: '2024-01-12' },
  { user_id: '4', course_id: 'ba-framework-mastery', enrolled_at: '2024-01-13' },
]
const DEMO_PROGRESS = [
  { user_id: '1', course_id: 'llm-telegram-enterprise', lesson_id: 'llm-tele-01', completed: true, completed_at: '2024-01-12' },
  { user_id: '1', course_id: 'llm-telegram-enterprise', lesson_id: 'llm-tele-02', completed: true, completed_at: '2024-01-13' },
  { user_id: '2', course_id: 'llm-telegram-enterprise', lesson_id: 'llm-tele-01', completed: true, completed_at: '2024-01-14' },
  { user_id: '2', course_id: 'foxai-onboarding', lesson_id: 'onboard-01', completed: true, completed_at: '2024-01-15' },
  { user_id: '3', course_id: 'foxai-onboarding', lesson_id: 'onboard-01', completed: true, completed_at: '2024-01-16' },
  { user_id: '3', course_id: 'foxai-onboarding', lesson_id: 'onboard-02', completed: true, completed_at: '2024-01-17' },
  { user_id: '4', course_id: 'ba-framework-mastery', lesson_id: 'ba-01', completed: true, completed_at: '2024-01-18' },
]

export default async function CourseReportPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params

  const course = COURSES.find((c) => c.id === courseId)
  if (!course) notFound()

  let profiles: { id: string; full_name: string | null; department: string | null }[] = []
  let enrollments: { user_id: string; course_id: string; enrolled_at: string }[] = []
  let progressRows: { user_id: string; course_id: string; lesson_id: string; completed: boolean; completed_at: string | null }[] = []

  if (isDemoMode) {
    profiles = DEMO_PROFILES
    enrollments = DEMO_ENROLLMENTS
    progressRows = DEMO_PROGRESS
  } else {
    const supabase = await createClient()
    const enrolledInCourse = await supabase
      .from('enrollments')
      .select('user_id, course_id, enrolled_at')
      .eq('course_id', courseId)

    const enrolledUserIds = (enrolledInCourse.data ?? []).map((e) => e.user_id)

    const [p, pr] = await Promise.all([
      enrolledUserIds.length > 0
        ? supabase.from('profiles').select('id, full_name, department').in('id', enrolledUserIds)
        : Promise.resolve({ data: [] as typeof profiles }),
      supabase.from('user_progress').select('user_id, course_id, lesson_id, completed, completed_at').eq('course_id', courseId),
    ])

    profiles = p.data ?? []
    enrollments = enrolledInCourse.data ?? []
    progressRows = pr.data ?? []
  }

  const courseEnrollments = enrollments.filter((e) => e.course_id === courseId)
  const enrolledUserIds = new Set(courseEnrollments.map((e) => e.user_id))
  const enrolledProfiles = profiles.filter((p) => enrolledUserIds.has(p.id))

  const learnerStats = enrolledProfiles.map((user) => {
    const enrollment = courseEnrollments.find((e) => e.user_id === user.id)!
    const userProgress = progressRows.filter((pr) => pr.user_id === user.id && pr.course_id === courseId)
    const lessonStatus = course.lessons.map((lesson) => {
      const prog = userProgress.find((pr) => pr.lesson_id === lesson.id)
      return { ...lesson, completed: prog?.completed ?? false, completed_at: prog?.completed_at ?? null }
    })
    const completedCount = lessonStatus.filter((l) => l.completed).length
    const pct = course.lessons.length > 0 ? Math.round((completedCount / course.lessons.length) * 100) : 0
    const isFinished = completedCount >= course.lessons.length
    return { user, enrollment, lessonStatus, completedCount, pct, isFinished }
  })

  const avgPct = learnerStats.length > 0
    ? Math.round(learnerStats.reduce((s, l) => s + l.pct, 0) / learnerStats.length)
    : 0
  const finishedCount = learnerStats.filter((l) => l.isFinished).length

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/reports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Báo cáo tổng quan
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{course.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-500 mt-0.5">{course.lessons.length} bài học · {enrolledProfiles.length} học viên đăng ký</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Học viên đăng ký', value: enrolledProfiles.length },
          { label: 'Đã hoàn thành', value: finishedCount },
          { label: 'Tỷ lệ trung bình', value: `${avgPct}%` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Per-lesson completion rate */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Tỷ lệ hoàn thành theo bài học</h2>
        <div className="space-y-3">
          {course.lessons.map((lesson, idx) => {
            const completedThisLesson = progressRows.filter(
              (pr) => pr.lesson_id === lesson.id && pr.completed
            ).length
            const lessonPct = enrolledProfiles.length > 0
              ? Math.round((completedThisLesson / enrolledProfiles.length) * 100)
              : 0
            return (
              <div key={lesson.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-5 text-right shrink-0">{idx + 1}</span>
                <span className="text-sm text-gray-700 flex-1 truncate">{lesson.title}</span>
                <div className="w-32 bg-gray-100 rounded-full h-2 shrink-0">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${lessonPct}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right shrink-0">{lessonPct}%</span>
                <span className="text-xs text-gray-400 w-16 text-right shrink-0">{completedThisLesson}/{enrolledProfiles.length}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Per-learner table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Chi tiết từng học viên</h2>
        </div>
        {learnerStats.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Chưa có học viên nào đăng ký</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {learnerStats.map(({ user, enrollment, lessonStatus, completedCount, pct, isFinished }) => (
              <div key={user.id} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-700 font-semibold text-xs">
                        {user.full_name?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div>
                      <Link href={`/admin/users/${user.id}`} className="font-medium text-gray-800 hover:text-blue-600 text-sm">
                        {user.full_name ?? '—'}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {user.department ?? '—'} · Đăng ký {new Date(enrollment.enrolled_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-10 text-right">{pct}%</span>
                    {isFinished && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Hoàn thành
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-11 flex flex-wrap gap-2">
                  {lessonStatus.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      title={`${idx + 1}. ${lesson.title}${lesson.completed_at ? ' · ' + new Date(lesson.completed_at).toLocaleDateString('vi-VN') : ''}`}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${
                        lesson.completed
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      {lesson.completed
                        ? <CheckCircle2 className="w-3 h-3" />
                        : <Circle className="w-3 h-3" />
                      }
                      {idx + 1}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
