const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    responseTimeMs: {
      type: Number,
      default: null,
    },
    ip: {
      type: String,
      default: null,
      trim: true,
    },
    userAgent: {
      type: String,
      default: null,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    requestBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    query: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    params: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true, collection: 'api_logs' }
);

apiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('ApiLog', apiLogSchema);
