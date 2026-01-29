import {Pool} from "pg";
import {UserRoleRepository} from "../repositories/user_role_repository";
import {UserRoleService} from "../services/user_role_service";
import {AuditRepository} from "../repositories/audit_repository";
import {AuditService} from "../services/audit_service";
import {AuditAction, UserRole} from "../models/models";

export class UserRoleUseCase {
    constructor(private readonly pool: Pool) {}

    assignRoleToUser = async (actorId: string, userId: string, roleId: string): Promise<UserRole> => {
        if (!actorId) throw new Error("Actor ID is required");

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const userRoleRepo = new UserRoleRepository(client);
            const userRoleServ = new UserRoleService(userRoleRepo);

            const AuditRepo = new AuditRepository(client);
            const AuditServ = new AuditService(AuditRepo)

            const user_role = await userRoleServ.assignRoleToUser(userId, roleId);
            await AuditServ.log(actorId, AuditAction.ROLE_ASSIGNED + ` to ${userId}`);

            await client.query("COMMIT");
            return user_role;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    getUserRoles = async (actorId: string, userId: string): Promise<UserRole[]> => {
        if (!actorId) throw new Error("Actor ID is required");

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const userRoleRepo = new UserRoleRepository(client);
            const userRoleServ = new UserRoleService(userRoleRepo);

            const AuditRepo = new AuditRepository(client);
            const AuditServ = new AuditService(AuditRepo)

            const user_roles = await userRoleServ.getUserRoles(userId);
            await AuditServ.log(actorId, AuditAction.GET_USER_ROLES + ` for ${userId}`);

            await client.query("COMMIT");
            return user_roles;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    removeRoleFromUser = async (actorId: string, userId: string, roleId: string): Promise<UserRole> => {
        if (!actorId) throw new Error("Actor ID is required");

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const userRoleRepo = new UserRoleRepository(client);
            const userRoleServ = new UserRoleService(userRoleRepo);

            const AuditRepo = new AuditRepository(client);
            const AuditServ = new AuditService(AuditRepo)

            const user_role = await userRoleServ.deleteUserRole(userId, roleId);
            await AuditServ.log(actorId, AuditAction.REMOVE_ROLE_FROM_USER + ` for ${userId}`);

            await client.query("COMMIT");
            return user_role;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }
}