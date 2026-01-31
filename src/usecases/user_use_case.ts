import {Pool} from "pg";
import {NewUser, User} from "../models/models";
import {UserRepository} from "../repositories/user_repository";
import {AuditRepository} from "../repositories/audit_repository";
import {UserService} from "../services/user_service";
import {AuditService} from "../services/audit_service";
import {AuditAction} from "../models/models";
import {BadRequestError} from "../errors/errors";

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

    blockUser = async (actorId: string, userId: string): Promise<User> => {
        if (!actorId) throw new BadRequestError("Actor ID is required");

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const userRepo = new UserRepository(client);
            const auditRepo = new AuditRepository(client);

            const userServ = new UserService(userRepo);
            const auditServ = new AuditService(auditRepo);

            const user = await userServ.blockUser(userId);

            await auditServ.log(actorId, AuditAction.USER_BLOCKED);
            await client.query("COMMIT");
            return user;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

     unblockUser = async (actorId: string, userId: string): Promise<User> => {
        if (!actorId) throw new BadRequestError("Actor ID is required");

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const userRepo = new UserRepository(client);
            const auditRepo = new AuditRepository(client);

            const userServ = new UserService(userRepo);
            const auditServ = new AuditService(auditRepo);

            const user = await userServ.unblockUser(userId);

            await auditServ.log(actorId, AuditAction.USER_UNBLOCKED);
            await client.query("COMMIT");
            return user;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    findUserById = async (actorId: string, userId: string): Promise<User> => {
        if (!actorId) throw new BadRequestError("Actor ID is required");

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const userRepo = new UserRepository(client);
            const userServ = new UserService(userRepo);

            const auditRepo = new AuditRepository(client);
            const auditServ = new AuditService(auditRepo);

            const user = await userServ.findUserById(userId);
            await auditServ.log(actorId, AuditAction.USER_FIND_BY_ID);

            await client.query("COMMIT");
            return user;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    findUserByEmail = async (actorId: string, email: string): Promise<User> => {
        if (!actorId) throw new BadRequestError("Actor ID is required");

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const userRepo = new UserRepository(client);
            const userServ = new UserService(userRepo);

            const auditRepo = new AuditRepository(client);
            const auditServ = new AuditService(auditRepo);

            const user = await userServ.findUserByEmail(email);
            await auditServ.log(actorId, AuditAction.USER_FIND_BY_EMAIL);

            await client.query("COMMIT");
            return user;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    getAllUsers = async (actorId: string): Promise<User[]> => {
        if (!actorId) throw new BadRequestError("Actor ID is required");

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const userRepo = new UserRepository(client);
            const userServ = new UserService(userRepo);

            const auditRepo = new AuditRepository(client)
            const auditServ = new AuditService(auditRepo)

            const users = await userServ.getAllUsers()
            await auditServ.log(actorId, AuditAction.GET_ALL_USERS)

            await client.query("COMMIT");
            return users;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    deleteUser = async (actorId: string, userId: string): Promise<User> => {
        if (!actorId) throw new BadRequestError("Actor ID is required");

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const userRepo = new UserRepository(client)
            const userServ = new UserService(userRepo)

            const auditRepo = new AuditRepository(client)
            const auditServ = new AuditService(auditRepo)

            const user = await userServ.deleteUser(userId)
            await auditServ.log(actorId, AuditAction.DELETE_USER)

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
