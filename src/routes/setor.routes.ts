import { Router } from 'express';
import { prosesSetor } from '../controllers/setor.controller';

const router = Router();

/**
 * @route POST /api/setor
 * @desc Proses setor barang (CRITICAL - Atomic transaction)
 */
router.post('/', prosesSetor);

export default router;
