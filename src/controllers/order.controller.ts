import { Order } from '../entities/Order';
import {OrderService} from '../services/order.service';
import {CreateOrderDTO, OrderStatus, ClaimOrdersDTO} from '../types/order.types';
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
            const sessionId = req.cookies.sid;

            if(!orderData.name || !orderData.phone || !orderData.address ){
                res.status(400).json({message: 'Missing required fields: name, phone, address'});
                return;
            }
            if(!Array.isArray(orderData.items) || orderData.items.length === 0){
                res.status(400).json({message: 'Order must have at least one item'});
                return;
            }

            const result = await this.orderService.createWebOrder(orderData, sessionId);

            if(!sessionId){
                res.cookie('sid', result.sessionId, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 180 * 24 * 60 * 60 * 1000,
                    sameSite: 'lax'
                })
            }


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

    //GET /api/orders/my-orders - view orders by current session
    getMyOrders = async (req: Request, res: Response)=>{
        try{
            const sessionId = req.cookies.sid;
            if(!sessionId){
                return res.status(200).json([]);
            }
            const orders = await this.orderService.getOrdersBySession(sessionId);
            res.status(200).json(orders);
        }catch(error){
            console.error('Error fetching orders:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    //POST /api/orders/claim-orders - claim orders by phone number
    claimOrders = async ( req: Request, res: Response)=>{
        try{
            const claimData: ClaimOrdersDTO = req.body;
            const sessionId = req.cookies.sid;

        

            if(!sessionId){

                const newSession = await this.orderService.getSessionService().createSession();
                let sesionId: string = newSession.sessionId;
                res.cookie('sid', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 180 * 24 * 60 * 60 * 1000,
                sameSite: 'lax'
            });

        }
        const result = await this.orderService.claimOrders(claimData, sessionId);
        res.status(201).json(result);
    }catch(error){
        console.error('Error claiming orders:', error);
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