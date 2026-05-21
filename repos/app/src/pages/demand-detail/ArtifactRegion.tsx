import { useEffect, useState } from 'react'
import { taskService, type DocumentSummary, type Issue } from '../../services'
import { mutedText, panel } from '../../utils/themeClasses'
import { createArtifactDocuments } from './demandDetailData'
import { PanelHead } from './PanelHead'

export function ArtifactRegion({
  initialDocuments,
  isDark,
  issue,
  refreshEnabled,
  refreshKey,
  onPreviewDocument,
}: {
  initialDocuments: DocumentSummary[]
  isDark: boolean
  issue: Issue
  refreshEnabled: boolean
  refreshKey: number
  onPreviewDocument: (document: DocumentSummary) => void
}) {
  const initialDocumentsKey = initialDocuments.map((document) => document.path ?? document.title).join('|')

  return (
    <ArtifactRegionContent
      key={initialDocumentsKey}
      initialDocuments={initialDocuments}
      isDark={isDark}
      issue={issue}
      refreshEnabled={refreshEnabled}
      refreshKey={refreshKey}
      onPreviewDocument={onPreviewDocument}
    />
  )
}

function ArtifactRegionContent({
  initialDocuments,
  isDark,
  issue,
  refreshEnabled,
  refreshKey,
  onPreviewDocument,
}: {
  initialDocuments: DocumentSummary[]
  isDark: boolean
  issue: Issue
  refreshEnabled: boolean
  refreshKey: number
  onPreviewDocument: (document: DocumentSummary) => void
}) {
  const { documents } = useArtifactDocuments(issue, initialDocuments, refreshKey, refreshEnabled)

  return (
    <section className={`grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border ${panel(isDark)}`}>
      <div className="p-3">
        <PanelHead title="当前产物" action={`${documents.length} docs`} />
      </div>
      <div className="min-h-0 overflow-auto px-3 pb-3">
        {documents.length === 0 && (
          <div className={`border-t border-slate-500/15 py-3 text-xs font-bold ${mutedText(isDark)}`}>
            暂无输出产物
          </div>
        )}
        {documents.map((document) => (
          <QuickDoc key={document.path ?? document.title} document={document} isDark={isDark} onPreview={() => onPreviewDocument(document)} />
        ))}
      </div>
    </section>
  )
}

function QuickDoc({ document, isDark, onPreview }: { document: DocumentSummary; isDark: boolean; onPreview: () => void }) {
  return (
    <button
      type="button"
      className={`block w-full cursor-pointer border-t border-slate-500/15 py-3 text-left first:border-t-0 ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-100/80'}`}
      onClick={onPreview}
    >
      <div>
        <div className="break-words text-xs font-extrabold">{document.title}</div>
        <p className={`mt-1 text-xs leading-relaxed ${mutedText(isDark)}`}>{document.body}</p>
      </div>
    </button>
  )
}

function useArtifactDocuments(issue: Issue, initialDocuments: DocumentSummary[], refreshKey: number, enabled: boolean) {
  const [documents, setDocuments] = useState(initialDocuments)

  useEffect(() => {
    if (!enabled || !issue.id || refreshKey === 0) {
      return undefined
    }

    let active = true

    void taskService.listWorkspaceArtifacts(issue)
      .then((artifacts) => {
        if (!active) {
          return
        }

        setDocuments(createArtifactDocuments(artifacts.files))
      })
      .catch(() => {
        // Keep the last visible artifact list; transient refresh failures should not blank the panel.
      })

    return () => {
      active = false
    }
  }, [enabled, issue, refreshKey])

  return { documents }
}
