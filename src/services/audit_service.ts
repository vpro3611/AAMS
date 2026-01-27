import {AuditRepository} from "../repositories/audit_repository";
import {AuditEvent} from "../models/models";


export class AuditService {
    constructor(private readonly auditRepo: AuditRepository) {}

    log = async (actorUserId: string, action: string): Promise<AuditEvent> => {
        return await this.auditRepo.createAuditEvent({actor_user_id: actorUserId, action});
    }
}