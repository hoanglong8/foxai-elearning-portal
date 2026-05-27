'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { inviteUser } from '@/app/admin/actions'
import { UserPlus, CheckCircle2 } from 'lucide-react'

const DEPARTMENTS = ['Sales', 'Delivery', 'R&D', 'Marketing', 'Back-office']

export function UserInviteDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [dept, setDept] = useState('Delivery')
  const [role, setRole] = useState('learner')

  function reset() {
    setFullName(''); setEmail(''); setDept('Delivery'); setRole('learner')
    setError(null); setSuccess(false)
  }

  function handleOpen(v: boolean) {
    if (!v) reset()
    setOpen(v)
  }

  function handleSubmit() {
    if (!fullName.trim()) { setError('Vui lòng nhập họ tên'); return }
    setError(null)
    const fd = new FormData()
    fd.set('full_name', fullName)
    fd.set('email', email)
    fd.set('department', dept)
    fd.set('role', role)

    startTransition(async () => {
      const res = await inviteUser(fd)
      if (res.error) { setError(res.error); return }
      setSuccess(true)
    })
  }

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <UserPlus className="w-4 h-4" /> Thêm người dùng
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm người dùng</DialogTitle>
          </DialogHeader>

          {success ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-medium text-gray-800">Đã thêm người dùng!</p>
              <p className="text-sm text-gray-500">
                {email
                  ? 'Email mời đã được gửi. Người dùng sẽ nhận được link đăng ký.'
                  : 'Người dùng đã được thêm vào hệ thống demo.'}
              </p>
              <Button className="w-full" onClick={() => handleOpen(false)}>Đóng</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">Họ tên *</Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nguyen.van.a@foxai.vn"
                  />
                  <p className="text-xs text-gray-400">
                    Email dùng để gửi lời mời khi kết nối Supabase thật
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Phòng ban</Label>
                    <Select value={dept} onValueChange={(v) => v && setDept(v)}>
                      <SelectTrigger>
                        <SelectValue>{dept}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Vai trò</Label>
                    <Select value={role} onValueChange={(v) => v && setRole(v)}>
                      <SelectTrigger>
                        <SelectValue>{role === 'admin' ? 'Admin' : 'Học viên'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="learner">Học viên</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => handleOpen(false)}>Hủy</Button>
                <Button onClick={handleSubmit} disabled={isPending}>
                  {isPending ? 'Đang xử lý...' : 'Thêm người dùng'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
