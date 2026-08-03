import { Router } from 'express';
import { ExchangeController } from '../controllers/exchange.controller.js';

const router = Router();

router.get('/', ExchangeController.getExchanges);
router.get('/wallets', ExchangeController.getExchangeWallets);
router.get('/flows', ExchangeController.getExchangeFlows);
router.post('/wallets', ExchangeController.addExchangeWallet);

export const exchangeRouter = router;
