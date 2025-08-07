import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {OrderItem} from "./OrderItem";

@Entity()
export class Product{
    @PrimaryGeneratedColumn("uuid")  
    id: string;  

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