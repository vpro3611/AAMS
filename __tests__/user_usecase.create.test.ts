import { UserUseCase} from "../src/usecases/user_use_case";
import { pool } from "../src/database";
import { NewUser } from "../src/models/models";

describe('UserUseCase - create a user', () => {
    let useCase: UserUseCase;

    beforeAll(() => {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('Must be in test environment');
        }
    });

    beforeEach(async () => {
       await pool.query(`TRUNCATE users, audit_events RESTART IDENTITY CASCADE`);

       useCase = new UserUseCase(pool);
    })

    afterEach(async () => {
        await pool.query(`TRUNCATE users, audit_events RESTART IDENTITY CASCADE`);
    })

    afterAll(async () => {
        await pool.end();
    })

    it("Should create a user and audit record in one transaction", async () => {
        const newUser: NewUser = {
            email: "usecase_test@example.com",
            password_hash: "password123"
        };

        const user = await useCase.createUser(newUser);

        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        expect(user.email).toBe(newUser.email);
        expect(user.status).toBe("active");
        expect(user.password_hash).toBe(newUser.password_hash);

        const auditEvents = await pool.query(`SELECT * FROM audit_events WHERE action = 'USER_CREATED'`);
        expect(auditEvents.rowCount).toBe(1);
        expect(auditEvents.rows[0].actor_user_id).toBe(user.id);
    })

    it("should rollback user creation if audit fails", async () => {
        const newUser: NewUser = {
            email: "duplicate@example.com",
            password_hash: "password123"
        };

        await useCase.createUser(newUser);

        await expect(useCase.createUser(newUser))
            .rejects
            .toThrow("User already exists");

        const users = await pool.query("SELECT * FROM users");
        const audits = await pool.query("SELECT * FROM audit_events");

        expect(users.rows.length).toBe(1);
        expect(audits.rows.length).toBe(1);
    });
})