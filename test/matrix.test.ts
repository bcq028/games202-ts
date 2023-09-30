import { Matrix, Vector, lookAt, multiply } from '../src/math/Matrix';

const epsilon = 1e-6; // A small value to account for floating point errors

function VectorEqual<T extends Matrix | Vector>(a: T, b: T) {
    for (let i = 0; i < a.elements.length; i++) {
        if (Math.abs(a.elements[i] - b.elements[i]) > epsilon) {
            return false;
        }
    }
    return true;
};

describe('Matrix multiplication', () => {
    test('Multiplication of identity matrix and another matrix', () => {
        const identityMatrix = Matrix.make_identity();
        const matrix = new Matrix([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

        const result = multiply(identityMatrix, matrix);

        // The result should be the same as the original matrix
        expect(VectorEqual(result, matrix)).toBe(true);
    });

    test('Multiplication of two arbitrary matrices', () => {
        const matrixA = new Matrix([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        const matrixB = new Matrix([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
        const expectedProduct = new Matrix([386, 444, 502, 560, 274, 316, 358, 400, 162, 188, 214, 240, 50, 60, 70, 80]);
        const result = multiply(matrixA, matrixB);
        // The result should match the expected product
        expect(VectorEqual(result, expectedProduct)).toBe(true);
    });

    test('make rotation', () => {
        const v = Vector.from(1, 0, 0);
        const m = Matrix.make_rotation(Vector.from(0, 0, 1), Math.PI / 2);
        v.applyMatrix(m);
        expect(VectorEqual(v, Vector.from(0, 1, 0)));
    })

    test('lookAt up is same', () => {
        const eye = Vector.make_zero();
        const target = Vector.from(0, 1, -1);
        const up = Vector.from(0, 1, -1);
        const mr = Matrix.make_rotation(Vector.from(1,0,0), Math.PI / 2);
        up.applyMatrix(mr);
        const m = lookAt(eye, target, up);
        const y = new Vector(m.elements.slice(4, 7));
        expect(VectorEqual(y, up.normalize()));
    })

});

