import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany} from "typeorm";
import {Order} from "./Order";
import {ShipmentLog} from "./ShipmentLog";  // Thêm import này

@Entity()
export class User{
    @PrimaryGeneratedColumn("uuid")
    id: string;  // Bỏ = uuidv4()
    
    @Column({type:'varchar', length: 255})
    fullName: string;

    @Column({type:'varchar',length: 255, nullable: true, unique: true})
    email: string;

    @Column({type: 'varchar', length:255 })
    password: string;

    @Column({
        type: 'enum',
        enum: ['admin','customer','shipper'],
        default: 'customer'
    })
    role: string;
    
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @OneToMany(() => Order, order => order.assignedTo)  // Sửa property name
    orders: Order[];

    @OneToMany(() => ShipmentLog, shipmentLog => shipmentLog.changeBy)  // Sửa property name
    shipmentLogs: ShipmentLog[];
}