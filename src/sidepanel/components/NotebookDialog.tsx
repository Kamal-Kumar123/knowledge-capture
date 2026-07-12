interface NotebookDialogProps {
  title: string
  label: string
  initialValue?: string
  confirmLabel: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function NotebookDialog({
  title,
  label,
  initialValue = '',
  confirmLabel,
  onConfirm,
  onCancel,
}: NotebookDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const value = (formData.get('name') as string)?.trim()
    if (value) onConfirm(value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
      >
        <h3 className="mb-4 text-base font-semibold text-white">{title}</h3>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            {label}
          </span>
          <input
            name="name"
            type="text"
            defaultValue={initialValue}
            autoFocus
            required
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            placeholder="Notebook name"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
