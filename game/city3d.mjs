import * as T from './vendor/three.min.js';
import { places, missions, blocked, LANDMARK_OFFSET } from './world.mjs';
import { buildStreets } from './streets.mjs';

export function createCityView() {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
  renderer.domElement.style.cssText = 'position:fixed;inset:0;pointer-events:none';
  document.querySelector('#world').after(renderer.domElement);
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio));
  const scene = new T.Scene();
  renderer.toneMapping = T.ACESFilmicToneMapping;
  scene.fog = new T.FogExp2('#d89883', .00155);
  const camera = new T.PerspectiveCamera(59, 1, 1, 2100);
  const sky = new T.Mesh(new T.SphereGeometry(1600, 32, 16), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false,
    uniforms: { warm: { value: new T.Color('#f7aa80') }, blue: { value: new T.Color('#435d87') } },
    vertexShader: 'varying vec3 ray; void main(){ ray = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `
      varying vec3 ray;
      uniform vec3 warm, blue;
      void main() {
        vec3 direction = normalize(ray);
        vec3 tint = mix(warm, blue, smoothstep(-.075, .63, direction.y));
        float sun = max(0., dot(direction, normalize(vec3(-.32,.12,-1.))));
        tint += vec3(.9,.43,.15) * (pow(sun,24.)*.23 + pow(sun,2200.)*2.);
        gl_FragColor = vec4(tint,1.);
        #include <colorspace_fragment>
      }
    `,
  }));
  sky.renderOrder = -10;
  scene.add(sky);
  scene.add(new T.HemisphereLight('#ffdfc6', '#7188bb', 1.9));
  const sun = new T.DirectionalLight('#ffd5a6', 2.65);
  sun.position.set(-80, 140, -210);
  scene.add(sun);
  const cube = new T.BoxGeometry();
  const materials = new Map();
  function box(parent, color, x, y, z, width, height, depth) {
    if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({ color }));
    const mesh = new T.Mesh(cube, materials.get(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    parent.add(mesh);
    return mesh;
  }
  function addInstances(parts, material) {
    const mesh = new T.InstancedMesh(cube, material, parts.length);
    const matrix = new T.Matrix4();
    parts.forEach(([x, y, z, width, height, depth], index) => {
      matrix.makeScale(width, height, depth).setPosition(x, y, z);
      mesh.setMatrixAt(index, matrix);
    });
    scene.add(mesh);
  }
  const updateTide = buildStreets(scene, box, addInstances);
  places.forEach(({ x, y }, index) => {
    box(scene,'#6d7278',x,0,y,135,.08,135);
    // Landmark structures sit outside the arrival circle, leaving its approaches open.
    const back = y + LANDMARK_OFFSET;
    if (index === 0) {
      box(scene, '#30586a', x, 14, back, 88, 28, 16);
      box(scene, '#e9b06f', x, 26, back-9, 90, 4, 7);
      for (const bay of [-27, 0, 27]) box(scene, '#192d3a', x+bay, 9, back-8.5, 20, 17, 1);
    } else if (index === 1) {
      box(scene, '#568583', x, 22, back, 85, 44, 17);
      for (let panel = -36; panel <= 36; panel += 12) {
        box(scene, '#9cd5c5', x+panel, 21, back-9, 9, 30, 1);
      }
    } else if (index === 2) {
      for (const side of [-32, 32]) box(scene, '#a76143', x+side, 22, back, 7, 44, 10);
      box(scene, '#e39b54', x, 43, back, 83, 7, 11);
      box(scene, '#c4ad74', x+19, 29, back, 2, 24, 2);
    } else {
      box(scene, '#354c61', x, 24, back, 24, 48, 18);
      box(scene, '#d3ae91', x, 43, back, 47, 1.7, 26);
      box(scene, '#425d6a', x, 47, back, 43, 7, 24);
      box(scene, '#e7d19f', x, 51.5, back, 47, 2, 27);
      box(scene, '#283b49', x, 6, back-9.2, 8, 12, 1);
      for (const rung of [-8, 8]) {
        box(scene, '#e7d19f', x+rung, 25, back-9.2, .9, 34, 1);
      }
      box(scene, '#758e9a', x, 61, back, 3, 25, 3);
      box(scene, '#dc695e', x, 74, back, 8, 5, 8);
    }
  });
  const markerMaterial = new T.MeshBasicMaterial({ color: '#ffd58a' });
  const destination = new T.Group();
  const arrivalRing = new T.Mesh(new T.RingGeometry(64, 67, 64), new T.MeshBasicMaterial({
    color: '#ffc672', side: T.DoubleSide, transparent: true, opacity: .62, depthWrite: false,
  }));
  arrivalRing.rotation.x = -Math.PI / 2;
  arrivalRing.position.y = 2.2;
  const pennant = new T.Mesh(new T.OctahedronGeometry(7), markerMaterial);
  destination.add(arrivalRing, pennant);
  scene.add(destination);
  const head = new T.SphereGeometry(2.25, 9, 6);
  const tire = new T.CylinderGeometry(3.4, 3.4, 2.5, 12);
  function moldedBody(points, width) {
    const shape = new T.Shape();
    points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
    shape.closePath();
    return new T.ExtrudeGeometry(shape, { depth: width, bevelEnabled: true,
      bevelSegments: 1, bevelSize: .55, bevelThickness: .5 }).translate(0, 0, -width/2);
  }
  const chassis = moldedBody([[-17,2.1],[16.8,2.1],[17.4,5.4],[14.9,6.6],[-15.5,6.5],[-17.4,5.3]], 14.8);
  const cabin = moldedBody([[-14,6.5],[7.1,6.5],[1.6,10.7],[-8.7,10.7]], 11.5);
  const wagonCabin = moldedBody([[-15,6.5],[7.1,6.5],[2.1,10.7],[-13,10.7]], 11.9);
  const glazing = new T.MeshStandardMaterial({ color: '#344f66', roughness: .21, metalness: .25 });
  const rubber = new T.MeshStandardMaterial({ color: '#242632' });
  const shadowGeometry = new T.CircleGeometry(1, 24);
  const shadowMaterial = new T.MeshBasicMaterial({ color: '#251f2b', transparent: true, opacity: .32, depthWrite: false });
  function shadow(parent, length, width) {
    const mesh = new T.Mesh(shadowGeometry, shadowMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = .25;
    mesh.scale.set(length, width, 1);
    parent.add(mesh);
  }
  function actor(index = -1) {
    const group = new T.Group();
    shadow(group, 4, 4);
    const coat = index < 0 ? '#308078' : ['#c88368','#5f718b','#9b5969','#c6a164'][index%4];
    const skin = ['#b98667','#815744','#e1ae8c'][Math.max(index, 0)%3];
    box(group,coat,0,8.4,0,4.7,6.2,5.1);
    const face = new T.Mesh(head, new T.MeshStandardMaterial({ color: skin }));
    face.position.y = 13.1;
    group.add(face);
    box(group,'#252b38',-.4,14.9,0,4,1.5,4.7);
    if (index < 0) box(group, '#dca36d', -2.65, 8.3, 0, 1.1, 4.2, 3.5);
    const legs = [-1.3,1.3].map(z => {
      const leg = new T.Group();
      leg.position.set(0, 5.7, z);
      box(leg, '#36384b', 0, -2.1, 0, 2.1, 4.4, 2.1);
      box(leg, '#e4cbbb', .55, -4.5, 0, 3, 1.1, 2.2);
      group.add(leg);
      box(group, coat, 0, 8.2, z*2.55, 2.4, 5, 1.55);
      box(group, skin, .35, 5.25, z*2.55, 1.5, 1.5, 1.4);
      return leg;
    });
    scene.add(group);
    return { group, legs };
  }
  function car(color, patrol = false, wagon = false) {
    const group = new T.Group();
    shadow(group, 21, 9);
    if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({ color }));
    group.add(new T.Mesh(chassis, materials.get(color)), new T.Mesh(wagon ? wagonCabin : cabin, glazing));
    box(group,color,wagon ? -5.5 : -3.4,11,0,wagon ? 15 : 10,1.05,11.9);
    box(group,'#32374a',-17.6,2.6,0,1.8,2,16);
    box(group,'#32374a',17.6,2.6,0,1.8,2,16);
    box(group,'#e1d3b5',-18.6,4.1,0,.16,1.6,4.2);
    for (const side of [-1,1]) {
      for (const axle of [-11,11]) {
        const wheel = new T.Mesh(tire, rubber);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(axle, 3.35, side*7.7);
        group.add(wheel);
        box(group, '#9da0a2', axle, 3.35, side*9, 2.7, 2.7, .2);
      }
      box(group,patrol ? '#263a59' : '#a9a5a2',-2,4.6,side*8.04,24,1.15,.2);
      box(group,'#ffda9e',17.8,5,side*5.7,1,1.65,3.8);
      box(group,'#c14355',-17.8,5,side*5.7,1,1.75,4);
      box(group,color,5,7.7,side*7,2.9,1.6,2.7);
      box(group,color,-3,8.8,side*6.18,1.05,3.3,.24);
    }
    if (patrol) {
      group.userData.beacons = ['#ff2552','#32a7ff'].map((color, index) => {
        const beacon = box(group, color, -2, 12, index ? 3 : -3, 2.6, 1.6, 6);
        beacon.material = new T.MeshStandardMaterial({ color, emissive: color });
        return beacon.material;
      });
    }
    scene.add(group);
    return group;
  }
  const hero=actor(), pedestrians=[], cars=[], police=[];
  const palette=['#b38851','#559091','#ba5050','#c5bac4','#56708c'];
  const desired = new T.Vector3(), look = new T.Vector3();
  const routeDots = Array.from({ length: 14 }, () => {
    const dot = box(scene, '#ffc472', 0, 0, 0, 5, .18, 5);
    dot.material = markerMaterial;
    dot.rotation.y = Math.PI/4;
    return dot;
  });
  let width=0,height=0, ready=false, heading=-Math.PI/2, chaseDistance=66;
  const lastPosition = new T.Vector2(360, 370);
  function place(group, entity) {
    group.position.set(entity.x,0,entity.y);
    group.rotation.y=-entity.a;
  }
  const tracerMaterial = new T.MeshBasicMaterial({ color: '#ffe4a8' });
  const tracers = Array.from({ length: 8 }, () => {
    const mesh = new T.Mesh(cube, tracerMaterial);
    mesh.scale.set(10, .35, .35);
    scene.add(mesh);
    return mesh;
  });
  function draw(world, w, h, dt, playing, route, moving, starter) {
    if (width!==w || height!==h) {
      width=w; height=h;
      renderer.setSize(w,h);
      camera.aspect=w/h;
      camera.updateProjectionMatrix();
    }
    const player=world.player, driving=player.car!==null;
    updateTide(world.time);
    routeDots.forEach((dot, i) => {
      const point = route[i + 1];
      dot.visible = playing && Boolean(point);
      if (point) dot.position.set(point.x, 1.18, point.y);
    });
    const task = missions[world.mission];
    destination.visible = playing && !world.completed && Boolean(task);
    if (destination.visible) {
      const site = starter ?? places[task.target];
      destination.position.set(site.x, 0, site.y);
      arrivalRing.scale.setScalar(starter ? .37 : 1);
      pennant.scale.setScalar(starter ? .55 : 1);
      pennant.position.y = (starter ? 21 : 34) + Math.sin(world.time * 3) * 3;
      pennant.rotation.y = world.time;
    }
    tracers.forEach((mesh, index) => {
      const bullet = world.bullets[index];
      mesh.visible = Boolean(bullet);
      if (bullet) {
        mesh.position.set(bullet.x, 7, bullet.y);
        mesh.rotation.y = -Math.atan2(bullet.vy, bullet.vx);
      }
    });
    place(hero.group,player);
    hero.group.visible=!driving;
    hero.legs.forEach((leg,i) => { leg.rotation.z=moving ? Math.sin(world.time*11+i*Math.PI)*.53 : 0; });
    world.peds.forEach((p,i) => {
      const entry=pedestrians[i]??(pedestrians[i]=actor(i));
      place(entry.group,p); entry.group.visible=!!p.hp && Math.hypot(p.x-player.x, p.y-player.y)<750;
      entry.legs.forEach((leg,j) => { leg.rotation.z = Math.sin(world.time*8+i+j*Math.PI)*.37; });
    });
    world.cars.forEach((c,i) => {
      const mesh=cars[i]??(cars[i]=car(palette[c.color], false, i%4===1));
      place(mesh,c); mesh.visible=c.hp>0 && Math.hypot(c.x-player.x, c.y-player.y)<1000;
    });
    police.forEach(mesh => {mesh.visible=false;});
    world.police.forEach((p,i) => {
      const mesh=police[i]??(police[i]=car('#e7e5ea', true));
      place(mesh,p); mesh.visible=true;
      mesh.userData.beacons.forEach((material, index) => {
        material.emissiveIntensity = Math.sin(world.time*15+index*Math.PI)>0 ? 3.1 : .15;
      });
    });
    const requestedHeading=playing?player.a:-1.7+Math.sin(world.time*.25)*.22;
    const cut = !ready || Math.hypot(player.x-lastPosition.x, player.y-lastPosition.y)>450;
    lastPosition.set(player.x, player.y);
    if (cut) heading=requestedHeading;
    const delta=requestedHeading-heading;
    heading+=Math.atan2(Math.sin(delta),Math.cos(delta))*(1-Math.exp(-(driving?5.5:9)*dt));
    const angle=heading;
    const vehicle = driving ? world.cars.find(car => car.id === player.car) : null;
    const speedRatio = Math.min(1, Math.abs(vehicle?.v ?? 0) / 200);
    const targetDistance = driving ? 78 + speedRatio * 31 : 57;
    chaseDistance += (targetDistance - chaseDistance) * (1 - Math.exp(-5 * dt));
    const distance = chaseDistance;
    desired.set(player.x-Math.cos(angle)*distance, driving?34+speedRatio*13:24, player.y-Math.sin(angle)*distance);
    for (let offset=8; offset<distance; offset+=4) {
      const x=player.x-Math.cos(angle)*offset;
      const z=player.y-Math.sin(angle)*offset;
      if (blocked(x,z)) {
        const safeOffset=Math.max(5,offset-5);
        desired.x=player.x-Math.cos(angle)*safeOffset;
        desired.z=player.y-Math.sin(angle)*safeOffset;
        break;
      }
    }
    look.set(player.x+Math.cos(angle)*30,10,player.y+Math.sin(angle)*30);
    if (cut) {camera.position.copy(desired);ready=true;}
    camera.position.lerp(desired,1-Math.exp(-7*dt));
    if (blocked(camera.position.x,camera.position.z)) camera.position.copy(desired);
    camera.lookAt(look);
    sky.position.copy(camera.position);
    renderer.render(scene,camera);
  }
  const raycaster = new T.Raycaster();
  const aimPoint = new T.Vector3();
  const aimPlane = new T.Plane(new T.Vector3(0, 1, 0), -7);
  draw.aim = (pointer, player) => {
    raycaster.setFromCamera({ x: pointer.x/width*2-1, y: 1-pointer.y/height*2 }, camera);
    return raycaster.ray.intersectPlane(aimPlane, aimPoint)
      ? Math.atan2(aimPoint.z-player.y, aimPoint.x-player.x)
      : player.a;
  };
  return draw;
}
