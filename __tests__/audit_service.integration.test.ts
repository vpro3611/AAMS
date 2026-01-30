import { pool } from "../src/database";
import { AuditRepository } from "../src/repositories/audit_repository";
import { AuditService } from "../src/services/audit_service";
import { AuditAction } from "../src/models/models";
import { User } from "../src/models/models";

describe("AuditService.getAuditEvents (integration)", () => {
    let client: any;
    let auditService: AuditService;
    let user: User;

    beforeAll(() => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("Must run in test environment");
        }
    });

    beforeEach(async () => {
        client = await pool.connect();
        await client.query("BEGIN");

        const userRes = await client.query(
            `INSERT INTO users (email, password_hash)
             VALUES ('audit_service@test.com', 'hash')
                 RETURNING *`
        );
        user = userRes.rows[0];

        const auditRepo = new AuditRepository(client);
        auditService = new AuditService(auditRepo);
    });

    afterEach(async () => {
        await client.query("ROLLBACK");
        client.release();
    });

    afterAll(async () => {
        await pool.end();
    });

    it("returns all audit events created via service log()", async () => {
        await auditService.log(
            user.id,
            AuditAction.ROLE_ASSIGNED
        );

        await auditService.log(
            user.id,
            AuditAction.GET_USER_ROLES
        );

        const audits = await auditService.getAuditEvents();

        expect(audits).toHaveLength(2);

        expect(audits.map(a => a.action)).toEqual(
            expect.arrayContaining([
                AuditAction.ROLE_ASSIGNED,
                AuditAction.GET_USER_ROLES,
            ])
        );

        audits.forEach(audit => {
            expect(audit).toHaveProperty("id");
            expect(audit.actor_user_id).toBe(user.id);
            expect(audit).toHaveProperty("action");
            expect(audit).toHaveProperty("created_at");
        });
    });

    it("returns empty array when there are no audit events", async () => {
        const audits = await auditService.getAuditEvents();

        expect(audits).toEqual([]);
    });
});
