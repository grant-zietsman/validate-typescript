import * as assert  from './assertions';
import * as sym from './symbols';
import { objectType, isUndefined, isNull } from './common';
import { ValidatorError, ValidationError, NotMatchAnyError, MultipleValidationError } from './errors';
import { ValidationOptions, Any } from './validators';
import { INVERT } from './assertions';

/**
 * Validator where the schema is an object. This is used, specifically for validating 
 * null, array and object types.
 * 
 * For null validation, the value must match the schema value of null.
 * 
 * For array validation each element of the array needs to be successfully validated. Multiple 
 * schemas can be provided but only one of them neds to succeed. Synonymous to the "any" 
 * validator.
 * 
 * For object validation, all the properties provided in the schema need to be provided in the
 * value object. To be validated, all the properties need to be validated successfully.
 * @param {T} schema The validation schema (object).
 * @param {any} value Variable (value) to be validated.
 * @param {string} property Name of the variable (value) being validated, for detailed logging.
 * @returns {T} When validation succeeds.
 * @throws {ValidatorError} When validation fails.
 */
export function ValidateObject<T>(schema: T, value: any, property: string): T {

    // Null Validation
    if (isNull(schema)) {
        Null(schema, value, property);
        return value;
    }

    // Array Validation
    if (Array.isArray(schema)) {

        // Ensure that the value is an array.
        try {
            assert.isArray(value);
        } catch (error) {
            throw new ValidatorError(Array.name, property, value, error);
        }

        const array_error = new MultipleValidationError(value);

        const idx_schema = (schema.length > 1) ? Any(schema) : schema[0];
		
        // Validate each element of the array.
        for (let element_idx = 0; element_idx < value.length; element_idx++) {
            
            const sub_property = `${property}[${element_idx}]`;

            try {
                value[element_idx] = ValidateRecursive(idx_schema, value[element_idx], sub_property);
            }
            catch (error) {
                array_error.child_errors.push(error);
            }
        }

        if (array_error.child_errors.length > 0) {
            throw array_error;
        }

    // Object Validation
    } else {

		// Ensure that the value is an object.
        try {
            assert.isObject(value);
            assert.isNull(value, INVERT);
            assert.isArray(value, INVERT);
        } catch (error) {
            throw new ValidatorError(Object.name, property, value, error);
        }
        
        const object_error = new MultipleValidationError(value);
		
		// Validate the fields of the object.
        for (const field of Object.getOwnPropertyNames(schema)) {
            try {
                value[field] = ValidateRecursive((<any>schema)[field], value[field], `${property}.${field}`);
            } catch (error) {
                object_error.child_errors.push(error);
            }
        }
        
        if (object_error.child_errors.length > 0) {
            throw object_error;
        }
		
    }

    return value;
};

/**
 * Validator where the schema is a function. This is used, specifically for validating based on 
 * type, multiple schema options and custom validators. The function serves as a wrapper to 
 * simplify the API.
 * 
 * For type validation, the class name of the value must match the class name of the schema.
 * 
 * For options validation, an array of schemas are provided. If the option is any, then only one
 * of the schemas need to match to validate successfully. If the option is all, then all of the 
 * schemas need to match to validate successfully. 
 * 
 * For custom validator validation, the custom validator function is called with the value and 
 * property as parameters.
 * @param {T} schema The validation schema (function).
 * @param {any} value Variable (value) to be validated.
 * @param {string} property Name of the variable (value) being validated, for detailed logging.
 * @returns {T} When validation succeeds.
 * @throws {ValidatorError} When validation fails.
 */
