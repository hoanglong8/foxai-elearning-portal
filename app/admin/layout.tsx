import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, BookOpen, BarChart2, ChevronLeft } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

  let profile = { role: 'admin', full_name: 'Nguyễn Hoàng Long' }

  if (!isDemoMode) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: p } = await supabase
      .from('profiles').select('role, full_name').eq('id', user.id).single()
    if (p?.role !== 'admin') redirect('/dashboard')
    profile = p
  }

  return (
    <div className="flex h-full">
      <aside className="w-60 flex flex-col bg-gray-900 text-white h-full fixed left-0 top-0 z-30">
        <div className="px-5 py-5 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
              <span className="font-bold text-xs">F</span>
            </div>
            <span className="font-semibold text-sm">Admin Panel</span>
          </div>
          <p className="text-xs text-gray-400">{profile?.full_name}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link href="/admin/users" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <Users className="w-4 h-4" /> Người dùng
          </Link>
          <Link href="/admin/courses" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <BookOpen className="w-4 h-4" /> Khóa học
          </Link>
          <Link href="/admin/reports" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <BarChart2 className="w-4 h-4" /> Báo cáo
          </Link>
        </nav>

        <div className="px-3 pb-4 border-t border-gray-700 pt-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Về trang học
          </Link>
        </div>
      </aside>

      <main className="flex-1 ml-60 min-h-full bg-gray-50">{children}</main>
    </div>
  )
}
