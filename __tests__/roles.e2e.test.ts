import request from "supertest";
import jwt from "jsonwebtoken";

import { createApp } from "../src/app";
import { buildContainer } from "../src/container";
import { pool } from "../src/database";

describe("Roles API (integration)", () => {
    let app: any;

    let actor: any;
    let actorToken: string;

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
            `
            INSERT INTO roles (name)
            VALUES ($1)
            RETURNING *
            `,
            [name]
        );
        return res.rows[0];
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
        // порядок важен из-за FK
        await pool.query("DELETE FROM user_roles");
        await pool.query("DELETE FROM roles");
        await pool.query("DELETE FROM users");

        actor = await createUser(`actor_${Date.now()}@test.com`);
        actorToken = jwt.sign(
            { sub: actor.id },
            process.env.JWT_SECRET!
        );
    });

    afterAll(async () => {
        await pool.query("DELETE FROM user_roles");
        await pool.query("DELETE FROM roles");
        await pool.query("DELETE FROM users");
        await pool.end();
    });

    // ─────────────────────────────
    // create role
    // ─────────────────────────────
    it("creates role", async () => {
        const res = await request(app)
            .post("/api/role")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ name: "admin" });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe("admin");
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

    it("returns 404 if role not found by name", async () => {
        const res = await request(app)
            .post("/api/role/get_name")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ roleName: "non-existent" });

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
        expect(res.body.allRoles.length).toBe(2);
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

    it("returns 404 when updating non-existent role", async () => {
        const res = await request(app)
            .patch("/api/role/update")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({
                role_id: "00000000-0000-0000-0000-000000000000",
                name: "ghost",
            });

        expect(res.status).toBe(404);
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

    it("returns 404 when deleting non-existent role", async () => {
        const res = await request(app)
            .post("/api/role/delete")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({
                roleId: "00000000-0000-0000-0000-000000000000",
            });

        expect(res.status).toBe(404);
    });
});
