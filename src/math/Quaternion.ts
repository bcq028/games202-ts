import { Matrix, Vector } from "./Matrix";

export class Quaternion {
    constructor(public elements: number[]) {
        if (elements.length == 3) {
            elements.push(1);
        }
    }
}

export function conjugate(q: Quaternion) {
    let ret = new Quaternion(structuredClone(q.elements));
    for (let i = 0; i < ret.elements.length; ++i) {
        ret.elements[i] = -ret.elements[i];
    }
    return ret;
}

export function invert(q: Quaternion) {
    return conjugate(q);
}

export function length(q: Quaternion) {
    return Math.sqrt(q.elements.map(p => p * p).reduce((p, c) => p + c))
}

export function normalize(q: Quaternion) {
    let ret = new Quaternion(structuredClone(q.elements));
    let len = length(q);
    for (let i = 0; i < ret.elements.length; ++i) {
        ret.elements[i] /= len;
    }
    return ret;
}

export function mul(a: Quaternion, b: Quaternion) {
    let ret = new Quaternion(structuredClone(a.elements));
    const qax = a.elements[0], qay = a.elements[1], qaz = a.elements[2], qaw = a.elements[3];
    const qbx = b.elements[0], qby = b.elements[1], qbz = b.elements[2], qbw = b.elements[3];
    ret.elements[0] = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;;
    ret.elements[1] = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    ret.elements[2] = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    ret.elements[3] = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
    return ret;
}

export function axisAngleToQuaternion(axis: Vector, angle: number) {
    let ret = new Quaternion([0, 0, 0, 0]);
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    ret.elements[0] = axis.elements[0] * s;
    ret.elements[1] = axis.elements[1] * s;
    ret.elements[2] = axis.elements[2] * s;
    ret.elements[3] = Math.cos(halfAngle);
    return ret;
}

export function EulerToQuaternion(euler: Vector) {
    const x = euler.elements[0], y = euler.elements[1], z = euler.elements[2];
    const cos = Math.cos;
    const sin = Math.sin;
    const c1 = cos(x / 2);
    const c2 = cos(y / 2);
    const c3 = cos(z / 2);
    const s1 = sin(x / 2);
    const s2 = sin(y / 2);
    const s3 = sin(z / 2);
    let ret = new Quaternion([0, 0, 0, 0]);

    ret.elements[0] = s1 * c2 * c3 + c1 * s2 * s3;
    ret.elements[1] = c1 * s2 * c3 - s1 * c2 * s3;
    ret.elements[2] = c1 * c2 * s3 + s1 * s2 * c3;
    ret.elements[3] = c1 * c2 * c3 - s1 * s2 * s3;
    return ret;
}

export function RotationMatrixToQuaternion(m: Matrix) {
    let ret = new Quaternion([0, 0, 0, 0]);

    const te = m.elements,

        m11 = te[0], m12 = te[4], m13 = te[8],
        m21 = te[1], m22 = te[5], m23 = te[9],
        m31 = te[2], m32 = te[6], m33 = te[10],

        trace = m11 + m22 + m33;

    if (trace > 0) {

        const s = 0.5 / Math.sqrt(trace + 1.0);

        ret.elements[0] = 0.25 / s;
        ret.elements[1] = (m32 - m23) * s;
        ret.elements[2] = (m13 - m31) * s;
        ret.elements[3] = (m21 - m12) * s;

    } else if (m11 > m22 && m11 > m33) {

        const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

        ret.elements[0] = (m32 - m23) / s;
        ret.elements[1] = 0.25 * s;
        ret.elements[2] = (m12 + m21) / s;
        ret.elements[3] = (m13 + m31) / s;

    } else if (m22 > m33) {

        const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

        ret.elements[0] = (m13 - m31) / s;
        ret.elements[1] = (m12 + m21) / s;
        ret.elements[2] = 0.25 * s;
        ret.elements[3] = (m23 + m32) / s;

    } else {

        const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

        ret.elements[0] = (m21 - m12) / s;
        ret.elements[1] = (m13 + m31) / s;
        ret.elements[2] = (m23 + m32) / s;
        ret.elements[3] = 0.25 * s;

    }
    return ret;
}

export function UnitVectorsToQuaternion(vFrom: Vector, vTo: Vector) {
    let ret = new Quaternion([0, 0, 0, 0]);
    let r = Vector.dot(vFrom, vTo) + 1;
    if (r < Number.EPSILON) {
        // vFrom and vTo point in opposite directions
        r = 0;

        if (Math.abs(vFrom.elements[0]) > Math.abs(vFrom.elements[2])) {

            ret.elements[0] = - vFrom.elements[1];
            ret.elements[1] = vFrom.elements[0];
            ret.elements[2] = 0;
            ret.elements[3] = r;

        } else {

            ret.elements[0] = 0;
            ret.elements[1] = - vFrom.elements[2];
            ret.elements[2] = vFrom.elements[1];
            ret.elements[3] = r;

        }

    } else {

        // crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3
        ret.elements[0] = vFrom.elements[1] * vTo.elements[2] - vFrom.elements[2] * vTo.elements[1];
        ret.elements[1] = vFrom.elements[2] * vTo.elements[0] - vFrom.elements[0] * vTo.elements[2];
        ret.elements[2] = vFrom.elements[0] * vTo.elements[1] - vFrom.elements[1] * vTo.elements[0];
        ret.elements[3] = r;
    }

    return normalize(ret);
}

