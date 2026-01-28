import { pool } from "../src/database"
import { RoleRepository } from "../src/repositories/role_repository"
import {randomUUID} from "crypto";

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

    it("creates, finds, gets roles and updates role", async () => {
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

        const updatedRole = await repo.updateRole(foundRole.id, { name: "updatedRoleName" });
        if (!updatedRole) throw new Error("Expected role to be updated");
        expect(updatedRole.name).toBe("updatedRoleName");
        expect(updatedRole.id).toBe(foundRole.id);
    });

    it('should delete a role)', async () => {
        const roleName = "deleteRoleTest";
        const createdRole = await repo.createRole({name: roleName});

        if (!createdRole) throw new Error("Expected role to be created");
        expect(createdRole).not.toBeNull()
        expect(createdRole.name).toBe(roleName);
        expect(createdRole.id).toBeDefined();
        expect(createdRole.created_at).toBeDefined();

        const deletedRole = await repo.deleteRole(createdRole.id)
        if (!deletedRole) throw new Error("Expected role to be deleted");
        expect(deletedRole.id).toBe(createdRole.id);
        expect(deletedRole.name).toBe(createdRole.name);
    });

    it("shouldnot delete unexistant)", async () => {
        const roleName = "deleteRoleTest";
        const createdRole = await repo.createRole({name: roleName});

        if (!createdRole) throw new Error("Expected role to be created");
        expect(createdRole).not.toBeNull()
        expect(createdRole.name).toBe(roleName);
        expect(createdRole.id).toBeDefined();
        expect(createdRole.created_at).toBeDefined();

        const nonExistentUserId = randomUUID();
        const deletedRole = await repo.deleteRole(nonExistentUserId)

        expect(deletedRole).toBeNull();

    })
});