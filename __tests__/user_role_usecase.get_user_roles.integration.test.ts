import { pool } from "../src/database";
import { UserRoleUseCase } from "../src/usecases/user_role_use_case";
import { AuditAction } from "../src/models/models";
import { User, Role } from "../src/models/models";

describe("UserRoleUseCase.getUserRoles (integration)", () => {
    let useCase: UserRoleUseCase;

    let actor: User;
    let user: User;
    let role1: Role;
    let role2: Role;

    beforeAll(() => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("Must run in test environment");
        }
    });

    beforeEach(async () => {
        const client = await pool.connect();
        await client.query("BEGIN");

        const actorRes = await client.query(
            `INSERT INTO users (email, password_hash)
             VALUES ('actor_roles@test.com', 'hash')
             RETURNING *`
        );
        actor = actorRes.rows[0];

        const userRes = await client.query(
            `INSERT INTO users (email, password_hash)
             VALUES ('user_roles@test.com', 'hash')
             RETURNING *`
        );
        user = userRes.rows[0];

        const role1Res = await client.query(
            `INSERT INTO roles (name) VALUES ('admin') RETURNING *`
        );
        role1 = role1Res.rows[0];

        const role2Res = await client.query(
            `INSERT INTO roles (name) VALUES ('editor') RETURNING *`
        );
        role2 = role2Res.rows[0];

        await client.query(
            `INSERT INTO user_roles (user_id, role_id)
             VALUES ($1, $2), ($1, $3)`,
            [user.id, role1.id, role2.id]
        );

        await client.query("COMMIT");
        client.release();

        useCase = new UserRoleUseCase(pool);
    });

    afterEach(async () => {
        await pool.query("DELETE FROM audit_events");
        await pool.query("DELETE FROM user_roles");
        await pool.query("DELETE FROM roles");
        await pool.query("DELETE FROM users");
    });

    afterAll(async () => {
        await pool.end();
    });

    it("returns user roles and creates audit record", async () => {
        const roles = await useCase.getUserRoles(actor.id, user.id);

        expect(roles).toHaveLength(2);
        expect(roles.map(r => r.role_id)).toEqual(
            expect.arrayContaining([role1.id, role2.id])
        );

        const audits = await pool.query(
            `SELECT * FROM audit_events WHERE actor_user_id = $1`,
            [actor.id]
        );

        expect(audits.rows).toHaveLength(1);
        expect(audits.rows[0].action).toContain(AuditAction.GET_USER_ROLES);
        expect(audits.rows[0].action).toContain(user.id);
    });

    it("returns empty array when user has no roles and still logs audit", async () => {
        // удаляем роли
        await pool.query(
            `DELETE FROM user_roles WHERE user_id = $1`,
            [user.id]
        );

        const roles = await useCase.getUserRoles(actor.id, user.id);

        expect(roles).toEqual([]);

        const audits = await pool.query(
            `SELECT * FROM audit_events WHERE actor_user_id = $1`,
            [actor.id]
        );
        expect(audits.rows).toHaveLength(1);
    });

    it("rolls back if audit creation fails", async () => {
        const invalidActorId = "550e8400-e29b-41d4-a716-446655440999";

        await expect(
            useCase.getUserRoles(invalidActorId, user.id)
        ).rejects.toThrow();

        const audits = await pool.query(
            `SELECT * FROM audit_events`
        );
        expect(audits.rows).toHaveLength(0);
    });

    it("throws error if actorId is missing", async () => {
        await expect(
            useCase.getUserRoles("", user.id)
        ).rejects.toThrow("Actor ID is required");
    });
});
