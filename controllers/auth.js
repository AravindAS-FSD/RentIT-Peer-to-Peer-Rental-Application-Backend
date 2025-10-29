import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }
        const COLLEGE_DOMAIN = 'ritrjpm.ac.in';
        if (!email.endsWith(`@${COLLEGE_DOMAIN}`)) {
            return res.status(400).json({ message: `Registration is only open to @${COLLEGE_DOMAIN} emails.` });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const emailLocalPart = email.split('@')[0];
        const role = /^[0-9]/.test(emailLocalPart) ? 'student' : 'staff';

        const user = await User.create({
            name,
            email,
            password,
            role,
        });

        if (!user) {
             return res.status(400).json({ message: 'Invalid user data' });
        }

        const verificationToken = jwt.sign({id: user._id }, 
            process.env.JWT_SECRET, {
                expiresIn: '1d',
            }
        );

        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        const emailHtml = `
            <h2>Welcome to Renit, ${name}!</h2>
            <p>Your role has been assigned as: <strong>${role}</strong>.</p>
            <p>Please click the button below to verify your email address and activate your account.</p>
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify My Account</a>
            <p>This link will expire in 24 hours.</p>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Renit - Please Verify Your Account',
            html: emailHtml,
        });

        res.status(201).json({
            message: 'Registration successful! Please check your email to verify your account.',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        if (user.status !== 'verified') {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id), 
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error); 
        res.status(500).json({ message: 'Server Error' });
    }
};

export const verifyUser = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found. Verification failed.' });
        }

        user.status = 'verified';
        await user.save();
        
        res.status(200).json({ message: 'Account successfully verified!' });

    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired verification link.' });
    }
};

export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ message: 'If an account with this email exists, a new verification link has been sent.' });
        }

        if (user.status === 'verified') {
            return res.status(400).json({ message: 'This account has already been verified.' });
        }

        const verificationToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        
        const emailHtml = `
            <h2>Hi ${user.name},</h2>
            <p>We received a request to resend your account verification link.</p>
            <p>Please click the button below to verify your email address.</p>
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify My Account</a>
            <p>This link will expire in 24 hours.</p>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Renit - Resend Account Verification',
            html: emailHtml,
        });

        res.status(200).json({ message: 'A new verification link has been sent to your email.' });

    } catch (error) {
        console.error('RESEND VERIFICATION ERROR:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({ message: 'If an account with this email exists, a password reset link has been sent.' });
        }

        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '15m', 
        });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const emailHtml = `
            <h2>Hi ${user.name},</h2>
            <p>Someone requested a password reset for your Renit account.</p>
            <p>If this was you, please click the button below to set a new password. This link is only valid for 15 minutes.</p>
            <a href="${resetUrl}" style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset My Password</a>
            <p>If you did not request this, please ignore this email.</p>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Renit - Password Reset Request',
            html: emailHtml,
        });

        res.status(200).json({ message: 'If an account with this email exists, a password reset link has been sent.' });

    } catch (error) {
        console.error('FORGOT PASSWORD ERROR:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { resetToken } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'New password is required.' });
        }

        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.password = password;
        await user.save();

        res.status(200).json({ message: 'Password has been updated successfully. Please login.' });

    } catch (error) {
        console.error('RESET PASSWORD ERROR:', error);
        res.status(400).json({ message: 'Invalid or expired password reset link.' });
    }
};