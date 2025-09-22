# Equipment Rental MERN — Code Map

This document is a quick reference to the repository’s structure, backend API, data models, auth, uploads, and the frontend routes.

## Layout

- `mern/backend/`
  - `app.js`: Express app bootstrap, MongoDB connection, route mounting, static `/uploads`.
  - `package.json`: server deps and `start` script (nodemon).
  - `Controllers/`: CRUD controllers for User, Supplier, Staff, Admin; `authController` for login/profile.
  - `Route/`: Express routers mounted at `/users`, `/suppliers`, `/staff`, `/admins`, `/auth`.
  - `Model/`: Mongoose schemas for user, supplier, staff, admin.
  - `middleware/authMiddleware.js`: JWT verification middleware.
  - `helpers/uploadHelper.js`: Multer config for profile image uploads to `uploads/`.
  - `uploads/`: Uploaded images. Served statically at `/uploads`.
- `mern/frontend/`
  - CRA-based React app (`react-scripts`). Entry `src/index.js`, routes in `src/App.js`.
  - Components grouped by feature folders.

---

## Backend

### Server bootstrap — `backend/app.js`
- Loads `dotenv`, enables `express.json()` and `cors()`.
- Mounts:
  - `app.use("/users", userRoutes)`
  - `app.use("/suppliers", supplierRoutes)`
  - `app.use("/staff", staffRoutes)`
  - `app.use("/admins", adminRoutes)`
  - `app.use("/auth", authRoutes)`
  - `app.use("/uploads", express.static("uploads"))`
- Connects to MongoDB using `MONGO_URI`, starts on `PORT` (default 5000).

### Data models — `backend/Model/*`
- `userModel.js` (collection: `user`)
  - Fields: `name (String, req)`, `email (String, req)`, `nic (String, req)`, `phoneno (Number, req)`, `district (String, req)`, `password (String, req)`, `role (String, default "user")`, `profileImage (String)`.  
- `supplierModel.js` (collection: `suppliers`)
  - Fields: `companyName (String, req)`, `name (String, req)`, `email (String, req, unique)`, `phone (String, req)`, `district (String, req)`, `password (String, req)`, `role (String, default "supplier")`, `profileImage (String)`.
- `staffModel.js` (collection: `staff`)
  - Fields: `name (String, req)`, `phoneno (String, req)`, `nicNo (String, req, unique)`, `email (String, req, unique)`, `password (String, req)`, `role (String, default "staff")`, `profileImage (String)`.
- `adminModel.js` (collection: `admins`)
  - Fields: `name (String, req)`, `email (String, req, unique)`, `password (String, req)`, `role (String, default "admin")`, `profileImage (String)`.

### Auth — `backend/Controllers/authController.js`, `middleware/authMiddleware.js`
- `POST /auth/login`
  - Request: `{ email: string, password: string }`
  - Behavior: finds account by email across all four collections, then signs JWT `{ id, role }` with `JWT_SECRET` for 1h.
  - Response: `{ token, role, user: { id, name, email, role } }`.
  - Note: Password is not currently validated against the stored hash; `bcryptjs` is installed but unused. Consider fixing (see “Improvements”).
- `GET /auth/profile`
  - Requires `Authorization: Bearer <token>`.
  - Uses decoded `{ id, role }` to fetch the profile from the relevant collection, excluding `password`.

### Uploads — `helpers/uploadHelper.js`
- Multer disk storage:
  - Destination: `uploads/`
  - Filename: `Date.now() + ext`
- Routes provide `POST /:id/upload` with field name `profileImage` to set `profileImage` on the entity and return updated document.

### REST endpoints
Base URL: `http://<host>:<PORT>` (default `http://localhost:5000`).

- Users — mounted at `/users`
  - `GET /users` → list all users
  - `POST /users` → create user
  - `GET /users/:id` → get user by id
  - `PUT /users/:id` → update user
  - `DELETE /users/:id` → delete user
  - `POST /users/:id/upload` (multipart) → set `profileImage` (field: `profileImage`)

