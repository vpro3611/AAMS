import {NextFunction, Response, Request} from "express";
import {UserStatus} from "../models/models";
import {UnauthorizedError, UserBlockedError, UserNotFoundError} from "../errors/errors";
import {UserService} from "../services/user_service";

export const setUserStatus = (userService: UserService) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userID;
            if (!userId) {
                return next(new UnauthorizedError());
            }

            const user = await userService.findUserById(userId);
            if (!user) {
                return next(new UserNotFoundError());
            }
            req.userStatus = user.status;
            return next();
        } catch (e) {
            return next(e);
        }
    };
};


export const userStatusCheckMiddleware = () => {
    return (req: Request, res: Response, next: NextFunction)=> {
        const userStatus = req.userStatus;
        if (userStatus === UserStatus.BLOCKED) {
            return next(new UserBlockedError());
        }
        return next();
    }
}