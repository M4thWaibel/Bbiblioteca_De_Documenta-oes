import { highlight } from '../lib/markdown'

export function MarkdownArticle({
  html,
  query,
  docId,
}: {
  html: string
  query: string
  docId: string
}) {
  return (
    <div
      key={docId + '|' + query}
      className="md-body"
      ref={(n) => {
        if (n) highlight(n, query)
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
