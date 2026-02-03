import { pool } from "../src/database";
import { AuditUseCase } from "../src/usecases/audit_use_case";
import { AuditAction } from "../src/models/models";
import { BadRequestError } from "../src/errors/errors";

describe("AuditUseCase (integration)", () => {
    let useCase: AuditUseCase;

    let actorId: string;
    let targetUserId: string;

    beforeAll(async () => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("NODE_ENV must be test");
        }
    });

    beforeEach(async () => {
        // чистим таблицы
        await pool.query("DELETE FROM audit_events");
        await pool.query("DELETE FROM users");

        useCase = new AuditUseCase(pool);

        // actor
        const actorRes = await pool.query(
            `
            INSERT INTO users (email, password_hash, status)
            VALUES ('actor@test.com', 'hash', 'active')
            RETURNING id
            `
        );

        // target user
        const targetRes = await pool.query(
            `
            INSERT INTO users (email, password_hash, status)
            VALUES ('target@test.com', 'hash', 'active')
            RETURNING id
            `
        );

        actorId = actorRes.rows[0].id;
        targetUserId = targetRes.rows[0].id;

        // initial audit events
        await pool.query(
            `
            INSERT INTO audit_events (actor_user_id, action)
            VALUES
                ($1, $2),
                ($3, $2)
            `,
            [
                actorId,
                AuditAction.ROLE_ASSIGNED,
                targetUserId,
            ]
        );
    });

    afterAll(async () => {
        await pool.end();
    });

    // ─────────────────────────────
    // getAuditEventsByUserId
    // ─────────────────────────────
    describe("getAuditEventsByUserId", () => {
        it("throws BadRequestError when actorId is missing", async () => {
            await expect(
                useCase.getAuditEventsByUserId("", targetUserId)
            ).rejects.toBeInstanceOf(BadRequestError);
        });

        it("returns audit events for given user id", async () => {
            const events = await useCase.getAuditEventsByUserId(
                actorId,
                actorId
            );

            expect(events.length).toBeGreaterThan(0);
            expect(events.every(e => e.actor_user_id === actorId)).toBe(true);
        });

        it("returns empty array when user has no audit events", async () => {
            const newUser = await pool.query(
                `
                INSERT INTO users (email, password_hash, status)
                VALUES ('empty@test.com', 'hash', 'active')
                RETURNING id
                `
            );

            const events = await useCase.getAuditEventsByUserId(
                actorId,
                newUser.rows[0].id
            );

            expect(events).toEqual([]);
        });

        it("writes audit log for GET_AUDIT_EVENTS_BY_USER_ID", async () => {
            await useCase.getAuditEventsByUserId(actorId, actorId);

            const res = await pool.query(
                `
                SELECT * FROM audit_events
                WHERE actor_user_id = $1
                  AND action = $2
                `,
                [
                    actorId,
                    AuditAction.GET_AUDIT_EVENTS_BY_USER_ID,
                ]
            );

            expect(res.rows.length).toBe(1);
        });
    });

    // ─────────────────────────────
    // getAuditEventsByAction
    // ─────────────────────────────
    describe("getAuditEventsByAction", () => {
        it("throws BadRequestError when actorId is missing", async () => {
            await expect(
                useCase.getAuditEventsByAction(
                    "",
                    AuditAction.ROLE_ASSIGNED
                )
            ).rejects.toBeInstanceOf(BadRequestError);
        });

        it("returns audit events by action", async () => {
            const events = await useCase.getAuditEventsByAction(
                actorId,
                AuditAction.ROLE_ASSIGNED
            );

            expect(events.length).toBeGreaterThan(0);
            expect(events.every(e => e.action === AuditAction.ROLE_ASSIGNED)).toBe(true);
        });

        it("returns empty array when no audit events for action", async () => {
            const events = await useCase.getAuditEventsByAction(
                actorId,
                AuditAction.GET_USER_ROLES
            );

            expect(events).toEqual([]);
        });

        it("writes audit log for GET_AUDIT_EVENTS_BY_ACTION", async () => {
            await useCase.getAuditEventsByAction(
                actorId,
                AuditAction.ROLE_ASSIGNED
            );

            const res = await pool.query(
                `
                SELECT * FROM audit_events
                WHERE actor_user_id = $1
                  AND action = $2
                `,
                [
                    actorId,
                    AuditAction.GET_AUDIT_EVENTS_BY_ACTION,
                ]
            );

            expect(res.rows.length).toBe(1);
        });
    });
});
