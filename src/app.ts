import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/task.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/tasks', taskRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
