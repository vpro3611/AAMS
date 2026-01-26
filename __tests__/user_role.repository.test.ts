import { pool } from '../src/database';
import { UserRoleRepository } from '../src/repositories/user_role_repository';
import {Role, User} from "../src/models/models";


describe('User Role Repository (assignRoleToUser, getUserRoles)', () => {
    let client: any;
    let repo: UserRoleRepository;
    let testRole: Role;
    let testUser: User;

    beforeAll(() => {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('Must be in test environment');
        }
    })

    beforeEach(async () => {
        client = await pool.connect();
        await client.query('BEGIN');

        const res = await client.query("INSERT INTO roles (name) VALUES ('testRole') RETURNING *");
        testRole = res.rows[0];

        const res2 = await client.query("INSERT INTO users (email, password_hash) VALUES ('makusa@gmail', 'imagineHashed') RETURNING *");
        testUser = res2.rows[0];

        repo = new UserRoleRepository(client);
    })

    afterEach(async () => {
        await client.query('ROLLBACK');
        client.release();
    })

    afterAll(async () => {
        await pool.end();
    })

    it('assigns a role to a user and gets the user roles', async () => {
        await repo.assignRoleToUser(testUser.id, testRole.id);
        const userRoles = await repo.getUserRoles(testUser.id);
        expect(userRoles).toHaveLength(1);
        expect(userRoles[0].role_id).toBe(testRole.id);
        expect(userRoles[0].user_id).toBe(testUser.id);
    });
});