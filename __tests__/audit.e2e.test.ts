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
        await pool.query("DELETE FROM audit_events");
        await pool.query("DELETE FROM users");

        actor = await createUser(`actor_${Date.now()}@test.com`);
        targetUser = await createUser(`target_${Date.now()}@test.com`);

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
        await pool.query("DELETE FROM audit_events");
        await pool.query("DELETE FROM users");
        await pool.end();
    });

    // ─────────────────────────────
    // get all audit logs
    // ─────────────────────────────
    it("returns all audit logs", async () => {
        const res = await request(app)
            .get("/api/audit_logs")
            .set("Authorization", `Bearer ${actorToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/audit");
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
        expect(res.body.every(
            (e: any) => e.actor_user_id === actor.id
        )).toBe(true);
    });

    it("returns empty array if user has no audit logs", async () => {
        const newUser = await createUser(`empty_${Date.now()}@test.com`);

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
        expect(res.body.every(
            (e: any) => e.action === AuditAction.ROLE_ASSIGNED
        )).toBe(true);
    });

    it("returns empty array if action has no logs", async () => {
        const res = await request(app)
            .post("/api/audit_logs/get_action")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ action: AuditAction.GET_AUDIT_EVENTS_BY_USER_ID });

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});
