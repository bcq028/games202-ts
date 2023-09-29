
/**
 *  set elements in col order 
 * so, elements[0] elements[1] elements[2] will be the first col of matrix
 */
export class Matrix {
    constructor(public elements: number[]) {
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