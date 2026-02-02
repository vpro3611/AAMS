// src/container.ts
import { pool } from "./database";

import { UserRepository } from "./repositories/user_repository";
import { AuditRepository } from "./repositories/audit_repository";
import { RoleRepository } from "./repositories/role_repository";
import { UserRoleRepository } from "./repositories/user_role_repository";

import { UserService } from "./services/user_service";
import { AuditService } from "./services/audit_service";
import { RoleService } from "./services/role_service";
import { UserRoleService } from "./services/user_role_service";
import { AuthService } from "./services/auth_service";

import { UserUseCase } from "./usecases/user_use_case";
import { AuditUseCase } from "./usecases/audit_use_case";
import { UserRoleUseCase } from "./usecases/user_role_use_case";
import { RolesUseCase } from "./usecases/roles_use_case";

import { JwtTokenService } from "./services/jwt_token_service";
import { BcryptPassHasher } from "./security/hashers";

import { RegisterController } from "./authentification_controllers/registration_controller";
import { LoginController } from "./authentification_controllers/login_controller";
import { UserController } from "./controllers/user_controllers";
import {RoleController} from "./controllers/role_controllers";
import {AuditController} from "./controllers/audit_controller";

export function buildContainer() {
    // repositories
    const userRepo = new UserRepository(pool);
    const auditRepo = new AuditRepository(pool);
    const roleRepo = new RoleRepository(pool);
    const userRoleRepo = new UserRoleRepository(pool);

    // services
    const userServ = new UserService(userRepo);
    const auditServ = new AuditService(auditRepo);
    const roleServ = new RoleService(roleRepo);
    const userRoleServ = new UserRoleService(userRoleRepo);

    // use cases
    const userUseCase = new UserUseCase(pool);
    const auditUseCase = new AuditUseCase(pool);
    const userRoleUseCase = new UserRoleUseCase(pool);
    const rolesUseCase = new RolesUseCase(pool);

    // auth
    const tokenService = new JwtTokenService(process.env.JWT_SECRET!);
    const passHasher = new BcryptPassHasher();
    const authService = new AuthService(
        userUseCase,
        passHasher,
        tokenService,
        userServ
    );

    // controllers
    const registrationController = new RegisterController(authService);
    const loginController = new LoginController(authService);
    const userController = new UserController(userUseCase);
    const roleController = new RoleController(rolesUseCase);
    const auditController = new AuditController(auditUseCase);

    return {
        tokenService,
        userServ,

        registrationController,
        loginController,
        userController,
        roleController,
        auditController,
    };
}
