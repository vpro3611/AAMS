export abstract class DomainError extends Error {
    abstract readonly httpStatus: number;
    abstract readonly code: string;

    protected constructor(message: string) {
        super(message);
    }
}

export class BadRequestError extends DomainError {
    readonly httpStatus = 400;
    readonly code = 'BAD_REQUEST';

    constructor(message: string) {
        super(message);
    }
}

export class RoleNotFoundError extends DomainError {
    readonly httpStatus = 404;
    readonly code = 'ROLE_NOT_FOUND';

    constructor() {
        super('Role not found');
    }
}

export class RolePersistenceError extends DomainError {
    readonly httpStatus = 409;
    readonly code = 'ROLE_PERSISTENCE_ERROR';

    constructor() {
        super('Role could not be persisted');
    }
}

export class UserRoleNotFoundError extends DomainError {
    readonly httpStatus = 404;
    readonly code = 'USER_ROLE_NOT_FOUND';

    constructor() {
        super('User role not found');
    }
}

export class UserRolePersistenceError extends DomainError {
    readonly httpStatus = 409;
    readonly code = 'USER_ROLE_PERSISTENCE_ERROR';

    constructor() {
        super('User role could not be persisted');
    }
}


