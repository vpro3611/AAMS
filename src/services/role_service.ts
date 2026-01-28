import {RoleRepository} from "../repositories/role_repository";
import {NewRole, Role} from "../models/models";


export class RoleService {
    constructor(private readonly roleRepo: RoleRepository) {}

    createNewRole = async (newRole: NewRole): Promise<Role | null> => {
        if (!newRole) throw new Error("New role cannot be null or undefined");
        return this.roleRepo.createRole(newRole);
    }

    findRoleByName = async (name: string): Promise<Role | null> => {
        if (!name) throw new Error("Role name cannot be null or undefined");
        return this.roleRepo.findRoleByName(name);
    }

    getAllRoles = async (): Promise<Role[]> => {
        return this.roleRepo.getRoles();
    }

    updateRole = async (roleId: string, newRole: NewRole): Promise<Role> => {
        if (!roleId) throw new Error("Role id cannot be null or undefined");
        if (!newRole) throw new Error("New role cannot be null or undefined");
        const updated = await this.roleRepo.updateRole(roleId, newRole);
        if (!updated) throw new Error("Role not found");
        return updated;
    }

    deleteRole = async (roleId: string): Promise<Role | null> => {
        if (!roleId) throw new Error("Role id cannot be null or undefined");
        return this.roleRepo.deleteRole(roleId);
    }
}