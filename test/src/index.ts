import { validate, Type } from "../.."
import { ID } from "../../lib/extensions"
import { All, Any, Options, Primitive, Optional } from "../../lib/validators"

import { test } from "ava"

// -------------------------------------------------------------------------------------------------
// region GENERATOR
// -------------------------------------------------------------------------------------------------

// [ ...Array(N).keys() ]


function gen_test_vectors(schema: any, vector: any[], pass_vector: number[]) {
    const result = {
        negative: vector.map((test) => (): any => validate(schema, test)),
        positive: [] as Array<() => any>
    };

    for (const test_index of pass_vector.sort((a, b) => b - a)) {
        result.positive.push(result.negative[test_index]);
        result.negative.splice(test_index, 1);
    }

    return result;
}

const std_vector = [
    undefined,
    null,
    true,
    false,
    {},
    [],
    Boolean(),
    Object(),
    Array(),
    Symbol(),
    "",
    "string",
    -1,
    0,
    1,
];

// -------------------------------------------------------------------------------------------------
// endregion GENERATOR
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// region LITERAL
// -------------------------------------------------------------------------------------------------

test('Literal Boolean', t => {

    const schema = true;
    const vector = std_vector
    const tests = gen_test_vectors(schema, vector, [2]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Literal Number', t => {

    const schema = 123;
    const vector = [...std_vector, schema];
    const tests = gen_test_vectors(schema, vector, [vector.length - 1]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Literal String', t => {

    const schema = "123";
    const vector = [...std_vector, schema];
    const tests = gen_test_vectors(schema, vector, [vector.length - 1]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Literal Symbol', t => {

    const schema = Symbol();
    const vector = [...std_vector, schema];
    const tests = gen_test_vectors(schema, vector, [vector.length - 1]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Literal Null', t => {

    const schema = null;
    const vector = [...std_vector, schema];
    const tests = gen_test_vectors(schema, vector, [1, vector.length - 1]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Literal Undefined', t => {

    const schema = undefined;
    const vector = [...std_vector, schema];
    const tests = gen_test_vectors(schema, vector, [0, vector.length - 1]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

// -------------------------------------------------------------------------------------------------
// endregion LITERAL
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// region PRIMITIVE
// -------------------------------------------------------------------------------------------------

test('Primitive Boolean', t => {

    const schema = Primitive(Boolean);
    const vector = std_vector;
    const tests = gen_test_vectors(schema, vector, [2, 3, 6]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});


test('Primitive Number', t => {

    const schema = Primitive(Number);
    const vector = std_vector;
    const tests = gen_test_vectors(schema, vector, [12, 13, 14]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Primitive String', t => {

    const schema = Primitive(String);
    const vector = std_vector;
    const tests = gen_test_vectors(schema, vector, [10, 11]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Primitive Symbol', t => {

    const schema = Primitive(Symbol);
    const vector = std_vector;
    const tests = gen_test_vectors(schema, vector, [9]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Primitive Object', t => {

    const schema = Primitive(Object);
    const vector = std_vector;
    const tests = gen_test_vectors(schema, vector, [4, 7]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Primitive Array', t => {

    const schema = Primitive(Array);
    const vector = std_vector;
    const tests = gen_test_vectors(schema, vector, [5, 8]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

// -------------------------------------------------------------------------------------------------
// endregion PRIMITIVE
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// region TYPE
// -------------------------------------------------------------------------------------------------

test('Type Boolean', t => {

    const schema = Type(Boolean);
    const vector = std_vector;
    const tests = gen_test_vectors(schema, vector, [2, 3, 6]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Type Number', t => {

    const schema = Type(Number);
    const vector = std_vector;
    const tests = gen_test_vectors(schema, vector, [12, 13, 14]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Type String', t => {

    const schema = Type(String);
    const vector = std_vector;
    const tests = gen_test_vectors(schema, vector, [10, 11]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Type Date', t => {

    const schema = Type(Date);
    const vector = [...std_vector, new Date()];
    const tests = gen_test_vectors(schema, vector, [vector.length - 1]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

test('Type Custom', t => {

    class Custom { }

    const schema = Type(Custom);
    const vector = [...std_vector, new Custom()];
    const tests = gen_test_vectors(schema, vector, [vector.length - 1]);

    tests.positive.forEach((test) => t.notThrows(test));
    tests.negative.forEach((test) => t.throws(test));

});

// -------------------------------------------------------------------------------------------------
// endregion TYPE
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// region OBJECT
// -------------------------------------------------------------------------------------------------

test('Valid Fields', t => {

    t.notThrows(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
    },
        {
            name: "name",
            age: 20,
        }));

});

test('Invalid Fields', t => {

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
    },
        {
            name: 10,
            age: 20,
        }));

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
    },
        {
            name: "name",
            age: "age",
        }));

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
    },
        {
            name: 10,
            age: "age",
        }));

});

test('Missing Fields', t => {

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
    },
        {
            name: "name",
        }));

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
    },
        {
            age: 20,
        }));

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
    },
        {

        }));

});

test('Extra Fields', t => {

    t.notThrows(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
    },
        {
            name: "name",
            age: 20,
            gender: "female"
        }));

});

