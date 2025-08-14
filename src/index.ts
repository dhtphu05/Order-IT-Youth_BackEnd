// src/index.ts
import express from 'express';
import "reflect-metadata";
import { AppDataSource } from './data-source';
import OrderRouter from './routes/order.routes';
import MessengerRouter from './routes/messenger.routes';
import cors from 'cors';
import dotenv from 'dotenv';
import { Order } from './entities/Order';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();
const port = 3000;

app.use(express.json());

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true // Cho phép gửi cookies
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/orders', OrderRouter);
app.use('/api/messenger', MessengerRouter);

// Health check
app.get('/', (_req, res) => {
    res.json({
        message: '🚀 Order Management API is running!',
        version: '1.0.0',
        endpoints: {
            orders: {
                create: 'POST /api/orders',
                getAll: 'GET /api/orders',
                assign: 'PUT /api/orders/:id/assign'
                
            },
            messenger: {
                webhook: 'GET/POST /api/messenger/webhook'
            }
        }
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});
AppDataSource.initialize()
    .then(() => {
        console.log("database connected");
        
        app.listen(port, () => {
            console.log(`🚀 Server running at http://localhost:${port}`);
            console.log(`📨 Webhook URL: http://localhost:${port}/api/messenger/webhook`);

        });
    })

