import { pool } from "../src/database";
import { AuditRepository } from "../src/repositories/audit_repository";
import { AuditAction } from "../src/models/models";

describe("AuditRepository (integration)", () => {
    let client: any;
    let repo: AuditRepository;

    let userAId: string;
    let userBId: string;

    beforeAll(async () => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("NODE_ENV must be test");
        }
    });

    beforeEach(async () => {
        client = await pool.connect();
        await client.query("BEGIN");

        repo = new AuditRepository(client);

        // ───────────────
        // users
        // ───────────────
        const userARes = await client.query(
            `
                INSERT INTO users (email, password_hash, status)
                VALUES ('userA@test.com', 'hash', 'active')
                    RETURNING id
            `
        );

        const userBRes = await client.query(
            `
            INSERT INTO users (email, password_hash, status)
            VALUES ('userB@test.com', 'hash', 'active')
            RETURNING id
            `
        );

        userAId = userARes.rows[0].id;
        userBId = userBRes.rows[0].id;

        // ───────────────
        // audit events
        // ───────────────
        await client.query(
            `
                INSERT INTO audit_events (actor_user_id, action)
                VALUES
                    ($1, $2),
                    ($1, $3),
                    ($4, $2)
            `,
            [
                userAId,                        // $1 uuid
                AuditAction.ROLE_ASSIGNED,      // $2 text
                AuditAction.GET_USER_ROLES,     // $3 text
                userBId                         // $4 uuid
            ]
        );
    });

    afterEach(async () => {
        await client.query("ROLLBACK");
        client.release();
    });

    afterAll(async () => {
        await pool.end();
    });

    // ─────────────────────────────
    // getAuditEventByUserId
    // ─────────────────────────────
    it("returns audit events for given user id", async () => {
        const events = await repo.getAuditEventByUserId(userAId);

        expect(events).toHaveLength(2);
        expect(events.every(e => e.actor_user_id === userAId)).toBe(true);
    });

    it("returns empty array when user has no audit events", async () => {
        const userCRes = await client.query(
            `
                INSERT INTO users (email, password_hash, status)
                VALUES ('userC@test.com', 'hash', 'active')
                    RETURNING id
            `
        );

        const userCId = userCRes.rows[0].id;

        const events = await repo.getAuditEventByUserId(userCId);

        expect(events).toEqual([]);
    });

    it("does not return audit events of other users", async () => {
        const events = await repo.getAuditEventByUserId(userBId);

        expect(events).toHaveLength(1);
        expect(events[0].actor_user_id).toBe(userBId);
    });

    // ─────────────────────────────
    // getAuditEventByAction
    // ─────────────────────────────
    it("returns audit events by action", async () => {
        const events = await repo.getAuditEventByAction(
            AuditAction.ROLE_ASSIGNED
        );

        expect(events).toHaveLength(2);
        expect(events.every(e => e.action === AuditAction.ROLE_ASSIGNED)).toBe(true);
    });

    it("returns empty array when no audit events for action", async () => {
        const events = await repo.getAuditEventByAction(
            "NON_EXISTENT_ACTION"
        );

        expect(events).toEqual([]);
    });

    it("does not return audit events with different action", async () => {
        const events = await repo.getAuditEventByAction(
            AuditAction.GET_USER_ROLES
        );

        expect(events).toHaveLength(1);
        expect(events[0].action).toBe(AuditAction.GET_USER_ROLES);
    });
});
