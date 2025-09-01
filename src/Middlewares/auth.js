// server/src/middleware/auth.js
import jwt from 'jsonwebtoken';

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Attach complete user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Token is not valid'
    });
  }
};

// Export as default export
export default authenticateToken;