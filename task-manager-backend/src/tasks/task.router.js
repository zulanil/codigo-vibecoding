import { Router } from 'express';
import * as controller from './task.controller.js';
import auth from '../middlewares/auth.js';

const router = Router();

router.use(auth);

router.get('/', controller.listTasks);
router.post('/', controller.createTask);
router.get('/:id', controller.getTask);
router.put('/:id', controller.updateTask);
router.delete('/:id', controller.deleteTask);

export default router;
