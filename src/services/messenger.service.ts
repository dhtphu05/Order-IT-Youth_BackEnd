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

                //case 1: new user - handle postback with referral 
                if(messagingEvent.postback){
                    await this.handlePostback(senderId, messagingEvent.postback);
                }

                //case 2: returning user- handle direct refferal
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
    //case 1: handle postback with referral
    private async handlePostback(psid: string, postback: any): Promise<void>{
        try{
            console.log('Handling postback from PSID:', psid, 'Postback:', postback);
            const payload = postback.payload;

            //check if this is a get started with referral
            if(payload === 'GET_STARTED' && postback.referral?.ref){
                const referralCode = postback.referral.ref;
                console.log(`Referral code received: ${referralCode}`);

                await this.linkOrderAndPsid(psid, referralCode, 'first-time');

                //send a welcome message
                await this.sendFirstTimeWelcomeMessage(psid);
            }
            else if( payload === 'GET_STARTED'){
                console.log('No referral code found, sending welcome message');
                await this.sendRegularWelcomeMessage(psid);
            }
            else{
                await this.handleOtherPostback(psid, payload);
            }
        }
        catch (error) {
            console.error('Error handling postback:', error);
            await this.sendMessage(psid, 'Xin lỗi, có một chút lỗi xảy ra khi xử lý yêu cầu của bạn, bạn vui lòng thử lại nhé.');
        }

    }
    //handle referral from m.messenger link
    private async handleReferral(psid: string, referralCode: string): Promise<void> {
        try {
            console.log(`Handling referral for PSID: ${psid}, Referral Code: ${referralCode}`);
            //call order service to handle referral
            await this.linkOrderAndPsid(psid, referralCode, 'returning');

            //send a welcome message
            // await this.sendWelcomeMessage(psid);
            await this.sendReturningUserMessage(psid);
        }
        catch (error) {
            console.error('Error handling referral:', error);
            await this.sendMessage(psid, 'Xin lỗi, có một chút lỗi xảy ra khi xử lý đơn hàng của bạn, bạn vui lòng đặt lại đơn giúp chúng mình nhé.');

        }
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
    private async linkOrderAndPsid(psid: string, referralCode: string, userType: 'first-time' | 'returning'): Promise<Order | null> {
        try{
            console.log(`Linking PSID: ${psid} with Referral Code: ${referralCode} as ${userType}`);

            //call order service to link psid and referral code
            const order = await this.orderService.handleMessengerWebhook(psid, referralCode, userType);

            if(order){
                console.log(`Order linked successfully: ${order.referralCode}`);
                //send order confirmation message
                await this.sendOrderConfirmation(psid, order);
                return order;
            }
            else{
                console.log(`No order found for PSID: ${psid} with Referral Code: ${referralCode}`);
                await this.sendMessage(psid, 'Xin lỗi, không tìm thấy đơn hàng của bạn. Vui lòng thử lại sau hoặc liên hệ với chúng tôi để được hỗ trợ.');
                return null;    
            }
        }
        catch (error) {
            console.error('Error linking order and PSID:', error);
            await this.sendMessage(psid, 'Xin lỗi, có một chút lỗi xảy ra khi xử lý đơn hàng của bạn, bạn vui lòng đặt lại đơn giúp chúng mình nhé.');
            return null;
        }
    }
    private async handleOtherPostback(psid: string, payload: string): Promise<void> {
        switch (payload){
            case 'MAIN_MENU':
                await this.sendMainMenu(psid);
                break;
            case 'CHECK_ORDER':
                await this.sendMessage(psid, '📦 Để kiểm tra đơn hàng, vui lòng cung cấp mã đơn hàng của bạn.');
                break;
            case 'SUPPORT':
                await this.sendMessage(psid, '🎯 Chúng tôi sẵn sàng hỗ trợ bạn! Vui lòng mô tả vấn đề bạn gặp phải.');
                break;
            default:
                console.log(`🤔 Unknown postback payload: ${payload}`);
                await this.sendMessage(psid, 'Xin lỗi, tôi không hiểu yêu cầu của bạn. Vui lòng thử lại.');
        }
    }
    private async handleTextMessage(psid: string, text: string): Promise<void> {
        console.log(`💬 Text message from PSID: ${psid}, Text: ${text}`);
        
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('hello') || lowerText.includes('xin chào') || lowerText.includes('hi')) {
            await this.sendRegularWelcomeMessage(psid);
        } else if (lowerText.includes('đơn hàng') || lowerText.includes('order')) {
            await this.sendMessage(psid, '📦 Để kiểm tra đơn hàng, vui lòng cung cấp mã đơn hàng của bạn (VD: order_1234567890_abc123)');
        } else if (lowerText.includes('hỗ trợ') || lowerText.includes('help')) {
            await this.sendMessage(psid, '🎯 Chúng tôi sẵn sàng hỗ trợ bạn! Vui lòng mô tả vấn đề bạn gặp phải.');
        } else {
            await this.sendMessage(psid, '📞 Cảm ơn tin nhắn của bạn! Chúng tôi sẽ phản hồi sớm nhất có thể.');
        }
    }

    // 🎉 Send first-time user welcome message
    private async sendFirstTimeWelcomeMessage(psid: string): Promise<void> {
        const message = `🎉 Chào mừng bạn đến với IT-Badminton!

Cảm ơn bạn đã đặt hàng! Chúng tôi đã nhận được thông tin đơn hàng của bạn.

✨ Đơn hàng của bạn đang được xử lý và chúng tôi sẽ gửi thông tin chi tiết ngay sau đây.

Cảm ơn bạn đã tin tưởng chúng tôi! 🙏`;

        await this.sendMessage(psid, message);
    }

    // 👋 Send regular welcome message (no order)
    private async sendRegularWelcomeMessage(psid: string): Promise<void> {
        const message = `👋 Chào mừng bạn đến với IT-Badminton!

🏸 Chúng tôi chuyên cung cấp dịch vụ đặt hàng online nhanh chóng và tiện lợi.

✨ Tính năng:
• 📦 Đặt hàng online
• 🚚 Giao hàng tận nơi  
• 💬 Hỗ trợ 24/7

Để bắt đầu đặt hàng, vui lòng truy cập website của chúng tôi!

Cảm ọn bạn đã quan tâm! ❤️`;

        await this.sendMessage(psid, message);
    }

    // 🔄 Send returning user message
    private async sendReturningUserMessage(psid: string): Promise<void> {
        const message = `🔄 Chào mừng bạn quay lại!

Chúng tôi đã nhận được thông tin đơn hàng mới của bạn và sẽ gửi chi tiết xác nhận ngay sau đây.

Cảm ơn bạn đã tiếp tục tin tưởng chúng tôi! 🙏`;

        await this.sendMessage(psid, message);
    }

    // 🏠 Send main menu
    private async sendMainMenu(psid: string): Promise<void> {
        const message = `🏠 MENU CHÍNH

Chọn một trong các tùy chọn sau:
• 📦 Kiểm tra đơn hàng
• 🛒 Đặt hàng mới  
• 🎯 Hỗ trợ khách hàng

Hoặc nhắn tin trực tiếp cho chúng tôi!`;

        await this.sendMessage(psid, message);
    }




}