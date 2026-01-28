import { pool } from "../src/database";
import { UserRepository} from "../src/repositories/user_repository";
import {randomUUID} from "crypto";


describe("UserRepository (creating and finding by email and id, updating status)", () => {
    let client: any;
    let repo: UserRepository;

    beforeAll(() => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("Must be in test environment");
        }
    });

    beforeEach(async () => {
        client = await pool.connect();
        await client.query("BEGIN");
        repo = new UserRepository(client);
    });

    afterEach(async () => {
        await client.query("ROLLBACK");
        client.release();
    });

    afterAll(async () => {
        await pool.end();
    });

    it("creates and finds a user by email and id, and updating status", async () => {
        const email = "test@example.com";

        const created = await repo.createUser({
            email,
            password_hash: "hash123",
        });

        const found = await repo.findUserByEmail(email);

        expect(found).not.toBeNull();

        if (!found) throw new Error("Expected user to be found");

        expect(found.email).toBe(email);

        const foundByID = await repo.findUserById(created.id);

        expect(foundByID).not.toBeNull();

        if (!foundByID) throw new Error("Expected user to be found");

        expect(foundByID.email).toBe(email);

        const updated = await repo.updateUserStatus(foundByID.id, "blocked");
        expect(updated.status).toBe("blocked");
    });

    it('should get list of all users', async () => {
        const email = "test@example.com";
        const password_hash = "hash123";

        const created = await repo.createUser({
            email,
            password_hash
        })

        expect(created).not.toBeNull();

        const users = await repo.getUsers();
        expect(users).toHaveLength(1);
    });

    it('should delete a user by his id', async () => {
        const email = "test@example.com";
        const password_hash = "hash123";

        const created = await repo.createUser({
            email,
            password_hash
        })

        const deleted = await repo.deleteUser(created.id);
        if (!deleted) throw new Error(
            "Expected user to be deleted"
        )
        expect(deleted).not.toBeNull();
        expect(deleted.id).toBe(created.id);
    });

    it('should not delete a user by his id if he does not exist', async () => {
        const userRandomUUID = randomUUID()
        const deleted = await repo.deleteUser(userRandomUUID);
        expect(deleted).toBeNull();
    });
});
