import { Router } from 'express';
import { createRequest, getMyRequests, getAdminRequests, approveRequest, rejectRequest } from '../controllers/request.controller';

const router = Router();

// Create a new deposit request
router.post('/', createRequest);

// Get requests for the current user (requires userId query param)
router.get('/my', getMyRequests);

// Get requests for an admin (requires adminId query param)
router.get('/admin', getAdminRequests);

// Approve a request
router.patch('/:id/approve', approveRequest);

// Reject a request
router.patch('/:id/reject', rejectRequest);

export default router;