test('Empty Schema', t => {

    t.notThrows(() => validate({
    },
        {
            name: "name",
            age: 20,
        }));

});

test('Nested Fields', t => {

    t.notThrows(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
        metrics: {
            height: Type(Number),
            weight: Type(Number)
        }
    },
        {
            name: "name",
            age: 20,
            metrics: {
                height: 1.8,
                weight: 60
            }
        }));

});

test('Invalid Nested Fields', t => {

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
        metrics: {
            height: Type(Number),
            weight: Type(Number)
        }
    },
        {
            name: "name",
            age: 20,
            metrics: {
                height: "1.8",
                weight: 60
            }
        }));

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
        metrics: {
            height: Type(Number),
            weight: Type(Number)
        }
    },
        {
            name: "name",
            age: 20,
            metrics: {
                height: 1.8,
                weight: "60"
            }
        }));

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
        metrics: {
            height: Type(Number),
            weight: Type(Number)
        }
    },
        {
            name: "name",
            age: 20,
            metrics: {
                height: "1.8",
                weight: "60"
            }
        }));

});

test('Missing Nested Fields', t => {

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
        metrics: {
            height: Type(Number),
            weight: Type(Number)
        }
    },
        {
            name: "name",
            age: 20,
            metrics: {
                weight: 60
            }
        }));

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
        metrics: {
            height: Type(Number),
            weight: Type(Number)
        }
    },
        {
            name: "name",
            age: 20,
            metrics: {
                height: 1.8,
            }
        }));

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
        metrics: {
            height: Type(Number),
            weight: Type(Number)
        }
    },
        {
            name: "name",
            age: 20,
            metrics: {
            }
        }));

    t.throws(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
        metrics: {
            height: Type(Number),
            weight: Type(Number)
        }
    },
        {
            name: "name",
            age: 20,
        }));

});

test('Multi Nested Fields', t => {

    t.notThrows(() => validate({
        name: Primitive(String),
        age: Primitive(Number),
        metrics: {
            height: {
                value: Type(Number),
                unit: "m",
            },
            weight: {
                value: Type(Number),
                unit: "kg",
            },
        }
    },
        {
            name: "name",
            age: 20,
            metrics: {
                height: {
                    value: 1.8,
                    unit: "m"
                },
                weight: {
                    value: 60,
                    unit: "kg"
                }
            }
        }));

});


// -------------------------------------------------------------------------------------------------
// endregion OBJECT
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// region ARRAY
// -------------------------------------------------------------------------------------------------

// TODO: Write tests

// -------------------------------------------------------------------------------------------------
// endregion ARRAY
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// region ANY
// -------------------------------------------------------------------------------------------------

// TODO: Write tests

// -------------------------------------------------------------------------------------------------
// endregion ANY
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// region ALL
// -------------------------------------------------------------------------------------------------

// TODO: Write tests

// -------------------------------------------------------------------------------------------------
// endregion ALL
// -------------------------------------------------------------------------------------------------
