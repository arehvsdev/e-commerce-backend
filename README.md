# E-Commerce Backend (Express + MongoDB)

This is a clean, highly readable, and production-style Node.js backend for an e-commerce platform. It provides user authentication, role-based authorization, product catalog management (with search, category/price filters, and pagination), order processing (with race-condition protection), and AI-driven product recommendations.

Designed as a high-quality, maintainable industry project, it prioritizes simple, flat architectures, robust request validations, and standardized, clean API response contracts.

---

## Folder Structure

The project maintains a simple, flat layer structure:
```text
config/             # App configurations and MongoDB connection
controllers/        # Route controllers containing business logic
middleware/         # Authentication, authorization, and global error handling
models/             # Mongoose schemas (User, Product, Order)
routes/             # Express routing definitions
services/           # External API wrappers (Hugging Face recommendations)
utils/              # Standardized API response wrappers and AppError definition
validators/         # express-validator request validation rulesets
test/               # Native controller and HTTP integration tests
index.js            # Express app initialization and mounting entry point
postman_collection.json # Exported Postman API collection for local testing
```

---

## Installation & Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher is recommended.
- **MongoDB**: A running local instance of MongoDB (default: `mongodb://127.0.0.1:27017`) or a MongoDB Atlas Cloud Cluster.

### 2. Clone and Install
In your terminal, run:
```bash
# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root of the project by copying the example:
```bash
cp .env.example .env
```
Ensure you customize the parameters inside your `.env` file:
- `PORT`: Port for the Express server (default: `5000`)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key used to sign JWT tokens
- `JWT_EXPIRES_IN`: JWT expiration length (e.g., `1d` for 1 day)
- `HUGGINGFACE_API_KEY`: API token from Hugging Face (optional; fallback logic runs if missing)
- `HUGGINGFACE_MODEL`: Model name for AI recommendation generation (default: `mistralai/Mistral-7B-Instruct-v0.2`)
- `ALLOWED_ORIGINS`: Comma-separated list of origins allowed by CORS (default: `*` if unconfigured)

---

## How to Run

### Run in Development Mode
Starts the application and watches for file changes using `nodemon`:
```bash
npm run dev
```

### Run in Production Mode
Starts the server with Node directly:
```bash
npm start
```

---

## Testing & Verification

The project includes both unit-style controller tests and full HTTP integration tests under the `test/` directory.

### Run all tests
Executes the native Node.js test runner:
```bash
npm test
```

### Run manual tests using Postman
Import the file [`postman_collection.json`](file:///d:/projects/express_sample/e-commerce-backend/postman_collection.json) in your project root directly into Postman or Thunder Client:
1. Set the collection variables if needed (the default `baseUrl` is `http://localhost:5000`).
2. Run the **Register User** request in the `Authentication` folder to set up a test user.
3. Run the **Login User** request. The post-response script automatically saves the returned bearer token to the collection variable `token` for subsequent authenticated calls.
4. Test products, order placement, admin dashboards, and recommendations.

---

## Standardized API Responses

The application enforces a consistent response structure across all endpoints.

### Success Response
Successful requests always return a `2xx` status code and wrap results inside a `data` object:
```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": {
    "currentPage": 1,
    "totalPages": 5,
    "totalProducts": 48,
    "products": [
      {
        "_id": "60d5ec4b1234567890abcdef",
        "name": "Designer Cotton Shirt",
        "category": "Clothing",
        "price": 45.99,
        "stock": 250,
        "image": "http://example.com/image.jpg",
        "rating": 4.5
      }
    ]
  }
}
```

### Error Response
Unsuccessful requests return appropriate HTTP status codes (`4xx` or `5xx`) and a unified message:
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Validation Error Response
Input validation failures (handled via `express-validator`) return a `400 Bad Request` and detailed field mappings:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

---

## Hugging Face Recommendation Engine

The recommendation API (`GET /api/recommendations/:userId`) suggests products for a user by taking into account their purchasing history.

