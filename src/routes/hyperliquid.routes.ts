import { Router } from 'express';
import { HyperliquidController } from '../controllers/hyperliquid.controller.js';

const router = Router();

router.get('/positions', HyperliquidController.getPositions);
router.get('/trades', HyperliquidController.getTrades);
router.get('/summary', HyperliquidController.getMarketSummary);
router.post('/ingest/mock', HyperliquidController.ingestMockHyperEvent);

export const hyperliquidRouter = router;
