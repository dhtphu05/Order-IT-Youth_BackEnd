import { OrderService } from './order.service';
import { MessengerWebhookPayload, SendMessagePayload } from '../types/messenger.types';
import { Order } from '../entities/Order';


export class MessengerService {
    private orderService: OrderService;
    private pageAccessToken: string;
    private verifyToken: string;

    constructor() {
        this.orderService = new OrderService();
        this.pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
        this.verifyToken = process.env.FACEBOOK_VERIFY_TOKEN || '';
    }

    //verify webhook voi facebook

    verifyWebhook(mode: string, token: string, challenge: string): string | null {
        if (mode === 'subscribe' && token == this.verifyToken) {
            console.log('Webhook verified successfully');
            return challenge;
        }
        else {
            console.error('Webhook verification failed');
            return null;
        }
    }
    //handle incoming message from facebook
    async handleWebhook(body: MessengerWebhookPayload): Promise<void> {
        if (body.object !== 'page') {
            console.error('Invalid webhook object');
            return;
        }
        for (const entry of body.entry) {
            for (const messagingEvent of entry.messaging) {
                const senderId = messagingEvent.sender.id;
                //handle referral when user click on link
                if (messagingEvent.referral) {
                    await this.handleReferral(senderId, messagingEvent.referral.ref);

                }
                //handle text message
                if (messagingEvent.message && messagingEvent.message.text) {
                    const text = messagingEvent.message.text;
                    await this.handleTextMessage(senderId, text);
                }
            }
        }
    }

    //handle referral from m.messenger link
    private async handleReferral(psid: string, referralCode: string): Promise<void> {
        try {
            console.log(`Handling referral for PSID: ${psid}, Referral Code: ${referralCode}`);
            //call order service to handle referral
            await this.orderService.handleMessengerWebhook(psid, referralCode);

            //send a welcome message
            await this.sendWelcomeMessage(psid);
        }
        catch (error) {
            console.error('Error handling referral:', error);
            await this.sendMessage(psid, 'Xin lỗi, có một chút lỗi xảy ra khi xử lý đơn hàng của bạn, bạn vui lòng đặt lại đơn giúp chúng mình nhé.');

        }
    }
    private async handleTextMessage(psid: string, text: string): Promise<void> {
        console.log(`Received text message from PSID: ${psid}, Text: ${text}`);
        //handle sau

    }
    private async sendWelcomeMessage(psid: string): Promise<void> {
        const message = `Chao mung ban da den voi itm`;
        await this.sendMessage(psid, message);
    }

    //send message to user using messenger api
    async sendMessage(psid: string, text: string): Promise<void> {
        const payload: SendMessagePayload = {
            recipient: { id: psid },
            message: { text }
        };
        try {
            const response = await fetch('https://graph.facebook.com/v18.0/me/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.pageAccessToken}`
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`Error sending message: ${response.statusText}`);
            }
            else {
                const error = await response.text();
                console.log('Message sent successfully:', error);
            }
        }
        catch (error) {
            console.error('Error sending message:', error);
        }
    }
    async sendOrderConfirmation(psid: string, order: Order): Promise<void> {
        const orderItems = order.orderItems
            .map(item => ` - ${item.quantity} x ${item.product.name} (${Number(item.price).toLocaleString()}đ)`)
            .join('\n');
        const message = `📋 XÁC NHẬN ĐƠN HÀNG

                Mã đơn hàng: #${order.referralCode}

                📦 Chi tiết:
                ${orderItems}

                💰 Tổng tiền: ${Number(order.totalPrice).toLocaleString()}đ

                📍 Địa chỉ giao hàng:
                ${order.address}
                📞 SĐT: ${order.phone}  
                👤 Người nhận: ${order.name}

                ${order.note ? `📝 Ghi chú: ${order.note}` : ''}

                Đơn hàng đang được xử lý. Chúng tôi sẽ liên hệ sớm nhất! 🚚`;
        await this.sendMessage(psid, message);
    }

}