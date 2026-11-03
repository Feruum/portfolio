import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createKnotSculpture } from '../v2/knot-sculpture.js';

function makeScene() {
  const knot = createKnotSculpture(THREE, new THREE.MeshBasicMaterial());
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  camera.position.z = 9.25;
  camera.updateMatrixWorld();
  return { knot, camera };
}

function centers(mesh) {
  const matrix = new THREE.Matrix4();
  return Array.from({ length: mesh.count }, (_, i) => {
    mesh.getMatrixAt(i, matrix);
    return new THREE.Vector3().setFromMatrixPosition(matrix);
  });
}

test('a sweep displaces nearby links, a click displaces the whole knot, and both settle', () => {
  const { knot, camera } = makeScene();
  const home = centers(knot.mesh);
  const moved = () => centers(knot.mesh).filter((p, i) => p.distanceTo(home[i]) > .04).length;
  let time = 0;
  function advance(frames) {
    for (let i = 0; i < frames; i++) knot.update(time += 1 / 60, camera);
  }
  const target = home[1].clone().project(camera);
  knot.movePointer(target.x + .05, target.y + .02);
  advance(16);
  assert.ok(moved() > 0 && moved() < home.length / 2);
  knot.leavePointer();
  advance(180);
  assert.equal(knot.active, false);
  assert.deepEqual(centers(knot.mesh), home);
  knot.scatter();
  advance(12);
  assert.equal(moved(), home.length);
  advance(180);
  assert.equal(knot.active, false);
  assert.deepEqual(centers(knot.mesh), home);
});

test('all link surfaces stay in frame through repeated bursts, sweeps, and turns', () => {
  const { knot, camera } = makeScene();
  const mesh = knot.mesh, vertices = mesh.geometry.getAttribute('position');
  const instance = new THREE.Matrix4(), projection = new THREE.Matrix4(), p = new THREE.Vector3();
  let time = 0;
  for (const aspect of [.5, .72, 1, 1.5, 2.4]) {
    camera.aspect = aspect;
    camera.zoom = Math.min(1, aspect);
    camera.updateProjectionMatrix();
    for (let frame = 0; frame < 96; frame++) {
      mesh.rotation.set(frame * .025, frame * .08, 0);
      mesh.updateMatrixWorld();
      knot.movePointer(Math.sin(frame * .27), Math.cos(frame * .21));
      if (frame % 11 === 0) knot.scatter();
      knot.update(time += 1 / 60, camera);
      if (frame % 4 !== 0) continue;
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, instance);
        projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
          .multiply(mesh.matrixWorld).multiply(instance);
        for (let n = 0; n < vertices.count; n++) {
          p.fromBufferAttribute(vertices, n).applyMatrix4(projection);
          assert.ok(Math.max(Math.abs(p.x), Math.abs(p.y)) < .98);
        }
      }
    }
  }
});
