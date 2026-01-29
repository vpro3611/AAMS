import { UserUseCase } from "../src/usecases/user_use_case";
import { pool } from "../src/database";
import { NewUser } from "../src/models/models";
import { AuditAction } from "../src/models/models";
import { randomUUID } from "crypto";

describe("UserUseCase - unblockUser", () => {
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

    it("should unblock a blocked user and create audit record", async () => {
        const actor = await useCase.createUser({
            email: "admin@example.com",
            password_hash: "admin_pass"
        });

        const targetUser = await useCase.createUser({
            email: "unblock_test@example.com",
            password_hash: "password123"
        });

        expect(targetUser.status).toBe("active");

        const blockedUser = await useCase.blockUser(actor.id, targetUser.id);
        expect(blockedUser.status).toBe("blocked");

        const unblockedUser = await useCase.unblockUser(actor.id, targetUser.id);
        expect(unblockedUser.status).toBe("active");
        expect(unblockedUser.id).toBe(targetUser.id);

        const auditRes = await pool.query(
            "SELECT * FROM audit_events WHERE action = $1",
            [AuditAction.USER_UNBLOCKED]
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
            useCase.unblockUser(actor.id, nonExistentUserId)
        ).rejects.toThrow("User not found");

        const users = await pool.query("SELECT * FROM users");
        const audits = await pool.query("SELECT * FROM audit_events");

        expect(users.rows).toHaveLength(1); // только actor
        expect(audits.rows).toHaveLength(1); // только USER_CREATED
    });

    it("should rollback if user already active", async () => {
        const actor = await useCase.createUser({
            email: "admin@example.com",
            password_hash: "admin_pass"
        });

        const user = await useCase.createUser({
            email: "already_active@example.com",
            password_hash: "password123"
        });

        await expect(
            useCase.unblockUser(actor.id, user.id)
        ).rejects.toThrow("User already active");

        const audits = await pool.query("SELECT * FROM audit_events");

        // USER_CREATED для actor + USER_CREATED для user
        expect(audits.rows).toHaveLength(2);
    });
});
