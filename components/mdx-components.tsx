"use client"

import React from "react"

import type { ReactNode, ComponentProps } from "react"
import NextLink from "next/link"
import Image from "next/image"
import { Copy, Check } from "lucide-react"
import { Button as UIButton } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Import Tooltip components
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

// Kbd component (remains the same)
const Kbd = ({ children }: { children: ReactNode }) => {
  return (
    <kbd className="px-2 py-1 text-xs font-semibold text-neutral-300 bg-neutral-700 border-neutral-600 rounded-md">
      {children}
    </kbd>
  )
}
Kbd.displayName = "Kbd"

// Enhanced CustomPre component with Tooltip
const CustomPre = (props: ComponentProps<"pre">) => {
  const { children, className: preClassName, ...restPreProps } = props
  const [isCopied, setIsCopied] = React.useState(false)
  const { toast } = useToast()

  let codeString = ""
  let lang = "bash"

  const findCodeElementAndContent = (node: ReactNode): string => {
    let content = ""
    React.Children.forEach(node, (child) => {
      if (React.isValidElement(child)) {
        if (child.type === "code") {
          const codeElement = child as React.ReactElement<ComponentProps<"code">>
          if (codeElement.props.className) {
            const langMatch = codeElement.props.className.match(/language-(\S+)/)
            if (langMatch) {
              lang = langMatch[1]
            }
          }
          if (typeof child.props.children === "string") {
            content += child.props.children
          } else {
            content += findCodeElementAndContent(child.props.children)
          }
        } else if (child.props.children) {
          content += findCodeElementAndContent(child.props.children)
        }
      } else if (typeof child === "string") {
        content += child
      }
    })
    return content
  }

  codeString = findCodeElementAndContent(children).trim()

  const handleCopy = () => {
    if (codeString) {
      navigator.clipboard.writeText(codeString)
      toast({
        title: "Copied to clipboard!",
      })
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  return (
    <div className="my-6 bg-neutral-800 rounded-md overflow-hidden text-sm relative group shadow-md">
      <div className="flex justify-between items-center px-4 py-2 bg-neutral-750 text-xs text-neutral-400">
        <span>{lang.toUpperCase()}</span>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <UIButton
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-neutral-700 opacity-50 group-hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-750 rounded-md"
                onClick={handleCopy}
              >
                <span className="sr-only">Copy code</span>
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-400" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </UIButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCopied ? "Copied!" : "Copy code"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <pre {...restPreProps} className={cn(preClassName, "!bg-transparent", "!m-0", "p-4", "overflow-x-auto")}>
        {children}
      </pre>
    </div>
  )
}
CustomPre.displayName = "CustomPre"

export const mdxComponents: { [key: string]: React.ElementType } = {
  a: (props: ComponentProps<typeof NextLink>) => {
    const { href, children, ...rest } = props
    const isExternal = href && (href.startsWith("http") || href.startsWith("mailto"))
    const linkClasses = cn(
      "text-green-400 hover:text-green-300 hover:underline underline-offset-4 decoration-dotted",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
    )

    if (isExternal) {
      return (
        <NextLink href={href} target="_blank" rel="noopener noreferrer" className={linkClasses} {...rest}>
          {children}
        </NextLink>
      )
    }
    return (
      <NextLink href={href || "#"} className={linkClasses} {...rest}>
        {children}
      </NextLink>
    )
  },
  pre: CustomPre,
  kbd: Kbd,
  img: (props: ComponentProps<typeof Image> & { blurDataURL?: string }) => {
    const receivedWidth = Number(props.width)
    const receivedHeight = Number(props.height)
    const defaultWidth = 700
    const calculatedHeight = receivedWidth ? Math.round(receivedWidth / (16 / 9)) : 400
    const width = receivedWidth || defaultWidth
    const height = receivedHeight || calculatedHeight
    const GENERIC_BLUR_DATA_URL_MDX =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8/x8AAuMB8DtXNJsAAAAASUVORK5CYII="

    return (
      <span className="block my-6 overflow-hidden rounded-lg border border-neutral-700 shadow-md bg-neutral-800">
        <Image
          src={props.src || `/placeholder.svg?width=${width}&height=${height}&query=mdx+content+image`}
          alt={props.alt || "Image from content"}
          width={width}
          height={height}
          className="w-full h-auto rounded-lg"
          sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1023px) calc(100vw - 48px), 65ch"
          loading="lazy"
          placeholder={props.blurDataURL ? "blur" : "empty"}
          blurDataURL={props.blurDataURL || GENERIC_BLUR_DATA_URL_MDX}
          {...props}
        />
      </span>
    )
  },
}
