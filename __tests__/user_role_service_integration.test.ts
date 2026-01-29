import { pool } from '../src/database';
import { UserRoleService } from '../src/services/user_role_service';
import { UserRoleRepository } from '../src/repositories/user_role_repository';
import { Role, User } from '../src/models/models';

describe('UserRoleService (integration)', () => {
    let client: any;
    let service: UserRoleService;
    let repo: UserRoleRepository;

    let testUser: User;
    let testRole: Role;

    beforeAll(() => {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('Must run in test environment');
        }
    });

    beforeEach(async () => {
        client = await pool.connect();
        await client.query('BEGIN');

        const userRes = await client.query(
            `INSERT INTO users (email, password_hash)
             VALUES ('service@test.com', 'hashed')
             RETURNING *`
        );
        testUser = userRes.rows[0];

        const roleRes = await client.query(
            `INSERT INTO roles (name)
             VALUES ('service_role')
             RETURNING *`
        );
        testRole = roleRes.rows[0];

        repo = new UserRoleRepository(client);
        service = new UserRoleService(repo);
    });

    afterEach(async () => {
        await client.query('ROLLBACK');
        client.release();
    });

    afterAll(async () => {
        await pool.end();
    });

    it('assigns role to user', async () => {
        const result = await service.assignRoleToUser(
            testUser.id,
            testRole.id
        );

        expect(result).toEqual({
            user_id: testUser.id,
            role_id: testRole.id,
        });
    });

    it('returns user roles', async () => {
        await service.assignRoleToUser(testUser.id, testRole.id);

        const roles = await service.getUserRoles(testUser.id);

        expect(roles).toHaveLength(1);
        expect(roles[0]).toMatchObject({
            user_id: testUser.id,
            role_id: testRole.id,
        });
    });

    it('returns empty array if user has no roles', async () => {
        const roles = await service.getUserRoles(testUser.id);

        expect(roles).toEqual([]);
    });

    it('deletes user role', async () => {
        await service.assignRoleToUser(testUser.id, testRole.id);

        const deleted = await service.deleteUserRole(
            testUser.id,
            testRole.id
        );

        expect(deleted).toEqual({
            user_id: testUser.id,
            role_id: testRole.id,
        });

        const roles = await service.getUserRoles(testUser.id);
        expect(roles).toHaveLength(0);
    });

    it('throws error when deleting non-existent role', async () => {
        await expect(
            service.deleteUserRole(testUser.id, testRole.id)
        ).rejects.toThrow('User role not found');
    });

});
