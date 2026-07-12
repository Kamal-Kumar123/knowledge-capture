interface NotebookDropdownProps {
  notebooks: { id: string; name: string }[]
  activeNotebookId: string | null
  onChange: (notebookId: string) => void
}

export function NotebookDropdown({
  notebooks,
  activeNotebookId,
  onChange,
}: NotebookDropdownProps) {
  return (
    <div className="relative">
      <select
        value={activeNotebookId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 pr-10 text-sm text-slate-100 shadow-inner transition-colors hover:border-slate-600 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
      >
        {notebooks.map((notebook) => (
          <option key={notebook.id} value={notebook.id}>
            {notebook.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          className="h-4 w-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