export function ValidateFunction<T extends Function>(schema: T, value: any, property: string): T {

    // Type Validation
    if ((<any>schema)[sym.Validator] === sym.TypeValidator) {
        let type_name = (<any>schema)[sym.TypeValidator];
        try {
            assert.isSameTypeName(type_name, <string>objectType(value));
        } catch(error) {
            throw new ValidatorError(type_name, property, value, error);
        }
    }

    // Options Validation
    else if ((<any>schema)[sym.Validator] === sym.OptionsValidator) {		

        const schemas = (<any>schema)[sym.OptionsValidator].schemas;
        const option: ValidationOptions = (<any>schema)[sym.OptionsValidator].option;
		const option_name = (<any>schema)[sym.Metadata].name;
		
        const match_error = new NotMatchAnyError(value);
        
		// Check each schema if (ALL); Check first valid schema (ANY).
        for (let schema_idx = 0; schema_idx < schemas.length; schema_idx++) {

            try {
                value = ValidateRecursive(schemas[schema_idx], value, property);
                if (option === ValidationOptions.any) {
                    match_error.child_errors = [];
                    break;
                }
            }
            catch (error) {
                match_error.child_errors[schema_idx] = error;
            }            
        }

        if (match_error.child_errors.length > 0) {
            throw new ValidatorError(option_name, property, value, match_error);
        }
    }

    // Custom Validator Validation
    else if ((<any>schema)[sym.Validator] === sym.CustomValidator) {

        let validator_name = (<any>schema)[sym.Metadata].name;
        try {
            value = (<any>schema)[sym.CustomValidator](value, property);
        } catch(error) {
            throw new ValidatorError(validator_name, property, value, error);
		}
		
    }

    // Validator Function (not supported)
    else Unknown(schema, value, property)

    return value;
};

/**
 * Validator where the schema is a literal string, thus the variable (value) is expected to be a 
 * string and have the same string value as the schema.
 * @param {string} schema The validation schema.
 * @param {any} value Variable (value) to be validated.
 * @param {string} property Name of the variable (value) being validated, for detailed logging.
 * @returns {string} When validation succeeds.
 * @throws {ValidatorError} When the value is either not a string or the string value differs
 * from that of the schema (failed validation).
 */
export function LiteralString(schema: string, value: any, property: string): string {
    try {
        assert.isString(value);
        assert.isEqual(schema, value);
    } catch (error) {
        throw new ValidatorError(LiteralString.name, property, value, error);
    }
    return value;
};

/**
 * Validator where the schema is a literal number, thus the variable (value) is expected to be a 
 * number and have the same numeric value as the schema.
 * @param {number} schema The validation schema.
 * @param {any} value Variable (value) to be validated.
 * @param {string} property Name of the variable (value) being validated, for detailed logging.
 * @returns {number} When validation succeeds.
 * @throws {ValidatorError} When the value is either not a number or the numeric value differs
 * from that of the schema (failed validation).
 */
export function LiteralNumber(schema: number, value: any, property: string): number {
    try {
        assert.isNumber(value);
        assert.isEqual(schema, value);
    } catch (error) {
        throw new ValidatorError(LiteralNumber.name, property, value, error);
    }
    return value;
};

/**
 * Validator where the schema is a literal boolean, thus the variable (value) is expected to be a 
 * boolean and have the same boolean value as the schema.
 * @param {boolean} schema The validation schema.
 * @param {any} value Variable (value) to be validated.
 * @param {string} property Name of the variable (value) being validated, for detailed logging.
 * @returns {boolean} When validation succeeds.
 * @throws {ValidatorError} When the value is either not a boolean or the boolean value differs 
 * from that of the schema (failed validation).
 */
export function LiteralBoolean(schema: boolean, value: any, property: string): boolean {
    try {
        assert.isBoolean(value);
        assert.isEqual(schema, value);
    } catch (error) {
        throw new ValidatorError(LiteralBoolean.name, property, value, error);
    }
    return value;
};

/**
 * Validator where the schema is a literal symbol, thus the variable (value) is expected to be a 
 * symbol and have the same symbolic value as the schema.
 * @param {symbol} schema The validation schema.
 * @param {any} value Variable (value) to be validated.
 * @param {string} property Name of the variable (value) being validated, for detailed logging.
 * @returns {symbol} When validation succeeds.
 * @throws {ValidatorError} When the value is either not a symbol or the symbolic value differs 
 * from that of the schema (failed validation).
 */
