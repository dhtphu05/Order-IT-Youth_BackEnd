import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import {Product} from "./Product";
import {Order} from "./Order";

@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;  // Bỏ = uuidv4()

    @ManyToOne(() => Product, product => product.orderItems)
    product: Product;

    @ManyToOne(() => Order, order => order.orderItems)
    order: Order;

    @Column({ type: "int" })
    quantity: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    price: number;
}