import * as repo from './task.repository.js';

async function listTasks(req, res) {
  try {
    const tasks = await repo.findByUserId(req.user.id);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener las tareas' });
  }
}

async function getTask(req, res) {
  try {
    const task = await repo.findById(req.params.id, req.user.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener la tarea' });
  }
}

async function createTask(req, res) {
  try {
    const { title, description } = req.body;
    const task = await repo.create({ title, description, userId: req.user.id });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear la tarea' });
  }
}

async function updateTask(req, res) {
  try {
    const owned = await repo.findById(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ message: 'Task not found' });
    const task = await repo.update(req.params.id, req.body);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar la tarea' });
  }
}

async function deleteTask(req, res) {
  try {
    const owned = await repo.findById(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ message: 'Task not found' });
    await repo.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar la tarea' });
  }
}

export { listTasks, getTask, createTask, updateTask, deleteTask };
