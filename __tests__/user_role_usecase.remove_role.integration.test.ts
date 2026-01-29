import { pool } from "../src/database";
import { UserRoleUseCase } from "../src/usecases/user_role_use_case";
import { AuditAction } from "../src/models/models";
import { User, Role } from "../src/models/models";

describe("UserRoleUseCase.removeRoleFromUser (integration)", () => {
    let useCase: UserRoleUseCase;

    let actor: User;
    let user: User;
    let role: Role;

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
             VALUES ('actor_remove@test.com', 'hash')
             RETURNING *`
        );
        actor = actorRes.rows[0];

        const userRes = await client.query(
            `INSERT INTO users (email, password_hash)
             VALUES ('user_remove@test.com', 'hash')
             RETURNING *`
        );
        user = userRes.rows[0];

        const roleRes = await client.query(
            `INSERT INTO roles (name)
             VALUES ('moderator')
             RETURNING *`
        );
        role = roleRes.rows[0];

        await client.query(
            `INSERT INTO user_roles (user_id, role_id)
             VALUES ($1, $2)`,
            [user.id, role.id]
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

    it("removes role from user and creates audit record", async () => {
        const result = await useCase.removeRoleFromUser(
            actor.id,
            user.id,
            role.id
        );

        expect(result).toEqual({
            user_id: user.id,
            role_id: role.id,
        });

        const userRoles = await pool.query(
            `SELECT * FROM user_roles WHERE user_id = $1`,
            [user.id]
        );
        expect(userRoles.rows).toHaveLength(0);

        const audits = await pool.query(
            `SELECT * FROM audit_events WHERE actor_user_id = $1`,
            [actor.id]
        );
        expect(audits.rows).toHaveLength(1);
        expect(audits.rows[0].action).toContain(
            AuditAction.REMOVE_ROLE_FROM_USER
        );
    });

    it("throws error and rolls back when role does not exist", async () => {
        // предварительно удаляем роль
        await pool.query(
            `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`,
            [user.id, role.id]
        );

        await expect(
            useCase.removeRoleFromUser(actor.id, user.id, role.id)
        ).rejects.toThrow();

        const userRoles = await pool.query(
            `SELECT * FROM user_roles WHERE user_id = $1`,
            [user.id]
        );
        expect(userRoles.rows).toHaveLength(0);

        const audits = await pool.query(
            `SELECT * FROM audit_events`
        );
        expect(audits.rows).toHaveLength(0);
    });

    it("rolls back role removal if audit fails", async () => {
        const invalidActorId = "550e8400-e29b-41d4-a716-446655440999";

        await expect(
            useCase.removeRoleFromUser(
                invalidActorId,
                user.id,
                role.id
            )
        ).rejects.toThrow();

        const userRoles = await pool.query(
            `SELECT * FROM user_roles WHERE user_id = $1 AND role_id = $2`,
            [user.id, role.id]
        );
        expect(userRoles.rows).toHaveLength(1);

        const audits = await pool.query(
            `SELECT * FROM audit_events`
        );
        expect(audits.rows).toHaveLength(0);
    });

    it("throws error if actorId is missing", async () => {
        await expect(
            useCase.removeRoleFromUser(
                "",
                user.id,
                role.id
            )
        ).rejects.toThrow("Actor ID is required");
    });
});
