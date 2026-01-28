import { RolesUseCase } from "../src/usecases/roles_use_case";
import { pool } from "../src/database";
import { AuditAction } from "../src/models/models";
import { UserService } from "../src/services/user_service";
import { UserRepository } from "../src/repositories/user_repository";

describe("RoleUseCase - findRoleByName", () => {
    let useCase: RolesUseCase;
    let userService: UserService;

    beforeEach(async () => {
        await pool.query(`
            TRUNCATE
                user_roles,
                roles,
                users,
                audit_events
            RESTART IDENTITY
            CASCADE
        `);

        useCase = new RolesUseCase(pool);
        userService = new UserService(new UserRepository(pool));
    });

    afterEach(async () => {
        await pool.query(`
            TRUNCATE
                user_roles,
                roles,
                users,
                audit_events
            RESTART IDENTITY
            CASCADE
        `);
    });

    afterAll(async () => {
        await pool.end();
    });

    it("should return role and create audit record when role exists", async () => {
        const user = await userService.createUser({
            email: "find_role@example.com",
            password_hash: "password123"
        });

        // создаём роль напрямую (без use case — это нормально для подготовки)
        await pool.query(
            "INSERT INTO roles (name) VALUES ($1)",
            ["admin"]
        );

        const role = await useCase.findRoleByName(user.id, "admin");

        expect(role).not.toBeNull();
        expect(role!.name).toBe("admin");

        const audits = await pool.query(
            "SELECT * FROM audit_events WHERE action = $1",
            [AuditAction.ROLE_SEARCHED]
        );

        expect(audits.rows).toHaveLength(1);
        expect(audits.rows[0].actor_user_id).toBe(user.id);
    });

    it("should return null and still create audit record when role does not exist", async () => {
        const user = await userService.createUser({
            email: "find_role_null@example.com",
            password_hash: "password123"
        });

        const role = await useCase.findRoleByName(user.id, "non-existent-role");

        expect(role).toBeNull();

        const audits = await pool.query(
            "SELECT * FROM audit_events WHERE action = $1",
            [AuditAction.ROLE_SEARCHED]
        );

        expect(audits.rows).toHaveLength(1);
        expect(audits.rows[0].actor_user_id).toBe(user.id);
    });

    it("should rollback and not create audit if userId is missing", async () => {
        await expect(
            useCase.findRoleByName("", "admin")
        ).rejects.toThrow("User ID is required");

        const audits = await pool.query("SELECT * FROM audit_events");
        expect(audits.rows).toHaveLength(0);
    });
});