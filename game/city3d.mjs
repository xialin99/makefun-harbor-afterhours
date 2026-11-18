import * as T from './vendor/three.module.js';
import { SIZE, ROAD, places, missions, blocked, courtyardBlock, LANDMARK_OFFSET } from './world.mjs';

export function createCityView() {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
  renderer.domElement.style.cssText = 'position:fixed;inset:0;pointer-events:none';
  document.querySelector('#world').after(renderer.domElement);
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio));
  const scene = new T.Scene();
  scene.background = new T.Color('#e6a08a');
  scene.fog = new T.FogExp2('#d28e83', .0018);
  const camera = new T.PerspectiveCamera(59, 1, 1, 2100);
  scene.add(new T.HemisphereLight('#ffe3ca', '#4c6290', 2.4));
  const sun = new T.DirectionalLight('#ffc28a', 2.2);
  sun.position.set(-150, 110, 200);
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
  box(scene, '#283641', SIZE/2, -3, SIZE/2, SIZE, 6, SIZE);
  box(scene, '#366b78', SIZE/2, -9, SIZE/2, 8000, 5, 8000);
  let seed = 72;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2**32);
  const windows = [];
  const laneMarks = [];
  for (let x = 0; x < SIZE; x += ROAD) {
    for (let z = 0; z < SIZE; z += ROAD) {
      for (let i = 0; i < ROAD; i += 30) {
        laneMarks.push([x+i, .2, z+45, 13, .15, 1]);
        laneMarks.push([x+45, .2, z+i, 1, .15, 13]);
      }
      if (courtyardBlock(x,z)) continue;
      box(scene, '#96918c', x+165, 1, z+165, 145, 2, 145);
      const height = 22 + random() ** 2 * (x < 1000 ? 75 : 145);
      const color = ['#706775','#5e7481','#ad8980','#857a82'][Math.floor(random()*4)];
      box(scene, color, x+165, height/2, z+165, 150, height, 150);
      box(scene, '#454757', x+163, height+2, z+164, 118, 4, 122);
      for (let y=10; y<height-4; y+=12) {
        for (let i=0; i<7; i++) {
          if (random()>.45) windows.push([x+115+i*15,y,z+89.5,8,5,1]);
          if (random()>.45) windows.push([x+89.5,y,z+118+i*15,1,5,8]);
        }
      }
    }
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
  addInstances(windows, new T.MeshBasicMaterial({ color: '#f9cd8a' }));
  addInstances(laneMarks, new T.MeshStandardMaterial({ color: '#c7ad7f' }));
  places.forEach(({ x, y }, index) => {
    box(scene,'#6d7278',x,1,y,135,2,135);
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
      box(scene, '#e7d19f', x, 46, back, 36, 10, 22);
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
  function actor() {
    const group = new T.Group();
    box(group,'#274147',0,7,0,6,8,4);
    box(group,'#c69676',0,13,0,4,4,4);
    box(group,'#242838',0,15,0,4.4,1.3,4.4);
    const legs = [-1.5,1.5].map(x => box(group,'#33324b',x,2,0,2,5,2));
    scene.add(group);
    return { group, legs };
  }
  function car(color) {
    const group = new T.Group();
    box(group,color,0,4,0,35,5,16);
    box(group,'#263348',-3,8,0,17,5,13);
    for (const side of [-1,1]) {
      for (const axle of [-10,10]) box(group,'#20212b',axle,2,side*8,7,6,4);
      box(group,'#ffda9e',18,4,side*5,1,2,4);
      box(group,'#b73346',-18,4,side*5,1,2,4);
    }
    scene.add(group);
    return group;
  }
  const hero=actor(), pedestrians=[], cars=[], police=[];
  const palette=['#b38851','#559091','#ba5050','#c5bac4','#56708c'];
  const target = new T.Vector3(), desired = new T.Vector3(), look = new T.Vector3();
  let width=0,height=0, ready=false, heading=0, chaseDistance=52;
  function place(group, entity) {
    group.position.set(entity.x,0,entity.y);
    group.rotation.y=-entity.a;
  }
  return function draw(world, w, h, dt, playing) {
    if (width!==w || height!==h) {
      width=w; height=h;
      renderer.setSize(w,h);
      camera.aspect=w/h;
      camera.updateProjectionMatrix();
    }
    const player=world.player, driving=player.car!==null;
    const task = missions[world.mission];
    destination.visible = playing && !world.completed && Boolean(task);
    if (destination.visible) {
      const site = places[task.target];
      destination.position.set(site.x, 0, site.y);
      pennant.position.y = 34 + Math.sin(world.time * 3) * 3;
      pennant.rotation.y = world.time;
    }
    place(hero.group,player);
    hero.group.visible=!driving;
    hero.legs.forEach((leg,i) => { leg.rotation.x=Math.sin(world.time*11+i*Math.PI)*Math.min(.5,hero.group.position.distanceTo(target)*.07); });
    world.peds.forEach((p,i) => {
      const entry=pedestrians[i]??(pedestrians[i]=actor());
      place(entry.group,p); entry.group.visible=!!p.hp;
    });
    world.cars.forEach((c,i) => {
      const mesh=cars[i]??(cars[i]=car(palette[c.color]));
      place(mesh,c); mesh.visible=c.hp>0;
    });
    police.forEach(mesh => {mesh.visible=false;});
    world.police.forEach((p,i) => {
      const mesh=police[i]??(police[i]=car('#e7e5ea'));
      place(mesh,p); mesh.visible=true;
    });
    target.set(player.x,0,player.y);
    const requestedHeading=playing?player.a:-1.15+Math.sin(world.time*.25)*.22;
    if (!ready) heading=requestedHeading;
    const delta=requestedHeading-heading;
    heading+=Math.atan2(Math.sin(delta),Math.cos(delta))*(1-Math.exp(-9*dt));
    const angle=heading;
    const vehicle = driving ? world.cars.find(car => car.id === player.car) : null;
    const speedRatio = Math.min(1, Math.abs(vehicle?.v ?? 0) / 200);
    const targetDistance = driving ? 65 + speedRatio * 30 : 52;
    chaseDistance += (targetDistance - chaseDistance) * (1 - Math.exp(-5 * dt));
    const distance = chaseDistance;
    desired.set(player.x-Math.cos(angle)*distance, driving?32:27, player.y-Math.sin(angle)*distance);
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
    if (!ready || camera.position.distanceTo(desired)>450) {camera.position.copy(desired);ready=true;}
    camera.position.lerp(desired,1-Math.exp(-7*dt));
    if (blocked(camera.position.x,camera.position.z)) camera.position.copy(desired);
    camera.lookAt(look);
    renderer.render(scene,camera);
  };
}
