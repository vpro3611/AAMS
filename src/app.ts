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
import {Roles, TokenService} from "./models/models";
import {UserService} from "./services/user_service";
import {RegisterController} from "./authentification_controllers/registration_controller";
import {LoginController} from "./authentification_controllers/login_controller";
import {UserController} from "./controllers/user_controllers";
import {RoleController} from "./controllers/role_controllers";
import {AuditController} from "./controllers/audit_controller";
import {UserRoleController} from "./controllers/user_role_controller";
import {requireRole, requireAnyRole, attachUserRoles} from "./middlewares/roles_middleware";
import {UserRoleService} from "./services/user_role_service";

export function createApp(deps: {
    tokenService: TokenService;
    userServ: UserService;
    registrationController: RegisterController;
    loginController: LoginController;
    userController: UserController;
    roleController: RoleController;
    auditController: AuditController;
    userRoleController: UserRoleController;
    userRoleServ: UserRoleService;
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

    const adminOnly = requireRole(Roles.ADMIN);
    const adminOrModerator = requireAnyRole(Roles.ADMIN, Roles.MODERATOR);

    // private
    const privateRouter = express.Router();

    privateRouter.use(authMiddleware(deps.tokenService));
    privateRouter.use(attachUserRoles(deps.userRoleServ));
    privateRouter.use(setUserStatus(deps.userServ));
    privateRouter.use(userStatusCheckMiddleware());
    privateRouter.use(loggerMiddleware());

    privateRouter.patch("/block_user", adminOnly, deps.userController.blockUser);
    privateRouter.patch("/unblock_user", adminOnly, deps.userController.unblockUser);
    privateRouter.post("/user/get_id", adminOrModerator, deps.userController.findUserById);
    privateRouter.post("/user/get_email", adminOrModerator, deps.userController.findUserByEmail);
    privateRouter.get("/users", adminOrModerator, deps.userController.getAllUsers);
    privateRouter.post("/user/delete", adminOnly, deps.userController.deleteUser);

    privateRouter.post("/role", adminOrModerator, deps.roleController.createRole);
    privateRouter.post("/role/get_name", adminOrModerator, deps.roleController.findRoleByName)
    privateRouter.get("/roles", adminOrModerator, deps.roleController.getAllRoles);
    privateRouter.patch("/role/update", adminOrModerator,deps.roleController.updateRole);
    privateRouter.post("/role/delete", adminOrModerator, deps.roleController.deleteRole);

    privateRouter.get("/audit_logs", adminOrModerator, deps.auditController.getAuditLogs);
    privateRouter.post("/audit_logs/get_user", adminOrModerator,deps.auditController.getAuditLogsByUserId);
    privateRouter.post("/audit_logs/get_action", adminOrModerator,deps.auditController.getAuditLogsByAction);

    privateRouter.post("/assign_role", adminOnly,deps.userRoleController.assignRoleToUser);
    privateRouter.post("/get_roles", adminOnly,deps.userRoleController.getUserRoles);
    privateRouter.post("/remove_role", adminOnly,deps.userRoleController.removeRoleFromUser);
    app.use("/api", privateRouter);

    // errors LAST
    app.use(errorsMiddleware());

    return app;
}
