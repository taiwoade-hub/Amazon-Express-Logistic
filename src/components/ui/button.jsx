function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

function Button({ variant = 'default', className, ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-black transition-colors disabled:opacity-50 disabled:pointer-events-none h-11 px-5'

  const variants = {
    default: 'bg-primary text-white hover:bg-black',
    outline: 'bg-white text-primary border border-border hover:bg-black/5'
  }

  return <button className={cn(base, variants[variant], className)} {...props} />
}

export { Button }

