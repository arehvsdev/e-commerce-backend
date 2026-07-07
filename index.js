const express = require('express');
const app = express();
const userProfileRoutes = require('./routes/userProfileRoutes');
const connectDB = require('./config/dbConnection');
const authenticationRoutes = require('./routes/authenticationRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.use(express.json());
connectDB();
app.use('/api/user',userProfileRoutes);
app.use('/api/auth', authenticationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.listen( PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
