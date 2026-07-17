const ApiLog = require('../models/apiLog');

const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'cookie', 'secret', 'apiKey'];

const sanitizeForLogging = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLogging(item));
  }

  if (typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, nestedValue]) => {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        acc[key] = '[REDACTED]';
        return acc;
      }

      acc[key] = sanitizeForLogging(nestedValue);
      return acc;
    }, {});
  }

  return String(value);
};

const apiLogger = (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }

  const startedAt = Date.now();
  const logPayload = {
    method: req.method,
    path: req.originalUrl || req.url,
    statusCode: null,
    responseTimeMs: null,
    ip:
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.ip ||
      req.connection?.remoteAddress ||
      null,
    userAgent: req.get('user-agent') || null,
    userId: req.user?._id || req.user?.id || null,
    requestBody: sanitizeForLogging(req.body),
    query: sanitizeForLogging(req.query),
    params: sanitizeForLogging(req.params),
  };

  let logDocument = null;

  ApiLog.create(logPayload)
    .then((createdLog) => {
      logDocument = createdLog;
    })
    .catch((error) => {
      console.error('Failed to save API log:', error);
    });

  const finalizeLog = () => {
    if (!logDocument) {
      return;
    }

    const updates = {
      statusCode: res.statusCode,
      responseTimeMs: Date.now() - startedAt,
    };

    const currentUserId = req.user?._id || req.user?.id || null;
    if (currentUserId) {
      updates.userId = currentUserId;
    }

    logDocument
      .updateOne(updates)
      .catch((error) => {
        console.error('Failed to update API log:', error);
      });
  };

  res.once('finish', finalizeLog);
  res.once('close', finalizeLog);
  res.once('error', finalizeLog);
  next();
};

module.exports = apiLogger;
