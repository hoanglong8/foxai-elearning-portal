import { createClient } from '@/lib/supabase/server'
import { COURSES } from '@/lib/courses-data'
import { CATEGORY_LABELS } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, CheckCircle2, TrendingUp } from 'lucide-react'
import { DepartmentChart } from '@/components/admin/DepartmentChart'
import Link from 'next/link'

const DEPARTMENTS = ['Sales', 'Delivery', 'R&D', 'Marketing', 'Back-office']

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

const DEMO_PROFILES = [
  { id: '1', full_name: 'Nguyễn Hoàng Long', department: 'Delivery', role: 'admin' },
  { id: '2', full_name: 'Nguyễn Quốc Anh', department: 'Delivery', role: 'learner' },
  { id: '3', full_name: 'Trần Thị Bích Hoài', department: 'Delivery', role: 'learner' },
  { id: '4', full_name: 'Vi Anh Tuấn', department: 'R&D', role: 'learner' },
  { id: '5', full_name: 'Trần Quốc Vương', department: 'Sales', role: 'learner' },
]
const DEMO_ENROLLMENTS = [
  { user_id: '1', course_id: 'llm-telegram-enterprise' },
  { user_id: '2', course_id: 'llm-telegram-enterprise' },
  { user_id: '2', course_id: 'foxai-onboarding' },
  { user_id: '3', course_id: 'foxai-onboarding' },
  { user_id: '4', course_id: 'ba-framework-mastery' },
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

export default async function AdminReportsPage() {
  let profiles: { id: string; full_name: string | null; department: string | null; role: string }[] = []
  let enrollments: { user_id: string; course_id: string }[] = []
  let progressRows: { user_id: string; course_id: string; lesson_id: string; completed: boolean; completed_at: string | null }[] = []

  if (isDemoMode) {
    profiles = DEMO_PROFILES
    enrollments = DEMO_ENROLLMENTS
    progressRows = DEMO_PROGRESS
  } else {
    const supabase = await createClient()
    const [p, e, pr] = await Promise.all([
      supabase.from('profiles').select('id, full_name, department, role'),
      supabase.from('enrollments').select('user_id, course_id'),
      supabase.from('user_progress').select('user_id, course_id, lesson_id, completed, completed_at'),
    ])
    profiles = p.data ?? []
    enrollments = e.data ?? []
    progressRows = pr.data ?? []
  }

  // Per-course stats
  const courseStats = COURSES.map((course) => {
    const enrolled = enrollments.filter((e) => e.course_id === course.id).length
    const completedLessons = progressRows.filter((pr) => pr.course_id === course.id && pr.completed).length
    const totalPossible = enrolled * course.lessons.length
    const completionPct = totalPossible > 0 ? Math.round((completedLessons / totalPossible) * 100) : 0
    const enrolledUsers = new Set(enrollments.filter((e) => e.course_id === course.id).map((e) => e.user_id))
    const completedUsers = [...enrolledUsers].filter((uid) => {
      const userProgress = progressRows.filter((pr) => pr.user_id === uid && pr.course_id === course.id && pr.completed)
      return userProgress.length >= course.lessons.length
    }).length
    return { course, enrolled, completedLessons, completionPct, completedUsers }
  })

  // Per-department stats
  const deptStats = DEPARTMENTS.map((dept) => {
    const deptUsers = profiles.filter((p) => p.department === dept)
    const deptUserIds = new Set(deptUsers.map((p) => p.id))
    const deptEnrollments = enrollments.filter((e) => deptUserIds.has(e.user_id)).length
    const deptCompleted = progressRows.filter((pr) => deptUserIds.has(pr.user_id) && pr.completed).length
    const totalLessons = COURSES.reduce((s, c) => s + c.lessons.length, 0)
    const totalPossible = deptUsers.length * totalLessons
    const pct = totalPossible > 0 ? Math.round((deptCompleted / totalPossible) * 100) : 0
    return { dept, users: deptUsers.length, enrollments: deptEnrollments, completedLessons: deptCompleted, pct }
  }).filter((d) => d.users > 0)

  const totalCompleted = progressRows.filter((pr) => pr.completed).length
  const totalLessons = COURSES.reduce((s, c) => s + c.lessons.length, 0)
  const totalPossible = profiles.length * totalLessons
  const avgPct = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo học tập</h1>
        <p className="text-gray-500 mt-1">Phân tích tiến độ học tập toàn công ty</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tổng người dùng', value: profiles.length, icon: Users, color: 'blue' },
          { label: 'Tổng đăng ký', value: enrollments.length, icon: BookOpen, color: 'purple' },
          { label: 'Bài học hoàn thành', value: totalCompleted, icon: CheckCircle2, color: 'green' },
          { label: 'Tỷ lệ hoàn thành TB', value: `${avgPct}%`, icon: TrendingUp, color: 'orange' },
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

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Per-course table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Theo khóa học</h2>
          <div className="space-y-3">
            {courseStats.map(({ course, enrolled, completionPct, completedUsers }) => (
              <Link key={course.id} href={`/admin/reports/${course.id}`} className="block hover:bg-gray-50 rounded-lg -mx-2 px-2 py-2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{course.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{course.title}</p>
                    <p className="text-xs text-gray-400">
                      {enrolled} học viên · {completedUsers} hoàn thành
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{completionPct}%</p>
                  </div>
                </div>
                <div className="mt-1.5 ml-8 w-full bg-gray-100 rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${completionPct}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Per-department */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Theo phòng ban</h2>
          <DepartmentChart data={deptStats} />
          <div className="mt-4 space-y-2">
            {deptStats.map(({ dept, users, pct }) => (
              <div key={dept} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-28 shrink-0">{dept}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right">{pct}%</span>
                <span className="text-xs text-gray-400 w-16 text-right">{users} người</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Learner detail table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Chi tiết theo người học</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Tên</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Phòng ban</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Đăng ký</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Bài hoàn thành</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((user) => {
                const userEnrollments = enrollments.filter((e) => e.user_id === user.id).length
                const userCompleted = progressRows.filter((pr) => pr.user_id === user.id && pr.completed).length
                const pct = totalLessons > 0 ? Math.round((userCompleted / totalLessons) * 100) : 0
                return (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3">
                      <Link href={`/admin/users/${user.id}`} className="font-medium text-gray-800 hover:text-blue-600">
                        {user.full_name ?? '—'}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">{user.department ?? '—'}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{userEnrollments}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{userCompleted}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-gray-700 font-medium w-7 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
