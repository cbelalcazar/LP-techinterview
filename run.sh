#!/bin/bash
set -e

echo "=========================================="
echo " Starting Enterprise E-Commerce App"
echo "=========================================="

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif docker-compose --version >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "❌ Error: Neither 'docker compose' nor 'docker-compose' could be found."
  echo "Please make sure Docker is installed and running."
  exit 1
fi

echo "[1/2] Building the Docker image (this may take a few minutes)..."
$COMPOSE_CMD build

echo "[2/2] Starting the containers..."
$COMPOSE_CMD up -d

echo "=========================================="
echo "✅ Application is successfully running!"
echo "👉 Access it at: http://localhost:3000"
echo "=========================================="
echo "To stop the application, run: $COMPOSE_CMD down"
