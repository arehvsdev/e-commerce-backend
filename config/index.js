const dotenv = require('dotenv');
dotenv.config();

if (!process.env.MONGO_URI) {
  console.warn("WARNING: MONGO_URI environment variable is missing.");
}

if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET environment variable is missing.");
}

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN,
  HUGGINGFACE_MODEL: process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.2",
};
