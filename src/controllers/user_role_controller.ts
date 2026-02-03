import {UserRoleRepository} from "../repositories/user_role_repository";
import {UserRoleUseCase} from "../usecases/user_role_use_case";
import {NextFunction, Request, Response} from "express";


export class UserRoleController {
    constructor(private readonly userRoleUseCase: UserRoleUseCase) {}

    assignRoleToUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, roleId } = req.body;
            const actorId = req.userID;
            const result = await this.userRoleUseCase.assignRoleToUser(actorId!, userId, roleId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    getUserRoles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.body;
            const actorId = req.userID;
            const result = await this.userRoleUseCase.getUserRoles(actorId!, userId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    removeRoleFromUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, roleId } = req.body;
            const actorId = req.userID;
            const result = await this.userRoleUseCase.removeRoleFromUser(actorId!, userId, roleId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}