// src/services/order.service.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Product } from '../entities/Product';
import { User } from '../entities/User';
import { CreateOrderDTO, OrderResponse, OrderListResponse, OrderStatus, WebOrderResponse, ClaimOrdersDTO, ClaimOrdersResponse } from '../types/order.types';
import { MessengerService } from './messenger.service';
import { SessionService } from './session.service';
export class OrderService {
    private orderRepo: Repository<Order>;
    private orderItemRepo: Repository<OrderItem>;
    private productRepo: Repository<Product>;
    private userRepo: Repository<User>;
    private sessionService: SessionService;


    constructor() {
        this.orderRepo = AppDataSource.getRepository(Order);
        this.orderItemRepo = AppDataSource.getRepository(OrderItem);
        this.productRepo = AppDataSource.getRepository(Product);
        this.userRepo = AppDataSource.getRepository(User);
        this.sessionService = new SessionService();
    }

    async createOrder(data: CreateOrderDTO): Promise<OrderResponse> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validate input
            if (!data.items || data.items.length === 0) {
                throw new Error('Order must have at least one item');
            }

            // Generate referral code
            const referralCode = this.generateReferralCode();
            
            // Create order
            const order = this.orderRepo.create({
                name: data.name,
                phone: data.phone,
                address: data.address,
                note: data.note || null,
                status: 'pending',
                referralCode,
                totalPrice: 0
            });

            const savedOrder = await queryRunner.manager.save(order);

            // Create order items and calculate total price
            let totalPrice = 0;
            const processedItems: Array<{productId: string, quantity: number}> = [];

            for (const item of data.items) {
                // Validate quantity
                if (item.quantity <= 0) {
                    throw new Error(`Quantity must be greater than 0 for product ${item.productId}`);
                }

                const product = await this.productRepo.findOne({
                    where: { id: item.productId }
                });

                if (!product) {
                    throw new Error(`Product with ID ${item.productId} not found`);
                }

                if (product.quantityInStock < item.quantity) {
                    throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.quantityInStock}, Requested: ${item.quantity}`);
                }

                // Create order item
                const orderItem = this.orderItemRepo.create({
                    order: savedOrder,
                    product,
                    quantity: item.quantity,
                    price: product.price
                });

                await queryRunner.manager.save(orderItem);

                // Update stock
                product.quantityInStock -= item.quantity;
                await queryRunner.manager.save(product);

                // Calculate price
                totalPrice += Number(product.price) * item.quantity;
                
                // Track processed items
                processedItems.push({
                    productId: item.productId,
                    quantity: item.quantity
                });
            }

            // Update total price
            savedOrder.totalPrice = totalPrice;
            await queryRunner.manager.save(savedOrder);

            await queryRunner.commitTransaction();

            // Return response
            return {
                orderId: savedOrder.id,
                referralCode,
                messengerLink: this.generateMessengerLink(referralCode),
                totalPrice: Number(savedOrder.totalPrice),
                status: savedOrder.status,
                orderItem: processedItems,
                createdAt: savedOrder.createdAt
            };

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getOrders(status?: OrderStatus): Promise<OrderListResponse[]> {
        const queryBuilder = this.orderRepo
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.orderItems', 'orderItems')
            .leftJoinAndSelect('orderItems.product', 'product')
            .leftJoinAndSelect('order.assignedTo', 'assignedTo') // Fix: was 'order.user'
            .orderBy('order.createdAt', 'DESC');

        if (status) {
            queryBuilder.where('order.status = :status', { status });
        }

        const orders = await queryBuilder.getMany();

        return orders.map(order => ({
            id: order.id,
            name: order.name,
            phone: order.phone,
            address: order.address,
            status: order.status as OrderStatus, // Type casting
            totalPrice: Number(order.totalPrice),
            createdAt: order.createdAt, 
            assignedTo: order.assignedTo ? {
                id: order.assignedTo.id,
                fullName: order.assignedTo.fullName
            } : undefined,
            orderItems: order.orderItems.map(item => ({
                product: {
                    name: item.product.name,
                    price: Number(item.price)
                },
                quantity: item.quantity
            }))
        }));
    }

    async assignShipper(orderId: string, shipperId: string): Promise<Order> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['assignedTo']
        });

        const shipper = await this.userRepo.findOne({
            where: { id: shipperId, role: 'shipper' }
        });

        if (!order) {
            throw new Error(`Order with ID ${orderId} not found`);
        }

        if (!shipper) {
            throw new Error(`Shipper with ID ${shipperId} not found or user is not a shipper`);
        }

        if (order.status !== 'pending') {
            throw new Error(`Order with ID ${orderId} is not in pending status. Current status: ${order.status}`);
        }

        order.assignedTo = shipper;
        order.status = 'assigned';

        return await this.orderRepo.save(order);
    }

    async handleMessengerWebhook(psid: string, referralCode: string, userType: 'first-time' | 'returning'): Promise<Order | null> {
        try{
            //search order by referral code
            const order = await this.orderRepo.findOne({
                where: { referralCode },
                relations: ['orderItems', 'orderItems.product']
            })
            if(!order){
                throw new Error(`Order with referral code ${referralCode} not found`);
            }
            if(order.messengerPSID){
                if(order.messengerPSID === psid){
                    console.log(`Order with referral code ${referralCode} already confirmed for PSID ${psid}`);
                    return order; // Order already confirmed for this PSID
                }
                else{
                    console.log(`Order with referral code ${referralCode} already confirmed for another PSID ${order.messengerPSID}`);
                    return null; // Order already confirmed for another PSID
                }
            }

            //save psid to order
            order.messengerPSID = psid;
            order.status= 'confirmed';
            
            await this.orderRepo.save(order);

            //send confirmation message by messenger
            const messengerService = new MessengerService();
            await messengerService.sendOrderConfirmation(psid, order);

            console.log(`Order with referral code ${referralCode} confirmed and message sent to PSID ${psid}`);

            return order;

        }
        catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error(`Error handling messenger webhook: ${errorMessage}`);
            throw error;
        }

    }

    // Helper methods
    private generateReferralCode(): string {
        return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateMessengerLink(referralCode: string): string {
        const pageUsername = process.env.FACEBOOK_PAGE_USERNAME;
        return `https://m.me/${pageUsername}?ref=${referralCode}`;
    }
}