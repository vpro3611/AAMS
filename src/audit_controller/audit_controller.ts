import {AuditService} from "../services/audit_service";
import {AuditUseCase} from "../usecases/audit_use_case";
import {NextFunction, Request, Response} from "express";


export class AuditController {
    constructor(private readonly auditUseCase: AuditUseCase) {}

    getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const actorId = req.userID;
            const auditLogs = await this.auditUseCase.getAuditEvents(actorId!);
            res.status(200).json(auditLogs);
        } catch (error) {
            next(error);
        }
    }
}