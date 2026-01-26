
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
