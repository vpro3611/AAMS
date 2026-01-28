import { RolesUseCase } from "../src/usecases/roles_use_case";
import { pool } from "../src/database";
import {UserService} from "../src/services/user_service";
import {UserRepository} from "../src/repositories/user_repository";

describe("RoleUseCase - createRole", () => {
    let useCase: RolesUseCase;
    let uService: UserService;

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
        uService = new UserService(new UserRepository(pool));
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

    it("should create role and audit record in one transaction", async () => {
        const createdUser = await uService.createUser({
            email: "role_test@example.com",
            password_hash: "password123"
        });

        const role = await useCase.createRole(createdUser.id, {
            name: "admin"
        });

        expect(role).toBeDefined();
        expect(role!.name).toBe("admin");

        const roles = await pool.query("SELECT * FROM roles");
        const audits = await pool.query("SELECT * FROM audit_events");

        expect(roles.rows).toHaveLength(1);
        expect(audits.rows).toHaveLength(1);
        expect(audits.rows[0].actor_user_id).toBe(createdUser.id);
    });

    it("should rollback if role already exists", async () => {
        const createdUser = await uService.createUser({
            email: "role_test2@example.com",
            password_hash: "password123"
        });

        await useCase.createRole(createdUser.id, { name: "admin" });

        await expect(
            useCase.createRole(createdUser.id, { name: "admin" })
        ).rejects.toThrow();

        const roles = await pool.query("SELECT * FROM roles");
        const audits = await pool.query("SELECT * FROM audit_events");

        expect(roles.rows).toHaveLength(1);
        expect(audits.rows).toHaveLength(1);
    });
});

