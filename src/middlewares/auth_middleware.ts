import {TokenService} from "../models/models";
import {NextFunction, Request, Response} from "express";

declare global {
    namespace Express {
        interface Request {
            userID?: string;
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
            return res.status(401).json({ message: "Unauthorized" });
        }

        const [type, token] = authHeader.split(" ");

        if (type !== "Bearer" || !token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        try {
            const payload = tokenService.verifyToken(token);
            req.userID = payload.sub;
            return next();
        } catch (error) {
            return res.status(401).json({ message: "Invalid token" });
        }
    };
};
