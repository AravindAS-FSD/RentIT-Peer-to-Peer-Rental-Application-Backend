import express from 'express';
import { registerUser, loginUser, verifyUser, resendVerificationEmail, forgotPassword, resetPassword } from '../controllers/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify/:token', verifyUser);
router.post('/resend-verification', resendVerificationEmail); 
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

export default router;