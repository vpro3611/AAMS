import {RoleRepository} from "../repositories/role_repository";
import {NewRole, Role} from "../models/models";
import {BadRequestError, RoleNotFoundError, RolePersistenceError} from "../errors/errors";


export class RoleService {
    constructor(private readonly roleRepo: RoleRepository) {}

    createNewRole = async (newRole: NewRole): Promise<Role> => {
        if (!newRole) throw new BadRequestError("New role cannot be null or undefined");
        if (newRole.name.trim().length < 1) throw new BadRequestError(
            "Role name cannot be empty or consist of only whitespaces"
        )
        const res = await this.roleRepo.createRole(newRole);
        if (!res) throw new RolePersistenceError();
        return res;
    }

    findRoleByName = async (name: string): Promise<Role> => {
        if (!name) throw new BadRequestError("Role name cannot be null or undefined");
        const res = await this.roleRepo.findRoleByName(name);
        if (!res) throw new RoleNotFoundError();
        return res;
    }

    getAllRoles = async (): Promise<Role[]> => {
        return await this.roleRepo.getRoles();
    }

    updateRole = async (roleId: string, newRole: NewRole): Promise<Role> => {
        if (!roleId) throw new BadRequestError("Role id cannot be null or undefined");
        if (!newRole) throw new BadRequestError("New role cannot be null or undefined");
        if (newRole.name.trim().length < 1) throw new BadRequestError("Role name cannot be empty or consist of only whitespaces")
        const updated = await this.roleRepo.updateRole(roleId, newRole);
        if (!updated) throw new RoleNotFoundError();
        return updated;
    }

    deleteRole = async (roleId: string): Promise<Role> => {
        if (!roleId) throw new BadRequestError("Role id cannot be null or undefined");
        const role = await this.roleRepo.deleteRole(roleId);
        if (!role) throw new RoleNotFoundError();
        return role;
    }
}