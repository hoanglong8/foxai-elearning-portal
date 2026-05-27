export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { COURSES } from '@/lib/courses-data'
import { Badge } from '@/components/ui/badge'
import { UserEditDialog } from '@/components/admin/UserEditDialog'
import { UserDeleteButton } from '@/components/admin/UserDeleteButton'
import { UserInviteDialog } from '@/components/admin/UserInviteDialog'
import { getDemoUsers } from '@/lib/demo-db'
import Link from 'next/link'

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

export default async function AdminUsersPage() {
  let profiles: { id: string; full_name: string | null; department: string | null; role: string; created_at: string }[] = []
  let enrollments: { user_id: string; course_id: string }[] = []
  let progressRows: { user_id: string; completed: boolean; completed_at: string | null }[] = []

  if (isDemoMode) {
    profiles = getDemoUsers()
  } else {
    const supabase = await createClient()
    const [p, e, pr] = await Promise.all([
      supabase.from('profiles').select('id, full_name, department, role, created_at').order('created_at'),
      supabase.from('enrollments').select('user_id, course_id'),
      supabase.from('user_progress').select('user_id, completed, completed_at'),
    ])
    profiles = p.data ?? []
    enrollments = e.data ?? []
    progressRows = pr.data ?? []
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const totalLessons = COURSES.reduce((s, c) => s + c.lessons.length, 0)

  const usersWithStats = profiles.map((p) => {
    const userEnrollments = enrollments.filter((e) => e.user_id === p.id).length
    const userCompleted = progressRows.filter((pr) => pr.user_id === p.id && pr.completed).length
    const lastActive = progressRows
      .filter((pr) => pr.user_id === p.id && pr.completed_at)
      .map((pr) => pr.completed_at!)
      .sort()
      .pop()
    const completionPct = totalLessons > 0 ? Math.round((userCompleted / totalLessons) * 100) : 0
    const isActive = lastActive && lastActive > oneWeekAgo

    return { ...p, enrollments: userEnrollments, completed: userCompleted, completionPct, lastActive, isActive }
  })

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Người dùng</h1>
          <p className="text-gray-500 mt-1">Tiến độ học tập của {profiles.length} thành viên</p>
        </div>
        <UserInviteDialog />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tên</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Phòng ban</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Vai trò</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Đăng ký</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Hoàn thành</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {usersWithStats.map((user) => (
                <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-blue-700 font-semibold text-xs">
                          {user.full_name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium text-gray-800 hover:text-blue-600 transition-colors"
                      >
                        {user.full_name ?? '—'}
                      </Link>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{user.department ?? '—'}</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {user.role === 'admin' ? 'Admin' : 'Học viên'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">{user.enrollments}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${user.completionPct}%` }}
                        />
                      </div>
                      <span className="text-gray-700 font-medium w-8 text-right">{user.completionPct}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {user.isActive ? 'Hoạt động' : 'Chưa học'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="h-7 px-2 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded flex items-center transition-colors"
                      >
                        Chi tiết
                      </Link>
                      <UserEditDialog user={user} />
                      <UserDeleteButton userId={user.id} userName={user.full_name ?? 'người dùng này'} />
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
