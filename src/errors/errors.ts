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

