# E-Commerce Backend (Express + MongoDB)

This is a clean, readable, and production-style Node.js backend for an e-commerce platform. It provides user authentication, role-based authorization, product management (with pagination and filtering), order processing (with race-condition protection), and AI-driven product recommendations.

Designed as a high-quality, maintainable industry-standard project, it prioritizes simple, clean architectures and robust validations.

---

## Core Features

- **Authentication & Authorization**: Registration and login using `bcryptjs` and `jsonwebtoken`. Public routes for browsing, user-only routes for placing/cancelling orders, and admin-only routes for CRUD user/product management and order status updates.
- **Product Management**: Pagination, sorting, price filtering, and safe partial-regex search over product name and description.
- **Order Flow**: Race-condition protected stock reservation during order placement using atomic Mongoose operations.
- **Hugging Face AI Recommendations**: Recommends items based on user purchase history and category preferences. Automatically falls back to category-based recommendation if the Hugging Face API is unconfigured or fails.
- **Centralized Error Handling**: Express global error handling middleware translating Mongo duplicate keys, Mongoose validation, and invalid ObjectIds into clean JSON error responses.

---

## Folder Structure

The project maintains a simple, clean, flat layer structure:
```text
config/             # App configs and MongoDB connection
controllers/        # Route controllers containing business logic
middleware/         # Authentication, authorization, and error handling
models/             # Mongoose schemas (User, Product, Order)
routes/             # Express routing definitions
services/           # External API wrappers (Hugging Face recommendations)
utils/              # Standardized API response utilities and AppError wrapper
validators/         # express-validator request validation schemas
test/               # Controller and route integration tests
index.js            # Express app initialization and mounting entry point
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your variables:
```bash
cp .env.example .env
```

Variables:
- `PORT`: Port for the Express server (default: `5000`)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRES_IN`: JWT expiration length (e.g. `1d`)
- `HUGGINGFACE_API_KEY`: API token from Hugging Face (optional, fallback is used if missing)
- `HUGGINGFACE_MODEL`: Model name for recommendation prompting (default: `mistralai/Mistral-7B-Instruct-v0.2`)
- `ALLOWED_ORIGINS`: Comma-separated list of origins allowed by CORS

---

## Installation & How to Run

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start in development mode** (reloads on changes using `nodemon`):
   ```bash
   npm run dev
   ```

3. **Start in production mode**:
   ```bash
   npm start
   ```

4. **Run the test suite**:
   ```bash
   npm test
   ```

---

## Standardized API Responses

The application enforces a consistent response structure across all endpoints.

### Success Response (wrapped in `data`)
```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": {
    "products": [ ... ]
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Valid email is required" }
  ]
}
```

---

## API Endpoint Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (defaults to `user` role) |
| `POST` | `/api/auth/login` | Public | Authenticate user and return JWT |
| `GET` | `/api/auth/healthCheck` | Public | Basic server health check |

### 👤 User Profile & User Management (`/api/user`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/user/profile` | Logged In | Get current user's profile |
| `PUT` | `/api/user/profile` | Logged In | Update current user's profile (name and phone only) |
| `DELETE` | `/api/user/profile` | Logged In | Delete own profile |
| `GET` | `/api/user` | Admin Only | List all users (excluding passwords) |
| `POST` | `/api/user` | Admin Only | Create a new user (specifying role) |
| `GET` | `/api/user/:id` | Admin Only | Get details for any user |
| `PUT` | `/api/user/:id` | Admin Only | Update any user details (including role) |
| `DELETE` | `/api/user/:id` | Admin Only | Delete any user |

### 🏷️ Products (`/api/products`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | List products (supports `search`, `category`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`) |
| `GET` | `/api/products/:id` | Public | Get product details by ID |
| `POST` | `/api/products` | Admin Only | Create a new product |
| `PUT` | `/api/products/:id` | Admin Only | Fully update a product |
| `PATCH` | `/api/products/:id` | Admin Only | Partially update a product |
| `DELETE` | `/api/products/:id` | Admin Only | Delete a product |

### 📦 Orders (`/api/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | User Only | Place a new order (checks and reserves stock atomically) |
| `GET` | `/api/orders` | User Only | List current user's order history |
| `GET` | `/api/orders/:id` | User / Admin | Get a specific order's details (owner or admin only) |
| `PUT` | `/api/orders/:id` | User Only | Edit own order quantity/payment (allowed only if `pending`) |
| `DELETE` | `/api/orders/:id` | User / Admin | Cancel order and restore stock (user can cancel only if `pending`) |
| `GET` | `/api/orders/admin` | Admin Only | List all orders in the system |
| `PUT` | `/api/orders/admin/:id` | Admin Only | Update an order's status (`pending` -> `shipped` -> `delivered`) |

### 🤖 Recommendations (`/api/recommendations`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/recommendations/:userId` | User / Admin | Get AI-generated product suggestions (owner or admin only) |

---

## License

ISC License.
