import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany} from "typeorm";
import {Order} from "./Order";
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User{
    @PrimaryGeneratedColumn("uuid")
    id: string = uuidv4();
    
    @Column({type:'varchar', length: 255})
    fullName: string;

    @Column({type:'varchar',length: 255, nullable: true, unique: true})
    email: string;

    @Column({type: 'varchar', length:255 })
    password: string;

    @Column(
    {type: 'enum',
            enum: ['admin','customer','shipper'],
            default: 'customer'
        })
        role: string;
    
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
    
}