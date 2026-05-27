'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteCourse, togglePublish } from '@/app/admin/actions'
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export function CourseActionButtons({ courseId, isPublished }: { courseId: string; isPublished: boolean }) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteCourse(courseId)
      setDeleteOpen(false)
    })
  }

  function handleToggle() {
    startTransition(async () => {
      await togglePublish(courseId, isPublished)
    })
  }

  return (
    <>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
          onClick={handleToggle}
          disabled={isPending}
          title={isPublished ? 'Ẩn khóa học' : 'Xuất bản'}
        >
          {isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
        <Link href={`/admin/courses/${courseId}`}>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50">
            <Pencil className="w-4 h-4" />
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50"
          onClick={() => setDeleteOpen(true)}
          disabled={isPending}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khóa học?</AlertDialogTitle>
            <AlertDialogDescription>
              Tất cả bài học trong khóa học này cũng sẽ bị xóa. Hành động không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
