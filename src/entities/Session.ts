import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany} from 'typeorm';
import {Order} from './Order';

@Entity()
export class Session{
    @PrimaryGeneratedColumn("uuid")
    id: string;
    @Column({type: 'varchar', length: 64, unique: true})
    sessionId: string;

    @Column({type: 'varchar', length: 255, nullable: true})
    userAgent: string;
    
    @Column({type: 'inet', nullable: true})
    ipAddress: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({type: 'timestamp'})
    expiresAt: Date;

    @OneToMany(() => Order, order => order.session)
    orders: Order[];
}