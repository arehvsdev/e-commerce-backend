const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("../config/dbConnection");
const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");

const userProfileRoutes = require("../routes/userProfileRoutes");
const authenticationRoutes = require("../routes/authenticationRoutes");
const productRoutes = require("../routes/productRoutes");
const orderRoutes = require("../routes/orderRoutes");
const recommendationRoutes = require("../routes/recommendationRoutes");
const { notFoundHandler, errorHandler } = require("../middleware/errorHandler");

let server;
let baseUrl;
const PORT = 5099;

test.before(async () => {
  // Connect to the DB
  await connectDB();

  // Clean up any stale test accounts or products
  await User.deleteMany({ email: { $regex: /@test\.com$/ } });
  await Product.deleteMany({ name: { $regex: /^Test Product/ } });
  await Order.deleteMany({});

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/user", userProfileRoutes);
  app.use("/api/auth", authenticationRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/recommendations", recommendationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      baseUrl = `http://localhost:${PORT}`;
      resolve();
    });
  });
});

test.after(async () => {
  // Clean up database records
  await User.deleteMany({ email: { $regex: /@test\.com$/ } });
  await Product.deleteMany({ name: { $regex: /^Test Product/ } });
  await Order.deleteMany({});

  await mongoose.connection.close();
  await new Promise((resolve) => server.close(resolve));
});

test("E-Commerce API Integration Tests", async (t) => {
  let userToken;
  let adminToken;
  let userId;
  let adminId;
  let productId;
  let orderId;

  // 1. Authentication: Register User
  await t.test("Register User successfully", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "user@test.com",
        password: "Password123",
        phone: "1234567890",
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, "user@test.com");
    assert.equal(body.data.user.role, "user");
    userId = body.data.user.id;
  });

  // 2. Authentication: Register Admin via Admin User creation route
  // We first register standard admin via auth/register (it defaults to user role), 
  // then we can seed a real admin directly in db for test purposes.
  await t.test("Seed Admin user directly in DB", async () => {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("AdminPassword123", 12);
    const adminUser = await User.create({
      name: "Test Admin",
      email: "admin@test.com",
      password: hashedPassword,
      phone: "0987654321",
      role: "admin",
    });
    adminId = adminUser._id.toString();
    assert.ok(adminId);
  });

  // 3. Authentication: Login User
  await t.test("Login User successfully", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user@test.com",
        password: "Password123",
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.token);
    userToken = body.data.token;
  });

  // 4. Authentication: Login Admin
  await t.test("Login Admin successfully", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@test.com",
        password: "AdminPassword123",
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.token);
    assert.equal(body.data.user.role, "admin");
    adminToken = body.data.token;
  });

  // 5. Product Management: Admin creates a product
  await t.test("Admin creates product successfully", async () => {
    const res = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Test Product A",
        description: "A wonderful test product description",
        category: "Electronics",
        price: 299.99,
        stock: 50,
        image: "http://example.com/image.jpg",
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.product.name, "Test Product A");
    assert.equal(body.data.product.stock, 50);
    productId = body.data.product._id;
  });

  // 6. Product Management: User cannot create a product (403 check)
  await t.test("User cannot create product", async () => {
    const res = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: "Test Product B",
        description: "Another description",
        category: "Clothing",
        price: 49.99,
        stock: 10,
        image: "http://example.com/clothing.jpg",
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 403);
    assert.equal(body.success, false);
  });

  // 7. Product Listing: Public Search & Filters
  await t.test("List products with search and category filters", async () => {
    const res = await fetch(`${baseUrl}/api/products?search=Wonderful&category=Electronics`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.products.length >= 1);
    assert.equal(body.data.products[0].name, "Test Product A");
    assert.equal(body.data.currentPage, 1);
  });

  // 8. Order Placement: User places order (Stock decrement check)
  await t.test("Place order successfully", async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        productId,
        quantity: 5,
        paymentMethod: "credit_card",
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.order.quantity, 5);
    orderId = body.data.order._id;

    // Verify stock decremented in db
    const product = await Product.findById(productId);
    assert.equal(product.stock, 45); // 50 - 5 = 45
  });

  // 9. Order Validation: Out of stock check
  await t.test("Place order fails if insufficient stock", async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        productId,
        quantity: 100, // exceeds 45 stock
        paymentMethod: "credit_card",
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.success, false);
  });

  // 10. Order Edit: User updates pending order quantity
  await t.test("User updates pending order quantity (Stock adjusts correctly)", async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        quantity: 8, // Increase by 3 (from 5 to 8)
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.order.quantity, 8);

    // Verify stock decremented by another 3
    const product = await Product.findById(productId);
    assert.equal(product.stock, 42); // 45 - 3 = 42
  });

  // 11. Order Status Security: User cannot update status
  await t.test("User cannot update order status", async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        status: "shipped",
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 403);
    assert.equal(body.success, false);
  });

  // 12. Admin Order Control: Admin lists all orders
  await t.test("Admin fetches all orders", async () => {
    const res = await fetch(`${baseUrl}/api/orders/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.orders.length >= 1);
  });

  // 13. Admin Order Control: Admin updates status
  await t.test("Admin updates order status successfully", async () => {
    const res = await fetch(`${baseUrl}/api/orders/admin/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: "shipped",
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.order.status, "shipped");
  });

  // 14. Order Edit Safety: User cannot edit shipped order
  await t.test("User cannot edit shipped order", async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        quantity: 10,
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.success, false);
  });

  // 15. User Profile: Fetch and Update Profile
  await t.test("User updates profile", async () => {
    const res = await fetch(`${baseUrl}/api/user/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: "Test User Updated",
        phone: "9999999999",
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.user.name, "Test User Updated");
  });

  // 16. Recommendations: User fetches recommendations (Fallback check)
  await t.test("Get user recommendations", async () => {
    const res = await fetch(`${baseUrl}/api/recommendations/${userId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.recommendedProducts));
    assert.ok(body.data.source);
  });
});
