import {RoleService} from "../src/services/role_service";
import {PoolClient} from "pg";
import {RoleRepository} from "../src/repositories/role_repository";
import {pool} from "../src/database";
import {NewRole} from "../src/models/models";
import {randomUUID} from "crypto";


describe('RoleService', () => {
    let service: RoleService;
    let client: PoolClient;
    let repo: RoleRepository;

    beforeAll(() => {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('Must be in test environment');
        }
    })

    beforeEach(async () => {
        client = await pool.connect();
        await client.query('BEGIN');
        repo = new RoleRepository(client);
        service = new RoleService(repo);
    })

    afterEach(async () => {
        await client.query('ROLLBACK');
        client.release();
    })

    afterAll(async () => {
        await pool.end();
    })

    it("should create a role", async () => {
        const newRole: NewRole = {
            name: 'Test Role',
        };

        const createdRole = await service.createNewRole(newRole);
        if (!createdRole) throw new Error("Expected role to be created");
        expect(createdRole).toBeDefined();
        expect(createdRole.name).toBe(newRole.name);
    })

    it("should get all roles", async () => {
        const newRole: NewRole = {
            name: 'Test Role',
        };

        const createdRole = await service.createNewRole(newRole);
        if (!createdRole) throw new Error("Expected role to be created");

        const allRoles = await service.getAllRoles();

        expect(allRoles).toBeDefined();
        expect(allRoles).toHaveLength(1);
        expect(allRoles[0].name).toBe(createdRole.name);
    })

    it("Should find role by its name", async () => {
        const newRole: NewRole = {
            name: 'Test Role',
        };

        const createdRole = await service.createNewRole(newRole);
        if (!createdRole) throw new Error("Expected role to be created");

        const foundRole = await service.findRoleByName(createdRole.name);
        if (!foundRole) throw new Error("Expected role to be found");
        expect(foundRole.name).toBe(createdRole.name);
        expect(foundRole.id).toBe(createdRole.id);
    })

    it("Should update role", async () => {
        const newRole: NewRole = {
            name: 'Test Role',
        };
        const createdRole = await service.createNewRole(newRole);
        if (!createdRole) throw new Error("Expected role to be created");

        const updatedRole = await service.updateRole(createdRole.id, {name: 'Updated Role'});
        if (!updatedRole) throw new Error("Expected role to be updated");
        expect(updatedRole.name).toBe('Updated Role');
        expect(updatedRole.id).toBe(createdRole.id);
    })

    it("Should throw error if role does not exist", async () => {
        const nonExistentRoleId = randomUUID();

        await expect(
            service.updateRole(nonExistentRoleId, { name: "Updated Role" })
        ).rejects.toThrow("Role not found");
    });


    it("Should delete role", async () => {
        const newRole: NewRole = {
            name: 'Test Role',
        };
        const createdRole = await service.createNewRole(newRole);
        if (!createdRole) throw new Error("Expected role to be created");

        const deletedRole = await service.deleteRole(createdRole.id);
        if (!deletedRole) throw new Error("Expected role to be deleted");
        expect(deletedRole.id).toBe(createdRole.id);
        expect(deletedRole.name).toBe(createdRole.name);
    })

    it("Should NOT delete role if role does not exist", async () => {
        const nonExistentRoleId = randomUUID();

        await expect(
            service.deleteRole(nonExistentRoleId)
        ).rejects.toThrow("Role not found");
    })
})