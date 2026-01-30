import { pool } from "../src/database";
import { AuditAction } from "../src/models/models";
import { User } from "../src/models/models";
import { AuditUseCase } from "../src/usecases/audit_use_case";

describe("AuditUseCase.getAuditEvents (integration)", () => {
    let useCase: AuditUseCase;
    let actor: User;

    beforeAll(() => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("Must run in test environment");
        }
    });

    beforeEach(async () => {
        const client = await pool.connect();
        await client.query("BEGIN");

        const userRes = await client.query(
            `INSERT INTO users (email, password_hash)
             VALUES ('audit_actor@test.com', 'hash')
             RETURNING *`
        );
        actor = userRes.rows[0];

        // создаём несколько audit-событий как фикстуру
        await client.query(
            `INSERT INTO audit_events (actor_user_id, action)
             VALUES ($1, 'TEST_EVENT_1'),
                    ($1, 'TEST_EVENT_2')`,
            [actor.id]
        );

        await client.query("COMMIT");
        client.release();

        useCase = new AuditUseCase(pool);
    });

    afterEach(async () => {
        await pool.query("DELETE FROM audit_events");
        await pool.query("DELETE FROM users");
    });

    afterAll(async () => {
        await pool.end();
    });

    it("returns audit events and creates GET_AUDIT_EVENTS audit", async () => {
        const audits = await useCase.getAuditEvents(actor.id);

        // 2 существующих + 1 новый (GET_AUDIT_EVENTS)
        expect(audits).toHaveLength(2);

        const storedAudits = await pool.query(
            `SELECT * FROM audit_events WHERE actor_user_id = $1`,
            [actor.id]
        );

        expect(storedAudits.rows).toHaveLength(3);
        expect(
            storedAudits.rows.some(
                a => a.action === AuditAction.GET_AUDIT_EVENTS
            )
        ).toBe(true);
    });

    it("throws error if actorId is missing", async () => {
        await expect(
            useCase.getAuditEvents("")
        ).rejects.toThrow("Actor ID is required");
    });

    it("rolls back when audit logging fails", async () => {
        const invalidActorId = "550e8400-e29b-41d4-a716-446655440999";

        await expect(
            useCase.getAuditEvents(invalidActorId)
        ).rejects.toThrow();

        const audits = await pool.query(
            `SELECT * FROM audit_events`
        );

        // никаких новых audit быть не должно
        expect(audits.rows).toHaveLength(2);
    });
});
