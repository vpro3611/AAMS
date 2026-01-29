import { UserUseCase } from "../src/usecases/user_use_case";
import { pool } from "../src/database";
import { AuditAction } from "../src/models/models";

describe("UserUseCase - findUserByEmail", () => {
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

    it("should find user by email and create audit record", async () => {
        const actor = await useCase.createUser({
            email: "admin@example.com",
            password_hash: "admin_pass"
        });

        const targetUser = await useCase.createUser({
            email: "user@example.com",
            password_hash: "password123"
        });

        const foundUser = await useCase.findUserByEmail(
            actor.id,
            targetUser.email
        );

        expect(foundUser.id).toBe(targetUser.id);
        expect(foundUser.email).toBe(targetUser.email);

        const auditRes = await pool.query(
            "SELECT * FROM audit_events WHERE action = $1",
            [AuditAction.USER_FIND_BY_EMAIL]
        );

        expect(auditRes.rows).toHaveLength(1);
        expect(auditRes.rows[0].actor_user_id).toBe(actor.id);
    });

    it("should rollback and not create audit if user not found", async () => {
        const actor = await useCase.createUser({
            email: "admin@example.com",
            password_hash: "admin_pass"
        });

        await expect(
            useCase.findUserByEmail(actor.id, "missing@example.com")
        ).rejects.toThrow("User not found");

        const audits = await pool.query("SELECT * FROM audit_events");

        // только USER_CREATED для actor
        expect(audits.rows).toHaveLength(1);
    });

    it("should throw error if actorId is not provided", async () => {
        await expect(
            useCase.findUserByEmail("", "user@example.com")
        ).rejects.toThrow("Actor ID is required");

        const audits = await pool.query("SELECT * FROM audit_events");

        expect(audits.rows).toHaveLength(0);
    });
});
