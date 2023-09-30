
/**
 *  set elements in col order 
 * so, elements[0] elements[1] elements[2] will be the first col of matrix
 */
export class Matrix {
    constructor(public elements: number[]) {
    }
    static fromNumber(num: number) {
        const elements = new Array(num).fill(0)
        return new Matrix(elements)
    }
    static make_identity() {
        return new Matrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
    }
}

export class Vector {
    constructor(public elements: number[]) {
    }
}

export function dot(u: Vector, v: Vector) {
    let ret = 0;
    for (let i = 0; i < u.elements.length; ++i) {
        ret += u.elements[i] * v.elements[i];
    }
    return ret;
}

export function scalarProduct(scalar: number, v: Vector) {
    let ret = new Vector(structuredClone(v.elements));
    for (let i = 0; i < v.elements.length; ++i) {
        ret.elements[i] *= scalar;
    }
    return ret;
}

/**
 * project_u(v) : project vector v onto vector u
 */
export function projection(u: Vector, v: Vector) {
    return scalarProduct(dot(u, v) / dot(u, u), u);
}

export function add(u: Vector, v: Vector) {
    let ret = new Vector(structuredClone(v.elements));
    for (let i = 0; i < v.elements.length; ++i) {
        ret.elements[i] += u.elements[i];
    }
    return ret;
}

export function sub(u: Vector, v: Vector) {
    let ret = new Vector(structuredClone(v.elements));
    for (let i = 0; i < v.elements.length; ++i) {
        ret.elements[i] = -ret.elements[i];
    }
    return add(u, ret);
}

export function perpendicular(u: Vector, v: Vector) {
    return sub(v, projection(u, v));
}

export function length(u: Vector) {
    return Math.sqrt(u.elements.map(p => p * p).reduce((p, c) => p + c, 0));
}

export function normalize(u: Vector) {
    let ret = new Vector(structuredClone(u.elements));
    const len = length(u);
    for (let i = 0; i < u.elements.length; ++i) {
        ret.elements[i] /= len;
    }
    return ret;
}

export function cross(u: Vector, v: Vector) {
    if (u.elements.length !== 3 || v.elements.length !== 3) {
        throw new Error('Cross product is defined for 3D vectors only.');
    }

    const u1 = u.elements[0];
    const u2 = u.elements[1];
    const u3 = u.elements[2];

    const v1 = v.elements[0];
    const v2 = v.elements[1];
    const v3 = v.elements[2];

    const w1 = u2 * v3 - u3 * v2;
    const w2 = u3 * v1 - u1 * v3;
    const w3 = u1 * v2 - u2 * v1;

    return new Vector([w1, w2, w3]);
}

export function rotate_orth(u: Vector, v: Vector, theta: number) {
    u = normalize(u);
    return add(scalarProduct(Math.cos(theta), v), scalarProduct(Math.sin(theta), cross(u, v)));
}

/**
 * euler is (x,y,z) describing rad of each axis rotation
 */
export function make_rotation_from_euler(euler: Vector) {
    const ret = new Matrix([0, 0, 0, 0]);
    const te = ret.elements;
    const x = euler.elements[0], y = euler.elements[1], z = euler.elements[2];
    const a = Math.cos(x), b = Math.sin(x);
    const c = Math.cos(y), d = Math.sin(y);
    const e = Math.cos(z), f = Math.sin(z);
    const ae = a * e, af = a * f, be = b * e, bf = b * f;
    te[0] = c * e;
    te[4] = - c * f;
    te[8] = d;
    te[1] = af + be * d;
    te[5] = ae - bf * d;
    te[9] = - b * c;
    te[2] = bf - ae * d;
    te[6] = be + af * d;
    te[10] = a * c;
    return ret;
}

export function make_translation(t: Vector) {
    return new Matrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t.elements[0], t.elements[1], t.elements[2], 1])
}

export function make_scale(t: Vector) {
    return new Matrix([t.elements[0], 0, 0, 0, 0, t.elements[1], 0, 0, 0, 0, t.elements[2], 0, 0, 0, 0, 1]);
}

export function multiply(a: Matrix, b: Matrix) {
    const ae = a.elements;
    const be = b.elements;
    const te = [];

    const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
    const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
    const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
    const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

    const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
    const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
    const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
    const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

    te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

    te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

    te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

    te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
    te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
    te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
    te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

    return new Matrix(te);
}

