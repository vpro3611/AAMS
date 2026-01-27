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
        const newUser: NewUser = {
            email: "unblock_test@example.com",
            password_hash: "password123"
        };

        // create → active
        const createdUser = await useCase.createUser(newUser);
        expect(createdUser.status).toBe("active");

        // block → blocked
        const blockedUser = await useCase.blockUser(createdUser.id);
        expect(blockedUser.status).toBe("blocked");

        // unblock → active
        const unblockedUser = await useCase.unblockUser(createdUser.id);
        expect(unblockedUser.status).toBe("active");
        expect(unblockedUser.id).toBe(createdUser.id);

        // проверяем audit
        const auditRes = await pool.query(
            "SELECT * FROM audit_events WHERE action = $1",
            [AuditAction.USER_UNBLOCKED]
        );

        expect(auditRes.rows).toHaveLength(1);
        expect(auditRes.rows[0].actor_user_id).toBe(createdUser.id);
    });

    it("should rollback and not create audit if user not found", async () => {
        const nonExistentUserId = randomUUID();

        await expect(
            useCase.unblockUser(nonExistentUserId)
        ).rejects.toThrow("User not found");

        const users = await pool.query("SELECT * FROM users");
        const audits = await pool.query("SELECT * FROM audit_events");

        expect(users.rows).toHaveLength(0);
        expect(audits.rows).toHaveLength(0);
    });

    it("should rollback if user already active", async () => {
        const user = await useCase.createUser({
            email: "already_active@example.com",
            password_hash: "password123"
        });

        await expect(
            useCase.unblockUser(user.id)
        ).rejects.toThrow("User already active");

        const audits = await pool.query("SELECT * FROM audit_events");
        expect(audits.rows).toHaveLength(1); // только USER_CREATED
    });


});
