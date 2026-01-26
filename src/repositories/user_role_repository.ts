import { pool } from '../database';
import { Pool, PoolClient } from "pg";
import { UserRole, UserRoleWithNames } from "../models/models";

export class UserRoleRepository {
    constructor(private readonly client: Pool | PoolClient = pool) {}

    private mapUserRole = (row: any): UserRoleWithNames => {
        return {
            user_id: row.user_id,
            role_id: row.role_id,
            role_name: row.role_name,
        };
    }

    assignRoleToUser = async (userId: string, roleId: string): Promise<void> => {
        await this.client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleId]);
    }

    getUserRoles = async (userId: string): Promise<UserRoleWithNames[]> => {
        const res = await this.client.query('SELECT ur.user_id, ur.role_id, r.name AS role_name' +
            ' FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1', [userId]);
        if (res.rowCount === 0) return [];
        return res.rows.map(this.mapUserRole);
    }
}