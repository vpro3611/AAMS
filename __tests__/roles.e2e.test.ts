import request from "supertest";
import jwt from "jsonwebtoken";

import { createApp } from "../src/app";
import { buildContainer } from "../src/container";
import { pool } from "../src/database";

describe("Roles API (integration)", () => {
    let app: any;

    let actor: any;
    let actorToken: string;

    const ADMIN = "ADMIN";

    // ─────────────────────────────
    // helpers
    // ─────────────────────────────
    const createUser = async (email: string) => {
        const res = await pool.query(
            `
                INSERT INTO users (email, password_hash, status)
                VALUES ($1, 'hashed', 'active')
                    RETURNING *
            `,
            [email]
        );
        return res.rows[0];
    };

    const createRole = async (name: string) => {
        const res = await pool.query(
            `INSERT INTO roles (name) VALUES ($1) RETURNING *`,
            [name]
        );
        return res.rows[0];
    };

    const assignRole = async (userId: string, roleId: string) => {
        await pool.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
            [userId, roleId]
        );
    };

    const createAdminUser = async (email: string) => {
        const user = await createUser(email);

        let roleRes = await pool.query(
            `SELECT * FROM roles WHERE name = $1`,
            [ADMIN]
        );

        let role = roleRes.rows[0];

        if (!role) {
            role = await createRole(ADMIN);
        }

        await assignRole(user.id, role.id);

        return user;
    };

    // ─────────────────────────────
    // lifecycle
    // ─────────────────────────────
    beforeAll(async () => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("NODE_ENV must be test");
        }

        const deps = buildContainer();
        app = createApp(deps);
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

        actor = await createAdminUser(
            `admin_${Date.now()}@test.com`
        );

        actorToken = jwt.sign(
            { sub: actor.id },
            process.env.JWT_SECRET!
        );
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
    // create role
    // ─────────────────────────────
    it("creates role (ADMIN or MODERATOR)", async () => {
        const res = await request(app)
            .post("/api/role")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ name: "moderator" });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe("moderator");
    });

    it("cannot create role with same name twice", async () => {
        await createRole("admin");

        const res = await request(app)
            .post("/api/role")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ name: "admin" });

        expect(res.status).toBe(500);
    });

    // ─────────────────────────────
    // find role by name
    // ─────────────────────────────
    it("finds role by name", async () => {
        const role = await createRole("moderator");

        const res = await request(app)
            .post("/api/role/get_name")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ roleName: role.name });

        expect(res.status).toBe(200);
        expect(res.body.foundRole.name).toBe("moderator");
    });

    it("returns 404 if role not found", async () => {
        const res = await request(app)
            .post("/api/role/get_name")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ roleName: "ghost" });

        expect(res.status).toBe(404);
    });

    // ─────────────────────────────
    // get all roles
    // ─────────────────────────────
    it("returns all roles", async () => {
        await createRole("admin");
        await createRole("moderator");

        const res = await request(app)
            .get("/api/roles")
            .set("Authorization", `Bearer ${actorToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.allRoles)).toBe(true);
        const roles = res.body.allRoles.map((r: any) => r.name);
        expect(roles).toContain("admin");
        expect(roles).toContain("moderator");
        // expect(res.body.allRoles.length).toBe(2);
    });

    // ─────────────────────────────
    // update role
    // ─────────────────────────────
    it("updates role name", async () => {
        const role = await createRole("user");

        const res = await request(app)
            .patch("/api/role/update")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({
                role_id: role.id,
                name: "basic_user",
            });

        expect(res.status).toBe(200);
        expect(res.body.updatedRole.name).toBe("basic_user");
    });

    // ─────────────────────────────
    // delete role
    // ─────────────────────────────
    it("deletes role", async () => {
        const role = await createRole("temp");

        const res = await request(app)
            .post("/api/role/delete")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ roleId: role.id });

        expect(res.status).toBe(200);
        expect(res.body.deletedRole.id).toBe(role.id);
    });
});
