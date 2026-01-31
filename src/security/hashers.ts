import bcrypt from 'bcryptjs';

export class BcryptPassHasher {
    constructor() {}

    hashPassword = async (password: string): Promise<string> => {
        return await bcrypt.hash(password, 12);
    }

    comparePasswords = async (password: string, hash: string): Promise<boolean> => {
        return await bcrypt.compare(password, hash);
    }
}