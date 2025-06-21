interface PageHeaderProps {
  title: string
  description?: string
  className?: string
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={`mb-8 md:mb-12 text-center ${className}`}>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
        {title}
      </h1>
      {description && (
        <p className="mt-3 sm:mt-4 text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </header>
  )
}
