import { createClient } from '@/lib/supabase/server'
import { COURSES } from '@/lib/courses-data'
import { CATEGORY_LABELS } from '@/types'
import { CourseCompletionChart } from '@/components/admin/CourseCompletionChart'
import { Users, BookOpen, CheckCircle2, TrendingUp } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

  let profiles: { id: string }[] | null = null
  let totalUsers = 0
  let enrollments: { user_id: string; course_id: string; enrolled_at: string }[] | null = null
  let progressRows: { user_id: string; course_id: string; lesson_id: string; completed: boolean; completed_at: string | null }[] | null = null

  if (!isDemoMode) {
    const [p, e, pr] = await Promise.all([
      supabase.from('profiles').select('id, full_name, department, role, created_at', { count: 'exact' }),
      supabase.from('enrollments').select('user_id, course_id, enrolled_at'),
      supabase.from('user_progress').select('user_id, course_id, lesson_id, completed, completed_at'),
    ])
    profiles = p.data
    totalUsers = p.count ?? 0
    enrollments = e.data
    progressRows = pr.data
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const activeUserIds = new Set(
    (progressRows ?? [])
      .filter((p) => p.completed && p.completed_at && p.completed_at > oneWeekAgo)
      .map((p) => p.user_id)
  )

  const completedLessons = (progressRows ?? []).filter((p) => p.completed).length

  const totalLessons = COURSES.reduce((s, c) => s + c.lessons.length, 0)
  const totalPossible = (totalUsers ?? 0) * totalLessons
  const avgCompletionRate = totalPossible > 0
    ? Math.round((completedLessons / totalPossible) * 100)
    : 0

  // Per-course stats
  const courseStats = COURSES.map((course) => {
    const courseEnrollments = (enrollments ?? []).filter((e) => e.course_id === course.id)
    const courseProgress = (progressRows ?? []).filter((p) => p.course_id === course.id && p.completed)
    const enrolled = courseEnrollments.length
    const totalCourseLessons = course.lessons.length
    const completed = enrolled > 0 && totalCourseLessons > 0
      ? Math.round((courseProgress.length / (enrolled * totalCourseLessons)) * 100)
      : 0
    return {
      name: course.emoji + ' ' + course.title.substring(0, 28) + (course.title.length > 28 ? '…' : ''),
      enrolled,
      completion: completed,
      category: CATEGORY_LABELS[course.category],
    }
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Thống kê học tập nội bộ FOXAI</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Tổng người dùng',
            value: totalUsers ?? 0,
            icon: Users,
            color: 'blue',
          },
          {
            label: 'Hoạt động tuần này',
            value: activeUserIds.size,
            icon: TrendingUp,
            color: 'green',
          },
          {
            label: 'Bài học hoàn thành',
            value: completedLessons,
            icon: CheckCircle2,
            color: 'purple',
          },
          {
            label: 'Tỷ lệ hoàn thành TB',
            value: `${avgCompletionRate}%`,
            icon: BookOpen,
            color: 'orange',
          },
        ].map((stat) => {
          const Icon = stat.icon
          const colorMap: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            purple: 'bg-purple-50 text-purple-600',
            orange: 'bg-orange-50 text-orange-500',
          }
          return (
            <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[stat.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Course completion chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Tỷ lệ hoàn thành theo khóa học</h2>
        <CourseCompletionChart data={courseStats} />
      </div>

      {/* Recent enrollments */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Thống kê đăng ký khóa học</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Khóa học</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Danh mục</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Đã đăng ký</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">% Hoàn thành</th>
              </tr>
            </thead>
            <tbody>
              {courseStats.map((stat, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-gray-800">{stat.name}</td>
                  <td className="py-3 px-3 text-gray-500">{stat.category}</td>
                  <td className="py-3 px-3 text-right text-gray-700">{stat.enrolled}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${stat.completion}%` }}
                        />
                      </div>
                      <span className="text-gray-700 font-medium w-8 text-right">{stat.completion}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
