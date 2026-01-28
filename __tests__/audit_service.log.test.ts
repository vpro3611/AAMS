import {AuditService} from "../src/services/audit_service";
import {PoolClient} from "pg";
import {AuditRepository} from "../src/repositories/audit_repository";
import {pool} from "../src/database";
import { UserService } from "../src/services/user_service";
import {UserRepository} from "../src/repositories/user_repository";


describe('audit_service.log', () => {
    let service: AuditService;
    let userServ: UserService;
    let userRepo: UserRepository;
    let client: PoolClient;
    let repo: AuditRepository;

    beforeAll(() => {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('Must be in test environment');
        }
    })

    beforeEach(async () => {
        client = await pool.connect();
        await client.query('BEGIN');
        repo = new AuditRepository(client);
        service = new AuditService(repo);
        userRepo = new UserRepository(client);
        userServ = new UserService(userRepo);
    })

    afterEach(async () => {
        await client.query('ROLLBACK');
        client.release();
    })

    afterAll(async () => {
        await pool.end();
    })

    it('logs an audit event', async () => {
        const userCreated = await userServ.createUser({email: 'vpro3611@gmail.c', password_hash: '2313'});
        if (!userCreated) throw new Error('Expected user to be created');
        expect(userCreated.id).toBeDefined();
        const auditEvent = await service.log(userCreated.id, 'test audit event');
        expect(auditEvent).toBeDefined();
        expect(auditEvent.action).toBe('test audit event');
        expect(auditEvent.actor_user_id).toBe(userCreated.id);
        expect(auditEvent.id).toBeDefined();
        expect(auditEvent.created_at).toBeDefined();
    })
})