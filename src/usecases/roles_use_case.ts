import {Pool} from "pg";
import {AuditAction, NewRole, Role} from "../models/models";
import {RoleRepository} from "../repositories/role_repository";
import {AuditRepository} from "../repositories/audit_repository";
import {RoleService} from "../services/role_service";
import {AuditService} from "../services/audit_service";


export class RolesUseCase {
    constructor(private readonly pool: Pool) {}

    createRole = async (userId: string, newRole: NewRole): Promise<Role | null> => {
        if (!userId) {
            throw new Error("User ID is required");
        }

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const roleRepo = new RoleRepository(client);
            const auditRepo = new AuditRepository(client);

            const roleServ = new RoleService(roleRepo);
            const auditServ = new AuditService(auditRepo);

            const role = await roleServ.createNewRole(newRole);
            await auditServ.log(userId, AuditAction.ROLE_CREATED);
            await client.query("COMMIT");
            return role;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    findRoleByName = async (userId: string, roleName: string): Promise<Role | null> => {
        if (!userId) {
            throw new Error("User ID is required");
        }

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const roleRepo = new RoleRepository(client);
            const roleServ = new RoleService(roleRepo);

            const auditRepo = new AuditRepository(client);
            const auditServ = new AuditService(auditRepo);

            const role = await roleServ.findRoleByName(roleName);
            await auditServ.log(userId, AuditAction.ROLE_SEARCHED);
            await client.query("COMMIT");
            return role;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    getAllRoles = async (userId: string): Promise<Role[]> => {
        if (!userId) {
            throw new Error("User ID is required");
        }

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN")

            const roleRepo = new RoleRepository(client);
            const roleServ = new RoleService(roleRepo);

            const auditRepo = new AuditRepository(client);
            const auditServ = new AuditService(auditRepo);

            const roles = await roleServ.getAllRoles();
            await auditServ.log(userId, AuditAction.ROLES_SEARCHED);
            await client.query("COMMIT");
            return roles;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    updateRole = async (userId: string, roleId: string, newRole: NewRole): Promise<Role> => {
        if (!userId) {
            throw new Error("User ID is required");
        }

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const roleRepo = new RoleRepository(client);
            const roleServ = new RoleService(roleRepo);

            const auditRepo = new AuditRepository(client);
            const auditServ = new AuditService(auditRepo);

            const role = await roleServ.updateRole(roleId, newRole);
            await auditServ.log(userId, AuditAction.ROLE_UPDATED);
            await client.query("COMMIT");
            return role;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    deleteRole = async (userId: string, roleId: string): Promise<Role | null> => {
        if (!userId) {
            throw new Error("User ID is required");
        }

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const roleRepo = new RoleRepository(client);
            const roleServ = new RoleService(roleRepo);

            const auditRepo = new AuditRepository(client);
            const auditServ = new AuditService(auditRepo);

            const role = await roleServ.deleteRole(roleId);

            await auditServ.log(userId, AuditAction.ROLE_DELETED);
            await client.query("COMMIT");
            return role;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }
}