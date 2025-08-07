import { DataSource } from "typeorm";
import {User} from "./entities/User";
import {Product} from "./entities/Product";
import {Order} from "./entities/Order";
import {OrderItem} from "./entities/OrderItem";
import {ShipmentLog} from "./entities/ShipmentLog";
import dotenv from "dotenv";
dotenv.config();
export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true, // Chỉ dùng trong dev
    logging: false,
    entities: [User, Product, Order, OrderItem, ShipmentLog],
    migrations: ["src/migrations/**/*.ts"],
    subscribers: [],
});
