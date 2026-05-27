import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { StaticCourse } from '@/types'
import { CheckCircle2, Circle, ChevronLeft } from 'lucide-react'

interface Props {
  course: StaticCourse
  currentLessonId: string
  completedIds: Set<string>
}

export function LessonSidebar({ course, currentLessonId, completedIds }: Props) {
  const completedCount = course.lessons.filter((l) => completedIds.has(l.id)).length
  const pct = course.lessons.length > 0
    ? Math.round((completedCount / course.lessons.length) * 100)
    : 0

  return (
    <aside className="w-72 flex flex-col bg-white border-r border-gray-200 h-full overflow-y-auto shrink-0">
      {/* Back + course info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <Link
          href={`/courses/${course.slug}`}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Về tổng quan
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{course.emoji}</span>
          <h2 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{course.title}</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0">{pct}%</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">{completedCount}/{course.lessons.length} bài hoàn thành</p>
      </div>

      {/* Lesson list */}
      <nav className="flex-1 px-3 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Nội dung</p>
        <div className="space-y-0.5">
          {course.lessons.map((lesson, idx) => {
            const isActive = lesson.id === currentLessonId
            const isDone = completedIds.has(lesson.id)
            return (
              <Link
                key={lesson.id}
                href={`/courses/${course.slug}/lessons/${lesson.id}`}
                className={cn(
                  'flex items-start gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className={cn('w-4 h-4', isActive ? 'text-blue-400' : 'text-gray-300')} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn('leading-snug', isActive && 'font-medium')}>
                    {idx + 1}. {lesson.title}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
