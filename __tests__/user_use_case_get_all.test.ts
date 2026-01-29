import { UserUseCase } from "../src/usecases/user_use_case";
import { pool } from "../src/database";
import { AuditAction } from "../src/models/models";

describe("UserUseCase - getAllUsers", () => {
    let useCase: UserUseCase;

    beforeAll(() => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("Must be in test environment");
        }
    });

    beforeEach(async () => {
        await pool.query(`
            TRUNCATE users, audit_events
            RESTART IDENTITY
            CASCADE
        `);

        useCase = new UserUseCase(pool);
    });

    afterEach(async () => {
        await pool.query(`
            TRUNCATE users, audit_events
            RESTART IDENTITY
            CASCADE
        `);
    });

    afterAll(async () => {
        await pool.end();
    });

    it("should return all users and create audit record", async () => {
        const actor = await useCase.createUser({
            email: "admin@example.com",
            password_hash: "admin_pass"
        });

        const user1 = await useCase.createUser({
            email: "user1@example.com",
            password_hash: "password123"
        });

        const user2 = await useCase.createUser({
            email: "user2@example.com",
            password_hash: "password456"
        });

        const users = await useCase.getAllUsers(actor.id);

        expect(users).toHaveLength(3);

        const returnedIds = users.map(u => u.id);
        expect(returnedIds).toEqual(
            expect.arrayContaining([actor.id, user1.id, user2.id])
        );

        const auditRes = await pool.query(
            "SELECT * FROM audit_events WHERE action = $1",
            [AuditAction.GET_ALL_USERS]
        );

        expect(auditRes.rows).toHaveLength(1);
        expect(auditRes.rows[0].actor_user_id).toBe(actor.id);
    });

    it("should return only actor if no other users exist and still create audit", async () => {
        const actor = await useCase.createUser({
            email: "admin@example.com",
            password_hash: "admin_pass"
        });

        const users = await useCase.getAllUsers(actor.id);

        expect(users).toHaveLength(1);
        expect(users[0].id).toBe(actor.id);

        const auditRes = await pool.query(
            "SELECT * FROM audit_events WHERE action = $1",
            [AuditAction.GET_ALL_USERS]
        );

        expect(auditRes.rows).toHaveLength(1);
        expect(auditRes.rows[0].actor_user_id).toBe(actor.id);
    });

    it("should throw error if actorId is not provided", async () => {
        await expect(
            useCase.getAllUsers("")
        ).rejects.toThrow("Actor ID is required");

        const audits = await pool.query("SELECT * FROM audit_events");
        expect(audits.rows).toHaveLength(0);
    });
});
