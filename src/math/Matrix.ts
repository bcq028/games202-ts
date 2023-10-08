
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
    static make_rotation(axis: Vector, angle: number) {
        const ret = Matrix.fromNumber(16);
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;
        const x = axis.elements[0], y = axis.elements[1], z = axis.elements[2];
        const tx = t * x, ty = t * y;

        ret.set(

            tx * x + c, tx * y - s * z, tx * z + s * y, 0,
            tx * y + s * z, ty * y + c, ty * z - s * x, 0,
            tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
            0, 0, 0, 1

        );

        return ret;
    }

    /**
     * l,r are x-axis value bounds the frustum others the same
     */
    static makePerspective(left: number, right: number, top: number, bottom: number, near: number, far: number) {
        const ret = Matrix.make_identity();
        const te = ret.elements;
        const x = 2 * near / (right - left);
        const y = 2 * near / (top - bottom);

        const a = (right + left) / (right - left);
        const b = (top + bottom) / (top - bottom);

        let c: number, d: number;

        c = - (far + near) / (far - near);
        d = (- 2 * far * near) / (far - near);


        te[0] = x; te[4] = 0; te[8] = a; te[12] = 0;
        te[1] = 0; te[5] = y; te[9] = b; te[13] = 0;
        te[2] = 0; te[6] = 0; te[10] = c; te[14] = d;
        te[3] = 0; te[7] = 0; te[11] = - 1; te[15] = 0;

        return ret;

    }


    static makePerspectiveByFov(near: number, far: number, fov: number, aspect: number) {
        const DEG2RAD = Math.PI / 180;
        let top = near * Math.tan(DEG2RAD * 0.5 * fov);
        let height = 2 * top;
        let width = aspect * height;
        let left = - 0.5 * width;
        return Matrix.makePerspective(left, left + width, top, top - height, near, far);
    }

    public set(n11: number, n12: number, n13: number, n14: number, n21: number, n22: number, n23: number, n24: number, n31: number, n32: number, n33: number, n34: number, n41: number, n42: number, n43: number, n44: number) {
        const te = this.elements;
        te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14;
        te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24;
        te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34;
        te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44;
        return this;
    }

    /**
     * multiply a to b
     * if b is null, b will be set to this
     */
    public multiply(a: Matrix, b: Matrix = this) {
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

        if (b == this) {
            this.elements = te;
            return this;
        }

        return new Matrix(te);
    }

    public invert() {
        const te = this.elements,

            n11 = te[0], n21 = te[1], n31 = te[2], n41 = te[3],
            n12 = te[4], n22 = te[5], n32 = te[6], n42 = te[7],
            n13 = te[8], n23 = te[9], n33 = te[10], n43 = te[11],
            n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15],

            t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
            t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
            t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
            t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

        const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

        if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

        const detInv = 1 / det;

        te[0] = t11 * detInv;
        te[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
        te[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
        te[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

        te[4] = t12 * detInv;
        te[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
        te[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
        te[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

        te[8] = t13 * detInv;
        te[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
        te[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
        te[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

        te[12] = t14 * detInv;
        te[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
        te[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
        te[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;

        return this;

    }

}

export class Vector {
    constructor(public elements: number[]) {
    }
    static from(x: number, y: number, z: number) {
        return new Vector([x, y, z]);
    }
    static make_zero() {
        return new Vector([0, 0, 0]);
    }
    static add(u: Vector, v: Vector) {
        let ret = new Vector(structuredClone(v.elements));
        for (let i = 0; i < v.elements.length; ++i) {
            ret.elements[i] += u.elements[i];
        }
        return ret;
    }

    static sub(u: Vector, v: Vector) {
        let ret = new Vector(structuredClone(v.elements));
        for (let i = 0; i < v.elements.length; ++i) {
            ret.elements[i] = -ret.elements[i];
        }
        return Vector.add(u, ret);
    }
    static cross(u: Vector, v: Vector) {
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

    static dot(u: Vector, v: Vector) {
        let ret = 0;
        for (let i = 0; i < u.elements.length; ++i) {
            ret += u.elements[i] * v.elements[i];
        }
        return ret;
    }

    public neg() {
        for (let i = 0; i < this.elements.length; ++i) {
            this.elements[i] = -this.elements[i];
        }
        return this;
    }
    public scalar(scalar: number) {
        for (let i = 0; i < this.elements.length; ++i) {
            this.elements[i] *= scalar;
        }
        return this
    }

    public length() {
        return Math.sqrt(this.elements.map(p => p * p).reduce((p, c) => p + c, 0));
    }

    public normalize() {
        const len = length(this);
        for (let i = 0; i < this.elements.length; ++i) {
            this.elements[i] /= len;
        }
        return this;
    }

    public applyMatrix(m: Matrix) {

        const x = this.elements[0], y = this.elements[1], z = this.elements[2];
        const e = m.elements;

        const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

        this.elements[0] = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
        this.elements[1] = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
        this.elements[2] = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;

        return this;

    }
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
    return scalarProduct(Vector.dot(u, v) / Vector.dot(u, u), u);
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

/**
 * we just need to move target to origin point, rotate up to y and eye to -z
 */
export function lookAt(eye: Vector, target: Vector, up: Vector) {
    const z = Vector.sub(eye, target);
    z.normalize();
    const x = Vector.cross(up, z);
    x.normalize();
    const y = Vector.cross(z, x);
    return new Matrix([...x.elements, 0, ...y.elements, 0, ...z.elements, 0, 1]);
}