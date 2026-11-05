type SectionHeadingProps = {
  title: string
  subtitle?: string
}

// Shared heading so every block of the public page reads the same way.
export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className="mb-5 text-center">
      <h2 className="text-balance font-display text-2xl font-medium text-foreground sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-1 max-w-xl text-pretty text-sm text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  )
}
