interface EditModalProps {
  initialText: string
  onSave: (text: string) => void
  onCancel: () => void
}

export function EditModal({ initialText, onSave, onCancel }: EditModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const text = (formData.get('text') as string)?.trim()
    if (text) onSave(text)
  }

  return (
    <div className="absolute inset-0 z-[2147483647] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm pointer-events-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900 p-4 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-sm font-semibold text-white">Edit Text</h3>
        <textarea
          name="text"
          defaultValue={initialText}
          autoFocus
          rows={6}
          required
          className="mb-4 w-full resize-y rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm leading-relaxed text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
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
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
