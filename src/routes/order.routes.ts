// src/routes/order.routes.ts
import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const OrderRouter = Router();
const orderController = new OrderController();

// POST /api/orders - Tạo đơn hàng mới
OrderRouter.post('/', orderController.createOrder);

// GET /api/orders - Lấy danh sách đơn hàng
OrderRouter.get('/', orderController.getOrders);

// PUT /api/orders/:id/assign - Gán shipper (FIX: đảm bảo syntax đúng)
OrderRouter.put('/:id/assign', orderController.assignShipper);

export default OrderRouter;