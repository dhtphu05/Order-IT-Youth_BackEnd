import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany} from "typeorm";
import {v4 as uuidv4} from 'uuid';
import {User} from ".User";
import {OrderItem} from "./OrderItem";
import {ShipmentLog} from "./ShipmentLog";
