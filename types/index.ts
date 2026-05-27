export type UserRole = 'learner' | 'admin'
export type Department = 'Sales' | 'Delivery' | 'R&D' | 'Marketing' | 'Back-office'
export type CourseCategory = 'internal-processes' | 'technical-skills' | 'sales-softskills' | 'ai-technology'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  department: Department | null
  role: UserRole
  created_at: string
}

export interface StaticLesson {
  id: string
  title: string
  duration_minutes: number
  content: string
}

export interface StaticCourse {
  id: string
  slug: string
  title: string
  description: string
  category: CourseCategory
  level: CourseLevel
  emoji: string
  lessons: StaticLesson[]
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at: string | null
  time_spent_seconds: number
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  completed_at: string | null
}

export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  'internal-processes': 'Quy trình nội bộ',
  'technical-skills': 'Kỹ năng kỹ thuật',
  'sales-softskills': 'Sales & Soft skills',
  'ai-technology': 'AI & Công nghệ',
}

export const CATEGORY_COLORS: Record<CourseCategory, string> = {
  'internal-processes': 'bg-blue-100 text-blue-800',
  'technical-skills': 'bg-purple-100 text-purple-800',
  'sales-softskills': 'bg-green-100 text-green-800',
  'ai-technology': 'bg-orange-100 text-orange-800',
}

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
}
