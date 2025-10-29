import express from 'express';
import { createRentalRequest, getMyRentals, getRentalById, decideOnRequest, scheduleRental, verifyExchange, cancelRental } from '../controllers/rentals.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createRentalRequest);
router.route('/my-rentals').get(protect, getMyRentals);  
router.route('/:id').get(protect, getRentalById);
router.route('/:id/decide').put(protect, decideOnRequest);
router.route("/:id/schedule").put(protect, scheduleRental);
router.route('/:id/verify-exchange').post(protect, verifyExchange);
router.route('/:id/cancel').put(protect, cancelRental);

export default router;