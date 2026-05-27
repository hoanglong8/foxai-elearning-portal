import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { redirect } from 'next/navigation'

const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export default async function LearnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (isDemoMode) {
    return (
      <div className="flex h-full">
        <Sidebar userRole="admin" userName="Nguyễn Hoàng Long" />
        <main className="flex-1 ml-64 min-h-full">{children}</main>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-full">
      <Sidebar
        userRole={profile?.role}
        userName={profile?.full_name ?? user.email?.split('@')[0]}
        userAvatar={profile?.avatar_url ?? undefined}
      />
      <main className="flex-1 ml-64 min-h-full">
        {children}
      </main>
    </div>
  )
}
