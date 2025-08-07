import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn} from "typeorm";
import {Order} from "./Order";
import {User} from "./User";

@Entity()
export class ShipmentLog {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Order, order => order.shipmentLogs)
    order: Order;

    @ManyToOne(() => User, user => user.shipmentLogs, { nullable: true })
    changeBy: User;  
    
    @Column({ type: 'text', nullable: true })
    note: string | null;
    
    @Column({
        type: "enum",
        enum: ['pending', 'assigned', 'delivering', 'delivered', 'cancelled'],
        default: 'pending'
    })
    status: string;

    @CreateDateColumn({ type: 'timestamp' })
    changedAt: Date;
}