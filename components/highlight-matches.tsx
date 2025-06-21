"use client" // Ensure this is marked as a client component

interface HighlightMatchesProps {
  text: string
  query: string
}

export function HighlightMatches({ text, query }: HighlightMatchesProps) {
  if (!query) {
    return <>{text}</>
  }

  // Ensure text is a string before calling split
  const safeText = typeof text === "string" ? text : ""

  const parts = safeText.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={index} className="font-bold text-green-300 bg-green-700/30 px-0.5 rounded-sm">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}
