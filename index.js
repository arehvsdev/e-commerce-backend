const express = require('express');
const app = express();

const dotenv = require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use

app.listen( PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
