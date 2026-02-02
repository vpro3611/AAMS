import {Pool} from "pg";
import {AuditAction, AuditEvent} from "../models/models";
import {AuditRepository} from "../repositories/audit_repository";
import {AuditService} from "../services/audit_service";
import {BadRequestError} from "../errors/errors";


export class AuditUseCase {
    constructor(private readonly pool: Pool) {}

    getAuditEvents = async (actorId: string): Promise<AuditEvent[]> => {
        if (!actorId) throw new BadRequestError("Actor ID is required");

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const auditRepo = new AuditRepository(client);
            const auditServ = new AuditService(auditRepo);

            const allAuditEvents = await auditServ.getAuditEvents();
            await auditServ.log(actorId, AuditAction.GET_AUDIT_EVENTS);

            await client.query("COMMIT");
            return allAuditEvents;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    getAuditEventsByUserId = async (actorId: string, userId: string): Promise<AuditEvent[]> => {
        if (!actorId) throw new BadRequestError("Actor ID is required");

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN")

            const auditRepo = new AuditRepository(client);
            const auditServ = new AuditService(auditRepo);

            const allAuditEvents = await auditServ.getAuditEventsByUserId(userId);
            await auditServ.log(actorId, AuditAction.GET_AUDIT_EVENTS_BY_USER_ID);

            await client.query("COMMIT");
            return allAuditEvents;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    getAuditEventsByAction = async (actorId: string, action: AuditAction): Promise<AuditEvent[]> => {
        if (!actorId) throw new BadRequestError("Actor ID is required");

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN")

            const auditRepo = new AuditRepository(client);
            const auditServ = new AuditService(auditRepo);

            const allAuditEvents = await auditServ.getAuditEventsByAction(action);
            await auditServ.log(actorId, AuditAction.GET_AUDIT_EVENTS_BY_ACTION);

            await client.query("COMMIT");
            return allAuditEvents;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }
}