import { UserService } from "../src/services/user_service";
import { UserRepository } from "../src/repositories/user_repository";
import { pool } from "../src/database";
import { NewUser } from "../src/models/models";
import { randomUUID } from "crypto";

describe("UserService - deleteUser (integration)", () => {
    let service: UserService;
    let repo: UserRepository;

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

    it("should delete user and return deleted user", async () => {
        const newUser: NewUser = {
            email: "delete_me@example.com",
            password_hash: "password123"
        };

        const createdUser = await repo.createUser(newUser);

        const deletedUser = await service.deleteUser(createdUser.id);

        expect(deletedUser.id).toBe(createdUser.id);
        expect(deletedUser.email).toBe(createdUser.email);

        const users = await service.getAllUsers();
        expect(users).toHaveLength(0);
    });

    it("should throw error if user does not exist", async () => {
        const nonExistentUserId = randomUUID();

        await expect(
            service.deleteUser(nonExistentUserId)
        ).rejects.toThrow("User not found");
    });

    it("should throw error if userId is empty", async () => {
        await expect(
            service.deleteUser("")
        ).rejects.toThrow("Invalid user id");
    });
});
