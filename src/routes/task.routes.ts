import { Router } from 'express';
import {
  getAllTasks,
  createTask,
  deleteTask,
  updateTaskColumn
} from '../controllers/task.controller';

const router = Router();

router.get('/', getAllTasks);
router.post('/', createTask);
router.delete('/:id', deleteTask);
router.put('/:id/move', updateTaskColumn);

export default router;
