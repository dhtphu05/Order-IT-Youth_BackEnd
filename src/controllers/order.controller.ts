import { Order } from '../entities/Order';
import {OrderService} from '../services/order.service';
import {CreateOrderDTO, OrderStatus} from '../types/order.types';
import {Request, Response} from 'express';
export class OrderController {
    private orderService: OrderService;
    
    constructor(){
        this.orderService = new OrderService();
    }

    //post /api/orders
    createOrder = async( req: Request, res: Response): Promise<void> =>{
        try{
            const orderData: CreateOrderDTO = req.body;

            if(!orderData.name || !orderData.phone || !orderData.address ){
                res.status(400).json({message: 'Missing required fields: name, phone, address'});
                return;
            }
            if(!Array.isArray(orderData.items) || orderData.items.length === 0){
                res.status(400).json({message: 'Order must have at least one item'});
                return;
            }

            const result = await this.orderService.createOrder(orderData);

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: result
            })
        }catch(error){
            console.error('Error creating order:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });

        }
    }
    
    //get /api/orders
    getOrders = async (req: Request, res: Response): Promise<void> => {
        try{
            const {status} = req.query;
            if(status &&!['pending', 'confirmed', 'assigned', 'delivering', 'delivered', 'cancelled'].includes(status as string)){
                res.status(400).json({message: 'Invalid status'});
                return;
            }
            const orders = await this.orderService.getOrders(status as OrderStatus);
            res.status(200).json({
                success: true,
                data: orders
            });
        }catch(error){
            console.error('Error fetching orders:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    //put /api/orders/:id/assign
    assignShipper = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { shipperId } = req.body;

            if (!shipperId) {
                res.status(400).json({
                    success: false,
                    message: 'Missing shipperId'
                });
                return;
            }

            const order = await this.orderService.assignShipper(id, shipperId);
            
            res.status(200).json({
                success: true,
                message: 'Shipper assigned successfully',
                data: {
                    orderId: order.id,
                    status: order.status,
                    assignedTo: order.assignedTo?.fullName
                }
            });
        } catch (error) {
            console.error('Error assigning shipper:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };


}