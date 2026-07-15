const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config/index');
const connectDB = require('./config/dbConnection');
const User = require('./models/user');

const seedAdmin = async () => {
  try {
    // 1. Connect to MongoDB
    console.log("Connecting to database...");
    await connectDB();

    // 2. Define Admin Data
    const adminEmail = 'agreesh777@gmail.com';
    const adminPassword = 'Zx.tyu678';
    const adminName = 'Admin user';

    // 3. Check if Admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin user with email "${adminEmail}" already exists.`);
      process.exit(0);
    }

    // 4. Hash password and save new Admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const newAdmin = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      phone: '9999999999',
      role: 'admin'
    });

    await newAdmin.save();
    console.log("Admin user seeded successfully!");
    console.log(`Email: ${adminEmail}`);
    console.log("Password: (as specified)");
    console.log("Role: admin");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin user:", error);
    process.exit(1);
  }
};

seedAdmin();
