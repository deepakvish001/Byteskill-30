"use client"

import Link from "next/link"

interface DirectoryLinkItemProps {
  href: string
  title: string
  isActive: boolean
}

export function DirectoryLinkItem({ href, title, isActive }: DirectoryLinkItemProps) {
  return (
    <li className="relative">
      <span
        className={`absolute left-[-12px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
          isActive ? "bg-green-400" : "bg-neutral-500"
        }`}
        aria-hidden="true"
      />
      <Link
        href={href}
        className={`block py-0.5 text-sm transition-colors ${
          isActive ? "text-green-400 font-semibold" : "text-neutral-400 hover:text-green-400 hover:underline"
        }`}
      >
        {title}
      </Link>
    </li>
  )
}
