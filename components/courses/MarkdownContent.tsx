import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
}

export function MarkdownContent({ content }: Props) {
  return (
    <article className="prose prose-gray prose-sm sm:prose-base max-w-none
      prose-headings:font-bold prose-headings:text-gray-900
      prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
      prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
      prose-p:text-gray-700 prose-p:leading-relaxed
      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
      prose-strong:text-gray-900
      prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
      prose-pre:bg-gray-900 prose-pre:rounded-xl
      prose-blockquote:border-l-blue-400 prose-blockquote:text-gray-600
      prose-table:text-sm prose-th:bg-gray-50 prose-th:text-gray-700
      prose-li:text-gray-700 prose-li:marker:text-gray-400">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  )
}
