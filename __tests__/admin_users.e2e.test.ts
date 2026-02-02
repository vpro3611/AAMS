import request from "supertest";
import jwt from "jsonwebtoken";

import { createApp } from "../src/app";
import { buildContainer } from "../src/container";
import { pool } from "../src/database";
import { UserStatus } from "../src/models/models";

describe("Users API (integration, status-based)", () => {
    let app: any;

    let actor: any;
    let actorToken: string;
    let target: any;

    // ─────────────────────────────
    // helpers (реальная БД)
    // ─────────────────────────────
    const createUser = async (
        email: string,
        status: UserStatus = UserStatus.ACTIVE
    ) => {
        const res = await pool.query(
            `
                INSERT INTO users (email, password_hash, status)
                VALUES ($1, 'hashed', $2)
                    RETURNING *
            `,
            [email, status]
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
        // чистим таблицу перед каждым тестом
        await pool.query("DELETE FROM users");

        actor = await createUser(`actor_${Date.now()}@test.com`);
        target = await createUser(`target_${Date.now()}@test.com`);

        actorToken = jwt.sign(
            { sub: actor.id },
            process.env.JWT_SECRET!
        );
    });

    afterAll(async () => {
        await pool.query("DELETE FROM users");
        await pool.end();
    });

    // ─────────────────────────────
    // block user
    // ─────────────────────────────
    it("blocks another active user", async () => {
        const res = await request(app)
            .patch("/api/block_user")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ user_id: target.id });

        expect(res.status).toBe(200);
        expect(res.body.blockedUser.status).toBe(UserStatus.BLOCKED);
    });

    it("cannot block yourself", async () => {
        const res = await request(app)
            .patch("/api/block_user")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ user_id: actor.id });

        expect(res.status).toBe(400);
    });

    it("blocked user cannot block anyone", async () => {
        await pool.query(
            `UPDATE users SET status = $1 WHERE id = $2`,
            [UserStatus.BLOCKED, actor.id]
        );

        const res = await request(app)
            .patch("/api/block_user")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ user_id: target.id });

        expect(res.status).toBe(403);
        expect(res.body.code).toBe("USER_BLOCKED");
    });

    // ─────────────────────────────
    // unblock user
    // ─────────────────────────────
    it("unblocks blocked user", async () => {
        await pool.query(
            `UPDATE users SET status = $1 WHERE id = $2`,
            [UserStatus.BLOCKED, target.id]
        );

        const res = await request(app)
            .patch("/api/unblock_user")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ user_id: target.id });

        expect(res.status).toBe(200);
        expect(res.body.unblockedUser.status).toBe(UserStatus.ACTIVE);
    });

    // ─────────────────────────────
    // find user by id
    // ─────────────────────────────
    it("finds user by id", async () => {
        const res = await request(app)
            .post("/api/user/get_id")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ user_id: target.id });

        expect(res.status).toBe(200);
        expect(res.body.foundUser.id).toBe(target.id);
    });

    it("returns 404 when user not found by id", async () => {
        const res = await request(app)
            .post("/api/user/get_id")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({
                user_id: "00000000-0000-0000-0000-000000000000",
            });

        expect(res.status).toBe(404);
    });

    // ─────────────────────────────
    // find user by email
    // ─────────────────────────────
    it("finds user by email", async () => {
        const res = await request(app)
            .post("/api/user/get_email")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ email: target.email });

        expect(res.status).toBe(200);
        expect(res.body.foundUser.email).toBe(target.email);
    });

    // ─────────────────────────────
    // get all users
    // ─────────────────────────────
    it("returns all users", async () => {
        await createUser(`u1_${Date.now()}@test.com`);
        await createUser(`u2_${Date.now()}@test.com`);

        const res = await request(app)
            .get("/api/users")
            .set("Authorization", `Bearer ${actorToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.allUsers)).toBe(true);
        expect(res.body.allUsers.length).toBeGreaterThanOrEqual(3);
    });

    // ─────────────────────────────
    // delete user
    // ─────────────────────────────
    it("deletes another user", async () => {
        const res = await request(app)
            .post("/api/user/delete")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ user_id: target.id });

        expect(res.status).toBe(200);
        expect(res.body.deletedUser.id).toBe(target.id);
    });

    it("cannot delete yourself", async () => {
        const res = await request(app)
            .post("/api/user/delete")
            .set("Authorization", `Bearer ${actorToken}`)
            .send({ user_id: actor.id });

        expect(res.status).toBe(400);
    });
});
