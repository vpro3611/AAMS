/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.createExtension("pgcrypto", { ifNotExists: true })
    pgm.createTable('users', {
        id: {
            type: "uuid",
            primaryKey: true,
            default: pgm.func("gen_random_uuid()"),
        },
        email: {
            type: "text",
            unique: true,
            notNull: true,
        },
        password_hash: {
            type: "text",
            notNull: true,
        },
        status: {
            type: "text",
            notNull: true,
            default: "active",
        },
        created_at: {
            type: "timestamp",
            notNull: true,
            default: pgm.func("now()"),
        }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('users');
};

