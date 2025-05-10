#!/bin/bash

# Setup PostgreSQL for testing
echo "Setting up PostgreSQL for testing..."

# Create test database
echo "Creating test database..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U postgres -c "CREATE DATABASE kanban_test;"

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Database setup complete!"
