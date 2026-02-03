import {ErrorMessages, LoginDTO, RegisterDTO, User} from "../models/models";
import {BcryptPassHasher} from "../security/hashers";
import {UserService} from "./user_service";
import {BadRequestError, UnauthorizedError} from "../errors/errors";
import {JwtTokenService} from "./jwt_token_service";
import {UserUseCase} from "../usecases/user_use_case";

export class AuthService {
    constructor(
        private readonly userUseCase: UserUseCase,
        private readonly hasher: BcryptPassHasher,
        private readonly tokenService: JwtTokenService,
        private readonly userServ: UserService
    ) {}

    register = async (dto: RegisterDTO): Promise<User> => {
        if (dto.password.trim().length < 8) throw new BadRequestError(ErrorMessages.TOO_SHORT_PASSWORD)
        if (dto.email.trim().length < 5) throw new BadRequestError(ErrorMessages.TOO_SHORT_EMAIL)
        const hashedPassword = await this.hasher.hashPassword(dto.password);

        return this.userUseCase.registerUserWithDefaultRole({
            email: dto.email,
            password_hash: hashedPassword
        })
    }

    login = async (dto: LoginDTO)=> {
         const user = await this.userServ.findUserByEmail(dto.email);
         if (!user) throw new UnauthorizedError();

         const passwordsMatch = await this.hasher.comparePasswords(dto.password, user.password_hash);
         if (!passwordsMatch) throw new UnauthorizedError();

         const token = this.tokenService.generateToken(user.id);
         return {token};
    }
}