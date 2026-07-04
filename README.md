# Nexus E-Commerce - Technical Challenge

[![CI](https://github.com/cbelalcazar/LP-techinterview/actions/workflows/ci.yml/badge.svg)](https://github.com/cbelalcazar/LP-techinterview/actions/workflows/ci.yml)

Hello! Welcome to the repository containing my solution for the technical challenge. I have taken this challenge very seriously, aiming not only to meet the basic requirements but to build an application with an enterprise-level standard, clean architecture, a responsive and beautiful frontend, and a bulletproof backend.

Below, you will find instructions on how to run the project and the architectural design decisions I made to ensure this product is robust and scalable.

---

## 🚀 How to Run the Project (Super Easy)

As requested, the application is "dockerized" so you do not have to install Node.js, databases, or fight with versions in your local environment.

**Only Requirement:** Have Docker installed and running on your machine.

1. Open your terminal at the root of this project.
2. Run the initialization script:
   ```bash
   ./run.sh
   ```

*Note: The script will automatically detect your Docker Compose version (`docker compose` or `docker-compose`) and start both the application container and the PostgreSQL database container. The environment variables in the `.env` file have been intentionally left in the repository to make it easier for you to review (as requested in the instructions).*

Once the build finishes (it takes a couple of minutes the first time), you can access the app at:  
👉 **[http://localhost:3000](http://localhost:3000)**

To stop the application, simply run `docker-compose down` (or `docker compose down`).

---

## ✅ Requirements Checklist

Here is the status of every point requested in the original instructions:

- [x] **Product CRUD**: Full API and UI to create, read, update, and delete products.
- [x] **Import from CSV**: Robust functionality to mass-import products. If the SKU already exists, it updates the record; if it doesn't, it creates a new one.
- [x] **Search Bar**: Dynamically searches by name, description, or SKU.
- [x] **Purchase System**: Interactive button that deducts stock in real-time and provides visual feedback (fake checkout).
- [x] **Premium Design**: UI/UX built exclusively with Vanilla CSS (no Tailwind/Bootstrap), custom color variables, implicit dark mode, smooth animations, and loading skeletons.
- [x] **Dockerized**: Everything runs in isolated, interconnected containers using `docker-compose.yml`.
- [x] **Automated Tests**: 100% line coverage in the backend (API Routes).
- [x] **Zero Code Comments**: The source code is delivered completely free of comments, maintaining readability through semantic naming of variables and functions.

*(The file `NTD Code Challenge E-Commerce.csv` was processed during development based on its original structure).*

---

## ⭐ Enterprise Enhancements (Phase 2)
Following the initial review, the application was upgraded to meet high-scale enterprise standards:
- **Secure Transaction Model**: Added a dedicated `Transaction` model and `POST /api/products/[id]/purchase` endpoint to track purchases historically and ensure stock updates are decoupled from the client.
- **Concurrency Controls**: Atomic stock decrements using database transactions (`prisma.$transaction`) prevent race conditions during checkout.
- **Advanced CSV Operations**: Batched CSV imports in chunks of 200 records to prevent memory exhaustion. Detailed error reporting (with row numbers) for invalid CSV lines directly in the UI.
- **Search & Discovery**: Introduced multi-dimensional filtering (by category, price ranges) and sorting (by price, date) in the API, Repository, and UI Store.
- **Production Readiness**: Added Pino structured logging for JSON-based log aggregation, replaced generic db pushes with standard Prisma Migrations (`prisma migrate deploy`), and created B-Tree/GIN indexes for performance.

---

## 🏗️ Architecture & Software Decisions

To demonstrate real technical proficiency, I decided to move away from monolithic or spaghetti solutions, implementing a **Clean Architecture** with enterprise-oriented design patterns:

### 1. The Backend (Next.js App Router + Prisma + PostgreSQL)
Instead of writing business logic directly in the API route handlers, I structured the project as follows:
- **Repository Pattern (`ProductRepository`)**: Encapsulates all database calls using Prisma. If we ever decide to swap Prisma for TypeORM or migrate to MongoDB, we only touch this file and the APIs remain intact.
- **Service Layer (`ProductService`)**: Contains the business rules (such as pagination, database delegation, and file processing orchestration).
- **Factory Pattern (`ParserFactory`)**: I was asked to process a CSV file. Instead of hardcoding `PapaParse` into the service, I created a factory that receives the file and returns the appropriate parser (`CSVParser`, `JSONParser`, etc.). This way, the system is ready to scale (Open-Closed Principle).
- **Zod Validation (Data Integrity)**: One of the biggest issues when processing user-provided CSVs is data corruption. Using Zod, I intercept incoming data (like `price: "free"` or `$29.99`), parse it, cast it, and validate it strictly before it hits the database.
- **Database**: In a production environment, SQLite does not scale well due to write concurrency locks (`SQLITE_BUSY`). I migrated the local stack to a **PostgreSQL** cluster mounted on Docker and natively indexed the table to optimize searches (`@@index([name])` and `mode: 'insensitive'`).

### 2. The Frontend (React + Vanilla CSS + Zustand)
- **Global State Management (Zustand)**: All the complex state regarding products, search, pagination, and loading has been extracted from the main component and lives in a global "Store" using Zustand. This decouples the React lifecycle from data logic.
- **Toasts and User Feedback**: I implemented Skeletons (loading animations) and `react-hot-toast` to avoid blocking the DOM with annoying native `alert()` popups. Every interaction (like importing a CSV) happens in the background while showing an interactive, non-blocking popup to the user.
- **Native Pagination**: Rendering thousands of products would freeze the browser. Both the API and the frontend handle data in a paginated way (`skip` and `take` in SQL).

### 3. Testing (Jest)
I integrated **Jest** into the Node environment to test all logical layers of the HTTP routes, simulating corrupt payloads and mocking Prisma methods. We achieved an astonishing **100% line coverage** across the APIs. You can verify this by running locally:
```bash
npm test
```

---

I thoroughly enjoyed building this challenge! I treated every detail as if I were creating a branch of a product that thousands of users would use tomorrow. I am very open to discussing and debating any of the decisions made during this development.

I hope you enjoy reviewing it!
