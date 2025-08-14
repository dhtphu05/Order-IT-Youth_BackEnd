// src/routes/order.routes.ts
import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const OrderRouter = Router();
const orderController = new OrderController();

// POST /api/orders - Tạo đơn hàng mới
OrderRouter.post('/', (req, res) => orderController.createOrder(req, res));

// GET /api/orders - Lấy danh sách đơn hàng
OrderRouter.get('/', (req, res) => orderController.getOrders(req, res));

// GET /api/orders/my-orders - Xem đơn hàng của phiên hiện tại
OrderRouter.get('/my-orders', (req, res) => orderController.getMyOrders(req, res));
// POST /api/orders/claim-orders - Nhận đơn hàng theo số điện thoại
OrderRouter.post('/claim-orders', (req, res) => orderController.claimOrders(req, res));
// PUT /api/orders/:id/assign - Gán shipper (FIX: đảm bảo syntax đúng)
OrderRouter.put('/:id/assign', (req, res) => orderController.assignShipper(req, res));

export default OrderRouter;