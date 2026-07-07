const test = require('node:test');
const assert = require('node:assert/strict');

const productController = require('../controllers/productController');
const Product = require('../models/product');

test('createProduct forwards unexpected errors to the centralized error handler', async () => {
  const originalCreate = Product.create;
  Product.create = async () => {
    throw new Error('database failure');
  };

  const req = { body: {}, user: { id: 'user-1' } };
  const res = {};
  let nextError = null;
  const next = (error) => {
    nextError = error;
  };

  await productController.createProduct(req, res, next);
  await new Promise((resolve) => setImmediate(resolve));

  assert.ok(nextError instanceof Error);
  assert.equal(nextError.message, 'database failure');

  Product.create = originalCreate;
});
