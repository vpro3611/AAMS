import {NextFunction, Request, Response} from "express";
import {RolesUseCase} from "../usecases/roles_use_case";
import {NewRole, UpdateRoleDTO} from "../models/models";


export class RoleController {
    constructor(private readonly roleUseCase: RolesUseCase) {}

    createRole = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const newRole: NewRole = req.body;
            const actorId = req.userID;
            const createdRole = await this.roleUseCase.createRole(actorId!, newRole);
            res.status(201).json(createdRole);
        } catch (error) {
            next(error);
        }
    }

    findRoleByName = async (req: Request, res: Response, next: NextFunction)=> {
        try {
            const { roleName } = req.body;
            const actorId = req.userID;
            const foundRole = await this.roleUseCase.findRoleByName(actorId!, roleName);
            res.status(200).json({ foundRole });
        } catch (error) {
            next(error);
        }
    }

    getAllRoles = async (req: Request, res: Response, next: NextFunction)=> {
        try {
            const actorId = req.userID;
            const allRoles = await this.roleUseCase.getAllRoles(actorId!);
            res.status(200).json({ allRoles });
        } catch (error) {
            next(error);
        }
    }

    updateRole = async (req: Request, res: Response, next: NextFunction)=> {
        try {
            const updateRole: UpdateRoleDTO = req.body;
            const actorId = req.userID;
            const updatedRole = await this.roleUseCase.updateRole(actorId!, updateRole.role_id, updateRole);
            res.status(200).json({ updatedRole });
        } catch (error) {
            next(error);
        }
    }

    deleteRole = async (req: Request<{role_id: string}>, res: Response, next: NextFunction)=> {
        try {
            const { roleId } = req.body;
            const actorId = req.userID;
            const deletedRole = await this.roleUseCase.deleteRole(actorId!, roleId);
            res.status(200).json({ deletedRole });
        } catch (error) {
            next(error);
        }
    }
}