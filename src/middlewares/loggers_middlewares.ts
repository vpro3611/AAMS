import {NextFunction, Request, Response} from "express";

// declare global {
//     namespace Express {
//         interface Request {
//             userID?: string;
//         }
//     }
// }

export const loggerMiddleware = () => {
    return (req: Request, res: Response, next: NextFunction) => {
        console.log(`Request: [${new Date().toISOString()}] ${req.method} ${req.originalUrl} by ${req.userID || "anonymous"}`);
        next();
    };
}

export const ResponseLoggerMiddleware = () => {
    return (req: Request, res: Response, next: NextFunction) => {
        res.on("finish", () => {
            console.log(`Response: [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
        });
        next();
    };
}