import { UserService } from "../src/services/user_service";
import { UserRepository } from "../src/repositories/user_repository";
import { pool } from "../src/database";
import { NewUser } from "../src/models/models";

describe("UserService - getAllUsers (integration)", () => {
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

    it("should return empty array when no users exist", async () => {
        const users = await service.getAllUsers();
        expect(users).toEqual([]);
    });

    it("should return all users", async () => {
        const usersData: NewUser[] = [
            { email: "u1@example.com", password_hash: "p1" },
            { email: "u2@example.com", password_hash: "p2" }
        ];

        for (const u of usersData) {
            await repo.createUser(u);
        }

        const users = await service.getAllUsers();

        expect(users).toHaveLength(2);
        expect(users.map(u => u.email).sort()).toEqual(
            ["u1@example.com", "u2@example.com"]
        );
    });
});
