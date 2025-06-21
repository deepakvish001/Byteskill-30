import type React from "react"
import type { FuseResultMatch } from "fuse.js"

interface HighlightMatchesProps {
  text: string
  matches?: readonly FuseResultMatch[]
  matchKey: string // e.g., "title", "description"
  className?: string
}

export function HighlightMatches({ text, matches, matchKey, className }: HighlightMatchesProps) {
  if (!matches || matches.length === 0) {
    return <span className={className}>{text}</span>
  }

  const relevantMatch = matches.find((match) => match.key === matchKey)
  if (!relevantMatch || !relevantMatch.indices || relevantMatch.indices.length === 0) {
    return <span className={className}>{text}</span>
  }

  const { indices } = relevantMatch
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  // Sort indices by start position to handle them in order
  const sortedIndices = [...indices].sort((a, b) => a[0] - b[0])

  sortedIndices.forEach(([start, end]) => {
    // Add non-matching part
    if (start > lastIndex) {
      parts.push(text.substring(lastIndex, start))
    }
    // Add matching part
    parts.push(
      <mark key={`${start}-${end}`} className="bg-green-500/30 text-green-300 px-0 py-0 rounded-sm">
        {text.substring(start, end + 1)}
      </mark>,
    )
    lastIndex = end + 1
  })

  // Add remaining non-matching part
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return <span className={className}>{parts}</span>
}
