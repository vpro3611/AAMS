import request from "supertest";
import jwt from "jsonwebtoken";

import { createApp } from "../src/app";
import { buildContainer } from "../src/container";
import { pool } from "../src/database";

describe("UserRole API (integration)", () => {
    let app: any;

    let actor: any;
    let actorToken: string;
    let user: any;
    let role: any;

    // ─────────────────────────────
    // helpers
    // ─────────────────────────────
    const createUser = async (email: string) => {
        const res = await pool.query(
            `
            INSERT INTO users (email, password_hash, status)
            VALUES ($1, 'hash', 'active')
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

        actor = await createUser(`actor_${Date.now()}@test.com`);
        user = await createUser(`user_${Date.now()}@test.com`);
        role = await createRole("admin");

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
    // assign role
    // ─────────────────────────────
    it("assigns role to user", async () => {
        const res = await request(app)
            .post("/api/assign_role")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ userId: user.id, roleId: role.id });

        expect(res.status).toBe(200);
        expect(res.body.user_id).toBe(user.id);
        expect(res.body.role_id).toBe(role.id);
    });

    it("returns 409 when assigning duplicate role", async () => {
        await pool.query(
            `
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
            `,
            [user.id, role.id]
        );

        const res = await request(app)
            .post("/api/assign_role")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ userId: user.id, roleId: role.id });

        expect(res.status).toBe(500);
    });

    // ─────────────────────────────
    // get user roles
    // ─────────────────────────────
    it("returns user roles", async () => {
        await pool.query(
            `
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
            `,
            [user.id, role.id]
        );

        const res = await request(app)
            .post("/api/get_roles")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ userId: user.id });

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].role_id).toBe(role.id);
    });

    it("returns empty array when user has no roles", async () => {
        const res = await request(app)
            .post("/api/get_roles")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ userId: user.id });

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    // ─────────────────────────────
    // remove role
    // ─────────────────────────────
    it("removes role from user", async () => {
        await pool.query(
            `
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
            `,
            [user.id, role.id]
        );

        const res = await request(app)
            .post("/api/remove_role")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ userId: user.id, roleId: role.id });

        expect(res.status).toBe(200);
        expect(res.body.role_id).toBe(role.id);
    });

    it("returns 404 when removing non-existent user role", async () => {
        const res = await request(app)
            .post("/api/remove_role")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ userId: user.id, roleId: role.id });

        expect(res.status).toBe(404);
    });

    it("returns 401 without token", async () => {
        const res = await request(app)
            .post("/api/assign_role")
            .send({ userId: user.id, roleId: role.id });

        expect(res.status).toBe(401);
    });
});
