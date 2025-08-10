import {Request, Response} from 'express';
import { MessengerService } from '../services/messenger.service';
import { MessengerWebhookPayload } from '../types/messenger.types';

export class MessengerController {
    private messengerService: MessengerService;

    constructor(){
        this.messengerService = new MessengerService();
    }

    //GET /webhook - Verify webhook with Facebook
    verifyWebhook = (req: Request, res: Response): void =>{
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        
        const result = this.messengerService.verifyWebhook(
            mode as string,
            token as string,
            challenge as string
        )
        if(result){
            res.status(200).send(result);
        }
        else{
            res.status(403).send('Forbidden');
        }
    }

    // POST /webhook - Handle incoming messages from Facebook
    handleWebhook = async (req: Request, res: Response): Promise<void> =>{
        try{
            const body: MessengerWebhookPayload = req.body;
            await this.messengerService.handleWebhook(body);
            res.status(200).send('EVENT_RECEIVED');
        }
        catch (error) {
            console.error('Error handling webhook:', error);
            res.status(500).send('Internal Server Error');
        }
    }
}