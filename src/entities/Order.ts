import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, Index} from "typeorm";
import {User} from "./User";
import {OrderItem} from "./OrderItem";
import {ShipmentLog} from "./ShipmentLog";
import {Session} from "./Session";
@Entity()
export class Order{
    @PrimaryGeneratedColumn("uuid")
    id: string;  // Bỏ = uuidv4()

    @Column({ type: "varchar", length:255})
    name: string;

    @Index()
    @Column({type: "varchar", length: 20})
    phone: string;

    @Column({type: "text"})
    address: string;

    @Column({ type: "text", nullable: true })
    note: string | null;

    @Column({
        type: "enum",
        enum: ['pending', 'confirmed', 'assigned', 'delivering', 'delivered', 'cancelled'],
        default: 'pending'
    })
    status: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    totalPrice: number;
    
    @ManyToOne(() => User, user => user.orders, {nullable: true})  // Sửa user.orders
    assignedTo: User;  

    @ManyToOne(() =>Session, session => session.orders, {nullable: true})
    session: Session;

    @Column({ type: 'varchar', length: 255, nullable: true })
    messengerPSID: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    referralCode: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @OneToMany(() => OrderItem, orderItem => orderItem.order)
    orderItems: OrderItem[];

    @OneToMany(() => ShipmentLog, shipmentLog => shipmentLog.order)
    shipmentLogs: ShipmentLog[];

}