### How it works
1. **Fetch Purchase History**: Retrieves the list of products previously ordered by the user.
2. **Fetch Available Products**: Loads all currently active products in stock (excluding those the user has already bought).
3. **Prompt Construction**: Generates a structured system instruction prompt containing the purchase history and list of available options, requesting a strict JSON recommendation array.
4. **Hugging Face Model Call**: Invokes the configured model (e.g. `Mistral-7B-Instruct-v0.2`) via the serverless Hugging Face Inference API.
5. **JSON Parse & Filter**: Matches the JSON response block and resolves the product suggestions.

### Fallback Mechanism
If the `HUGGINGFACE_API_KEY` is not configured, or if the Hugging Face API is rate-limited or fails, the engine **automatically falls back to a category-based recommendation**:
1. It analyzes the categories of the user's purchased products.
2. It fetches in-stock products in the same categories that the user hasn't bought yet.
3. It sorts these category matches by rating (descending) and price (ascending).
4. If no purchase history exists, it defaults to the highest-rated available products in the store.
5. It returns these items labeled with `"source": "fallback"`.

---

## Detailed API Endpoint Reference

### 🔐 Authentication (`/api/auth`)
- **`POST /api/auth/register`** (Public)
  - Registers a user. Ignores role properties in the body (defaults to `"user"`).
- **`POST /api/auth/login`** (Public)
  - Returns a signed JWT. Outputs a generic error if credentials fail to prevent account enumeration.
- **`GET /api/auth/healthCheck`** (Public)
  - Verifies database and server availability.

### 👤 User Profiles & User Management (`/api/user`)
- **`GET /api/user/profile`** (User/Admin)
  - Fetches the profile of the logged-in user.
- **`PUT /api/user/profile`** (User/Admin)
  - Updates own name and phone numbers (ignores email and role updates).
- **`DELETE /api/user/profile`** (User/Admin)
  - Deletes the logged-in user's account.
- **`GET /api/user`** (Admin Only)
  - Lists all users registered on the platform (excluding passwords).
- **`POST /api/user`** (Admin Only)
  - Creates a new user (admin can specify any role).
- **`GET /api/user/:id`** (Admin Only)
  - Fetches user details by ID.
- **`PUT /api/user/:id`** (Admin Only)
  - Updates any user's fields, including role assignment.
- **`DELETE /api/user/:id`** (Admin Only)
  - Deletes any user.

### 🏷️ Products (`/api/products`)
- **`GET /api/products`** (Public)
  - Lists all products. Supports query options: `search` (partial regex on name/description), `category`, `minPrice`, `maxPrice`, `sort` (`price`, `rating`, `createdAt`), `page`, and `limit`.
- **`GET /api/products/:id`** (Public)
  - Fetches product detail.
- **`POST /api/products`** (Admin Only)
  - Creates a product.
- **`PUT /api/products/:id`** (Admin Only)
  - Updates a product (whitelists body fields to block unauthorized fields like `rating`).
- **`DELETE /api/products/:id`** (Admin Only)
  - Deletes a product.

### 📦 Orders (`/api/orders`)
- **`POST /api/orders`** (User Only)
  - Places an order. Atomically decrements the stock to protect against race conditions.
- **`GET /api/orders`** (User Only)
  - Lists the user's order history.
- **`GET /api/orders/:id`** (User/Admin)
  - Gets a specific order (restricted to the owner or admins).
- **`PUT /api/orders/:id`** (User Only)
  - Updates order quantity/payment. Allowed **only if the order is still pending**. Automatically adjusts stock balances.
- **`DELETE /api/orders/:id`** (User/Admin)
  - Cancels an order. Allowed for users **only if the order is pending**. Restores stock balances atomically.
- **`GET /api/orders/admin`** (Admin Only)
  - Lists all orders placed on the system.
- **`PUT /api/orders/admin/:id`** (Admin Only)
  - Updates order status (e.g. `pending`, `shipped`, `delivered`).

### 🤖 Recommendations (`/api/recommendations`)
- **`GET /api/recommendations/:userId`** (User/Admin)
  - Fetches AI recommendations (restricted to the owner or admins).
