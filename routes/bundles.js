import express from 'express';
import { createBundle, getMyBundles } from '../controllers/bundles.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
.post(protect, createBundle);

router.route('/my-bundles')
.get(protect, getMyBundles);

export default router;