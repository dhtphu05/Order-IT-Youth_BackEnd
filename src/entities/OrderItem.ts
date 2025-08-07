import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable} from "typeorm";
import { v4 as uuidv4 } from 'uuid';
@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn("uuid")
    id: string = uuidv4();

    @Column({type: "int", default: 1})
    quantity: number;

    @ManyToMany(() => Product, product => product.orderItems)
    @JoinTable()
    product: Product;
    @Column({ type: "decimal", precision: 10, scale: 2 })
}