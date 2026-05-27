'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createLesson, updateLesson, deleteLesson } from '@/app/admin/actions'
import { Plus, Pencil, Trash2, GripVertical, Upload, X, ChevronDown, ChevronUp } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  content: string
  duration_minutes: number
  order_index: number
}

function LessonEditor({
  lesson,
  courseId,
  orderIndex,
  onDone,
}: {
  lesson?: Lesson
  courseId: string
  orderIndex: number
  onDone: () => void
}) {
  const [title, setTitle] = useState(lesson?.title ?? '')
  const [content, setContent] = useState(lesson?.content ?? '')
  const [duration, setDuration] = useState(String(lesson?.duration_minutes ?? 10))
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setContent(text)
      if (!title) setTitle(file.name.replace(/\.md$/, '').replace(/-/g, ' '))
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleSave() {
    if (!title.trim()) { setError('Vui lòng nhập tên bài học'); return }
    setError(null)
    const fd = new FormData()
    fd.set('course_id', courseId)
    fd.set('title', title)
    fd.set('content', content)
    fd.set('duration_minutes', duration || '10')
    fd.set('order_index', String(orderIndex))
    if (lesson?.id) fd.set('id', lesson.id)

    startTransition(async () => {
      const res = lesson?.id ? await updateLesson(fd) : await createLesson(fd)
      if (res.error) { setError(res.error); return }
      onDone()
    })
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Tên bài học *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Giới thiệu khóa học" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Thời lượng (phút)</Label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min={1}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Nội dung (Markdown)</Label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Upload className="w-3 h-3" /> Upload file .md
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".md,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="# Tiêu đề bài học&#10;&#10;Nội dung markdown..."
          rows={10}
          className="text-xs font-mono"
        />
        {content && (
          <p className="text-xs text-gray-400">{content.split('\n').length} dòng · {content.length} ký tự</p>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? 'Đang lưu...' : lesson?.id ? 'Lưu' : 'Thêm bài'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Hủy</Button>
      </div>
    </div>
  )
}

export function LessonManager({ courseId, lessons: initial }: { courseId: string; lessons: Lesson[] }) {
  const [lessons, setLessons] = useState(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDone() {
    setEditingId(null)
    setAddingNew(false)
    // Reload will happen via revalidatePath in action
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      await deleteLesson(deleteTarget.id, courseId)
      setLessons((prev) => prev.filter((l) => l.id !== deleteTarget.id))
      setDeleteTarget(null)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {lessons.length === 0 && !addingNew && (
        <div className="p-8 text-center text-gray-400 text-sm">
          Chưa có bài học nào. Thêm bài học đầu tiên!
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {lessons.map((lesson, idx) => (
          <div key={lesson.id}>
            {editingId === lesson.id ? (
              <div className="p-4">
                <LessonEditor
                  lesson={lesson}
                  courseId={courseId}
                  orderIndex={lesson.order_index}
                  onDone={handleDone}
                />
              </div>
            ) : (
              <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
                    <p className="text-xs text-gray-400">{lesson.duration_minutes} phút · {lesson.content.length} ký tự</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                      title="Xem nội dung"
                    >
                      {expandedId === lesson.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setEditingId(lesson.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(lesson)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {expandedId === lesson.id && (
                  <div className="mt-2 ml-9 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                      {lesson.content || '(Chưa có nội dung)'}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {addingNew && (
        <div className="p-4 border-t border-gray-50">
          <LessonEditor
            courseId={courseId}
            orderIndex={lessons.length}
            onDone={handleDone}
          />
        </div>
      )}

      {!addingNew && (
        <div className="p-4 border-t border-gray-50">
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2"
            onClick={() => setAddingNew(true)}
          >
            <Plus className="w-4 h-4" /> Thêm bài học
          </Button>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài học?</AlertDialogTitle>
            <AlertDialogDescription>
              Bài học <strong>{deleteTarget?.title}</strong> sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
