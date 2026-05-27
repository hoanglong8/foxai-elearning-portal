'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createCourse, updateCourse } from '@/app/admin/actions'

const EMOJIS = ['📚', '🤖', '💼', '📊', '🛠️', '🎯', '💡', '🔬', '📈', '🌐', '⚙️', '🧠']

const CATEGORY_LABELS: Record<string, string> = {
  'internal-processes': 'Quy trình nội bộ',
  'technical-skills': 'Kỹ năng kỹ thuật',
  'sales-softskills': 'Sales & Soft skills',
  'ai-technology': 'AI & Công nghệ',
}

const LEVEL_LABELS: Record<string, string> = {
  'beginner': 'Cơ bản',
  'intermediate': 'Trung cấp',
  'advanced': 'Nâng cao',
}

interface CourseData {
  id: string
  title: string
  description: string
  category: string
  level: string
  emoji: string
  is_published: boolean
}

export function CourseForm({ course }: { course?: CourseData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(course?.title ?? '')
  const [description, setDescription] = useState(course?.description ?? '')
  const [category, setCategory] = useState(course?.category ?? 'internal-processes')
  const [level, setLevel] = useState(course?.level ?? 'beginner')
  const [emoji, setEmoji] = useState(course?.emoji ?? '📚')
  const [isPublished, setIsPublished] = useState(course?.is_published ?? false)

  function handleSubmit() {
    if (!title.trim()) { setError('Vui lòng nhập tên khóa học'); return }
    setError(null)

    const fd = new FormData()
    fd.set('title', title)
    fd.set('description', description)
    fd.set('category', category)
    fd.set('level', level)
    fd.set('emoji', emoji)
    fd.set('is_published', String(isPublished))
    if (course?.id) fd.set('id', course.id)

    startTransition(async () => {
      const res = course?.id ? await updateCourse(fd) : await createCourse(fd)
      if (res.error) { setError(res.error); return }
      if (!course?.id && 'id' in res && res.id) {
        router.push(`/admin/courses/${res.id}`)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
      {/* Emoji picker */}
      <div className="space-y-1.5">
        <Label>Biểu tượng</Label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`w-9 h-9 text-xl rounded-lg border transition-all ${
                emoji === e
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {e}
            </button>
          ))}
          <Input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-14 text-center text-xl"
            maxLength={2}
            placeholder="✏️"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Tên khóa học *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VD: Kỹ năng Sales Enterprise Vietnam"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="desc">Mô tả</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả ngắn về khóa học..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Danh mục</Label>
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger>
              <SelectValue>{CATEGORY_LABELS[category] ?? category}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal-processes">Quy trình nội bộ</SelectItem>
              <SelectItem value="technical-skills">Kỹ năng kỹ thuật</SelectItem>
              <SelectItem value="sales-softskills">Sales & Soft skills</SelectItem>
              <SelectItem value="ai-technology">AI & Công nghệ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Cấp độ</Label>
          <Select value={level} onValueChange={(v) => v && setLevel(v)}>
            <SelectTrigger>
              <SelectValue>{LEVEL_LABELS[level] ?? level}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Cơ bản</SelectItem>
              <SelectItem value="intermediate">Trung cấp</SelectItem>
              <SelectItem value="advanced">Nâng cao</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between py-2 border-t border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-700">Xuất bản</p>
          <p className="text-xs text-gray-400">Học viên sẽ thấy khóa học này</p>
        </div>
        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
          {isPending ? 'Đang lưu...' : course?.id ? 'Lưu thay đổi' : 'Tạo khóa học'}
        </Button>
        <Button variant="outline" onClick={() => router.push('/admin/courses')}>
          Hủy
        </Button>
      </div>
    </div>
  )
}
