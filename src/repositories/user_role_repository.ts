import { pool } from '../database';
import { Pool, PoolClient } from "pg";
import {UserRole, UserRoleWithNames} from "../models/models";

export class UserRoleRepository {
    constructor(private readonly client: Pool | PoolClient = pool) {}

    private mapUserRole = (row: any): UserRoleWithNames => {
        return {
            user_id: row.user_id,
            role_id: row.role_id,
            role_name: row.role_name,
        };
    }

    private mapRole = (row: any): UserRole => {
        return {
            user_id: row.user_id,
            role_id: row.role_id,
        };
    }

    assignRoleToUser = async (userId: string, roleId: string): Promise<UserRole> => {
        const res = await this.client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) RETURNING *',
            [userId, roleId]);
        if (res.rowCount === 0) throw new Error('User role already exists');
        return this.mapRole(res.rows[0]);
    }

    getUserRoles = async (userId: string): Promise<UserRoleWithNames[]> => {
        const res = await this.client.query('SELECT ur.user_id, ur.role_id, r.name AS role_name' +
            ' FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1', [userId]);
        if (res.rows.length === 0) return [];
        return res.rows.map(row => this.mapUserRole(row));
    }

    deleteUserRole = async (userId: string, roleId: string): Promise<UserRole | null> => {
        const res = await this.client.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 RETURNING *',
            [userId, roleId]);
        if (res.rowCount === 0) return null;
        return this.mapRole(res.rows[0]);
    }
}