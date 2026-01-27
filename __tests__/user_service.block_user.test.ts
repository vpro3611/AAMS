import { UserService } from "../src/services/user_service";
import { pool } from "../src/database";
import {PoolClient} from "pg";
import { UserRepository} from "../src/repositories/user_repository";
import { NewUser } from "../src/models/models";

describe("UserService - Block User", () => {
    let service: UserService;
    let client: PoolClient;
    let userRepo: UserRepository;

    beforeAll(() => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("Must be in test environment");
        }
    })

    beforeEach(async () => {
        client = await pool.connect();
        await client.query("BEGIN");
        userRepo = new UserRepository(client);
        service = new UserService(userRepo);
    })

    afterEach(async () => {
        await client.query("ROLLBACK");
        client.release();
    })

    afterAll(async () => {
        await pool.end();
    })

    it("Should block a user", async () => {
        const newUser: NewUser = {
            email: "test2@example.com",
            password_hash: "password123"
        }

        const userId = await userRepo.createUser(newUser);
        await service.blockUser(userId.id);
        const blockedUser = await userRepo.findUserById(userId.id);
        if (!blockedUser) throw new Error("Expected user to be found");
        expect(blockedUser.status).toBe("blocked");
        expect(blockedUser.id).toBe(userId.id);
        expect(blockedUser.email).toBe(userId.email);
    })
})