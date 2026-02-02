import { AuditService } from "../src/services/audit_service";
import { BadRequestError } from "../src/errors/errors";
import { AuditEvent } from "../src/models/models";

describe("AuditService (unit)", () => {
    let auditRepo: any;
    let auditService: AuditService;

    beforeEach(() => {
        auditRepo = {
            getAuditEventByUserId: jest.fn(),
            getAuditEventByAction: jest.fn(),
        };

        auditService = new AuditService(auditRepo);
    });

    // ─────────────────────────────
    // getAuditEventsByUserId
    // ─────────────────────────────
    describe("getAuditEventsByUserId", () => {
        it("throws BadRequestError if userId is empty", async () => {
            await expect(
                auditService.getAuditEventsByUserId("")
            ).rejects.toBeInstanceOf(BadRequestError);
        });

        it("calls repository with correct userId", async () => {
            const userId = "user-id-123";
            const events: AuditEvent[] = [];

            auditRepo.getAuditEventByUserId.mockResolvedValue(events);

            const result = await auditService.getAuditEventsByUserId(userId);

            expect(auditRepo.getAuditEventByUserId).toHaveBeenCalledWith(userId);
            expect(result).toBe(events);
        });

        it("returns audit events from repository", async () => {
            const userId = "user-id-123";
            const events: AuditEvent[] = [
                { id: "1", actor_user_id: userId, action: "ACTION_1", created_at: new Date() } as AuditEvent,
            ];

            auditRepo.getAuditEventByUserId.mockResolvedValue(events);

            const result = await auditService.getAuditEventsByUserId(userId);

            expect(result).toEqual(events);
        });

        it("returns empty array if repository returns empty array", async () => {
            auditRepo.getAuditEventByUserId.mockResolvedValue([]);

            const result = await auditService.getAuditEventsByUserId("user-id");

            expect(result).toEqual([]);
        });
    });

    // ─────────────────────────────
    // getAuditEventsByAction
    // ─────────────────────────────
    describe("getAuditEventsByAction", () => {
        it("throws BadRequestError if action is empty", async () => {
            await expect(
                auditService.getAuditEventsByAction("")
            ).rejects.toBeInstanceOf(BadRequestError);
        });

        it("calls repository with correct action", async () => {
            const action = "ROLE_ASSIGNED";
            const events: AuditEvent[] = [];

            auditRepo.getAuditEventByAction.mockResolvedValue(events);

            const result = await auditService.getAuditEventsByAction(action);

            expect(auditRepo.getAuditEventByAction).toHaveBeenCalledWith(action);
            expect(result).toBe(events);
        });

        it("returns audit events from repository", async () => {
            const action = "ROLE_ASSIGNED";
            const events: AuditEvent[] = [
                { id: "1", actor_user_id: "user-1", action, created_at: new Date() } as AuditEvent,
            ];

            auditRepo.getAuditEventByAction.mockResolvedValue(events);

            const result = await auditService.getAuditEventsByAction(action);

            expect(result).toEqual(events);
        });

        it("returns empty array if repository returns empty array", async () => {
            auditRepo.getAuditEventByAction.mockResolvedValue([]);

            const result = await auditService.getAuditEventsByAction("ANY_ACTION");

            expect(result).toEqual([]);
        });
    });
});
