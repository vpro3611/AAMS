import { pool } from "../src/database";
import { UserUseCase } from "../src/usecases/user_use_case";
import { Roles } from "../src/models/models";

describe("UserUseCase.registerUserWithDefaultRole (integration)", () => {
    let useCase: UserUseCase;

    beforeAll(() => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("NODE_ENV must be test");
        }
        useCase = new UserUseCase(pool);
    });

    beforeEach(async () => {
        await pool.query(`
            TRUNCATE TABLE
                audit_events,
                user_roles,
                roles,
                users
            RESTART IDENTITY CASCADE
        `);
    });

    afterAll(async () => {
        await pool.query(`
            TRUNCATE TABLE
                audit_events,
                user_roles,
                roles,
                users
            RESTART IDENTITY CASCADE
        `);
        await pool.end();
    });

    // ─────────────────────────────
    // 1️⃣ creates user + role if missing
    // ─────────────────────────────
    it("creates user and default role if it does not exist", async () => {
        const user = await useCase.registerUserWithDefaultRole({
            email: "test1@test.com",
            password_hash: "hash"
        });

        expect(user).toBeDefined();
        expect(user.email).toBe("test1@test.com");

        const roleRes = await pool.query(
            `SELECT * FROM roles WHERE name = $1`,
            [Roles.USER]
        );

        expect(roleRes.rows).toHaveLength(1);

        const userRoleRes = await pool.query(
            `SELECT * FROM user_roles WHERE user_id = $1`,
            [user.id]
        );

        expect(userRoleRes.rows).toHaveLength(1);
        expect(userRoleRes.rows[0].role_id).toBe(roleRes.rows[0].id);
    });

    // ─────────────────────────────
    // 2️⃣ does not create duplicate role
    // ─────────────────────────────
    it("does not create duplicate USER role if it already exists", async () => {
        // предварительно создаём роль
        const existingRole = await pool.query(
            `INSERT INTO roles (name) VALUES ($1) RETURNING *`,
            [Roles.USER]
        );

        const user = await useCase.registerUserWithDefaultRole({
            email: "test2@test.com",
            password_hash: "hash"
        });

        const rolesRes = await pool.query(
            `SELECT * FROM roles WHERE name = $1`,
            [Roles.USER]
        );

        expect(rolesRes.rows).toHaveLength(1); // не создалась вторая

        const userRoleRes = await pool.query(
            `SELECT * FROM user_roles WHERE user_id = $1`,
            [user.id]
        );

        expect(userRoleRes.rows).toHaveLength(1);
        expect(userRoleRes.rows[0].role_id).toBe(existingRole.rows[0].id);
    });

    // ─────────────────────────────
    // 3️⃣ rollback on failure
    // ─────────────────────────────
    it("rolls back everything if user creation fails", async () => {
        // создаём пользователя с тем же email чтобы вызвать conflict
        await pool.query(
            `INSERT INTO users (email, password_hash, status)
             VALUES ($1, 'hash', 'active')`,
            ["duplicate@test.com"]
        );

        await expect(
            useCase.registerUserWithDefaultRole({
                email: "duplicate@test.com",
                password_hash: "hash"
            })
        ).rejects.toThrow();

        // убеждаемся что роль не создалась
        const roleRes = await pool.query(
            `SELECT * FROM roles WHERE name = $1`,
            [Roles.USER]
        );

        expect(roleRes.rows).toHaveLength(0);

        // убеждаемся что user_roles не создался
        const userRolesRes = await pool.query(
            `SELECT * FROM user_roles`
        );

        expect(userRolesRes.rows).toHaveLength(0);
    });
});
