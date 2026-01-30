

export class ApplicationError extends Error {
    constructor(message: string) {
        super(message);
    }
}


export class InvalidInputError extends ApplicationError {

}