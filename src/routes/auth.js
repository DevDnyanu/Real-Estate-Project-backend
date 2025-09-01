import express from 'express';
import { signup, login, verifyToken } from '../controllers/authController.js';
import { validate } from '../Middlewares/authValidation.js';
import { signupValidation, loginValidation } from '../Middlewares/authValidation.js';

const router = express.Router();

// Signup route with validation
router.post('/signup', validate(signupValidation), signup);

// Login route with validation
router.post('/login', validate(loginValidation), login);

// Verify token route
router.get('/verify', verifyToken);

export default router;