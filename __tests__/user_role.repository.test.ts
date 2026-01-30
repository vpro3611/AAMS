import { pool } from '../src/database';
import { UserRoleRepository } from '../src/repositories/user_role_repository';
import { Role, User } from '../src/models/models';

describe('UserRoleRepository (integration)', () => {
    let client: any;
    let repo: UserRoleRepository;
    let testRole: Role;
    let testUser: User;

    beforeAll(() => {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('Tests must run in test environment');
        }
    });

    beforeEach(async () => {
        client = await pool.connect();
        await client.query('BEGIN');

        const roleRes = await client.query(
            `INSERT INTO roles (name)
             VALUES ('testRole')
             RETURNING *`
        );
        testRole = roleRes.rows[0];

        const userRes = await client.query(
            `INSERT INTO users (email, password_hash)
             VALUES ('makusa@gmail.com', 'hashed')
             RETURNING *`
        );
        testUser = userRes.rows[0];

        repo = new UserRoleRepository(client);
    });

    afterEach(async () => {
        await client.query('ROLLBACK');
        client.release();
    });

    afterAll(async () => {
        await pool.end();
    });

    it('assigns a role to a user', async () => {
        const result = await repo.assignRoleToUser(testUser.id, testRole.id);

        expect(result).not.toBeNull();

        expect(result).toEqual({
            user_id: testUser.id,
            role_id: testRole.id,
        });
    });

    it('returns user roles with role names', async () => {
        await repo.assignRoleToUser(testUser.id, testRole.id);

        const roles = await repo.getUserRoles(testUser.id);

        expect(roles).toHaveLength(1);
        expect(roles[0]).toEqual({
            user_id: testUser.id,
            role_id: testRole.id,
            role_name: testRole.name,
        });
    });

    it('returns empty array if user has no roles', async () => {
        const roles = await repo.getUserRoles(testUser.id);

        expect(roles).toEqual([]);
    });

    it('deletes user role', async () => {
        await repo.assignRoleToUser(testUser.id, testRole.id);

        const deleted = await repo.deleteUserRole(testUser.id, testRole.id);

        expect(deleted).toEqual({
            user_id: testUser.id,
            role_id: testRole.id,
        });

        const roles = await repo.getUserRoles(testUser.id);
        expect(roles).toHaveLength(0);
    });

    it('returns null when deleting non-existent role', async () => {
        const result = await repo.deleteUserRole(testUser.id, testRole.id);

        expect(result).toBeNull();
    });
});
