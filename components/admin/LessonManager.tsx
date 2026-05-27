'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createLesson, updateLesson, deleteLesson } from '@/app/admin/actions'
import { QuizEditor } from './QuizEditor'
import { SurveyEditor } from './SurveyEditor'
import { Plus, Pencil, Trash2, GripVertical, Upload, ChevronDown, ChevronUp, Video, HelpCircle, ClipboardList } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  content: string
  duration_minutes: number
  order_index: number
  video_url?: string | null
}

type Tab = 'content' | 'quiz' | 'survey'

function LessonEditor({
  lesson, courseId, orderIndex, onDone,
}: {
  lesson?: Lesson; courseId: string; orderIndex: number; onDone: () => void
}) {
  const [title, setTitle] = useState(lesson?.title ?? '')
  const [content, setContent] = useState(lesson?.content ?? '')
  const [duration, setDuration] = useState(String(lesson?.duration_minutes ?? 10))
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url ?? '')
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
    fd.set('video_url', videoUrl)
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
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={1} className="h-8 text-sm" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs flex items-center gap-1"><Video className="w-3 h-3 text-red-500" /> Link YouTube (tùy chọn)</Label>
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Nội dung (Markdown)</Label>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Upload className="w-3 h-3" /> Upload file .md
          </button>
          <input ref={fileRef} type="file" accept=".md,.txt" className="hidden" onChange={handleFileUpload} />
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="# Tiêu đề bài học&#10;&#10;Nội dung markdown..."
          rows={8}
          className="text-xs font-mono"
        />
        {content && <p className="text-xs text-gray-400">{content.split('\n').length} dòng · {content.length} ký tự</p>}
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
  const [activeTab, setActiveTab] = useState<Record<string, Tab>>({})
  const [isPending, startTransition] = useTransition()

  function getTab(lessonId: string): Tab { return activeTab[lessonId] ?? 'content' }
  function setTab(lessonId: string, tab: Tab) { setActiveTab((p) => ({ ...p, [lessonId]: tab })) }

  function handleDone() { setEditingId(null); setAddingNew(false) }

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
        <div className="p-8 text-center text-gray-400 text-sm">Chưa có bài học nào. Thêm bài học đầu tiên!</div>
      )}

      <div className="divide-y divide-gray-50">
        {lessons.map((lesson, idx) => (
          <div key={lesson.id}>
            {editingId === lesson.id ? (
              <div className="p-4">
                <LessonEditor lesson={lesson} courseId={courseId} orderIndex={lesson.order_index} onDone={handleDone} />
              </div>
            ) : (
              <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
                      {lesson.video_url && <Video className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400">{lesson.duration_minutes} phút · {lesson.content.length} ký tự</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    >
                      {expandedId === lesson.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setEditingId(lesson.id)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(lesson)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {expandedId === lesson.id && (
                  <div className="mt-3 ml-9">
                    {/* Tabs */}
                    <div className="flex gap-1 border-b border-gray-100 mb-3">
                      {([
                        { key: 'content', label: 'Nội dung', icon: null },
                        { key: 'quiz', label: 'Trắc nghiệm', icon: <HelpCircle className="w-3.5 h-3.5" /> },
                        { key: 'survey', label: 'Khảo sát', icon: <ClipboardList className="w-3.5 h-3.5" /> },
                      ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
                        <button
                          key={key}
                          onClick={() => setTab(lesson.id, key)}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-colors ${
                            getTab(lesson.id) === key
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {icon}{label}
                        </button>
                      ))}
                    </div>

                    {getTab(lesson.id) === 'content' && (
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {lesson.content || '(Chưa có nội dung)'}
                      </pre>
                    )}
                    {getTab(lesson.id) === 'quiz' && (
                      <QuizEditor lessonId={lesson.id} courseId={courseId} />
                    )}
                    {getTab(lesson.id) === 'survey' && (
                      <SurveyEditor lessonId={lesson.id} courseId={courseId} />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {addingNew && (
        <div className="p-4 border-t border-gray-50">
          <LessonEditor courseId={courseId} orderIndex={lessons.length} onDone={handleDone} />
        </div>
      )}

      {!addingNew && (
        <div className="p-4 border-t border-gray-50">
          <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => setAddingNew(true)}>
            <Plus className="w-4 h-4" /> Thêm bài học
          </Button>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài học?</AlertDialogTitle>
            <AlertDialogDescription>
              Bài học <strong>{deleteTarget?.title}</strong> và toàn bộ câu hỏi sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-red-600 hover:bg-red-700">
              {isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
