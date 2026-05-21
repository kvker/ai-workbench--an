import { useEffect, useId, useMemo, useRef } from 'react'
import { Modal } from 'antd'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import type { DocumentSummary } from '../../services'
import { useAppTheme } from '../../providers/themeContext'
import { panel } from '../../utils/themeClasses'

export function ArtifactPreviewDialog({
  content,
  document,
  loading,
  open,
  onClose,
}: {
  content: string
  document: DocumentSummary | null
  loading: boolean
  open: boolean
  onClose: () => void
}) {
  const { isDark } = useAppTheme()
  const markdownRef = useRef<HTMLDivElement>(null)
  const previewId = useId().replace(/:/g, '')
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(content, { async: false })), [content])

  useEffect(() => {
    let cancelled = false
    const root = markdownRef.current

    if (!open || loading || !root) {
      return undefined
    }

    const blocks = Array.from(root.querySelectorAll('pre > code.language-mermaid'))

    if (blocks.length === 0) {
      return undefined
    }

    void import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        htmlLabels: false,
        theme: 'neutral',
        flowchart: {
          htmlLabels: false,
        },
      })

      blocks.forEach((block, index) => {
        const pre = block.parentElement
        const source = block.textContent ?? ''

        if (!pre || !source.trim()) {
          return
        }

        void mermaid.render(`${previewId}-mermaid-${index}`, source)
          .then(({ svg }) => {
            if (cancelled) {
              return
            }

            const container = window.document.createElement('div')
            container.className = 'my-4 overflow-auto rounded-md border border-slate-500/20 bg-white p-3'
            container.innerHTML = svg
            pre.replaceWith(container)
          })
          .catch(() => {
            if (cancelled) {
              return
            }

            pre.classList.add('border', 'border-amber-400/50')
          })
      })
    }).catch(() => {
      if (cancelled) {
        return
      }

      blocks.forEach((block) => {
        block.parentElement?.classList.add('border', 'border-amber-400/50')
      })
    })

    return () => {
      cancelled = true
    }
  })

  return (
    <Modal
      title={document?.title ?? '产物预览'}
      open={open}
      footer={null}
      loading={loading}
      width={860}
      onCancel={onClose}
    >
      <div className={`max-h-[70vh] overflow-auto rounded-lg border p-4 ${panel(isDark)}`}>
        <div
          ref={markdownRef}
          className={`max-w-none text-sm leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-800'} [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-400 [&_blockquote]:pl-3 [&_code]:break-words [&_code]:rounded [&_code]:bg-slate-500/10 [&_code]:px-1 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-extrabold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-extrabold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:font-extrabold [&_hr]:my-4 [&_li+li]:mt-1 [&_ol]:ml-5 [&_ol]:list-decimal [&_p+p]:mt-2 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-slate-950/80 [&_pre]:p-3 [&_pre]:text-slate-100 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-500/20 [&_td]:p-2 [&_th]:border [&_th]:border-slate-500/20 [&_th]:p-2 [&_th]:text-left [&_ul]:ml-5 [&_ul]:list-disc`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </Modal>
  )
}
