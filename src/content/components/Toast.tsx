interface ToastProps {
  message: string
}

export function Toast({ message }: ToastProps) {
  return (
    <div className="absolute bottom-6 left-1/2 z-[2147483647] -translate-x-1/2 animate-[slideUp_0.3s_ease-out] pointer-events-auto">
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/95 px-4 py-2.5 text-sm font-medium text-emerald-300 shadow-xl shadow-black/40 backdrop-blur-md">
        <span className="text-base">✓</span>
        {message}
      </div>
    </div>
  )
}
