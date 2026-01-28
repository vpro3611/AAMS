import { pool } from './database';
import {UserRepository} from "./repositories/user_repository";
import {AuditRepository} from "./repositories/audit_repository";
import {RoleRepository} from "./repositories/role_repository";
import {UserRoleRepository} from "./repositories/user_role_repository";


async function main() {

    const res = await pool.query('SELECT NOW()');
    console.log(res.rows[0]);

    const userRepo: UserRepository = new UserRepository(pool);
    const auditRepo: AuditRepository = new AuditRepository(pool);
    const roleRepo: RoleRepository = new RoleRepository(pool);
    const userRoleRepo: UserRoleRepository = new UserRoleRepository(pool);

}

main().catch((err) => {
    console.error('Error in main function:', err);
    process.exit(1);
});