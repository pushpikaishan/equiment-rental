Quick Docker instructions

Build and run the app (backend, frontend, and MongoDB) with docker-compose:

1) Build and start services:

   docker-compose up --build

2) Open the frontend in your browser:

   http://localhost:3000

3) Backend API:

   http://localhost:5000

Notes:
- The backend expects a MongoDB URI in the MONGO_URI env var; docker-compose sets this automatically to the 'mongo' service.
- If you want to provide local environment variables, create a `backend/.env` file and add any secrets there; docker-compose can be updated to use `env_file`.
- Static uploads are mounted from `./backend/uploads` to persist uploaded files.
