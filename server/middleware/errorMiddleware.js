const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose invalid ObjectId → 400 Bad Request ──────────────────────────
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid resource ID';
  }

  // ── Mongoose ValidationError → 400 with field-level detail ───────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const fields = Object.values(err.errors).map((e) => e.message);
    message = fields.join('. ');
  }

  // ── MongoDB duplicate key → 409 Conflict ─────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with that ${field} already exists`;
  }

  // ── JWT errors → 401 Unauthorized ────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Not authorized — invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized — token has expired';
  }

  // ── Strip stack trace in production ──────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export { notFound, errorHandler };

