import { Repository } from 'typeorm'
import { AppDataSource } from '../data-source'
import { Order } from '../entities/Order'
import { OrderItem } from '../entities/OrderItem'
import { Product } from '../entities/Product'
import { User } from '../entities/User'
import { CreateOrderDTO, OrderResponse, OrderListResponse, OrderStatus } from '../types/order.types'

export class OrderService {
    private orderRepo: Repository<Order>
    private orderItemRepo: Repository<OrderItem>
    private productRepo: Repository<Product>
    private userRepo: Repository<User>
    constructor() {
        this.orderRepo = AppDataSource.getRepository(Order)
        this.orderItemRepo = AppDataSource.getRepository(OrderItem)
        this.productRepo = AppDataSource.getRepository(Product)
        this.userRepo = AppDataSource.getRepository(User)
    }

    async createOrder(data: CreateOrderDTO): Promise<OrderResponse> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const referralCode = this.generateReferralCode();
            const order = this.orderRepo.create({
                name: data.name,
                phone: data.phone,
                address: data.address,
                note: data.note,
                status: 'pending' as OrderStatus,
                referralCode,
                totalPrice: 0
            });
            const saveOrder = await queryRunner.manager.save(order);

            //cretate order items and calculate total price
            let totalPrice = 0;
            for (const item of data.items) {
                const product = await this.productRepo.findOne({
                    where: { id: item.productId }
                });
                if (!product) {
                    throw new Error(`Product with ID ${item.productId} not found`);
                }
                if (product.quantityInStock < item.quantity) {
                    throw new Error(`Insufficient stock for product ${product.name}`);
                }
                const orderItem = this.orderItemRepo.create({
                    order: saveOrder,
                    product,
                    quantity: item.quantity,
                    price: product.price
                })
                await queryRunner.manager.save(orderItem);

                //delet ton kho
                product.quantityInStock -= item.quantity;
                await queryRunner.manager.save(product);

                totalPrice += Number(product.price) * item.quantity;
            }

            //update total price of order
            saveOrder.totalPrice = totalPrice;
            await queryRunner.manager.save(saveOrder);

            await queryRunner.commitTransaction();

            //return to frontend
            return {
                orderId: saveOrder.id,
                referralCode: referralCode,
                messengerLink: this.generateMessengerLink(referralCode),
                totalPrice: saveOrder.totalPrice,
                orderItem: data.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
                status: saveOrder.status,
                createAt: saveOrder.createdAt
            };

        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

    }

    async getOrderList(status?: OrderStatus): Promise<OrderListResponse[]> {
        const queryBuilder = this.orderRepo
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.orderItems', 'orderItems')
            .leftJoinAndSelect('orderItems.product', 'product')
            .leftJoinAndSelect('order.user', 'user')
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
            status: order.status as OrderStatus,
            totalPrice: Number(order.totalPrice),
            createAt: order.createdAt,
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

    async assignShipper(orderId: string, shipperId: string):Promise<Order>{
        const order= await this.orderRepo.findOne({
            where: {id: orderId},
            relations: ['assignedTo']
        })
        const shipper = await this.userRepo.findOne({
            where: {id: shipperId, role: 'shipper'}
        });
        if(!order){
            throw new Error(`Order with ID ${orderId} not found`);
        }
        if(!shipper){
            throw new Error(`Shipper with ID ${shipperId} not found`);
        }
        if(order.status !== 'pending') {
            throw new Error(`Order with ID ${orderId} is not in pending status`);
        }
        order.assignedTo = shipper;
        order.status = 'assigned';
        return await this.orderRepo.save(order);
    }
    private generateReferralCode(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    private generateMessengerLink(referralCode: string): string {
    const pageUsername = process.env.FACEBOOK_PAGE_USERNAME || 'your_page_username';
    return `https://m.me/${pageUsername}?ref=${referralCode}`;
  }


}