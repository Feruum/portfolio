// Rigid links share a single geometry and draw call. Their springs move in the
// camera plane, so a sweep always pushes away from the pointer as the knot turns.
export function createKnotSculpture(THREE, material) {
  const count = 20;
  const path = new THREE.Curve();
  path.getPoint = function (t, point = new THREE.Vector3()) {
    const a = t * Math.PI * 2;
    const r = 0.675 * (2 + Math.cos(3 * a));
    return point.set(r * Math.cos(2 * a), r * Math.sin(2 * a), 0.675 * Math.sin(3 * a));
  };
  const points = path.getSpacedPoints(count);
  const profile = [
    [.145, -.44], [.17, -.48], [.34, -.48], [.405, -.42], [.42, -.32],
    [.42, .32], [.405, .42], [.34, .48], [.17, .48], [.145, .44], [.145, -.44],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const mesh = new THREE.InstancedMesh(new THREE.LatheGeometry(profile, 20), material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const up = new THREE.Vector3(0, 1, 0);
  const pose = new THREE.Object3D();
  const links = points.slice(0, count).map((point, i) => {
    const direction = points[i + 1].clone().sub(point);
    const length = direction.length();
    const home = point.clone().lerp(points[i + 1], .5);
    const rotation = new THREE.Quaternion().setFromUnitVectors(up, direction.normalize());
    return {
      home, rotation, length, radius: Math.hypot(.42, .48 * length),
      center: new THREE.Vector3(), offset: new THREE.Vector2(), velocity: new THREE.Vector2(),
    };
  });

  const pointer = new THREE.Vector2();
  const previous = new THREE.Vector2();
  const inverse = new THREE.Quaternion();
  const twist = new THREE.Quaternion();
  const angles = new THREE.Euler();
  let hovering = false;
  let awake = false;
  let burst = false;
  let lastTime = 0;

  function writePose(link, i) {
    pose.position.set(link.offset.x, link.offset.y, 0).applyQuaternion(inverse).add(link.home);
    twist.setFromEuler(angles.set(-link.offset.y * .85, link.offset.x * .85, 0));
    pose.quaternion.copy(inverse).multiply(twist).multiply(mesh.quaternion).multiply(link.rotation);
    pose.scale.set(1, link.length, 1);
    pose.updateMatrix();
    mesh.setMatrixAt(i, pose.matrix);
  }

  function reset() {
    hovering = awake = burst = false;
    inverse.copy(mesh.quaternion).invert();
    links.forEach((link, i) => {
      link.offset.set(0, 0);
      link.velocity.set(0, 0);
      writePose(link, i);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  reset();

  function movePointer(x, y) {
    pointer.set(x, y);
    if (!hovering) previous.copy(pointer);
    hovering = awake = true;
  }

  function resolveContacts(dt) {
    for (let i = 1; i < links.length; i++) {
      const a = links[i];
      for (let j = 0; j < i; j++) {
        const b = links[j];
        const dx = a.center.x + a.offset.x - b.center.x - b.offset.x;
        const dy = a.center.y + a.offset.y - b.center.y - b.offset.y;
        const dz = a.center.z - b.center.z;
        const squared = dx * dx + dy * dy + dz * dz;
        if (squared >= .82 * .82 || squared === 0) continue;
        const distance = Math.sqrt(squared);
        const nx = dx / distance, ny = dy / distance;
        const speed = (a.velocity.x - b.velocity.x) * nx + (a.velocity.y - b.velocity.y) * ny;
        const impulse = Math.max(0, 220 * (.82 - distance) - 4 * speed) * dt;
        a.velocity.x += nx * impulse;
        a.velocity.y += ny * impulse;
        b.velocity.x -= nx * impulse;
        b.velocity.y -= ny * impulse;
      }
    }
  }

  function update(time, camera) {
    const dt = Math.min(1 / 30, Math.max(0, time - lastTime));
    lastTime = time;
    if (!awake) return;
    inverse.copy(mesh.quaternion).invert();
    const slopeY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / camera.zoom;
    const slopeX = slopeY * camera.aspect;
    const damping = Math.exp(-8 * dt);
    let moving = false;

    for (const link of links) link.center.copy(link.home).applyQuaternion(mesh.quaternion);
    resolveContacts(dt);
    links.forEach((link, i) => {
      const home = link.center;
      const offset = link.offset, velocity = link.velocity;
      const depth = camera.position.z - home.z;
      const halfW = depth * slopeX, halfH = depth * slopeY;
      if (burst) {
        const direction = Math.atan2(home.y, home.x) + .22 * Math.sin(i * 2);
        const speed = 7 + 2 * Math.cos(i * 3);
        velocity.x += Math.cos(direction) * speed;
        velocity.y += Math.sin(direction) * speed;
      }
      if (hovering) {
        // Use the whole swept segment so a quick mouse movement can't skip a link.
        const sx = (pointer.x - previous.x) * halfW, sy = (pointer.y - previous.y) * halfH;
        let dx = home.x + offset.x - previous.x * halfW;
        let dy = home.y + offset.y - previous.y * halfH;
        const along = THREE.MathUtils.clamp((dx * sx + dy * sy) / (sx * sx + sy * sy || 1), 0, 1);
        dx -= along * sx;
        dy -= along * sy;
        const distance = Math.hypot(dx, dy);
        const weight = Math.max(0, 1 - distance / 1.15) ** 2;
        const force = 130 * dt / Math.max(.06, distance);
        velocity.x += weight * (dx * force + 2.6 * sx);
        velocity.y += weight * (dy * force + 2.6 * sy);
      }
      velocity.addScaledVector(offset, -62 * dt).multiplyScalar(damping).clampLength(0, 11);
      offset.addScaledVector(velocity, dt);

      // Keep the entire tilted link inside the frustum, including during a burst.
      const limitX = halfW * .965 - link.radius * Math.hypot(1, slopeX);
      const limitY = halfH * .965 - link.radius * Math.hypot(1, slopeY);
      offset.x = THREE.MathUtils.clamp(home.x + offset.x, -limitX, limitX) - home.x;
      offset.y = THREE.MathUtils.clamp(home.y + offset.y, -limitY, limitY) - home.y;
      if (offset.lengthSq() + velocity.lengthSq() > .00012) moving = true;
      writePose(link, i);
    });
    mesh.instanceMatrix.needsUpdate = true;
    previous.copy(pointer);
    burst = false;
    if (!hovering && !moving) reset();
  }

  return {
    mesh, update, reset, movePointer,
    get active() { return awake; },
    leavePointer() { hovering = false; },
    scatter() { burst = awake = true; },
  };
}
