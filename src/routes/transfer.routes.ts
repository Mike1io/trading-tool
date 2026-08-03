import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller.js';

const router = Router();

router.get('/', TransferController.getTransfers);
router.get('/stats', TransferController.getTransferStats);
router.post('/ingest/live', TransferController.ingestLiveTransfer);

export const transferRouter = router;
