import {AuthService} from "../services/auth_service";
import {UserService} from "../services/user_service";
import {Request, Response} from "express";

export class LoginController {
    constructor(private readonly authServ: AuthService) {}

    login = async(req: Request, res: Response)=> {
        const { email, password } = req.body;
        const result = await this.authServ.login({email, password});
        res.json(result);
    }
}