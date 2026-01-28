import { UserService } from "../src/services/user_service";
import { UserRepository } from "../src/repositories/user_repository";
import { pool } from "../src/database";
import { NewUser } from "../src/models/models";

describe("UserService - findUserByEmail (integration)", () => {
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

    it("should return user if email exists", async () => {
        const newUser: NewUser = {
            email: "find_email@example.com",
            password_hash: "password123"
        };

        const createdUser = await repo.createUser(newUser);

        const foundUser = await service.findUserByEmail(createdUser.email);

        expect(foundUser.id).toBe(createdUser.id);
        expect(foundUser.email).toBe(createdUser.email);
        expect(foundUser.status).toBe(createdUser.status);
    });

    it("should throw error if email does not exist", async () => {
        await expect(
            service.findUserByEmail("missing@example.com")
        ).rejects.toThrow("User not found");
    });

    it("should throw error if email is invalid", async () => {
        await expect(
            service.findUserByEmail("not-an-email")
        ).rejects.toThrow("Invalid email format");
    });

    it("should throw error if email is empty", async () => {
        await expect(
            service.findUserByEmail("")
        ).rejects.toThrow("Email cannot be null or undefined");
    });
});
