require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/dbConnection');
const apiLogger = require('./middleware/apiLogger');

const userProfileRoutes = require('./routes/userProfileRoutes');
const authenticationRoutes = require('./routes/authenticationRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const countryRoutes = require('./routes/countryRoutes');
const { seedCountriesIfNeeded } = require('./controllers/countryController');

const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const corsOptions = {
  origin: process.env.CLIENT_URL || false,
  credentials: true,
};

// Connect to database
connectDB().then(() => {
  seedCountriesIfNeeded();
});

// Global Middleware
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(apiLogger);

// Route Mounts
app.use('/api/user', userProfileRoutes);
app.use('/api/auth', authenticationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/countries', countryRoutes);

// central error handlers
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
