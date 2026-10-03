import { Fragment, type ReactNode } from 'react'

const LIST_RE = /^\s*([-*]|\d+\.)\s+/
const HEAD_RE = /^#{1,4}\s+/

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.length > 4 && p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
    if (p.length > 2 && p.startsWith('`') && p.endsWith('`'))
      return <code key={i} className="rounded bg-sand px-1.5 py-0.5 font-mono text-[0.88em]">{p.slice(1, -1)}</code>
    return <Fragment key={i}>{p}</Fragment>
  })
}

// Renderizador mínimo y seguro (sin dangerouslySetInnerHTML)
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n')
  const out: ReactNode[] = []
  let i = 0
  let k = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim().startsWith('```')) {
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++])
      i++
      out.push(
        <pre key={k++} className="overflow-x-auto rounded-lg bg-sand p-3 font-mono text-[13px] leading-relaxed">
          {code.join('\n')}
        </pre>,
      )
      continue
    }

    if (LIST_RE.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const items: string[] = []
      while (i < lines.length && LIST_RE.test(lines[i])) items.push(lines[i++].replace(LIST_RE, ''))
      const Tag = ordered ? 'ol' : 'ul'
      out.push(
        <Tag key={k++} className={`space-y-1.5 pl-5 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-clay`}>
          {items.map((it, j) => <li key={j}>{inline(it)}</li>)}
        </Tag>,
      )
      continue
    }

    if (HEAD_RE.test(line)) {
      out.push(<p key={k++} className="font-semibold">{inline(line.replace(HEAD_RE, ''))}</p>)
      i++
      continue
    }

    if (!line.trim()) { i++; continue }

    const para = [line]
    i++
    while (
      i < lines.length && lines[i].trim() &&
      !LIST_RE.test(lines[i]) && !HEAD_RE.test(lines[i]) && !lines[i].trim().startsWith('```')
    ) para.push(lines[i++])
    out.push(<p key={k++}>{inline(para.join(' '))}</p>)
  }

  return <div className="space-y-3 text-[15.5px] leading-relaxed">{out}</div>
}
