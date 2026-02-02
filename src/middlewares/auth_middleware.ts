import {TokenService} from "../models/models";
import {NextFunction, Request, Response} from "express";
import {InvalidTokenError, UnauthorizedError} from "../errors/errors";

// changing global interface of express

declare global {
    namespace Express {
        interface Request {
            userID?: string;
            userStatus?: string;
        }
    }
}


// export const authMiddleware = (tokenService: TokenService) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//         const authHeader = req.headers.authorization;
//         if (!authHeader) return res.sendStatus(401).json({message: "Unauthorized"});
//         const [type, token] = authHeader.split(" ");
//         if (type !== "Bearer") return res.sendStatus(401).json({message: "Unauthorized"});
//
//         try {
//             const payload = tokenService.verifyToken(token);
//             req.userID = payload.sub;
//             return next();
//         } catch (error) {
//             return res.sendStatus(401).json({message: "Invalid Token"});
//         }
//     };
// };

export const authMiddleware = (tokenService: TokenService) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next(new UnauthorizedError())
        }

        const [type, token] = authHeader.split(" ");

        if (type !== "Bearer" || !token) {
            return next(new UnauthorizedError())
        }

        try {
            const payload = tokenService.verifyToken(token);
            req.userID = payload.sub;
            return next();
        } catch (error) {
            return next(new InvalidTokenError())
        }
    };
};
