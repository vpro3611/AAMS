import { pool } from "../src/database";
import { AuditRepository } from "../src/repositories/audit_repository";
import { NewAuditEvent } from "../src/models/models";


describe("AuditRepository (creating and getting all", () => {
    let client: any;
    let repo: AuditRepository;
    let userId: string;
    beforeAll(() => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("Must be in test environment");
        }
    });

    beforeEach(async () => {
        client = await pool.connect();
        await client.query("BEGIN");
        const res = await client.query(
            `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`, ["test@test.com", "hash"]
        );
        userId = res.rows[0].id;
        repo = new AuditRepository(client);
    })

    afterEach(async () => {
        await client.query("ROLLBACK");
        client.release();
    })

    afterAll(async () => {
        await pool.end();
    })

    it("creates and gets all audit events", async () => {
        const auditEvent: NewAuditEvent = {
            actor_user_id: userId,
            action: "test"
        }
        const createdAuditEvent = await repo.createAuditEvent(auditEvent);
        expect(createdAuditEvent).toBeDefined();
        expect(createdAuditEvent.id).toBeDefined();
        expect(createdAuditEvent.action).toBe(auditEvent.action);
        expect(createdAuditEvent.actor_user_id).toBe(auditEvent.actor_user_id);
        const auditEvents = await repo.getAuditEvents();
        expect(auditEvents).toHaveLength(1);
        expect(auditEvents[0]).toEqual(createdAuditEvent);
    })
})