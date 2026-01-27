import { UserRepository} from "../repositories/user_repository";
import {NewUser, User} from "../models/models";


export class UserService {
    constructor(private readonly userRepo: UserRepository) {}

    createUser = async (newUser: NewUser): Promise<User> => {
        if (!newUser.email || !newUser.password_hash) {
            throw new Error("Invalid user data");
        }

        const checkUser = await this.userRepo.findUserByEmail(newUser.email);

        if (checkUser) throw new Error("User already exists");

        if (!newUser.email.includes("@") || !newUser.email.includes(".")) throw new Error("Invalid email format")

        return await this.userRepo.createUser(newUser);
    }

    blockUser = async (userId: string): Promise<User> => {
        if (!userId) throw new Error("Invalid user id");

        const user = await this.userRepo.findUserById(userId);

        if (!user) throw new Error("User not found");

        if (user.status === "blocked") throw new Error("User already blocked");

        return await this.userRepo.updateUserStatus(userId, user.status="blocked");
    }

    unblockUser = async (userId: string): Promise<User> => {
        if (!userId) throw new Error("Invalid user id");

        const user = await this.userRepo.findUserById(userId);

        if (!user) throw new Error("User not found");

        if (user.status === "active") throw new Error("User already active");

        return await this.userRepo.updateUserStatus(userId, user.status="active");
    }
}