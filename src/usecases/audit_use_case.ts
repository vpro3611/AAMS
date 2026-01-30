import {Pool} from "pg";
import {AuditAction, AuditEvent} from "../models/models";
import {AuditRepository} from "../repositories/audit_repository";
import {AuditService} from "../services/audit_service";


export class AuditUseCase {
    constructor(private readonly pool: Pool) {}

    getAuditEvents = async (actorId: string): Promise<AuditEvent[]> => {
        if (!actorId) throw new Error("Actor ID is required");

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
}