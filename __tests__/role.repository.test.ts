import { pool } from "../src/database"
import { RoleRepository } from "../src/repositories/role_repository"

describe("RoleRepository(createRole, findRoleByName, getRoles)", () => {
    let client: any;
    let repo: RoleRepository;

    beforeAll(() => {
        if (process.env.NODE_ENV !== "test") {
            throw new Error("Must be in test environment");
        }
    })

    beforeEach(async () => {
        client = await pool.connect();
        await client.query("BEGIN");
        repo = new RoleRepository(client);
    })

    afterEach(async () => {
        await client.query("ROLLBACK");
        client.release();
    })

    afterAll(async () => {
        await pool.end();
    })

    it("creates, finds and gets roles", async () => {
        const roleName = "testRole";

        const createdRole = await repo.createRole({name: roleName});

        if (!createdRole) throw new Error("Expected role to be created");
        expect(createdRole).not.toBeNull()
        expect(createdRole.name).toBe(roleName);
        expect(createdRole.id).toBeDefined();
        expect(createdRole.created_at).toBeDefined();

        const foundRole = await repo.findRoleByName(roleName);

        if (!foundRole) throw new Error("Expected role to be found");
        expect(foundRole.id).toBe(createdRole.id);
        expect(foundRole.name).toBe(createdRole.name);
        expect(foundRole.created_at.getTime()).toBe(createdRole.created_at.getTime());


        const roles = await repo.getRoles();
        expect(roles).toHaveLength(1);
        expect(roles[0]).toEqual(createdRole);
    });
});