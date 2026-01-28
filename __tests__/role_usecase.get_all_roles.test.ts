import { RolesUseCase } from "../src/usecases/roles_use_case";
import { pool } from "../src/database";
import { AuditAction } from "../src/models/models";
import { UserService } from "../src/services/user_service";
import { UserRepository } from "../src/repositories/user_repository";

describe("RoleUseCase - getAllRoles", () => {
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
    })

    it("should return all roles and create audit record", async () => {
        const user = await userService.createUser({
            email: "get_all_roles@example.com",
            password_hash: "password123"
        });

        // подготовка данных (напрямую)
        await pool.query(
            "INSERT INTO roles (name) VALUES ($1), ($2)",
            ["admin", "moderator"]
        );

        const roles = await useCase.getAllRoles(user.id);

        expect(roles).toHaveLength(2);
        expect(roles.map(r => r.name).sort()).toEqual(
            ["admin", "moderator"]
        );

        const audits = await pool.query(
            "SELECT * FROM audit_events WHERE action = $1",
            [AuditAction.ROLES_SEARCHED]
        );

        expect(audits.rows).toHaveLength(1);
        expect(audits.rows[0].actor_user_id).toBe(user.id);
    });

    it("should return empty array and still create audit record when no roles exist", async () => {
        const user = await userService.createUser({
            email: "get_all_roles_empty@example.com",
            password_hash: "password123"
        });

        const roles = await useCase.getAllRoles(user.id);

        expect(roles).toEqual([]);

        const audits = await pool.query(
            "SELECT * FROM audit_events WHERE action = $1",
            [AuditAction.ROLES_SEARCHED]
        );

        expect(audits.rows).toHaveLength(1);
        expect(audits.rows[0].actor_user_id).toBe(user.id);
    });

        it("should rollback and not create audit if userId is missing", async () => {
        await expect(
            useCase.getAllRoles("")
        ).rejects.toThrow("User ID is required");

        const audits = await pool.query("SELECT * FROM audit_events");
        expect(audits.rows).toHaveLength(0);
    });
});
