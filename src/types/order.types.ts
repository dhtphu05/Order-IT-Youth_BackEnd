import { Order } from './../entities/Order';
export interface CreateOrderDTO {
    name: string
    phone: string
    address: string,
    note?: string, 
    items: Array<{
        productId: string;
        quantity: number;
    }>;
}
export interface OrderResponse{
    orderId: string;
    referralCode: string;
    messengerLink: string;
    totalPrice: number;
    orderItem: Array<CreateOrderDTO['items'][number]>;
    status: OrderStatus;
    createAt: Date;

}
export interface OrderListResponse {
    id: string;
    name: string;
    phone: string;
    address: string;
    status: 'pending' | 'confirmed' | 'assigned'| 'delivering' | 'delivered' | 'cancelled';
    totalPrice: number;
    createAt: Date;
    assignedTo?: {
        id: string;
        fullName: string;
    };
    orderItems: Array<{
        product:{
            name: string;
            price: number
        }
        quantity: number;
    }>;

}
export type OrderStatus = 'pending' | 'confirmed' | 'assigned' | 'delivering' | 'delivered' | 'cancelled';
