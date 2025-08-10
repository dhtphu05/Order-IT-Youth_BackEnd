// src/routes/messenger.routes.ts
import { Router } from 'express';
import { MessengerController } from '../controllers/messenger.controller';

const MessengerRouter = Router();
const messengerController = new MessengerController();

// GET /webhook - Facebook verification
MessengerRouter.get('/webhook', messengerController.verifyWebhook);

// POST /webhook - Receive messages
MessengerRouter.post('/webhook', messengerController.handleWebhook);

export default MessengerRouter;