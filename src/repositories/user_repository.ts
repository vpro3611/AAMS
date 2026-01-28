import { pool } from '../database';
import {NewUser, User} from "../models/models";
import {Pool, PoolClient} from "pg";

export class UserRepository {

    constructor(private readonly client: Pool | PoolClient = pool) {}

    private mapUser = (row: any): User => ({
        id: row.id,
        email: row.email,
        password_hash: row.password_hash,
        status: row.status,
        created_at: row.created_at,
    });

    findUserById = async (id: string): Promise<User | null> => {
        const res = await this.client.query('SELECT * FROM users WHERE id = $1', [id]);
        if (res.rowCount === 0) return null;
        return this.mapUser(res.rows[0]);
    }

    findUserByEmail = async (email: string): Promise<User | null> => {
        const res = await this.client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rowCount === 0) return null;
        return this.mapUser(res.rows[0]);
    }

     createUser = async (newUser: NewUser): Promise<User> => {
         const res = await this.client.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
             [newUser.email, newUser.password_hash])
         return this.mapUser(res.rows[0])
     }

     updateUserStatus = async (userId: string, status: string): Promise<User> => {
        const res = await this.client.query('UPDATE users SET status = $1 WHERE id = $2 RETURNING *', [status, userId]);
        return this.mapUser(res.rows[0]);
     }
}