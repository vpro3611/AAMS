import { pool } from "../src/database";
import { UserRoleUseCase } from "../src/usecases/user_role_use_case";
import { AuditAction } from "../src/models/models";
import { User, Role } from "../src/models/models";

describe("UserRoleUseCase.assignRoleToUser (integration)", () => {
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
             VALUES ('actor@test.com', 'hash')
             RETURNING *`
        );
        actor = actorRes.rows[0];

        const userRes = await client.query(
            `INSERT INTO users (email, password_hash)
             VALUES ('user@test.com', 'hash')
                 RETURNING *`
        );
        user = userRes.rows[0];

        const roleRes = await client.query(
            `INSERT INTO roles (name)
             VALUES ('admin')
                 RETURNING *`
        );
        role = roleRes.rows[0];

        await client.query("COMMIT");
        client.release();

        useCase = new UserRoleUseCase(pool);
    });

    afterEach(async () => {
        // чистим всё, что use case мог создать
        await pool.query("DELETE FROM audit_events");
        await pool.query("DELETE FROM user_roles");
        await pool.query("DELETE FROM roles");
        await pool.query("DELETE FROM users");
    });

    afterAll(async () => {
        await pool.end();
    });

    it("assigns role and creates audit record", async () => {
        const result = await useCase.assignRoleToUser(
            actor.id,
            user.id,
            role.id
        );

        expect(result).toEqual({
            user_id: user.id,
            role_id: role.id,
        });

        const userRoles = await pool.query(
            `SELECT * FROM user_roles WHERE user_id = $1 AND role_id = $2`,
            [user.id, role.id]
        );
        expect(userRoles.rows).toHaveLength(1);

        const audits = await pool.query(
            `SELECT * FROM audit_events WHERE actor_user_id = $1`,
            [actor.id]
        );
        expect(audits.rows).toHaveLength(1);
        expect(audits.rows[0].action).toContain(AuditAction.ROLE_ASSIGNED);
    });

    it("rolls back role assignment if audit fails", async () => {
        // невалидный actorId → auditServ.log упадёт по FK
        const invalidActorId = "550e8400-e29b-41d4-a716-446655440999";

        await expect(
            useCase.assignRoleToUser(
                invalidActorId,
                user.id,
                role.id
            )
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

    it("throws error if actorId is missing", async () => {
        await expect(
            useCase.assignRoleToUser(
                "",
                user.id,
                role.id
            )
        ).rejects.toThrow("Actor ID is required");
    });
});
