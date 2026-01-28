import { UserService } from "../src/services/user_service";
import { pool } from "../src/database";
import { PoolClient } from "pg";
import { UserRepository} from "../src/repositories/user_repository";
import { NewUser } from "../src/models/models";

describe("UserService - CreateUser", () => {
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
    it("Should unblock a user", async () => {
        const newUser: NewUser = {
            email: "test3@example.com",
            password_hash: "password123"
        }

        const userId = await userRepo.createUser(newUser);

        const blockedUser = await service.blockUser(userId.id);
        if (!blockedUser) throw new Error("Expected user to be found");
        expect(blockedUser.status).toBe("blocked");
        expect(blockedUser.id).toBe(userId.id);


        const unblockedUser = await service.unblockUser(blockedUser.id);
        expect(unblockedUser.status).toBe("active");
        expect(unblockedUser.id).toBe(userId.id);
        expect(unblockedUser.email).toBe(userId.email);
    })
});