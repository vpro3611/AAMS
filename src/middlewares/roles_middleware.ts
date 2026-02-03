import {UserRoleService} from "../services/user_role_service";
import {NextFunction, Request, Response} from "express";
import {ForbiddenError} from "../errors/errors";

export const attachUserRoles
    = (userRoleService: UserRoleService)=>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userID;
            if (!userId) {
                return next();
            }

            const role = await userRoleService.getUserRoles(userId);

            req.userRoles = role.map(r => r.role_name);

            next();
        } catch (e) {
            next(e);
        }
    }

export const requireRole =
    (requiredRole: string) =>
        (req: Request, res: Response, next: NextFunction) => {
            const userRoles = req.userRoles;
            if (!userRoles || !userRoles.includes(requiredRole)) {
                return next(new ForbiddenError())
            }
            next();
        }

export const requireAnyRole =
    (...requiredRoles: string[]) =>
        (req: Request, res: Response, next: NextFunction) => {
           const userRoles = req.userRoles;
           if (!userRoles) {
               return next(new ForbiddenError())
           }

           const hasRequiredRole = requiredRoles.some(r => userRoles.includes(r));
           if (!hasRequiredRole) {
               return next(new ForbiddenError())
           }
           next();
        };