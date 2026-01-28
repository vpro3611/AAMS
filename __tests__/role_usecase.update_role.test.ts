import { RolesUseCase } from "../src/usecases/roles_use_case";
import { pool } from "../src/database";
import { AuditAction } from "../src/models/models";
import { UserService } from "../src/services/user_service";
import { UserRepository } from "../src/repositories/user_repository";
import {randomUUID} from "crypto";

describe("RoleUseCase - updateRole", () => {
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

    it("should update role and create audit record", async () => {
        const user = await userService.createUser({
            email: "update_role@example.com",
            password_hash: "password123"
        });

        // подготовка роли
        const roleRes = await pool.query(
            "INSERT INTO roles (name) VALUES ($1) RETURNING *",
            ["admin"]
        );
        const roleId = roleRes.rows[0].id;

        const updatedRole = await useCase.updateRole(
            user.id,
            roleId,
            {name: "super_admin"}
        );

        expect(updatedRole).not.toBeNull();
        expect(updatedRole!.name).toBe("super_admin");

        // роль реально обновилась
        const dbRole = await pool.query(
            "SELECT name FROM roles WHERE id = $1",
            [roleId]
        );
        expect(dbRole.rows[0].name).toBe("super_admin");

        // аудит создан
        const audits = await pool.query(
            "SELECT * FROM audit_events WHERE action = $1",
            [AuditAction.ROLE_UPDATED]
        );

        expect(audits.rows).toHaveLength(1);
        expect(audits.rows[0].actor_user_id).toBe(user.id);
    });

    it("should rollback and not create audit if role does not exist", async () => {
        const user = await userService.createUser({
            email: "update_role_not_found@example.com",
            password_hash: "password123"
        });

        const nonExistentRoleId = randomUUID();

        await expect(
            useCase.updateRole(user.id, nonExistentRoleId, { name: "ghost" })
        ).rejects.toThrow();


        const roles = await pool.query("SELECT * FROM roles");
        const audits = await pool.query("SELECT * FROM audit_events");

        expect(roles.rows).toHaveLength(0);
        expect(audits.rows).toHaveLength(0);
    });

    it("should throw and not create audit if userId is missing", async () => {
        const updated = await expect(
            useCase.updateRole("", randomUUID(), { name: "admin" })
        ).rejects.toThrow("User ID is required");

        const audits = await pool.query("SELECT * FROM audit_events");
        expect(audits.rows).toHaveLength(0);
    });
});