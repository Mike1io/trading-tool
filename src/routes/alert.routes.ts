import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all alert routes with JWT
router.use(authenticateJWT);

router.post('/', AlertController.createAlert);
router.get('/', AlertController.getAlerts);
router.patch('/:id', AlertController.updateAlert);
router.delete('/:id', AlertController.deleteAlert);

router.get('/notifications', AlertController.getNotifications);
router.post('/test', AlertController.testAlertDispatch);

export const alertRouter = router;
