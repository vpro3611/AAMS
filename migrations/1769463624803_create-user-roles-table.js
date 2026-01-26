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
    pgm.createTable("user_roles", {
        user_id: {
            type: "uuid",
            notNull: true,
            references: "users(id)",
            onDelete: "cascade",
        },
        role_id: {
            type: "uuid",
            notNull: true,
            references: "roles(id)",
            onDelete: "cascade",
        },
    });
    pgm.createConstraint("user_roles", "user_roles_pkey", {
        primaryKey: ["user_id", "role_id"],
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('user_roles');
};
