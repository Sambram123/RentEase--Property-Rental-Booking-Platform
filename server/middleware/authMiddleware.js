import asyncHandler from '../utils/asyncHandler.js';
// import jwt from 'jsonwebtoken'; — enable when auth is implemented

const getTokenFromHeader = (req) => {
  if (req.headers.authorization?.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

const protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  // TODO: Verify JWT and attach user when authentication is implemented
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // req.user = await User.findById(decoded.id).select('-password');

  next();
});

export { protect, getTokenFromHeader };
