'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateUser } from '@/app/admin/actions'
import { Pencil } from 'lucide-react'

const DEPARTMENTS = ['Sales', 'Delivery', 'R&D', 'Marketing', 'Back-office']

interface User {
  id: string
  full_name: string | null
  department: string | null
  role: string
}

export function UserEditDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(user.full_name ?? '')
  const [dept, setDept] = useState(user.department ?? '')
  const [role, setRole] = useState(user.role)

  function handleSubmit() {
    setError(null)
    const fd = new FormData()
    fd.set('id', user.id)
    fd.set('full_name', name)
    fd.set('department', dept)
    fd.set('role', role)

    startTransition(async () => {
      const res = await updateUser(fd)
      if (res.error) { setError(res.error); return }
      setOpen(false)
    })
  }

  return (
    <>
      <Button size="sm" variant="ghost" className="h-7 px-2 text-gray-500" onClick={() => setOpen(true)}>
        <Pencil className="w-3.5 h-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Họ tên</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>

            <div className="space-y-1.5">
              <Label>Phòng ban</Label>
              <Select value={dept} onValueChange={(v) => v && setDept(v)}>
                <SelectTrigger>
                  <SelectValue>{dept || 'Chọn phòng ban'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
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

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
