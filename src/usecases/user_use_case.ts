import {Pool} from "pg";
import {NewUser, User} from "../models/models";
import {UserRepository} from "../repositories/user_repository";
import {AuditRepository} from "../repositories/audit_repository";
import {UserService} from "../services/user_service";
import {AuditService} from "../services/audit_service";
import {AuditAction} from "../models/models";

export class UserUseCase {
    constructor(private readonly pool: Pool) {}

    createUser = async (newUser: NewUser): Promise<User> => {
        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const userRepo = new UserRepository(client);
            const auditRepo = new AuditRepository(client);

            const userServ = new UserService(userRepo);
            const auditServ = new AuditService(auditRepo);

            const user = await userServ.createUser(newUser);

            await auditServ.log(user.id, AuditAction.USER_CREATED);
            await client.query("COMMIT");
            return user;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    async blockUser(userId: string): Promise<User> {
        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const userRepo = new UserRepository(client);
            const auditRepo = new AuditRepository(client);

            const userServ = new UserService(userRepo);
            const auditServ = new AuditService(auditRepo);

            const user = await userServ.blockUser(userId);

            await auditServ.log(user.id, AuditAction.USER_BLOCKED);
            await client.query("COMMIT");
            return user;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    async unblockUser(userId: string): Promise<User> {
        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const userRepo = new UserRepository(client);
            const auditRepo = new AuditRepository(client);

            const userServ = new UserService(userRepo);
            const auditServ = new AuditService(auditRepo);

            const user = await userServ.unblockUser(userId);

            await auditServ.log(user.id, AuditAction.USER_UNBLOCKED);
            await client.query("COMMIT");
            return user;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }
}
