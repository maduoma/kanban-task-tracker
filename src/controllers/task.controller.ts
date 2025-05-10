import { Request, Response } from 'express';
import * as taskService from '../services/task.service';
import { Column } from '@prisma/client';

export const getAllTasks = async (_: Request, res: Response) => {
  const tasks = await taskService.getAll();
  res.json(tasks);
};

export const createTask = async (req: Request, res: Response) => {
  const { content } = req.body;
  const task = await taskService.create(content);
  res.status(201).json(task);
};

export const deleteTask = async (req: Request, res: Response) => {
  await taskService.remove(req.params.id);
  res.status(204).send();
};


export const normalizeColumn = (raw: string): Column => {
  const upper = raw.toUpperCase();
  switch (upper) {
    case 'TODO':
      return Column.TODO;
    case 'INPROGRESS':
    case 'IN_PROGRESS':
      return Column.IN_PROGRESS;
    case 'DONE':
      return Column.DONE;
    default:
      throw new Error(`Invalid column value: ${raw}`);
  }
};

export const updateTaskColumn = async (req: Request, res: Response) => {
  try {
    console.log('Received column update request:', req.body);
    // Pass the column directly to the service
    const task = await taskService.move(req.params.id, req.body.column);
    console.log('Task updated successfully:', task);
    res.json(task);
  } catch (err: any) {
    console.error('Error updating task column:', err);
    res.status(400).json({ error: err.message });
  }
};
