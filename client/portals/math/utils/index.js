import {
    Matrix3, MathUtils, Matrix4, Euler, Vector4,
} from 'three';

const mat3ProjXZ = new Matrix3();
mat3ProjXZ.set(
    1, 0, 0,
    0, 0, 0,
    0, 0, 1,
);
Object.freeze(mat3ProjXZ);

const matRot180Y = new Matrix4().makeRotationFromEuler(new Euler(0, Math.PI, 0, 'YXZ'));
Object.freeze(matRot180Y);

/**
 * Lengyel Eric's Oblique Near-Plane Clipping implementation: http://www.terathon.com/code/oblique.html
 * @param {Vector4} clipPlane - a clip plane in view space
 * @param {Matrix4} matrix - a projection matrix
 * @returns {Matrix4}
 */
function calculateObliqueMatrix(clipPlane, matrix) {
    const q = new Vector4();
    const matMod = matrix.clone();
    const { elements } = matMod;

    // Calculate the clip-space corner point opposite the clipping plane
    // as (sgn(clipPlane.x), sgn(clipPlane.y), 1, 1) and
    // transform it into camera space by multiplying it
    // by the inverse of the projection matrix

    q.x = (Math.sign(clipPlane.x) + elements[8]) / elements[0];
    q.y = (Math.sign(clipPlane.y) + elements[9]) / elements[5];
    q.z = -1.0;
    q.w = (1.0 + elements[10]) / elements[14];

    // Calculate the scaled plane vector
    const c = clipPlane.clone().multiplyScalar(2.0 / clipPlane.dot(q));

    // Replace the third row of the projection matrix
    elements[2] = c.x;
    elements[6] = c.y;
    elements[10] = c.z + 1.0;
    elements[14] = c.w;

    return matMod;
}

function getPillarRandValue(minXZ, maxXZ, thickness) {
    const halfThick = thickness * 0.5;
    const range = maxXZ - minXZ;
    const mr = Math.floor(Math.random() * range / halfThick) * halfThick;
    const exmr = mr * 2 - range * 0.5;

    const p = exmr + Math.sign(exmr) * minXZ;

    return p;
}

export default {
    ...MathUtils,
    mat3ProjXZ,
    matRot180Y,
    calculateObliqueMatrix,
    getPillarRandValue,
};
