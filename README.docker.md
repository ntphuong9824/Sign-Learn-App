# Sign Learn - Docker Setup

## Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React app |
| Backend | http://localhost:8080 | Spring Boot API |
| PostgreSQL | localhost:5432 | Database |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Development

For development, you can run services individually:

```bash
# Backend
cd backend
./mvnw spring-boot:run

# Frontend
cd frontend
npm run dev
```

## Production Build

```bash
# Build and start all services
docker-compose up -d --build
```

## Database

- **Host**: localhost:5432
- **Database**: signlearn_db
- **User**: signlearn
- **Password**: signlearn_password