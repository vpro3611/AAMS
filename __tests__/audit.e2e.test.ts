import request from "supertest";
import jwt from "jsonwebtoken";

import { createApp } from "../src/app";
import { buildContainer } from "../src/container";
import { pool } from "../src/database";
import { AuditAction } from "../src/models/models";

describe("Audit API (integration)", () => {
    let app: any;

    let actor: any;
    let actorToken: string;
    let targetUser: any;

    const ADMIN = "ADMIN";

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

    const createAudit = async (actorId: string, action: AuditAction) => {
        await pool.query(
            `
            INSERT INTO audit_events (actor_user_id, action)
            VALUES ($1, $2)
            `,
            [actorId, action]
        );
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

        targetUser = await createUser(
            `target_${Date.now()}@test.com`
        );

        actorToken = jwt.sign(
            { sub: actor.id },
            process.env.JWT_SECRET!
        );

        // seed audit logs
        await createAudit(actor.id, AuditAction.ROLE_ASSIGNED);
        await createAudit(actor.id, AuditAction.GET_USER_ROLES);
        await createAudit(targetUser.id, AuditAction.ROLE_ASSIGNED);
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
    // get all audit logs
    // ─────────────────────────────
    it("returns all audit logs (ADMIN or MODERATOR)", async () => {
        const res = await request(app)
            .get("/api/audit_logs")
            .set("Authorization", `Bearer ${actorToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/audit_logs");
        expect(res.status).toBe(401);
    });

    // ─────────────────────────────
    // get audit logs by user id
    // ─────────────────────────────
    it("returns audit logs by user id", async () => {
        const res = await request(app)
            .post("/api/audit_logs/get_user")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ userId: actor.id });

        expect(res.status).toBe(200);
        expect(
            res.body.every(
                (e: any) => e.actor_user_id === actor.id
            )
        ).toBe(true);
    });

    it("returns empty array if user has no logs", async () => {
        const newUser = await createUser(
            `empty_${Date.now()}@test.com`
        );

        const res = await request(app)
            .post("/api/audit_logs/get_user")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ userId: newUser.id });

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    // ─────────────────────────────
    // get audit logs by action
    // ─────────────────────────────
    it("returns audit logs by action", async () => {
        const res = await request(app)
            .post("/api/audit_logs/get_action")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ action: AuditAction.ROLE_ASSIGNED });

        expect(res.status).toBe(200);
        expect(
            res.body.every(
                (e: any) =>
                    e.action === AuditAction.ROLE_ASSIGNED
            )
        ).toBe(true);
    });

    it("returns empty array if action has no logs", async () => {
        const res = await request(app)
            .post("/api/audit_logs/get_action")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({
                action: AuditAction.GET_AUDIT_EVENTS_BY_USER_ID,
            });

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});
