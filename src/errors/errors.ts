import {ErrorCodes, ErrorMessages} from "../models/models";

export abstract class DomainError extends Error {
    abstract readonly httpStatus: number;
    abstract readonly code: string;

    protected constructor(message: string) {
        super(message);
    }
}

export class BadRequestError extends DomainError {
    readonly httpStatus = 400;
    readonly code = ErrorCodes.BAD_REQUEST;

    constructor(message: string) {
        super(message);
    }
}

export class RoleNotFoundError extends DomainError {
    readonly httpStatus = 404;
    readonly code = ErrorCodes.ROLE_NOT_FOUND;

    constructor() {
        super(ErrorMessages.ROLE_NOT_FOUND);
    }
}

export class RolePersistenceError extends DomainError {
    readonly httpStatus = 409;
    readonly code = ErrorCodes.ROLE_PERSISTENCE_ERROR;

    constructor() {
        super(ErrorMessages.ROLE_PERSISTENCE_ERROR);
    }
}

export class UserRoleNotFoundError extends DomainError {
    readonly httpStatus = 404;
    readonly code = ErrorCodes.USER_ROLE_NOT_FOUND;

    constructor() {
        super(ErrorMessages.USER_ROLE_NOT_FOUND);
    }
}

export class UserRolePersistenceError extends DomainError {
    readonly httpStatus = 409;
    readonly code = ErrorCodes.USER_ROLE_PERSISTENCE_ERROR;

    constructor() {
        super(ErrorMessages.USER_ROLE_PERSISTENCE_ERROR);
    }
}

export class UserNotFoundError extends DomainError {
    readonly httpStatus = 404;
    readonly code = ErrorCodes.USER_NOT_FOUND;

    constructor() {
        super(ErrorMessages.USER_NOT_FOUND);
    }
}

export class UserConflictError extends DomainError {
    readonly httpStatus = 409;
    readonly code = ErrorCodes.USER_CONFLICT;

    constructor(message: string) {
        super(message);
    }
}

export class UnauthorizedError extends DomainError {
    readonly httpStatus = 401;
    readonly code = ErrorCodes.UNAUTHORIZED;

    constructor() {
        super(ErrorMessages.UNAUTHORIZED);
    }
}

export class InvalidTokenError extends DomainError {
    readonly httpStatus = 401;
    readonly code = ErrorCodes.INVALID_TOKEN;

    constructor() {
        super(ErrorMessages.INVALID_TOKEN);
    }
}

export class UserBlockedError extends DomainError {
    readonly httpStatus = 403;
    readonly code = ErrorCodes.USER_BLOCKED;

    constructor() {
        super(ErrorMessages.USER_BLOCKED);
    }
}

export class ForbiddenError extends DomainError {
    readonly httpStatus = 403;
    readonly code = ErrorCodes.FORBIDDEN;

    constructor() {
        super(ErrorMessages.FORBIDDEN);
    }
}