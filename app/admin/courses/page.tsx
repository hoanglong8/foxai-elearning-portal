export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getDemoCourses } from '@/lib/demo-db'
import { COURSES } from '@/lib/courses-data'
import { CATEGORY_LABELS, CATEGORY_COLORS, LEVEL_LABELS } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, Plus, Lock } from 'lucide-react'
import { CourseActionButtons } from '@/components/admin/CourseActionButtons'
import Link from 'next/link'

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

export default async function AdminCoursesPage() {
  let dbCourses: {
    id: string; slug: string; title: string; description: string;
    category: string; level: string; emoji: string; is_published: boolean; created_at: string
  }[] = []

  if (isDemoMode) {
    dbCourses = getDemoCourses()
  } else {
    const supabase = await createClient()
    const { data } = await supabase
      .from('db_courses')
      .select('id, slug, title, description, category, level, emoji, is_published, created_at')
      .order('created_at', { ascending: false })
    dbCourses = data ?? []
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Khóa học</h1>
          <p className="text-gray-500 mt-1">
            {COURSES.length} khóa học tích hợp · {dbCourses.length} khóa do admin tạo
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Tạo khóa học
          </Button>
        </Link>
      </div>

      {/* Admin-created courses */}
      {dbCourses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Khóa học do admin tạo
          </h2>
          <div className="space-y-3">
            {dbCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <span className="text-3xl shrink-0">{course.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      <Badge
                        className={CATEGORY_COLORS[course.category as keyof typeof CATEGORY_COLORS] ?? ''}
                        variant="secondary"
                      >
                        {CATEGORY_LABELS[course.category as keyof typeof CATEGORY_LABELS] ?? course.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {LEVEL_LABELS[course.level as keyof typeof LEVEL_LABELS] ?? course.level}
                      </Badge>
                      <Badge
                        variant={course.is_published ? 'default' : 'outline'}
                        className={`text-xs ${course.is_published ? 'bg-green-600' : 'text-gray-400'}`}
                      >
                        {course.is_published ? 'Đã xuất bản' : 'Nháp'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{course.description || 'Chưa có mô tả'}</p>
                  </div>
                  <CourseActionButtons courseId={course.id} isPublished={course.is_published} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Built-in static courses */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Khóa học tích hợp sẵn (chỉ đọc)
        </h2>
        <div className="space-y-4">
          {COURSES.map((course) => {
            const totalMins = course.lessons.reduce((s, l) => s + l.duration_minutes, 0)
            return (
              <div key={course.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 opacity-80">
                <div className="flex items-start gap-4">
                  <span className="text-3xl shrink-0">{course.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      <Badge className={CATEGORY_COLORS[course.category]} variant="secondary">
                        {CATEGORY_LABELS[course.category]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{LEVEL_LABELS[course.level]}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{course.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> {course.lessons.length} bài học
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {totalMins} phút
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
