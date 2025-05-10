# Kanban Task Tracker

A simple Kanban board application for tracking tasks across different stages of completion. This application allows users to create, move, and delete tasks with a clean and intuitive interface.

## Features

- Create new tasks in the "To Do" column
- Drag and drop tasks between columns (To Do, In Progress, Done)
- Delete tasks when they're no longer needed
- Confetti celebration when tasks are marked as done
- Responsive design that works on desktop and mobile devices

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest, Supertest

## Project Structure

```
├── prisma/              # Prisma schema and migrations
├── public/              # Static frontend files
│   ├── __tests__/       # Frontend tests
│   ├── index.html       # Main HTML file
│   ├── script.js        # Frontend JavaScript
│   └── styles.css       # CSS styles
├── src/                 # Backend source code
│   ├── __tests__/       # Backend tests
│   │   ├── integration/ # Integration tests
│   │   └── unit/        # Unit tests
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── .env                 # Environment variables
├── jest.config.js       # Jest configuration
├── package.json         # Project dependencies
└── tsconfig.json        # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/kanban-task-tracker.git
   cd kanban-task-tracker
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Run database migrations
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Testing

The project includes comprehensive unit and integration tests for both the frontend and backend components. The test suite is configured to provide detailed coverage reports.

### Test Structure

- **Unit Tests**: Located in `src/__tests__/unit/` for backend and `public/__tests__/` for frontend
- **Integration Tests**: Located in `src/__tests__/integration/`

### Running Tests

To run all tests with coverage report:

```bash
npm test
```

To run only backend tests:

```bash
npm run test:backend
```

To run only frontend tests:

```bash
npm run test:frontend
```

### Test Coverage

The project maintains 100% test coverage across all files, ensuring robust and reliable code. Coverage reports include statements, branches, functions, and lines.

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment. The CI/CD pipeline automates testing, building, and deploying the application.

### Workflow

1. **Testing**: Runs all unit and integration tests across multiple Node.js versions
2. **Building**: Builds the application for production
3. **Deployment**: Automatically deploys to Netlify when changes are pushed to the main branch

### Setup for Deployment

To enable automatic deployment to Netlify, you need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `NETLIFY_AUTH_TOKEN`: Your Netlify personal access token
   - `NETLIFY_SITE_ID`: The API ID of your Netlify site

### Local Development vs CI Environment

The CI pipeline uses SQLite for testing in the GitHub Actions environment, which simplifies the CI setup and avoids potential Docker-related issues. While your local development might use PostgreSQL, the tests are configured to run with either database system by using environment variables.

## API Endpoints

| Method | Endpoint           | Description                       |
|--------|-------------------|-----------------------------------|
| GET    | /api/tasks        | Get all tasks                     |
| POST   | /api/tasks        | Create a new task                 |
| DELETE | /api/tasks/:id    | Delete a task by ID               |
| PUT    | /api/tasks/:id    | Update a task's column            |
| GET    | /health           | Health check endpoint             |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
