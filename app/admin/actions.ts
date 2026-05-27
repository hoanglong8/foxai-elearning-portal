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

  if (isDemoMode) {
    revalidatePath(`/admin/courses/${course_id}`)
    return { success: true, id: 'demo-lesson-' + Date.now() }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('db_lessons')
    .insert({ course_id, title, content, duration_minutes, order_index })
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
  const { error } = await supabase.from('db_lessons').update({ title, content, duration_minutes, order_index }).eq('id', id)
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
