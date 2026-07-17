require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const Product = require('./models/product');
const Category = require('./models/category');

const seedData = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-commerce';
  console.log('Connecting to database:', mongoUri);

  try {
    await mongoose.connect(mongoUri);
    console.log('Database connected successfully.');

    // 1. Find or create an admin user
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found. Creating seed admin user...');
      admin = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@gmail.com',
        password: 'Password@123', // Will be hashed by user pre-save hook
        phone: '+91-9876543210',
        role: 'admin',
      });
      console.log('Seed admin user created successfully.');
    } else {
      console.log('Using existing admin user:', admin.email);
    }

    // 2. Clear products and categories
    console.log('Clearing existing products and categories...');
    await Product.deleteMany({});
    await Category.deleteMany({});

    // 3. Create categories
    const categoriesData = [
      { name: 'Electronics' },
      { name: 'Fashion' },
      { name: 'Home & Living' },
      { name: 'Books & Sports' }
    ];

    const seededCategories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${seededCategories.length} categories.`);

    const categoryMap = seededCategories.reduce((acc, cat) => {
      acc[cat.name] = cat._id;
      return acc;
    }, {});

    // 4. Create products
    const productsData = [
      {
        name: 'Premium Wireless Headphones',
        description: 'High-fidelity sound wireless headphones with active noise cancellation and 40-hour battery life.',
        category: categoryMap['Electronics'],
        price: 4999.00,
        stock: 50,
        image: '/images/product/product-01.jpg',
        rating: 4.5,
        sku: 'ELEC-HEAD-001',
        createdBy: admin._id,
      },
      {
        name: 'Ergonomic Office Chair',
        description: 'Fully adjustable ergonomic desk chair with lumbar support and mesh back for maximum comfort.',
        category: categoryMap['Home & Living'],
        price: 12999.00,
        stock: 20,
        image: '/images/product/product-02.jpg',
        rating: 4.7,
        sku: 'HOME-CHAIR-002',
        createdBy: admin._id,
      },
      {
        name: 'Minimalist Leather Backpack',
        description: 'Sleek and durable water-resistant leather backpack featuring a 15-inch laptop compartment.',
        category: categoryMap['Fashion'],
        price: 2499.00,
        stock: 35,
        image: '/images/product/product-03.jpg',
        rating: 4.2,
        sku: 'FASH-BAG-003',
        createdBy: admin._id,
      },
      {
        name: 'Mechanical Gaming Keyboard',
        description: 'Tactile mechanical gaming keyboard with RGB backlighting, custom switches, and durable aluminum top frame.',
        category: categoryMap['Electronics'],
        price: 3499.00,
        stock: 15,
        image: '/images/product/product-04.jpg',
        rating: 4.6,
        sku: 'ELEC-KEYS-004',
        createdBy: admin._id,
      },
      {
        name: 'Stainless Steel Smart Thermos',
        description: 'Double-walled vacuum insulated water bottle with an LED temperature display lid.',
        category: categoryMap['Home & Living'],
        price: 1499.00,
        stock: 80,
        image: '/images/product/product-05.jpg',
        rating: 4.4,
        sku: 'HOME-BOTT-005',
        createdBy: admin._id,
      }
    ];

    const seededProducts = await Product.insertMany(productsData);
    console.log(`Seeded ${seededProducts.length} new products successfully.`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seedData();
