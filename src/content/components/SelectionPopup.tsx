interface SelectionPopupProps {
  position: { top: number; left: number }
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

export function SelectionPopup({
  position,
  onEdit,
  onSave,
  onCancel,
}: SelectionPopupProps) {
  return (
    <div
      className="absolute z-[2147483646] flex items-center gap-0.5 rounded-xl border border-slate-600/80 bg-slate-900/95 p-1 shadow-2xl shadow-black/50 backdrop-blur-md pointer-events-auto"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, 8px)',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
      >
        <span>✏</span> Edit
      </button>
      <div className="h-4 w-px bg-slate-700" />
      <button
        type="button"
        onClick={onSave}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-600/20 hover:text-emerald-300"
      >
        <span>💾</span> Save
      </button>
      <div className="h-4 w-px bg-slate-700" />
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-red-400"
      >
        <span>✖</span> Cancel
      </button>
    </div>
  )
}
