import { Router } from 'express';
import {
    getDetailSetorById,
    updateDetailSetorQty,
    deleteDetailSetor
} from '../controllers/detailSetor.controller';

const router = Router();

// GET /api/detail-setor/:id - Get detail setor by ID
router.get('/:id', getDetailSetorById);

// PATCH /api/detail-setor/:id/qty - Update qty
router.patch('/:id/qty', updateDetailSetorQty);

// DELETE /api/detail-setor/:id - Delete detail setor
router.delete('/:id', deleteDetailSetor);

export default router;
