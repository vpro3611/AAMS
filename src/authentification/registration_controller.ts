import {UserService} from "../services/user_service";
import {AuthService} from "../services/auth_service";
import {Request, Response, NextFunction} from "express";

export class RegisterController {
    constructor(private readonly authServ: AuthService) {}

    registerUser = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const {email, password} = req.body;
            const user = await this.authServ.register({
                email,
                password,
            });
            res.status(201).json(user);
        } catch (e) {
            next(e);
        }
    }
}