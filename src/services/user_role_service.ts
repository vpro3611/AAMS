import {UserRoleRepository} from "../repositories/user_role_repository";
import {UserRole, UserRoleWithNames} from "../models/models";
import {BadRequestError, UserRoleNotFoundError, UserRolePersistenceError} from "../errors/errors";


export class UserRoleService {
    constructor(private readonly userRoleRepo: UserRoleRepository ) {}

    assignRoleToUser = async (userId: string, roleId: string): Promise<UserRole> => {
        if (!userId) throw new BadRequestError("Invalid user id");
        if (!roleId) throw new BadRequestError("Invalid role id");
        const res = await this.userRoleRepo.assignRoleToUser(userId, roleId);
        if (!res) throw new UserRolePersistenceError();
        return res;
    }
    getUserRoles = async (userId: string): Promise<UserRoleWithNames[]> => {
        if (!userId) throw new BadRequestError("Invalid user id");
        return await this.userRoleRepo.getUserRoles(userId);
    }
    deleteUserRole = async (userId: string, roleId: string): Promise<UserRole> => {
        if (!userId) throw new BadRequestError("Invalid user id");
        if (!roleId) throw new BadRequestError("Invalid role id");
        const res = await this.userRoleRepo.deleteUserRole(userId, roleId);
        if (!res) throw new UserRoleNotFoundError();
        return res;
    }
}