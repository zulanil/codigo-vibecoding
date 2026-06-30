import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'

interface Props {
  onUpload: (file: File) => void
  loading: boolean
}

export default function FileUpload({ onUpload, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.name.endsWith('.csv')) { alert('Solo se aceptan archivos .csv'); return }
    onUpload(file)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer relative border-2 border-dashed rounded-2xl p-20 text-center transition-all duration-200 overflow-hidden
        ${dragging
          ? 'border-cyan-500 bg-cyan-500/5 scale-[1.01]'
          : 'border-slate-700 hover:border-cyan-600/60 hover:bg-slate-900/60'}`}
    >
      {/* Subtle glow background */}
      {dragging && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none rounded-2xl" />}

      <input ref={inputRef} type="file" accept=".csv" className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />

      <div className={`mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
        ${dragging ? 'bg-cyan-500/20 border border-cyan-500/40' : 'bg-slate-800 border border-slate-700'}`}>
        <UploadCloud className={dragging ? 'text-cyan-400' : 'text-slate-400'} size={28} strokeWidth={1.5} />
      </div>

      <p className="text-lg font-semibold text-slate-200">
        {loading ? 'Procesando archivo…' : 'Arrastra tu CSV aquí o haz clic'}
      </p>
      <p className="text-sm text-slate-500 mt-2">
        Separador automático: coma (,) o punto y coma (;)
      </p>
    </div>
  )
}
