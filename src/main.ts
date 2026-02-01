import { pool } from './database';
import {UserRepository} from "./repositories/user_repository";
import {AuditRepository} from "./repositories/audit_repository";
import {RoleRepository} from "./repositories/role_repository";
import {UserRoleRepository} from "./repositories/user_role_repository";
import express from 'express';
import {JwtTokenService} from "./services/jwt_token_service";
import {AuthService} from "./services/auth_service";
import {UserService} from "./services/user_service";
import {AuditService} from "./services/audit_service";
import {RoleService} from "./services/role_service";
import {UserRoleService} from "./services/user_role_service";
import {BcryptPassHasher} from "./security/hashers";
import {UserUseCase} from "./usecases/user_use_case";
import {AuditUseCase} from "./usecases/audit_use_case";
import {UserRoleUseCase} from "./usecases/user_role_use_case";
import {RolesUseCase} from "./usecases/roles_use_case";
import {RegisterController} from "./authentification/registration_controller";
import {LoginController} from "./authentification/login_controller";
import {authMiddleware} from "./middlewares/auth_middleware";

async function main() {
    const app = express();

    const serverPort = process.env.PORT || 3000;

    const res = await pool.query('SELECT NOW()');
    console.log(res.rows[0]);

    const userRepo: UserRepository = new UserRepository(pool);
    const auditRepo: AuditRepository = new AuditRepository(pool);
    const roleRepo: RoleRepository = new RoleRepository(pool);
    const userRoleRepo: UserRoleRepository = new UserRoleRepository(pool);


    const userServ = new UserService(userRepo);
    const auditServ = new AuditService(auditRepo);
    const roleServ = new RoleService(roleRepo);
    const userRoleServ = new UserRoleService(userRoleRepo)

    const userUseCase = new UserUseCase(pool)
    const auditUseCase = new AuditUseCase(pool)
    const userRoleUseCase = new UserRoleUseCase(pool)
    const rolesUseCase = new RolesUseCase(pool)


    const tokenService = new JwtTokenService(process.env.JWT_SECRET!)
    const bcryptPassHasher = new BcryptPassHasher()
    const authService = new AuthService(userUseCase, bcryptPassHasher, tokenService, userServ);



    const registrationController = new RegisterController(authService);
    const loginController = new LoginController(authService);

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    // app.use(authMiddleware(tokenService));

    app.post('/register', registrationController.registerUser);
    app.post('/login', loginController.login);

    app.listen(serverPort, () => console.log(`Server started on port ${serverPort}`));

}

main().catch((err) => {
    console.error('Error in main function:', err);
    process.exit(1);
});