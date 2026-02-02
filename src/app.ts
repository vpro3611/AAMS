// src/app.ts
import express from "express";
import {
    loggerMiddleware,
    ResponseLoggerMiddleware,
} from "./middlewares/loggers_middlewares";
import { authMiddleware } from "./middlewares/auth_middleware";
import { userStatusCheckMiddleware } from "./middlewares/user_status_check_middleware";
import { setUserStatus } from "./middlewares/user_status_check_middleware";
import { errorsMiddleware } from "./middlewares/errors_middleware";
import {TokenService} from "./models/models";
import {UserService} from "./services/user_service";
import {RegisterController} from "./authentification_controllers/registration_controller";
import {LoginController} from "./authentification_controllers/login_controller";
import {UserController} from "./user_controllers/user_controllers";
import {RoleController} from "./role_controllers/role_controllers";
import {AuditController} from "./audit_controller/audit_controller";

export function createApp(deps: {
    tokenService: TokenService;
    userServ: UserService;
    registrationController: RegisterController;
    loginController: LoginController;
    userController: UserController;
    roleController: RoleController;
    auditController: AuditController;
}) {
    const app = express();

    // infrastructure
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(ResponseLoggerMiddleware());

    app.get("/", (_req, res) => res.send("Hello World!"));

    // public
    const publicRouter = express.Router();
    publicRouter.use(loggerMiddleware());

    publicRouter.post("/register", deps.registrationController.registerUser);
    publicRouter.post("/login", deps.loginController.login);
    app.use("/", publicRouter);

    // private
    const privateRouter = express.Router();

    privateRouter.use(authMiddleware(deps.tokenService));
    privateRouter.use(setUserStatus(deps.userServ));
    privateRouter.use(userStatusCheckMiddleware());
    privateRouter.use(loggerMiddleware());

    privateRouter.patch("/block_user", deps.userController.blockUser);
    privateRouter.patch("/unblock_user", deps.userController.unblockUser);
    privateRouter.post("/user/get_id", deps.userController.findUserById);
    privateRouter.post("/user/get_email", deps.userController.findUserByEmail);
    privateRouter.get("/users", deps.userController.getAllUsers);
    privateRouter.post("/user/delete", deps.userController.deleteUser);

    privateRouter.post("/role", deps.roleController.createRole);
    privateRouter.post("/role/get_name", deps.roleController.findRoleByName)
    privateRouter.get("/roles", deps.roleController.getAllRoles);
    privateRouter.patch("/role/update", deps.roleController.updateRole);
    privateRouter.post("/role/delete", deps.roleController.deleteRole);

    privateRouter.get("/audit_logs", deps.auditController.getAuditLogs);

    app.use("/api", privateRouter);

    // errors LAST
    app.use(errorsMiddleware());

    return app;
}
