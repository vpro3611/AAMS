import { AuthService } from "../src/services/auth_service";
import { BadRequestError, UnauthorizedError } from "../src/errors/errors";
import { ErrorMessages, UserStatus } from "../src/models/models";
import { User } from "../src/models/models";

describe("AuthService (unit)", () => {
    let authService: AuthService;

    let hasherMock: any;
    let userUseCaseMock: any;
    let userServMock: any;
    let tokenServiceMock: any;

    beforeEach(() => {
        hasherMock = {
            hashPassword: jest.fn(),
            comparePasswords: jest.fn(),
        };

        // ✅ ИСПРАВЛЕНО ЗДЕСЬ
        userUseCaseMock = {
            registerUserWithDefaultRole: jest.fn(),
        };

        userServMock = {
            findUserByEmail: jest.fn(),
        };

        tokenServiceMock = {
            generateToken: jest.fn(),
        };

        authService = new AuthService(
            userUseCaseMock,
            hasherMock,
            tokenServiceMock,
            userServMock,
        );
    });

    // ---------------- REGISTER ----------------

    describe("register", () => {
        it("throws error if password is too short", async () => {
            await expect(
                authService.register({
                    email: "test@mail.com",
                    password: "123",
                })
            ).rejects.toBeInstanceOf(BadRequestError);

            expect(hasherMock.hashPassword).not.toHaveBeenCalled();
            expect(userUseCaseMock.registerUserWithDefaultRole).not.toHaveBeenCalled();
        });

        it("throws error if email is too short", async () => {
            await expect(
                authService.register({
                    email: "a@",
                    password: "strongpassword",
                })
            ).rejects.toBeInstanceOf(BadRequestError);

            expect(hasherMock.hashPassword).not.toHaveBeenCalled();
            expect(userUseCaseMock.registerUserWithDefaultRole).not.toHaveBeenCalled();
        });

        it("hashes password and creates user for valid input", async () => {
            const dto = {
                email: "test@mail.com",
                password: "strongpassword",
            };

            const hashedPassword = "hashed-password";

            const createdUser: User = {
                id: "user-id",
                email: dto.email,
                password_hash: hashedPassword,
                created_at: new Date(),
                status: UserStatus.ACTIVE,
            };

            hasherMock.hashPassword.mockResolvedValue(hashedPassword);
            userUseCaseMock.registerUserWithDefaultRole.mockResolvedValue(createdUser);

            const result = await authService.register(dto);

            expect(hasherMock.hashPassword).toHaveBeenCalledWith(dto.password);

            expect(userUseCaseMock.registerUserWithDefaultRole).toHaveBeenCalledWith({
                email: dto.email,
                password_hash: hashedPassword,
            });

            expect(result).toEqual(createdUser);
        });
    });

    // ---------------- LOGIN ----------------

    describe("login", () => {
        it("throws UnauthorizedError if user not found", async () => {
            userServMock.findUserByEmail.mockResolvedValue(null);

            await expect(
                authService.login({
                    email: "test@mail.com",
                    password: "password123",
                })
            ).rejects.toBeInstanceOf(UnauthorizedError);

            expect(hasherMock.comparePasswords).not.toHaveBeenCalled();
            expect(tokenServiceMock.generateToken).not.toHaveBeenCalled();
        });

        it("throws UnauthorizedError if password does not match", async () => {
            const user: User = {
                id: "user-id",
                email: "test@mail.com",
                password_hash: "hashed-password",
                created_at: new Date(),
                status: UserStatus.ACTIVE,
            };

            userServMock.findUserByEmail.mockResolvedValue(user);
            hasherMock.comparePasswords.mockResolvedValue(false);

            await expect(
                authService.login({
                    email: "test@mail.com",
                    password: "wrong-password",
                })
            ).rejects.toBeInstanceOf(UnauthorizedError);

            expect(hasherMock.comparePasswords).toHaveBeenCalled();
            expect(tokenServiceMock.generateToken).not.toHaveBeenCalled();
        });

        it("returns token for valid credentials", async () => {
            const user: User = {
                id: "user-id",
                email: "test@mail.com",
                password_hash: "hashed-password",
                created_at: new Date(),
                status: UserStatus.ACTIVE,
            };

            userServMock.findUserByEmail.mockResolvedValue(user);
            hasherMock.comparePasswords.mockResolvedValue(true);
            tokenServiceMock.generateToken.mockReturnValue("jwt-token");

            const result = await authService.login({
                email: "test@mail.com",
                password: "password123",
            });

            expect(userServMock.findUserByEmail).toHaveBeenCalledWith(
                "test@mail.com"
            );

            expect(hasherMock.comparePasswords).toHaveBeenCalledWith(
                "password123",
                user.password_hash
            );

            expect(tokenServiceMock.generateToken).toHaveBeenCalledWith(user.id);

            expect(result).toEqual({ token: "jwt-token" });
        });
    });
});
