import {UserRoleRepository} from "../repositories/user_role_repository";
import {UserRole, UserRoleWithNames} from "../models/models";


export class UserRoleService {
    constructor(private readonly userRoleRepo: UserRoleRepository ) {}

    assignRoleToUser = async (userId: string, roleId: string): Promise<UserRole> => {
        if (!userId) throw new Error("Invalid user id");
        if (!roleId) throw new Error("Invalid role id");
        const res = await this.userRoleRepo.assignRoleToUser(userId, roleId);
        if (!res) throw new Error("User role not found");
        return res;
    }
    getUserRoles = async (userId: string): Promise<UserRoleWithNames[]> => {
        if (!userId) throw new Error("Invalid user id");
        return await this.userRoleRepo.getUserRoles(userId);
    }
    deleteUserRole = async (userId: string, roleId: string): Promise<UserRole> => {
        if (!userId) throw new Error("Invalid user id");
        if (!roleId) throw new Error("Invalid role id");
        const res = await this.userRoleRepo.deleteUserRole(userId, roleId);
        if (!res) throw new Error("User role not found");
        return res;
    }
}