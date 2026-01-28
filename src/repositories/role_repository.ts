import { Pool, PoolClient } from "pg";
import { pool } from "../database";
import { NewRole, Role } from "../models/models";

export class RoleRepository {
    constructor(private readonly client: Pool | PoolClient = pool) {}

    private mapRole = (row: any): Role => {
        return {
            id: row.id,
            name: row.name,
            created_at: row.created_at,
        };
    }

    createRole = async (newRole: NewRole): Promise<Role | null> => {
        const { name } = newRole;
        const res = await this.client.query('INSERT INTO roles (name) VALUES ($1) RETURNING *', [name]);
        if (res.rowCount === 0) return null;
        return this.mapRole(res.rows[0]);
    }

    findRoleByName = async (name: string): Promise<Role | null> => {
        const res = await this.client.query('SELECT * FROM roles WHERE name = $1', [name]);
        if (res.rowCount === 0) return null;
        return this.mapRole(res.rows[0]);
    }

    getRoles = async(): Promise<Role[]> => {
        const res = await this.client.query('SELECT * FROM roles');
        if (res.rows.length === 0) return [];
        return res.rows.map(this.mapRole);
    }

    updateRole = async (roleId: string, newRole: NewRole): Promise<Role | null> => {
        const { name } = newRole;
        const res = await this.client.query('UPDATE roles SET name = $1 WHERE id = $2 RETURNING *', [name, roleId]);
        if (res.rowCount === 0) return null;
        return this.mapRole(res.rows[0]);
    }

    deleteRole = async (roleId: string): Promise<Role> => {
        const res = await this.client.query('DELETE FROM roles WHERE id = $1 RETURNING *', [roleId]);
        return this.mapRole(res.rows[0]);
    }
}