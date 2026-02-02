// import { pool } from './database';
// import {UserRepository} from "./repositories/user_repository";
// import {AuditRepository} from "./repositories/audit_repository";
// import {RoleRepository} from "./repositories/role_repository";
// import {UserRoleRepository} from "./repositories/user_role_repository";
// import express from 'express';
// import {JwtTokenService} from "./services/jwt_token_service";
// import {AuthService} from "./services/auth_service";
// import {UserService} from "./services/user_service";
// import {AuditService} from "./services/audit_service";
// import {RoleService} from "./services/role_service";
// import {UserRoleService} from "./services/user_role_service";
// import {BcryptPassHasher} from "./security/hashers";
// import {UserUseCase} from "./usecases/user_use_case";
// import {AuditUseCase} from "./usecases/audit_use_case";
// import {UserRoleUseCase} from "./usecases/user_role_use_case";
// import {RolesUseCase} from "./usecases/roles_use_case";
// import {RegisterController} from "./authentification_controllers/registration_controller";
// import {LoginController} from "./authentification_controllers/login_controller";
// import {authMiddleware} from "./middlewares/auth_middleware";
// import {loggerMiddleware, ResponseLoggerMiddleware} from "./middlewares/loggers_middlewares";
// import {errorsMiddleware} from "./middlewares/errors_middleware";
// import {UserController} from "./user_controllers/user_controllers";
// import {setUserStatus, userStatusCheckMiddleware} from "./middlewares/user_status_check_middleware";
//
//
// async function main() {
//     const app = express();
//
//     const serverPort = process.env.PORT || 3000;
//
//     const res = await pool.query('SELECT NOW()');
//     console.log(res.rows[0]);
//
//     const userRepo: UserRepository = new UserRepository(pool);
//     const auditRepo: AuditRepository = new AuditRepository(pool);
//     const roleRepo: RoleRepository = new RoleRepository(pool);
//     const userRoleRepo: UserRoleRepository = new UserRoleRepository(pool);
//
//
//     const userServ = new UserService(userRepo);
//     const auditServ = new AuditService(auditRepo);
//     const roleServ = new RoleService(roleRepo);
//     const userRoleServ = new UserRoleService(userRoleRepo)
//
//     const userUseCase = new UserUseCase(pool)
//     const auditUseCase = new AuditUseCase(pool)
//     const userRoleUseCase = new UserRoleUseCase(pool)
//     const rolesUseCase = new RolesUseCase(pool)
//
//
//     const tokenService = new JwtTokenService(process.env.JWT_SECRET!)
//     const bcryptPassHasher = new BcryptPassHasher()
//     const authService = new AuthService(userUseCase, bcryptPassHasher, tokenService, userServ);
//
//
//
//     const registrationController = new RegisterController(authService);
//     const loginController = new LoginController(authService);
//
//     const userController = new UserController(userUseCase)
//
//     app.use(express.json());
//     app.use(express.urlencoded({ extended: true }));
//
//     app.use(loggerMiddleware());
//     app.use(ResponseLoggerMiddleware());
//
//     app.get("/", (req, res) => res.send("Hello World!"));
//
// // ---------- Public routes ----------
//     const publicRouter = express.Router();
//
//     publicRouter.post("/register", registrationController.registerUser);
//     publicRouter.post("/login", loginController.login);
//
//     app.use("/", publicRouter);
//
// // ---------- Private routes ----------
//     const privateRouter = express.Router();
//
//     privateRouter.use(authMiddleware(tokenService));
//
//     privateRouter.use(setUserStatus(userServ))
//
//     privateRouter.use(userStatusCheckMiddleware());
//
//     privateRouter.use(loggerMiddleware());
//
//     privateRouter.patch("/block_user", userController.blockUser);
//     privateRouter.patch("/unblock_user", userController.unblockUser);
//     privateRouter.post("/user/get_id", userController.findUserById);
//     privateRouter.post("/user/get_email", userController.findUserByEmail);
//     privateRouter.get("/users", userController.getAllUsers);
//     privateRouter.post("/user/delete", userController.deleteUser);
//
//     app.use("/api", privateRouter);
//
//     app.use(errorsMiddleware());
//
//     app.listen(serverPort, () =>
//         console.log(`Server started on port ${serverPort}`)
//     );
//
//
// }
//
// main().catch((err) => {
//     console.error('Error in main function:', err);
//     process.exit(1);
// });

import {startServer} from "./server";

startServer().catch((err) => {
    console.error("Fatal error on startup: ", err);
    process.exit(1);
})

// a934e51f-f422-4b8e-a1bf-6c3c99dabcfb

// 4aa92bd2-07be-476b-812d-c24375ec99bb