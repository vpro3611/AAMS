
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