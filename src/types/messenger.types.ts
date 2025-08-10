export interface MessengerWebhookEntry {
    id: string;
    time: number;
    messaging: MessengerMessage[];
}
export interface MessengerMessage {
    sender: {id: string};
    recipient: {id: string};
    timestamp: number;
    message?: {
        text: string;
        quick_reply?: {
            payload: string;
        };
    }
    referral?:{
        type: string;
        source: string;
        ref: string;
    }
    postback?: {
        payload: string;
    };
}

export interface MessengerWebhookPayload{
    object: string;
    entry: MessengerWebhookEntry[];
}
export interface SendMessagePayload {
    recipient: {id: string};
    message:{
        text: string;
    }
}