import chalk from "chalk";
import { validate } from "../validate";
import { ID } from "../extensions";
import { All, Any, Options, Primitive, Optional } from "../validators";

export class Test extends Error {
    /**
     *
     */

     public output =
`
${chalk.bold('TypeScript Validate')} ${chalk.red('Error')}
`

    constructor() {
        super();
    }
}

export abstract class ValidationError extends Error {
    abstract get reason(): string; 
}

export class ValidatorError extends ValidationError {

    constructor(
        public validator: string,
        public field: string,
        public value: any,
        public err: Error
    ) {
        super();
        this.message = this.reason;
    }

    get reason() {

        let response = `in validator [${this.validator}] on field "${this.field}".\n`;
        if (this.err instanceof ValidationError) {
            response += this.err.reason;
        } else {
            response += this.err.message;
        }
        return response;
    }
}




let a = validate({
    test: {
        world: [
            {
                id: ID(),
                name: Optional(Primitive(String)),
                children: [Any([
                    Primitive(String),
                    ID(),
                    {
                        id: 1,
                        //namde: Primitive(String)
                    }
                ])]
            }
        ]
    }
}, {
    test: {
        world: [
            {
                id: 1,
                name: undefined,
                children: [
                    '1',
                    '4',
                    {
                        ide: 1,
                        name: 'Jeremy'
                    },
                ]
            }
        ]
    }
});
