import {AuditRepository} from "../repositories/audit_repository";
import {AuditEvent} from "../models/models";
import {BadRequestError} from "../errors/errors";


export class AuditService {
    constructor(private readonly auditRepo: AuditRepository) {}

    log = async (actorUserId: string, action: string): Promise<AuditEvent> => {
        return await this.auditRepo.createAuditEvent({actor_user_id: actorUserId, action});
    }

    getAuditEvents = async (): Promise<AuditEvent[]> => {
        return await this.auditRepo.getAuditEvents();
    }

    getAuditEventsByUserId = async (userId: string): Promise<AuditEvent[]> => {
        if (!userId) throw new BadRequestError("User id cannot be null or undefined");
        return await this.auditRepo.getAuditEventByUserId(userId);
    }

    getAuditEventsByAction = async (action: string): Promise<AuditEvent[]> => {
        if (!action) throw new BadRequestError("Action cannot be null or undefined");
        return await this.auditRepo.getAuditEventByAction(action);
    }
}