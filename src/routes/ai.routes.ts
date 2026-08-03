import { Router } from 'express';
import { AIController } from '../controllers/ai.controller.js';

const router = Router();

router.get('/wallet/:address', AIController.getWalletAIReport);
router.get('/token/:symbol', AIController.getTokenAIReport);
router.get('/copy-trading', AIController.getCopyTradingOpportunities);
router.get('/market-summary', AIController.getMarketAISummary);

export const aiRouter = router;
