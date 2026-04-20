'use client'

interface MarkdownViewProps {
  content: string
  className?: string
}

interface Segment {
  type: 'text' | 'bold' | 'italic' | 'code' | 'heading' | 'list' | 'link'
  content: string
  level?: number
}

function parseMarkdown(text: string): Segment[][] {
  const lines = text.split('\n')
  const result: Segment[][] = []

  for (const line of lines) {
    const lineSegments: Segment[] = []

    if (line.startsWith('# ')) {
      lineSegments.push({ type: 'heading', content: line.slice(2), level: 1 })
    } else if (line.startsWith('## ')) {
      lineSegments.push({ type: 'heading', content: line.slice(3), level: 2 })
    } else if (line.startsWith('### ')) {
      lineSegments.push({ type: 'heading', content: line.slice(4), level: 3 })
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      lineSegments.push({ type: 'list', content: line.slice(2) })
    } else {
      let remaining = line
      while (remaining.length > 0) {
        const codeMatch = remaining.match(/^`([^`]+)`/)
        if (codeMatch) {
          lineSegments.push({ type: 'code', content: codeMatch[1] })
          remaining = remaining.slice(codeMatch[0].length)
          continue
        }

        const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
        if (boldMatch) {
          lineSegments.push({ type: 'bold', content: boldMatch[1] })
          remaining = remaining.slice(boldMatch[0].length)
          continue
        }

        const italicMatch = remaining.match(/^\*([^*]+)\*/)
        if (italicMatch) {
          lineSegments.push({ type: 'italic', content: italicMatch[1] })
          remaining = remaining.slice(italicMatch[0].length)
          continue
        }

        const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
        if (linkMatch) {
          lineSegments.push({ type: 'link', content: linkMatch[1], level: 0 })
          remaining = remaining.slice(linkMatch[0].length)
          continue
        }

        const textMatch = remaining.match(/^[\*\`\[#\-]+/)
        if (textMatch) {
          lineSegments.push({ type: 'text', content: textMatch[0] })
          remaining = remaining.slice(textMatch[0].length)
          continue
        }

        if (remaining.length > 0) {
          lineSegments.push({ type: 'text', content: remaining[0] })
          remaining = remaining.slice(1)
        }
      }
    }

    if (lineSegments.length === 0) {
      lineSegments.push({ type: 'text', content: '' })
    }
    result.push(lineSegments)
  }

  return result
}

export default function MarkdownView({ content, className = '' }: MarkdownViewProps) {
  const parsed = parseMarkdown(content)

  return (
    <div className={className}>
      {parsed.map((line, lineIndex) => (
        <div key={lineIndex}>
          {lineIndex > 0 && <br />}
          {line.map((segment, segIndex) => {
            if (segment.type === 'heading') {
              const sizes = ['text-2xl', 'text-xl', 'text-lg']
              return (
                <span key={segIndex} className={`font-bold ${sizes[segment.level! - 1]}`}>
                  {segment.content}
                </span>
              )
            }
            if (segment.type === 'bold') {
              return (
                <strong key={segIndex}>
                  {segment.content}
                </strong>
              )
            }
            if (segment.type === 'italic') {
              return (
                <em key={segIndex}>
                  {segment.content}
                </em>
              )
            }
            if (segment.type === 'code') {
              return (
                <code key={segIndex} className="bg-[var(--surface-alt)] px-1 py-0.5 rounded text-sm font-mono">
                  {segment.content}
                </code>
              )
            }
            if (segment.type === 'list') {
              return (
                <span key={segIndex}>
                  <span className="font-semibold">• </span>
                  <span>{segment.content}</span>
                </span>
              )
            }
            if (segment.type === 'link') {
              return (
                <a key={segIndex} className="text-[var(--accent)] underline">
                  {segment.content}
                </a>
              )
            }
            return (
              <span key={segIndex}>
                {segment.content}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}