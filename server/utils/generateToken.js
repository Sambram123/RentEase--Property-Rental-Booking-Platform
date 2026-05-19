import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for a user.
 * @param {object} payload  - { id, role }
 * @param {string} expiresIn - default '7d'
 */
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export default generateToken;
