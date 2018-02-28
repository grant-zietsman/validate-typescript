
import chalk from "chalk";
import { objectToString } from './common';

export abstract class ValidationError extends Error {

    constructor() {
        super();
        this.message = 'Validate TypeScript';
    }

    public get trace() { return this.reason(); }

    public abstract reason(count?: number): string;

    public indent(count: number, message: string): string {
        return ('\n' + message).replace(/\n/g, '\n' + '  '.repeat(count));
    }; 

}

export class ConversionError extends ValidationError {
    constructor(
        public value: any,
        public converter: string,
        public details: string
    ) { 
        super();
    }

    public reason(count: number = 0) {
        return this.indent(count, `${chalk.yellowBright(`[Conversion: ${this.converter}]`)}\n${chalk.bold(`${objectToString(this.value)} ${this.details}.`)}`) + '\n';
    }
}

export class AssertionError extends ValidationError {
    constructor(
        public value: any,
        public assertion: string,
        public details: string
    ) { 
        super();
    }

    public reason(count: number = 0) {
        return this.indent(count, `${chalk.greenBright(`[Assertion: ${this.assertion}]`)}\n${chalk.bold(`${objectToString(this.value)} ${this.details}.`)}`) + '\n';
    }
}

export class ValidatorError extends ValidationError {

    constructor(
        public validator:   string,
        public property:    string,
        public value:       any,
        public child_error: Error,
    ) {
        super();
    }

    public reason(count: number = 0) {

        let response = this.indent(count, `${chalk.blueBright(`[Validator: ${this.validator}]`)} on property ${chalk.redBright(`${this.property}`)}`);

        if (this.child_error instanceof ValidationError) {
            response += this.child_error.reason(count + 1);
        }

        return response;
    }
}

export class NotMatchAnyError extends ValidationError {

    constructor(
        public value:           any,
        public child_errors:    Error[] = [],
    ) {
        super();
    }

    public reason(count: number = 0) {

        let response  = '';
        
        // Hide options if there is only one.
        if (this.child_errors.length > 1)
            response = '\n' + this.indent(count, `${chalk.magentaBright(`[Options: ${this.child_errors.length}]`)}`) + '\n';
        else count--;

        for (let child_error of this.child_errors) {
            if (child_error instanceof ValidationError) {
                response += child_error.reason(count + 1);
            }
        }

        return response;
    }
}