import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Dialog from '../components/Dialog'
import TaskForm from '../components/TaskForm'
import { taskService } from '../services/taskService'

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await taskService.getById(id)
        setTask(data)
      } catch {
        setError('No se pudo cargar la tarea.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleEdit = async (form) => {
    try {
      setSaving(true)
      const updated = await taskService.update(id, form)
      setTask(updated)
      setEditOpen(false)
    } catch {
      alert('Error al actualizar la tarea.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSaving(true)
      await taskService.delete(id)
      navigate('/')
    } catch {
      alert('Error al eliminar la tarea.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        Cargando tarea…
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-gray-500">
        <p>{error ?? 'Tarea no encontrada.'}</p>
        <Link to="/" className="text-indigo-600 underline text-sm">Volver a la lista</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          ← Volver a tareas
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mb-4 ${
              task.done
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${task.done ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {task.done ? 'Completada' : 'Pendiente'}
          </span>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">{task.title}</h1>

          {task.description ? (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{task.description}</p>
          ) : (
            <p className="text-gray-400 text-sm italic mb-6">Sin descripción.</p>
          )}

          <div className="text-xs text-gray-400 border-t border-gray-100 pt-4 mb-6">
            Creada el{' '}
            {new Date(task.created_at).toLocaleDateString('es', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setEditOpen(true)}
              className="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Editar tarea
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="px-4 py-2 text-sm rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Editar tarea">
        <TaskForm
          initialData={task}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          loading={saving}
        />
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar tarea">
        <p className="text-sm text-gray-600 mb-5">
          ¿Estás segura de que quieres eliminar{' '}
          <span className="font-semibold text-gray-800">"{task.title}"</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setDeleteOpen(false)}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </Dialog>
    </div>
  )
}
