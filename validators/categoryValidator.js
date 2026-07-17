const createCategoryValidator = (req, res, next) => {
  const errors = [];
  const allowed = ['name'];

  for (const key of Object.keys(req.body || {})) {
    if (!allowed.includes(key)) {
      errors.push({ field: key, message: 'Field is not allowed' });
    }
  }

  const { name } = req.body || {};

  if (name === undefined || name === null || name.trim() === '') {
    errors.push({ field: 'name', message: 'Category name is required' });
  } else if (name.trim().length < 2 || name.trim().length > 60) {
    errors.push({ field: 'name', message: 'Category name must be between 2 and 60 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  if (req.body && name) {
    req.body.name = name.trim();
  }

  next();
};

const updateCategoryValidator = createCategoryValidator;

module.exports = {
  createCategoryValidator: [createCategoryValidator],
  updateCategoryValidator: [updateCategoryValidator],
};
