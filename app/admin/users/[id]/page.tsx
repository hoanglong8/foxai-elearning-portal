import { createClient } from '@/lib/supabase/server'
import { COURSES } from '@/lib/courses-data'
import { Badge } from '@/components/ui/badge'
import { UserEditDialog } from '@/components/admin/UserEditDialog'
import { ChevronLeft, CheckCircle2, Circle, Clock } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

const DEMO_USERS: Record<string, { id: string; full_name: string; department: string; role: string; created_at: string }> = {
  '1': { id: '1', full_name: 'Nguyễn Hoàng Long', department: 'Delivery', role: 'admin', created_at: '2024-01-01' },
  '2': { id: '2', full_name: 'Nguyễn Quốc Anh', department: 'Delivery', role: 'learner', created_at: '2024-01-02' },
  '3': { id: '3', full_name: 'Trần Thị Bích Hoài', department: 'Delivery', role: 'learner', created_at: '2024-01-03' },
  '4': { id: '4', full_name: 'Vi Anh Tuấn', department: 'R&D', role: 'learner', created_at: '2024-01-04' },
  '5': { id: '5', full_name: 'Trần Quốc Vương', department: 'Sales', role: 'learner', created_at: '2024-01-05' },
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let profile: { id: string; full_name: string | null; department: string | null; role: string; created_at: string } | null = null
  let enrollments: { course_id: string; enrolled_at: string }[] = []
  let progressRows: { lesson_id: string; course_id: string; completed: boolean; completed_at: string | null }[] = []

  if (isDemoMode) {
    profile = DEMO_USERS[id] ?? null
    if (profile) {
      enrollments = [
        { course_id: 'llm-telegram-enterprise', enrolled_at: '2024-01-10' },
        { course_id: 'foxai-onboarding', enrolled_at: '2024-01-11' },
      ]
      progressRows = [
        { lesson_id: 'llm-tele-01', course_id: 'llm-telegram-enterprise', completed: true, completed_at: '2024-01-12' },
        { lesson_id: 'llm-tele-02', course_id: 'llm-telegram-enterprise', completed: true, completed_at: '2024-01-13' },
        { lesson_id: 'llm-tele-03', course_id: 'llm-telegram-enterprise', completed: false, completed_at: null },
        { lesson_id: 'onboard-01', course_id: 'foxai-onboarding', completed: true, completed_at: '2024-01-14' },
        { lesson_id: 'onboard-02', course_id: 'foxai-onboarding', completed: false, completed_at: null },
        { lesson_id: 'onboard-03', course_id: 'foxai-onboarding', completed: false, completed_at: null },
      ]
    }
  } else {
    const supabase = await createClient()
    const [p, e, pr] = await Promise.all([
      supabase.from('profiles').select('id, full_name, department, role, created_at').eq('id', id).single(),
      supabase.from('enrollments').select('course_id, enrolled_at').eq('user_id', id),
      supabase.from('user_progress').select('lesson_id, course_id, completed, completed_at').eq('user_id', id),
    ])
    profile = p.data
    enrollments = e.data ?? []
    progressRows = pr.data ?? []
  }

  if (!profile) notFound()

  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id))
  const enrolledCourses = COURSES.filter((c) => enrolledCourseIds.has(c.id))

  const courseStats = enrolledCourses.map((course) => {
    const enrollment = enrollments.find((e) => e.course_id === course.id)!
    const lessonProgress = course.lessons.map((lesson) => {
      const prog = progressRows.find((pr) => pr.lesson_id === lesson.id)
      return { ...lesson, completed: prog?.completed ?? false, completed_at: prog?.completed_at ?? null }
    })
    const completedCount = lessonProgress.filter((l) => l.completed).length
    const pct = course.lessons.length > 0 ? Math.round((completedCount / course.lessons.length) * 100) : 0
    return { course, enrollment, lessonProgress, completedCount, pct }
  })

  const totalCompleted = progressRows.filter((pr) => pr.completed).length
  const totalLessons = COURSES.reduce((s, c) => s + c.lessons.length, 0)
  const overallPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Danh sách người dùng
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-700 font-bold text-xl">
                {profile.full_name?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.full_name ?? '—'}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-sm">{profile.department ?? 'Chưa có phòng ban'}</span>
                <span className="text-gray-300">·</span>
                <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                  {profile.role === 'admin' ? 'Admin' : 'Học viên'}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Tham gia {new Date(profile.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
          <UserEditDialog user={profile} />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Khóa học đã đăng ký', value: enrollments.length },
          { label: 'Bài học hoàn thành', value: totalCompleted },
          { label: 'Tỷ lệ hoàn thành', value: `${overallPct}%` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Per-course progress */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900">Tiến độ theo khóa học</h2>

        {courseStats.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
            Người dùng chưa đăng ký khóa học nào.
          </div>
        )}

        {courseStats.map(({ course, enrollment, lessonProgress, completedCount, pct }) => (
          <div key={course.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{course.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">{course.title}</h3>
                    <p className="text-xs text-gray-400">
                      Đăng ký {new Date(enrollment.enrolled_at).toLocaleDateString('vi-VN')}
                      {' · '}{completedCount}/{course.lessons.length} bài
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{pct}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {lessonProgress.map((lesson, idx) => (
                <div key={lesson.id} className="flex items-center gap-3 px-5 py-3">
                  {lesson.completed
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                  }
                  <span className={`text-sm flex-1 ${lesson.completed ? 'text-gray-700' : 'text-gray-400'}`}>
                    {idx + 1}. {lesson.title}
                  </span>
                  {lesson.completed && lesson.completed_at && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(lesson.completed_at).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