export function LiteralSymbol(schema: symbol, value: any, property: string): symbol {
    try {
        assert.isSymbol(value);
        assert.isEqual(schema, value);
    } catch (error) {
        throw new ValidatorError(LiteralSymbol.name, property, value, error);
    }
    return value;
};

/**
 * Validator where the schema is undefined, thus the variable (value) is expected to be undefined
 * too.
 * @param {undefined} schema The validation schema.
 * @param {any} value Variable (value) to be validated.
 * @param {string} property Name of the variable (value) being validated, for detailed logging.
 * @returns {undefined} When validation succeeds.
 * @throws {ValidatorError} When the value is not undefined (failed validation).
 */
export function Undefined(schema: undefined, value: any, property: string): undefined {
    try {
        assert.isUndefined(value);
    } catch (error) {
        throw new ValidatorError(Undefined.name, property, value, error);
    }
    return value;
};

/**
 * Validator where the schema is null, thus the variable (value) is expected to be null too.
 * @param {null} schema The validation schema.
 * @param {any} value Variable (value) to be validated.
 * @param {string} property Name of the variable (value) being validated, for detailed logging.
 * @returns {null} When validation succeeds.
 * @throws {ValidatorError} When the value is not null (failed validation).
 */
export function Null(schema: null, value: any, property: string): null {
    try {
        assert.isNull(value);
    } catch (error) {
        throw new ValidatorError(Null.name, property, value, error);
    }
    return value;
};

/**
 * Validator where the schema has a native type that has not been catered for.
 * @param {T} schema The validation schema.
 * @param {any} value Variable (value) to be validated.
 * @param {string} property Name of the variable (value) being validated, for detailed logging.
 * @throws {ValidatorError} This caters for the scenario where a native type is not catered for.
 */
export function Unknown<T>(schema: T, value: any, property: string): T {
    throw new ValidatorError(Unknown.name, property, value, new Error('Unable to validate unknown type.'));
};

/**
 * Internal method to select the appropriate validation scheme, base on the native type of the 
 * variable (value).
 * @param {T} schema The validation schema.
 * @param {any} value Variable (value) to be validated.
 * @param {string} property Name of the variable (value) being validated, for detailed logging.
 * @returns {T} The original value cast to type T if validation succeeded, else an error is 
 * thrown.
 */
function ValidateRecursive<T>(schema: T, value: any, property: string): T {
    
    if 		(typeof schema === 'object')	{ value = ValidateObject(schema, value, property); }
    else if	(typeof schema === 'function')	{ value = ValidateFunction(schema, value, property); }        
    else if (typeof schema === 'string')	{ value = LiteralString(schema, value, property); }
    else if (typeof schema === 'number')	{ value = LiteralNumber(schema, value, property); }
    else if (typeof schema === 'boolean')	{ value = LiteralBoolean(schema, value, property); }
    else if (typeof schema === 'symbol')	{ value = LiteralSymbol(schema, value, property); }
    else if (typeof schema === 'undefined')	{ value = Undefined(schema, value, property); }
    else									{ value = Unknown(schema, value, property); }

    return value;
}

/**
 * Validates a variable (value) according to a validation schema (type T).
 * @param {T} schema The validation schema.
 * @param {any} value Variable (value) to be validated.
 * @param {string} name Name of the variable (value) being validated, for detailed logging.
 * @param {Function(string)} log Validation error logger, takes a string input.
 * @returns {T} The original value cast to type T if validation succeeded, else an error is 
 * thrown.
 */
export function validate<T>(schema: T, value: any, name: string = '', log: any = console.log): T {

    try {
        return ValidateRecursive(schema, value, name);
    } catch(error) {

        if (error instanceof ValidationError) {
            if (!isUndefined(log)) {
                log('\n' + error.trace + '\n');
            }
        }

        throw error;
    }

}
