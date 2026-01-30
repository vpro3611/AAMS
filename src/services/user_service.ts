import { UserRepository} from "../repositories/user_repository";
import {NewUser, User} from "../models/models";
import {BadRequestError, UserConflictError, UserNotFoundError} from "../errors/errors";


export class UserService {
    constructor(private readonly userRepo: UserRepository) {}

    private checkEmail = (email: string): boolean => {
        return email.includes("@") && email.includes(".");
    }

    createUser = async (newUser: NewUser): Promise<User> => {
        if (!newUser.email || !newUser.password_hash) {
            throw new BadRequestError("Invalid user data");
        }

        const checkUser = await this.userRepo.findUserByEmail(newUser.email);

        if (checkUser) throw new UserConflictError("User already exists");

        if (!this.checkEmail) throw new BadRequestError("Invalid email format")

        return await this.userRepo.createUser(newUser);
    }

    blockUser = async (userId: string): Promise<User> => {
        if (!userId) throw new BadRequestError("Invalid user id");

        const user = await this.userRepo.findUserById(userId);

        if (!user) throw new UserNotFoundError();

        if (user.status === "blocked") throw new UserConflictError("User already blocked");

        return await this.userRepo.updateUserStatus(userId, "blocked");
    }

    unblockUser = async (userId: string): Promise<User> => {
        if (!userId) throw new BadRequestError("Invalid user id");

        const user = await this.userRepo.findUserById(userId);

        if (!user) throw new UserNotFoundError();

        if (user.status === "active") throw new UserConflictError("User already active");

        return await this.userRepo.updateUserStatus(userId, "active");
    }

    findUserById = async (userId: string): Promise<User> => {
        if (!userId) throw new BadRequestError("Invalid user id");

        const user = await this.userRepo.findUserById(userId);
        if (!user) throw new UserNotFoundError();

        return user;
    }

    findUserByEmail = async (email: string): Promise<User> => {
        if (!email) throw new BadRequestError("Email cannot be null or undefined");
        if (!this.checkEmail(email)) throw new BadRequestError("Invalid email format");
        const user = await this.userRepo.findUserByEmail(email);
        if (!user) throw new UserNotFoundError();
        return user;
    }

    getAllUsers = async (): Promise<User[]> => {
        return await this.userRepo.getUsers();
    }

    deleteUser = async (userId: string): Promise<User> => {
        if (!userId) throw new BadRequestError("Invalid user id");
        const user =  await this.userRepo.deleteUser(userId);
        if (!user) throw new UserNotFoundError();
        return user;
    }
}