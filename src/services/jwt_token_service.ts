import jwt from 'jsonwebtoken';
import {TokenService} from "../models/models";

export class JwtTokenService implements TokenService{
    constructor(private readonly secret: string) {}

    generateToken(userId: string): string {
        return jwt.sign(
            { sub: userId },
            this.secret,
            { expiresIn: '12h' }
        );
    }

    verifyToken(token: string): { sub: string } {
        return jwt.verify(token, this.secret) as { sub: string };
    }
}