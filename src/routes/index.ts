import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { transferRouter } from './transfer.routes.js';
import { hyperliquidRouter } from './hyperliquid.routes.js';
import { exchangeRouter } from './exchange.routes.js';
import { alertRouter } from './alert.routes.js';
import { searchRouter } from './search.routes.js';
import { aiRouter } from './ai.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/transfers', transferRouter);
router.use('/hyperliquid', hyperliquidRouter);
router.use('/exchanges', exchangeRouter);
router.use('/alerts', alertRouter);
router.use('/search', searchRouter);
router.use('/ai', aiRouter);

export const apiRouter = router;
