import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {OrderItem} from "./OrderItem";
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Product{
    @PrimaryGeneratedColumn()
    id: string = uuidv4();

    @Column({ type: "varchar", length: 255 })
    name: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    price: number;

    @Column({ type: "int" })
    quantityInStock: number;

    @Column({ type: "varchar", length: 255 })
    imageUrl: string;

    @OneToMany(() => OrderItem, orderItem => orderItem.product)
    orderItems: OrderItem[];
}