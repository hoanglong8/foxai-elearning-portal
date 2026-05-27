import { createClient } from '@/lib/supabase/server'
import { COURSES } from '@/lib/courses-data'
import { isDemoMode, DEMO_ENROLLMENTS, DEMO_PROGRESS } from '@/lib/demo'
import { CATEGORY_LABELS, CATEGORY_COLORS, LEVEL_LABELS, type CourseCategory } from '@/types'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Clock, BookOpen, ChevronRight } from 'lucide-react'

type DbCourse = {
  id: string
  slug: string
  title: string
  description: string
  category: string
  level: string
  emoji: string
  lesson_count?: number
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const activeCategory = params.category as CourseCategory | undefined

  let enrollments = DEMO_ENROLLMENTS
  let progressRows = DEMO_PROGRESS
  let dbCourses: DbCourse[] = []

  if (!isDemoMode) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [e, pr, dbc] = await Promise.all([
      supabase.from('enrollments').select('course_id, enrolled_at, completed_at').eq('user_id', user.id),
      supabase.from('user_progress').select('lesson_id, course_id, completed').eq('user_id', user.id),
      supabase.from('db_courses').select('id, slug, title, description, category, level, emoji').eq('is_published', true).order('created_at', { ascending: false }),
    ])
    enrollments = e.data ?? []
    progressRows = pr.data ?? []
    dbCourses = dbc.data ?? []
  }

  const enrolledIds = new Set(enrollments.map((e) => e.course_id))
  const completedIds = new Set(progressRows.filter((p) => p.completed).map((p) => p.lesson_id))

  const filteredStatic = activeCategory
    ? COURSES.filter((c) => c.category === activeCategory)
    : COURSES

  const filteredDb = activeCategory
    ? dbCourses.filter((c) => c.category === activeCategory)
    : dbCourses

  const categories = Object.entries(CATEGORY_LABELS) as [CourseCategory, string][]
  const totalCount = COURSES.length + dbCourses.length

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Khóa học</h1>
        <p className="text-gray-500 mt-1">Tất cả {totalCount} khóa học từ tài liệu nội bộ FOXAI</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Link
          href="/courses"
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            !activeCategory
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          Tất cả
        </Link>
        {categories.map(([key, label]) => (
          <Link
            key={key}
            href={`/courses?category=${key}`}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* DB courses (admin-created) */}
        {filteredDb.map((course) => {
          const isEnrolled = enrolledIds.has(course.id)
          const cat = course.category as CourseCategory
          return (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group flex flex-col"
            >
              <div className="p-5 pb-4 flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-3xl">{course.emoji}</span>
                  <Badge className={CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600'} variant="secondary">
                    {CATEGORY_LABELS[cat] ?? course.category}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors mb-2">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
              </div>
              <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <Badge variant="outline" className="text-xs capitalize">
                    {LEVEL_LABELS[course.level as keyof typeof LEVEL_LABELS] ?? course.level}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {isEnrolled && (
                    <span className="text-xs text-blue-600 font-medium">Đã đăng ký</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </Link>
          )
        })}

        {/* Static courses */}
        {filteredStatic.map((course) => {
          const isEnrolled = enrolledIds.has(course.id)
          const completed = course.lessons.filter((l) => completedIds.has(l.id)).length
          const totalMins = course.lessons.reduce((s, l) => s + l.duration_minutes, 0)
          const pct = course.lessons.length > 0
            ? Math.round((completed / course.lessons.length) * 100)
            : 0

          return (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group flex flex-col"
            >
              <div className="p-5 pb-4 flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-3xl">{course.emoji}</span>
                  <Badge className={CATEGORY_COLORS[course.category]} variant="secondary">
                    {CATEGORY_LABELS[course.category]}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors mb-2">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
              </div>
              <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {course.lessons.length} bài
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {totalMins} phút
                  </span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {LEVEL_LABELS[course.level]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {isEnrolled && (
                    <span className="text-xs text-blue-600 font-medium">
                      {pct === 100 ? '✅ Hoàn thành' : `${pct}%`}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
