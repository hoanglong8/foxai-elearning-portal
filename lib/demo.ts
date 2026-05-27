export const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export const DEMO_ENROLLMENTS = [
  { course_id: 'llm-telegram-enterprise', enrolled_at: new Date().toISOString(), completed_at: null },
  { course_id: 'foxai-onboarding', enrolled_at: new Date().toISOString(), completed_at: null },
]

export const DEMO_PROGRESS = [
  { lesson_id: 'llm-tele-01', course_id: 'llm-telegram-enterprise', completed: true },
  { lesson_id: 'llm-tele-02', course_id: 'llm-telegram-enterprise', completed: true },
  { lesson_id: 'onboard-01', course_id: 'foxai-onboarding', completed: true },
]