- Suppliers — mounted at `/suppliers`
  - `GET /suppliers`
  - `POST /suppliers`
  - `GET /suppliers/:id`
  - `PUT /suppliers/:id`
  - `DELETE /suppliers/:id`
  - `POST /suppliers/:id/upload` (multipart) → set `profileImage`

- Staff — mounted at `/staff`
  - `GET /staff`
  - `POST /staff`
  - `GET /staff/:id`
  - `PUT /staff/:id`
  - `DELETE /staff/:id`
  - `POST /staff/:id/upload` (multipart) → set `profileImage`

- Admins — mounted at `/admins`
  - `GET /admins`
  - `POST /admins`
  - `GET /admins/:id`
  - `PUT /admins/:id`
  - `DELETE /admins/:id`
  - `POST /admins/:id/upload` (multipart) → set `profileImage`

- Auth — mounted at `/auth`
  - `POST /auth/login` → issue JWT
  - `GET /auth/profile` → get current profile by token

Response shapes return `{ users }`, `{ supplier }`, `{ staff }`, `{ admin }` etc., or `{ message: string }` on errors.

---

## Frontend

- Entry: `src/index.js` with `BrowserRouter` and `StrictMode`.
- Routes in `src/App.js` (React Router):
  - `/` → `home`
  - `/userlog` → `login`
  - Registration: `/userRegister`, `/SupplierRegister`, `/AdminRegister`, `/StaffRegister`
  - Update: `/update-user/:id`, `/update-supplier/:id`, `/update-staff/:id`, `/update-admin/:id`
  - Lists: `/DisAllUsers`, `/DisAllStaff`, `/DisAllSupplier`, `/DisAllAdmins`
  - Account: `/userAccount/profile`, `/UserMenu`
  - Admin dashboard: `/adminDashbooard` (note the spelling, three o’s)
  - Misc: `/RegCusOrSupButton`

Key component groups under `src/component/`:
- `home/`, `userlog/`, `userregister/`, `userupdate/`, `disalluser/`, `userAccount/`, `adminPanel/` (+ `adminProfile/`).

Dependencies:
- React `^19`, React Router DOM `^7`, Axios `^1`. CRA `react-scripts@5` builds and dev serves the app.

---

## Running locally

Prereqs: Node.js LTS, MongoDB connection string.

1) Backend
```powershell
cd mern/backend
npm install
Copy-Item .env.example .env
# Edit .env with your values
npm start
```

2) Frontend (new terminal)
```powershell
cd mern/frontend
npm install
npm start
```

Backend default port is `5000`; frontend dev server is typically `3000`.

### Environment variables — `mern/backend/.env`
- `MONGO_URI=mongodb+srv://...` (or `mongodb://localhost:27017/equipment-rental`)
- `JWT_SECRET=your-strong-secret`
- `PORT=5000` (optional)

---

## Example requests

- Login
```http
POST /auth/login HTTP/1.1
Content-Type: application/json

{ "email": "user@example.com", "password": "pass123" }
```
- Get profile
```http
GET /auth/profile HTTP/1.1
Authorization: Bearer <JWT>
```
- Upload profile image (multipart)
```http
POST /users/66f.../upload HTTP/1.1
Content-Type: multipart/form-data; boundary=...

--boundary
Content-Disposition: form-data; name="profileImage"; filename="me.jpg"
Content-Type: image/jpeg

<binary>
--boundary--
```

---

## Notable observations and suggested improvements

- Password handling: controllers store plaintext; login doesn’t verify credentials. `bcryptjs` is installed but unused. Recommendation:
  - Hash on create/update (`bcrypt.hash`), verify on login (`bcrypt.compare`).
  - Enforce unique `email` across models where relevant.
- Validation: add request validation (e.g., `express-validator`) and consistent error responses.
- Controller consistency: prefer returning updated docs via `{ new: true }` rather than `.save()` after `findByIdAndUpdate`.
- Security: restrict who can call `/admins` and other admin endpoints (role-based authorization on top of `authMiddleware`).
- Typo: route `/adminDashbooard` likely intended `adminDashboard`.
- Rate limiting and CORS origin: consider `helmet`, `express-rate-limit`, and restrictive CORS.

This codemap should get new contributors up to speed quickly and serve as a single place to look up routes, models, and setup.
