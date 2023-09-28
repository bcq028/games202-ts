
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

export function dotProduct(u: Vector, v: Vector) {
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
    return scalarProduct(dotProduct(u, v) / dotProduct(u, u), u);
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

export function crossProduct(u: Vector, v: Vector) {
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
    return add(scalarProduct(Math.cos(theta), v), scalarProduct(Math.sin(theta), crossProduct(u, v)));
}