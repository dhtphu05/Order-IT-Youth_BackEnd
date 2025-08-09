// src/index.ts
import express from 'express';
import "reflect-metadata";
import { AppDataSource } from './data-source';
import orderRoutes from './routes/order.routes';
import cors from 'cors';
const app = express();
const port = 3000;

app.use(express.json());

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/orders', orderRoutes);

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
        });
    })

