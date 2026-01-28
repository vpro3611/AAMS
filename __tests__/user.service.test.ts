import { UserService } from "../src/services/user_service";
import { UserRepository } from "../src/repositories/user_repository";
import { pool } from "../src/database";
import { NewUser } from "../src/models/models";
import { randomUUID } from "crypto";

describe("UserService - findUserById (integration)", () => {
    let service: UserService;
    let repo: UserRepository;


    beforeAll( async () => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("Must be in test environment");
        }
    })

    beforeEach(async () => {

        await pool.query(`
            TRUNCATE users
            RESTART IDENTITY
            CASCADE
        `);

        repo = new UserRepository(pool);
        service = new UserService(repo);
    });

    afterEach(async () => {
        await pool.query(`
            TRUNCATE users
            RESTART IDENTITY
            CASCADE
        `);
    });

    afterAll( async () => {
        await pool.end();
    })

    it("should return user if user exists", async () => {
        const newUser: NewUser = {
            email: "find_user@example.com",
            password_hash: "password123"
        };

        const createdUser = await repo.createUser(newUser);

        const foundUser = await service.findUserById(createdUser.id);

        expect(foundUser.id).toBe(createdUser.id);
        expect(foundUser.email).toBe(createdUser.email);
        expect(foundUser.status).toBe(createdUser.status);
    });

    it("should throw error if user does not exist", async () => {
        const nonExistentUserId = randomUUID();

        await expect(
            service.findUserById(nonExistentUserId)
        ).rejects.toThrow("User not found");
    });

    it("should throw error if userId is empty", async () => {
        await expect(
            service.findUserById("")
        ).rejects.toThrow("Invalid user id");
    });
});
