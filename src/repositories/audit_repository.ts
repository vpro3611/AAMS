import { pool } from '../database';
import { Pool, PoolClient } from "pg";
import { AuditEvent, NewAuditEvent } from "../models/models";


export class AuditRepository {
    constructor(private readonly client: Pool | PoolClient = pool) {}

    private mapAuditEvent = (row: any): AuditEvent => ({
        id: row.id,
        actor_user_id: row.actor_user_id,
        action: row.action,
        created_at: row.created_at,
    });

    createAuditEvent = async (newAuditEvent: NewAuditEvent): Promise<AuditEvent> => {
        const { actor_user_id, action } = newAuditEvent;

        const res = await this.client.query('INSERT INTO audit_events (actor_user_id, action) VALUES ($1, $2)' +
            ' RETURNING *',
            [actor_user_id, action]);

        return this.mapAuditEvent(res.rows[0]);
    }

    getAuditEvents = async (): Promise<AuditEvent[]> => {
        const res = await this.client.query('SELECT * FROM audit_events');

        if (res.rowCount === 0) return [];

        return res.rows.map(this.mapAuditEvent);
    }
}