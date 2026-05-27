'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  addDemoCourse, updateDemoCourse, deleteDemoCourse,
  addDemoUser, updateDemoUser, deleteDemoUser,
} from '@/lib/demo-db'

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

// ─── USER ACTIONS ──────────────────────────────────────────

export async function updateUser(formData: FormData) {
  const id = formData.get('id') as string
  const full_name = formData.get('full_name') as string
  const department = formData.get('department') as string
  const role = formData.get('role') as string

  if (isDemoMode) {
    updateDemoUser(id, { full_name, department, role })
    revalidatePath('/admin/users')
    return { success: true }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ full_name, department, role }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteUser(id: string) {
  if (isDemoMode) {
    deleteDemoUser(id)
    revalidatePath('/admin/users')
    return { success: true }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function inviteUser(formData: FormData) {
  const full_name = formData.get('full_name') as string
  const department = formData.get('department') as string
  const role = formData.get('role') as string
  const email = formData.get('email') as string

  if (isDemoMode) {
    addDemoUser({ full_name, department, role })
    revalidatePath('/admin/users')
    return { success: true }
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return { error: 'Cần cấu hình SUPABASE_SERVICE_ROLE_KEY để tạo người dùng mới' }

  const { createClient: createSupabase } = await import('@supabase/supabase-js')
  const adminClient = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name, department, role },
  })
  if (error) return { error: error.message }
  if (data.user) {
    await adminClient.from('profiles').upsert({ id: data.user.id, full_name, department, role })
  }
  revalidatePath('/admin/users')
  return { success: true }
}

// ─── COURSE ACTIONS ────────────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function createCourse(formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const level = formData.get('level') as string
  const emoji = (formData.get('emoji') as string) || '📚'
  const is_published = formData.get('is_published') === 'true'
  const slug = slugify(title) + '-' + Date.now()

  if (isDemoMode) {
    const course = addDemoCourse({ slug, title, description, category, level, emoji, is_published })
    revalidatePath('/admin/courses')
    return { success: true, id: course.id }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('db_courses')
    .insert({ slug, title, description, category, level, emoji, is_published, created_by: user?.id })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
  return { success: true, id: data.id }
}

export async function updateCourse(formData: FormData) {
  const id = formData.get('id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const level = formData.get('level') as string
  const emoji = (formData.get('emoji') as string) || '📚'
  const is_published = formData.get('is_published') === 'true'

  if (isDemoMode) {
    updateDemoCourse(id, { title, description, category, level, emoji, is_published })
    revalidatePath('/admin/courses')
    revalidatePath(`/admin/courses/${id}`)
    return { success: true }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('db_courses').update({ title, description, category, level, emoji, is_published }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
  revalidatePath(`/admin/courses/${id}`)
  return { success: true }
}

export async function deleteCourse(id: string) {
  if (isDemoMode) {
    deleteDemoCourse(id)
    revalidatePath('/admin/courses')
    return { success: true }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('db_courses').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
  return { success: true }
}

export async function togglePublish(id: string, current: boolean) {
  if (isDemoMode) {
    updateDemoCourse(id, { is_published: !current })
    revalidatePath('/admin/courses')
    return { success: true }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('db_courses').update({ is_published: !current }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
  revalidatePath(`/admin/courses/${id}`)
  return { success: true }
}

// ─── LESSON ACTIONS ────────────────────────────────────────

export async function createLesson(formData: FormData) {
  const course_id = formData.get('course_id') as string
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const duration_minutes = parseInt(formData.get('duration_minutes') as string) || 10
  const order_index = parseInt(formData.get('order_index') as string) || 0
  const video_url = (formData.get('video_url') as string) || null

  if (isDemoMode) {
    revalidatePath(`/admin/courses/${course_id}`)
    return { success: true, id: 'demo-lesson-' + Date.now() }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('db_lessons')
    .insert({ course_id, title, content, duration_minutes, order_index, video_url })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath(`/admin/courses/${course_id}`)
  return { success: true, id: data.id }
}

export async function updateLesson(formData: FormData) {
  const course_id = formData.get('course_id') as string

  if (isDemoMode) {
    revalidatePath(`/admin/courses/${course_id}`)
    return { success: true }
  }

  const supabase = await createClient()
  const id = formData.get('id') as string
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const duration_minutes = parseInt(formData.get('duration_minutes') as string) || 10
  const order_index = parseInt(formData.get('order_index') as string) || 0
  const video_url = (formData.get('video_url') as string) || null
  const { error } = await supabase.from('db_lessons').update({ title, content, duration_minutes, order_index, video_url }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/admin/courses/${course_id}`)
  return { success: true }
}

export async function deleteLesson(id: string, course_id: string) {
  if (isDemoMode) {
    revalidatePath(`/admin/courses/${course_id}`)
    return { success: true }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('db_lessons').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/admin/courses/${course_id}`)
  return { success: true }
}

// ─── QUIZ ACTIONS ──────────────────────────────────────────

export async function createQuestion(payload: {
  lesson_id: string; course_id: string; question: string
  options: string[]; correct_index: number; order_index: number
}) {
  if (isDemoMode) return { success: true, id: 'demo-q-' + Date.now() }
  const supabase = await createClient()
  const { data, error } = await supabase.from('db_questions')
    .insert({ ...payload, options: JSON.stringify(payload.options) })
    .select('id').single()
  if (error) return { error: error.message }
  return { success: true, id: data.id }
}

export async function updateQuestion(payload: {
  id: string; question: string; options: string[]; correct_index: number
}) {
  if (isDemoMode) return { success: true }
  const supabase = await createClient()
  const { error } = await supabase.from('db_questions')
    .update({ question: payload.question, options: JSON.stringify(payload.options), correct_index: payload.correct_index })
    .eq('id', payload.id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteQuestion(id: string) {
  if (isDemoMode) return { success: true }
  const supabase = await createClient()
  const { error } = await supabase.from('db_questions').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function submitQuizAnswer(questionId: string, selectedIndex: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { data: q } = await supabase.from('db_questions').select('correct_index').eq('id', questionId).single()
  if (!q) return { error: 'Câu hỏi không tồn tại' }

  const is_correct = selectedIndex === q.correct_index
  const { error } = await supabase.from('db_question_responses').upsert({
    user_id: user.id, question_id: questionId, selected_index: selectedIndex, is_correct,
  }, { onConflict: 'user_id,question_id' })
  if (error) return { error: error.message }
  return { success: true, is_correct, correct_index: q.correct_index }
}

// ─── SURVEY ACTIONS ────────────────────────────────────────

export async function createSurveyQuestion(payload: {
  lesson_id: string; course_id: string; question: string; order_index: number
}) {
  if (isDemoMode) return { success: true, id: 'demo-s-' + Date.now() }
  const supabase = await createClient()
  const { data, error } = await supabase.from('db_surveys').insert(payload).select('id').single()
  if (error) return { error: error.message }
  return { success: true, id: data.id }
}

export async function updateSurveyQuestion(payload: { id: string; question: string }) {
  if (isDemoMode) return { success: true }
  const supabase = await createClient()
  const { error } = await supabase.from('db_surveys').update({ question: payload.question }).eq('id', payload.id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteSurveyQuestion(id: string) {
  if (isDemoMode) return { success: true }
  const supabase = await createClient()
  const { error } = await supabase.from('db_surveys').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function submitSurveyResponse(surveyId: string, response: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }
  const { error } = await supabase.from('db_survey_responses').upsert({
    user_id: user.id, survey_id: surveyId, response,
  }, { onConflict: 'user_id,survey_id' })
  if (error) return { error: error.message }
  return { success: true }
}
