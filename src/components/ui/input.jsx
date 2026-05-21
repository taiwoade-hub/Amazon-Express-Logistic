function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full h-11 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-primary placeholder-black/30 focus:outline-none focus:border-border-active',
        className
      )}
      {...props}
    />
  )
}

export { Input }

