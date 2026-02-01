import { NextFunction, Request, Response } from "express";
import {DomainError} from "../errors/errors";

export const errorsMiddleware = () => {
    return (err: unknown, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof DomainError) {
            return res.status(err.httpStatus).json({code: err.code, message: err.message });
        }
        console.error("Unhandled error: ", err);

        return res.status(500).json({code: "INTERNAL_SERVER_ERROR", message: "Internal server error has occurred"});
    };
}