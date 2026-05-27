'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { BookOpen, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react'

interface SidebarProps {
  userRole?: string
  userName?: string
  userAvatar?: string
}

const navItems = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/courses', label: 'Khóa học', icon: BookOpen },
]

export function Sidebar({ userRole, userName, userAvatar }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 flex flex-col bg-white border-r border-gray-200 h-full fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight">FOXAI Learning</p>
          <p className="text-xs text-gray-400 truncate">Nền tảng đào tạo nội bộ</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        {userRole === 'admin' && (
          <Link
            href="/admin/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-purple-50 text-purple-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Admin Dashboard
          </Link>
        )}
      </nav>

      {/* User info */}
      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-3 mb-2">
          {userAvatar ? (
            <img src={userAvatar} alt="" className="w-8 h-8 rounded-full shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-blue-700 font-semibold text-xs">
                {userName?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{userName ?? 'Người dùng'}</p>
            <p className="text-xs text-gray-400">{userRole === 'admin' ? 'Admin' : 'Học viên'}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
