import {RoleRepository} from "../repositories/role_repository";
import {NewRole, Role} from "../models/models";


export class RoleService {
    constructor(private readonly roleRepo: RoleRepository) {}

    createNewRole = async (newRole: NewRole): Promise<Role> => {
        if (!newRole) throw new Error("New role cannot be null or undefined");
        const res = await this.roleRepo.createRole(newRole);
        if (!res) throw new Error("Role creation failed");
        return res;
    }

    findRoleByName = async (name: string): Promise<Role> => {
        if (!name) throw new Error("Role name cannot be null or undefined");
        const res = await this.roleRepo.findRoleByName(name);
        if (!res) throw new Error("Role not found");
        return res;
    }

    getAllRoles = async (): Promise<Role[]> => {
        return await this.roleRepo.getRoles();
    }

    updateRole = async (roleId: string, newRole: NewRole): Promise<Role> => {
        if (!roleId) throw new Error("Role id cannot be null or undefined");
        if (!newRole) throw new Error("New role cannot be null or undefined");
        const updated = await this.roleRepo.updateRole(roleId, newRole);
        if (!updated) throw new Error("Role not found");
        return updated;
    }

    deleteRole = async (roleId: string): Promise<Role> => {
        if (!roleId) throw new Error("Role id cannot be null or undefined");
        const role = await this.roleRepo.deleteRole(roleId);
        if (!role) throw new Error("Role not found");
        return role;
    }
}