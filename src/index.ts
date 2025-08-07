// src/index.ts
import express from 'express';
import "reflect-metadata";
import { AppDataSource } from '../ormconfig';
const app = express();
const port = 3000;

app.use(express.json());

AppDataSource.initialize()
    .then(() => {
        console.log("database connected");
        app.get('/', (_req, res) => {
            res.send('Hello from Express + TypeScript!');
        });

        app.listen(port, () => {
            console.log(`🚀 Server running at http://localhost:${port}`);
        });
    })

