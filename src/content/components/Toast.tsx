interface ToastProps {
  message: string
  type: 'success' | 'error'
}

export function Toast({ message, type }: ToastProps) {
  const isSuccess = type === 'success'

  return (
    <div className="absolute bottom-6 left-1/2 z-[2147483647] -translate-x-1/2 animate-[slideUp_0.3s_ease-out] pointer-events-auto">
      <div
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl shadow-black/40 backdrop-blur-md ${
          isSuccess
            ? 'border border-emerald-500/30 bg-emerald-950/95 text-emerald-300'
            : 'border border-red-500/30 bg-red-950/95 text-red-300'
        }`}
      >
        <span className="text-base">{isSuccess ? '✓' : '✖'}</span>
        {message}
      </div>
    </div>
  )
}
