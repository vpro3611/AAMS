import { UserUseCase } from "../src/usecases/user_use_case";
import { pool } from "../src/database";
import { AuditAction } from "../src/models/models";
import { randomUUID } from "crypto";

describe("UserUseCase - deleteUser", () => {
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

    it("should delete user and create audit record in one transaction", async () => {
        const actor = await useCase.createUser({
            email: "admin@example.com",
            password_hash: "admin_pass"
        });

        const targetUser = await useCase.createUser({
            email: "user@example.com",
            password_hash: "password123"
        });

        const deletedUser = await useCase.deleteUser(actor.id, targetUser.id);

        // возвращается удалённый user
        expect(deletedUser.id).toBe(targetUser.id);
        expect(deletedUser.email).toBe(targetUser.email);

        // user реально удалён
        const usersRes = await pool.query(
            "SELECT * FROM users WHERE id = $1",
            [targetUser.id]
        );
        expect(usersRes.rows).toHaveLength(0);

        // audit создан
        const auditRes = await pool.query(
            "SELECT * FROM audit_events WHERE action = $1",
            [AuditAction.DELETE_USER]
        );

        expect(auditRes.rows).toHaveLength(1);
        expect(auditRes.rows[0].actor_user_id).toBe(actor.id);
    });

    it("should rollback and not create audit if user not found", async () => {
        const actor = await useCase.createUser({
            email: "admin@example.com",
            password_hash: "admin_pass"
        });

        const nonExistentUserId = randomUUID();

        await expect(
            useCase.deleteUser(actor.id, nonExistentUserId)
        ).rejects.toThrow("User not found");

        // actor остался
        const usersRes = await pool.query("SELECT * FROM users");
        expect(usersRes.rows).toHaveLength(1);
        expect(usersRes.rows[0].id).toBe(actor.id);

        // audit не создан (кроме USER_CREATED)
        const audits = await pool.query("SELECT * FROM audit_events");
        expect(audits.rows).toHaveLength(1);
    });

    it("should throw error if actorId is not provided", async () => {
        const user = await useCase.createUser({
            email: "user@example.com",
            password_hash: "password123"
        });

        await expect(
            useCase.deleteUser("", user.id)
        ).rejects.toThrow("Actor ID is required");

        // user не удалён
        const usersRes = await pool.query("SELECT * FROM users");
        expect(usersRes.rows).toHaveLength(1);

        // audit не создан
        const audits = await pool.query("SELECT * FROM audit_events");
        expect(audits.rows).toHaveLength(1); // только USER_CREATED
    });
});
