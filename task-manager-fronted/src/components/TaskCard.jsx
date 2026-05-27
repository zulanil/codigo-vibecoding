import { Link } from 'react-router-dom'

export default function TaskCard({ task, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              task.done ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <h3 className="font-semibold text-gray-800 truncate">{task.title}</h3>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
            task.done
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          }`}
        >
          {task.done ? 'Completada' : 'Pendiente'}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-gray-400">
          {new Date(task.created_at).toLocaleDateString('es', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <div className="flex gap-2">
          <Link
            to={`/tasks/${task.id}`}
            className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Ver
          </Link>
          <button
            onClick={() => onEdit(task)}
            className="text-xs px-3 py-1 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(task)}
            className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
