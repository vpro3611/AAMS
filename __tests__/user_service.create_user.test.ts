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

    it("should create a new user", async () => {
        const newUser: NewUser = {
            email: "test@example.com",
            password_hash: "password123"
        }

        const user = await service.createUser(newUser);

        expect(user.email).toBe(newUser.email);
        expect(user.status).toBe("active");
        expect(user.password_hash).toBe(newUser.password_hash);
    })
});

