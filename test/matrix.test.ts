import { Matrix, multiply } from '../src/math/Matrix';

const epsilon = 1e-6; // A small value to account for floating point errors

const areMatricesEqual = (a: Matrix, b: Matrix) => {
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
        expect(areMatricesEqual(result, matrix)).toBe(true);
    });

    test('Multiplication of two arbitrary matrices', () => {
        const matrixA = new Matrix([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        const matrixB = new Matrix([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
        const expectedProduct = new Matrix([386, 444, 502, 560, 274, 316, 358, 400, 162, 188, 214, 240, 50, 60, 70, 80]);
        const result = multiply(matrixA, matrixB);
        // The result should match the expected product
        expect(areMatricesEqual(result, expectedProduct)).toBe(true);
    });

    // Add more test cases as needed
});

