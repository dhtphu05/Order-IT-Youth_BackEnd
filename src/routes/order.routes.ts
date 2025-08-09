// src/routes/order.routes.ts
import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();
const orderController = new OrderController();

// POST /api/orders - Tạo đơn hàng mới
router.post('/', orderController.createOrder);

// GET /api/orders - Lấy danh sách đơn hàng
// Query params: ?status=pending|assigned|delivering|delivered|cancelled
router.get('/', orderController.getOrders);

// PUT /api/orders/:id/assign - Gán shipper cho đơn hàng
// Body: { "shipperId": "uuid" }
router.put('/:id/assign', orderController.assignShipper);

export default router;