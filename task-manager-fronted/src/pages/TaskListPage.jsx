import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Dialog from '../components/Dialog'
import TaskCard from '../components/TaskCard'
import TaskForm from '../components/TaskForm'
import { taskService } from '../services/taskService'
import { useAuth } from '../context/AuthContext'

export default function TaskListPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await taskService.getAll()
      setTasks(data)
    } catch {
      setError('No se pudieron cargar las tareas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleCreate = async (form) => {
    try {
      setSaving(true)
      await taskService.create(form)
      setCreateOpen(false)
      fetchTasks()
    } catch {
      alert('Error al crear la tarea.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (form) => {
    try {
      setSaving(true)
      await taskService.update(editTarget.id, form)
      setEditTarget(null)
      fetchTasks()
    } catch {
      alert('Error al actualizar la tarea.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSaving(true)
      await taskService.delete(deleteTarget.id)
      setDeleteTarget(null)
      fetchTasks()
    } catch {
      alert('Error al eliminar la tarea.')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const pending = tasks.filter((t) => !t.done).length
  const completed = tasks.filter((t) => t.done).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Tareas</h1>
            {user && (
              <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
            )}
            {!loading && (
              <p className="text-sm text-gray-500 mt-0.5">
                {pending} pendiente{pending !== 1 ? 's' : ''} · {completed} completada{completed !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-2 items-start flex-shrink-0">
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">+</span>
              Nueva tarea
            </button>
            <button
              onClick={handleLogout}
              className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex justify-center py-20 text-gray-400 text-sm">Cargando tareas…</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
            {error}{' '}
            <button onClick={fetchTasks} className="underline font-medium">Reintentar</button>
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-base font-medium">Sin tareas aún</p>
            <p className="text-sm mt-1">Crea tu primera tarea para comenzar.</p>
          </div>
        )}

        {!loading && !error && tasks.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva tarea">
        <TaskForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          loading={saving}
        />
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar tarea">
        <TaskForm
          initialData={editTarget}
          onSubmit={handleEdit}
          onCancel={() => setEditTarget(null)}
          loading={saving}
        />
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar tarea">
        <p className="text-sm text-gray-600 mb-5">
          ¿Estás segura de que quieres eliminar{' '}
          <span className="font-semibold text-gray-800">"{deleteTarget?.title}"</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setDeleteTarget(null)}
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
