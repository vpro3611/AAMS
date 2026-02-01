
// User type for all users in the database

export type User = {
    id: string;
    email: string,
    password_hash: string,
    status: string,
    created_at: Date,
}

// New user type for creating a new user,
// for insertion so that we do not interfere with the original user type

export type NewUser = {
    email: string,
    password_hash: string,
}

// Audit event type for all audit events in the database,
// stands for users actions, a register

export type AuditEvent = {
    id: string,
    actor_user_id: string,
    action: string,
    created_at: Date,
}

// New audit event type for creating a new audit event,
// for insertion so that we do not interfere with the original audit event type

export type NewAuditEvent = {
    actor_user_id: string,
    action: string,
}

// Role type for all roles in the database

export type Role = {
    id: string,
    name: string,
    created_at: Date,
}

// New role type for creating a new role,
// for insertion so that we do not interfere with the original role type

export type NewRole = {
    name: string,
}

// User role type for associating a user with a role. We do not add <NewRole type>
// since there it is assignable directly to the user_id and role_id both being primary keys


export type UserRole = {
    user_id: string,
    role_id: string,
}

// for user_role repo, getting user roles with role names

export type UserRoleWithNames = {
    user_id: string,
    role_id: string,
    role_name: string
};

// Audit action types

export enum AuditAction {
    USER_CREATED = "USER_CREATED",
    USER_BLOCKED = "USER_BLOCKED",
    USER_UNBLOCKED = "USER_UNBLOCKED",
    ROLE_CREATED = "ROLE_CREATED",
    ROLE_SEARCHED = "ROLE_SEARCHED",
    ROLES_SEARCHED = "ROLES_SEARCHED",
    ROLE_UPDATED = "ROLE_UPDATED",
    ROLE_DELETED = "ROLE_DELETED",
    USER_FIND_BY_ID = "USER_FIND_BY_ID",
    USER_FIND_BY_EMAIL = "USER_FIND_BY_EMAIL",
    GET_ALL_USERS = "GET_ALL_USERS",
    DELETE_USER = "DELETE_USER",
    ROLE_ASSIGNED = "ROLE_ASSIGNED",
    GET_USER_ROLES = "GET_USER_ROLES",
    REMOVE_ROLE_FROM_USER = "REMOVE_ROLE_FROM_USER",
    GET_AUDIT_EVENTS = "GET_AUDIT_EVENTS",
}

export enum UserStatus {
    ACTIVE = "active",
    BLOCKED = "blocked",
}

export enum ErrorCodes {
    BAD_REQUEST = "BAD_REQUEST",
    ROLE_NOT_FOUND = "ROLE_NOT_FOUND",
    ROLE_PERSISTENCE_ERROR = "ROLE_PERSISTENCE_ERROR",
    USER_ROLE_NOT_FOUND = "USER_ROLE_NOT_FOUND",
    USER_ROLE_PERSISTENCE_ERROR = "USER_ROLE_PERSISTENCE_ERROR",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    USER_CONFLICT = "USER_CONFLICT",
    UNAUTHORIZED = "UNAUTHORIZED",
    USER_BLOCKED = "USER_BLOCKED",
    INVALID_TOKEN = "INVALID_TOKEN",
}

export enum ErrorMessages {
    ROLE_NOT_FOUND = "Role not found",
    ROLE_PERSISTENCE_ERROR = "Role could not be persisted",
    USER_ROLE_NOT_FOUND = "User role not found",
    USER_ROLE_PERSISTENCE_ERROR = "User role could not be persisted",
    USER_NOT_FOUND = "User not found",
    UNAUTHORIZED = "Unauthorized",
    TOO_SHORT_PASSWORD = "Password is too short. Minimum length is 8 characters",
    TOO_SHORT_EMAIL = "Email is too short. Minimum length is 5 characters",
    USER_BLOCKED = "User is blocked",
    INVALID_TOKEN = "Invalid token",
}

export type RegisterDTO = {
        email: string,
        password: string
}

export type LoginDTO = {
    email: string,
    password: string
}

export enum RolesOfUser {
    ADMIN = "admin",
    MODERATOR = "moderator",
    USER = "user",
}

export interface TokenService {
    generateToken(userId: string): string;
    verifyToken(token: string): { sub: string };
}