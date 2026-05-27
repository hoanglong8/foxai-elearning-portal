import { CourseForm } from '@/components/admin/CourseForm'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCoursePage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/courses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Danh sách khóa học
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tạo khóa học mới</h1>
      </div>
      <CourseForm />
    </div>
  )
}
