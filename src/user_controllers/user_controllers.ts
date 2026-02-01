import {UserUseCase} from "../usecases/user_use_case";
import {NextFunction, Request, Response} from "express";



export class UserController {
    constructor(private readonly userUseCase: UserUseCase) {}

    blockUser = async (req: Request, res: Response, next: NextFunction)=> {
        try {
            const { user_id } = req.body;
            const actorId = req.userID;
            const blockedUser = await this.userUseCase.blockUser(actorId!, user_id);
            res.status(200).json({ blockedUser });
        } catch (error) {
            next(error);
        }
    }

    unblockUser = async (req: Request, res: Response, next: NextFunction)=> {
        try {
            const { user_id } = req.body;
            const actorId = req.userID;
            const unblockedUser = await this.userUseCase.unblockUser(actorId!, user_id);
            res.status(200).json({ unblockedUser });
        } catch (error) {
            next(error);
        }
    }

    findUserById = async (req: Request, res: Response, next: NextFunction)=> {
        try {
            const { user_id } = req.body;
            const actorId = req.userID;
            const foundUser = await this.userUseCase.findUserById(actorId!, user_id);
            res.status(200).json({ foundUser });
        } catch (error) {
            next(error);
        }
    }

    findUserByEmail = async (req: Request, res: Response, next: NextFunction)=> {
        try {
            const { email }  = req.body;

            const actorId = req.userID;
            const foundUser = await this.userUseCase.findUserByEmail(actorId!, email);
            res.status(200).json({ foundUser });
        } catch (error) {
            next(error);
        }
    }

    getAllUsers = async (req: Request, res: Response, next: NextFunction)=> {
        try {
            const actorId = req.userID;
            const allUsers = await this.userUseCase.getAllUsers(actorId!);
            res.status(200).json({ allUsers });
        } catch (error) {
            next(error);
        }
    }

    deleteUser = async (req: Request<{user_id: string}>, res: Response, next: NextFunction)=> {
        try {
            const { user_id } = req.body;
            const actorId = req.userID;
            const deletedUser = await this.userUseCase.deleteUser(actorId!, user_id);
            res.status(200).json({ deletedUser });
        } catch (error) {
            next(error);
        }
    }
}