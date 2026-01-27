import { UserUseCase } from "../src/usecases/user_use_case";
import { pool } from "../src/database";
import { NewUser } from "../src/models/models";
import { AuditAction } from "../src/models/models";
import { randomUUID } from "crypto";

describe("UserUseCase - blockUser", () => {
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

    it("should block user and create audit record in one transaction", async () => {
        const newUser: NewUser = {
            email: "block_test@example.com",
            password_hash: "password123"
        };

        // создаём пользователя через use case
        const createdUser = await useCase.createUser(newUser);
        expect(createdUser.status).toBe("active");

        // блокируем
        const blockedUser = await useCase.blockUser(createdUser.id);

        expect(blockedUser.status).toBe("blocked");
        expect(blockedUser.id).toBe(createdUser.id);

        // проверяем БД напрямую (это нормально для integration)
        const userRes = await pool.query(
            "SELECT status FROM users WHERE id = $1",
            [createdUser.id]
        );

        expect(userRes.rows[0].status).toBe("blocked");

        const auditRes = await pool.query(
            "SELECT * FROM audit_events WHERE action = $1",
            [AuditAction.USER_BLOCKED]
        );

        expect(auditRes.rows).toHaveLength(1);
        expect(auditRes.rows[0].actor_user_id).toBe(createdUser.id);
    });

    it("should rollback and not create audit if user not found", async () => {
        const nonExistentUserId = randomUUID();

        await expect(
            useCase.blockUser(nonExistentUserId)
        ).rejects.toThrow("User not found");

        const users = await pool.query("SELECT * FROM users");
        const audits = await pool.query("SELECT * FROM audit_events");

        expect(users.rows).toHaveLength(0);
        expect(audits.rows).toHaveLength(0);
    });

});
