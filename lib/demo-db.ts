import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DB_PATH = join(process.cwd(), '.demo-db.json')

export interface DemoCourse {
  id: string
  slug: string
  title: string
  description: string
  category: string
  level: string
  emoji: string
  is_published: boolean
  created_at: string
}

export interface DemoUser {
  id: string
  full_name: string | null
  department: string | null
  role: string
  created_at: string
}

interface DemoDb {
  courses: DemoCourse[]
  users: DemoUser[]
}

const DEFAULT_USERS: DemoUser[] = [
  { id: '1', full_name: 'Nguyễn Hoàng Long', department: 'Delivery', role: 'admin', created_at: '2024-01-01' },
  { id: '2', full_name: 'Nguyễn Quốc Anh', department: 'Delivery', role: 'learner', created_at: '2024-01-02' },
  { id: '3', full_name: 'Trần Thị Bích Hoài', department: 'Delivery', role: 'learner', created_at: '2024-01-03' },
  { id: '4', full_name: 'Vi Anh Tuấn', department: 'R&D', role: 'learner', created_at: '2024-01-04' },
  { id: '5', full_name: 'Trần Quốc Vương', department: 'Sales', role: 'learner', created_at: '2024-01-05' },
]

function readDb(): DemoDb {
  if (!existsSync(DB_PATH)) return { courses: [], users: [...DEFAULT_USERS] }
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return { courses: [], users: [...DEFAULT_USERS] }
  }
}

function writeDb(db: DemoDb) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

// ── Courses ────────────────────────────────────────────────
export function getDemoCourses(): DemoCourse[] {
  return readDb().courses
}

export function addDemoCourse(course: Omit<DemoCourse, 'id' | 'created_at'>): DemoCourse {
  const db = readDb()
  const newCourse: DemoCourse = {
    ...course,
    id: 'demo-' + Date.now(),
    created_at: new Date().toISOString(),
  }
  db.courses.unshift(newCourse)
  writeDb(db)
  return newCourse
}

export function updateDemoCourse(id: string, updates: Partial<DemoCourse>) {
  const db = readDb()
  const idx = db.courses.findIndex((c) => c.id === id)
  if (idx >= 0) db.courses[idx] = { ...db.courses[idx], ...updates }
  writeDb(db)
}

export function deleteDemoCourse(id: string) {
  const db = readDb()
  db.courses = db.courses.filter((c) => c.id !== id)
  writeDb(db)
}

// ── Users ──────────────────────────────────────────────────
export function getDemoUsers(): DemoUser[] {
  return readDb().users
}

export function addDemoUser(user: Omit<DemoUser, 'id' | 'created_at'>): DemoUser {
  const db = readDb()
  const newUser: DemoUser = {
    ...user,
    id: 'demo-user-' + Date.now(),
    created_at: new Date().toISOString(),
  }
  db.users.push(newUser)
  writeDb(db)
  return newUser
}

export function updateDemoUser(id: string, updates: Partial<DemoUser>) {
  const db = readDb()
  const idx = db.users.findIndex((u) => u.id === id)
  if (idx >= 0) db.users[idx] = { ...db.users[idx], ...updates }
  writeDb(db)
}

export function deleteDemoUser(id: string) {
  const db = readDb()
  db.users = db.users.filter((u) => u.id !== id)
  writeDb(db)
}
