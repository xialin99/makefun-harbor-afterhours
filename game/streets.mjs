import * as T from './vendor/three.min.js';
import { SIZE, ROAD, places, courtyardBlock } from './world.mjs';

const districts = [
  { name: 'MARINA ROW', walls: ['#f2bd84', '#b95f59', '#458983'], trim: '#ffdda2', glass: '#45646b' },
  { name: 'GLASSWORKS', walls: ['#365f74', '#526d7c', '#887c91'], trim: '#86d9d1', glass: '#274557' },
  { name: 'SIGNAL QUARTER', walls: ['#947da0', '#bf8274', '#766e91'], trim: '#f5b5cc', glass: '#53435e' },
  { name: 'SOUTH DOCKS', walls: ['#a46b4e', '#587b72', '#9a7862'], trim: '#ffc566', glass: '#3b5d60' },
];

export function districtAt(x, z) {
  return districts[(z >= 1200 ? 2 : 0) + Number(x >= 1200)];
}

export function sign(parent, label, color, x, y, z, width, rotation = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  function drawLabel(){
    ctx.fillStyle = '#172735';
    ctx.fillRect(0, 0, 512, 96);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 500, 84);
    ctx.fillStyle = color;
    ctx.font = 'bold 49px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(window.t(label), 256, 50, 464);
  }
  drawLabel();
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  window.addEventListener('ui-language-change',()=>{drawLabel();map.needsUpdate=true;});
  const mesh = new T.Mesh(new T.PlaneGeometry(width, width * 96 / 512),
    new T.MeshBasicMaterial({ map, side: T.DoubleSide }));
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotation;
  parent.add(mesh);
}

export function buildStreets(scene, box, instances) {
  const batches = new Map();
  const tile = (color, ...part) => {
    if (!batches.has(color)) batches.set(color, []);
    batches.get(color).push(part);
  };
  let seed = 871;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2**32);
  const pick = values => values[Math.floor(random() * values.length)];
  const sea = new T.Mesh(new T.PlaneGeometry(7100, 7100), new T.ShaderMaterial({
    uniforms: { tide: { value: 0 }, haze: { value: new T.Color('#d89883') } },
    vertexShader: `
      varying vec3 water;
      void main() {
        water = (modelMatrix * vec4(position, 1.)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(water, 1.);
      }
    `,
    fragmentShader: `
      varying vec3 water;
      uniform float tide;
      uniform vec3 haze;
      void main() {
        vec2 p = water.xz;
        float distanceToEye = length(water - cameraPosition);
        float wave = sin(p.y*.23 + sin(p.x*.045 + tide*.25)*2.8 + tide)
                   + sin(p.x*.12 + p.y*.38 - tide*1.7)*.48;
        float ripple = smoothstep(.86, 1.42, wave) * exp(-distanceToEye*.002);
        vec3 liquid = mix(vec3(.025,.13,.18), vec3(.15,.34,.35), .38 + ripple*.62);
        liquid += vec3(.17,.11,.074) * smoothstep(1.21, 1.48, wave) * exp(-distanceToEye*.002);
        float mist = 1. - exp(-pow(distanceToEye*.0015,2.));
        gl_FragColor = vec4(mix(liquid, haze, mist),1.);
        #include <colorspace_fragment>
      }
    `,
  }));
  sea.rotation.x = -Math.PI/2;
  sea.position.set(SIZE/2, -8.5, SIZE/2);
  scene.add(sea);
  const asphalt = box(scene, '#59545d', SIZE / 2, -3, SIZE / 2, SIZE, 6, SIZE);
  const grain = document.createElement('canvas');
  grain.width = grain.height = 128;
  const paint = grain.getContext('2d');
  paint.fillStyle = '#dad6d1';
  paint.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 4400; i++) {
    paint.fillStyle = i % 3 ? '#564b4a24' : '#ffffef70';
    paint.fillRect(random()*128, random()*128, 1 + random()*2, 1);
  }
  const grainMap = new T.CanvasTexture(grain);
  grainMap.wrapS = grainMap.wrapT = T.RepeatWrapping;
  grainMap.repeat.set(43, 43);
  grainMap.colorSpace = T.SRGBColorSpace;
  asphalt.material = new T.MeshStandardMaterial({ map: grainMap, color: '#787077', roughness: 1 });
  for (let i = 12; i < SIZE; i += 24) {
    for (const edge of [4, SIZE - 4]) {
      tile('#b4a095', edge, 1, i, 8, 2, 24);
      tile('#b4a095', i, 1, edge, 24, 2, 8);
      if (i % 48 === 12) {
        tile('#2c414d', edge, 4, i, 4, 7, 4);
        tile('#2c414d', i, 4, edge, 4, 7, 4);
      }
    }
  }
  for (let i = 0; i < 9; i++) {
    const z = 105 + i * 251;
    tile('#957b6c', -46, -1, z, 94, 3, 18);
    tile('#303f54', -55, -5, z + 20, 53, 7, 14);
    tile('#ede1cd', -55, 0, z + 20, 45, 3, 11);
    tile('#34566a', -60, 3, z + 20, 16, 4, 9);
    tile('#bda694', -63, 12, z + 20, .7, 17, .7);
  }
  for (const center of [1610, 1840, 2070, 2300]) {
    tile('#827162', center, -1.6, SIZE+44, 35, 4, 90);
    tile('#304455', center+36, -3, SIZE+89, 38, 7, 87);
    tile('#aa735b', center+36, 1, SIZE+89, 32, 2, 75);
    tile('#eee2cb', center+36, 5, SIZE+104, 29, 7, 26);
    for (const side of [-1,1]) tile('#e7ae63', center+side*18, 27, SIZE+27, 5, 55, 5);
    tile('#e7ae63', center, 55, SIZE+27, 58, 6, 6);
    tile('#463e43', center+15, 41, SIZE+27, .85, 23, .85);
  }
  const foliage = new T.DodecahedronGeometry(1, 0);
  const leaves = new T.MeshStandardMaterial({ color: '#4e7760' });
  for (let x = 0; x < SIZE; x += ROAD) {
    for (let z = 0; z < SIZE; z += ROAD) {
      const district = districtAt(x, z);
      for (let i = 104; i < ROAD; i += 26) {
        tile('#ddba82', x+i, .08, z+45, 12, .15, 1);
        tile('#ddba82', x+45, .08, z+i, 1, .15, 12);
      }
      for (let i = 23; i < 73; i += 8) {
        tile('#bfb7ae', x+84, .08, z+i, 5, .15, 4);
        tile('#bfb7ae', x+i, .08, z+84, 4, .15, 5);
      }
      for (const offset of [86, 232]) {
        tile('#c5ae9d', x+offset, .48, z+162, 7, .85, 144);
        tile('#c5ae9d', x+161, .48, z+offset, 144, .85, 7);
      }
      for (const [lx, lz] of [[x+94,z+84], [x+84,z+221]]) {
        tile('#293744', lx, 10, lz, 1.4, 20, 1.4);
        tile('#293744', lx, 20, lz-4, 2, 1.3, 9);
        tile('!#ffe4ad', lx, 19.5, lz-7, 4, .7, 3);
        tile('#736b67', lx, .1, lz, 8, .2, 8);
      }
      if (courtyardBlock(x, z)) continue;
      const dock = district === districts[3];
      const glass = district === districts[1];
      const h = 25 + Math.round(random() * (dock ? 20 : glass ? 101 : 43));
      const wall = pick(district.walls);
      const width = dock ? 134 : 123;
      const left = x + (150-width)/2 + 90;
      const front = z + 103;
      const right = left+width;
      const back = front+124;
      const midX = (left+right)/2;
      const midZ = (front+back)/2;
      tile('#aaa298', x+164, .8, z+163, 147, 1.6, 147);
      tile('#7b7775', midX+4, 1.65, midZ-5, width+8, .15, 130);
      tile(wall, midX, h/2, midZ, width, h, 124);
      tile(district.glass, midX, h+.3, midZ, width+1, .8, 126);
      tile(wall, midX+15, h+2.5, midZ+24, 42, 5, 39);
      tile('#515159', midX+18, h+7, midZ+24, 9, 5, 10);
      for (const face of [front-.2, back+.2]) {
        tile(district.trim, midX, h-1, face, width, 1.5, 1.2);
        if (!dock) tile(district.trim, midX, 12, face, width, .85, 1.4);
        for (let dx = left+11; dx < right-5; dx+=16) {
          tile(district.glass, dx, 5.6, face, 11.5, 9, .7);
          if (!dock) tile(district.trim, dx, 11, face, 13, .9, 5.5);
          for (let y=17; y<h-3; y+=glass ? 9 : 11) {
            tile(random()<.16 ? '!#efbe83' : district.glass, dx, y, face,
              glass ? 13 : 7, glass ? 7.5 : 5.5, .65);
            if (!glass && !dock) {
              tile(district.trim, dx, y-2.9, face, 9.3, .5, 1.35);
              tile(wall, dx, y, face, .47, 5.5, .85);
            }
          }
        }
      }
      for (const face of [left-.2, right+.2]) {
        tile(district.trim, face, h-1, midZ, 1.2, 1.5, 124);
        for (let dz=front+11; dz<back-6; dz+=15) {
          for (let y=7; y<h-3; y+=glass ? 9 : 11) {
            tile(random()<.12 ? '!#efbe83' : district.glass, face, y, dz,
              .65, glass ? 7.3 : 5.5, glass ? 12 : 7);
          }
        }
      }
      if (!dock && (x+z)%480===0) {
        tile('#685344', x+102, 5, z+94, 2.2, 10, 2.2);
        const crown = new T.Mesh(foliage, leaves);
        crown.position.set(x+102, 13, z+94);
        crown.scale.set(6, 7, 5);
        scene.add(crown);
      }
      if (dock) {
        tile(pick(['#ad6751','#376f79','#ae944f']), midX+18, 4, front-7, 32, 8, 7);
      }
      if (glass && h > 76) {
        tile(district.glass, midX-21, h+8, midZ-17, 41, 16, 47);
        tile(district.trim, midX-21, h+16, midZ-17, 43, 1, 49);
        tile('#5b5967', midX-23, h+24, midZ-17, 1.1, 15, 1.1);
      }
      if (z === 0 && x < 960) {
        const names = ['TIDE TABLE', 'PIER SUPPLY', 'MOTH COFFEE', 'BREAKWATER'];
        sign(scene, names[x/ROAD], district.trim, midX, 13.1, back+3.1, 45);
      }
    }
  }
  places.forEach(({ x, y, name }) => {
    const district = districtAt(x, y);
    const signal = name === 'Signal House';
    sign(scene, name.toUpperCase(), district.trim, x, signal ? 46 : 23, y+(signal ? 78 : 81), signal ? 43 : 78, Math.PI);
    for (let col=-60; col<=60; col+=10) {
      for (let row=-60; row<=60; row+=10) {
        tile(pick(['#9a8a7c','#a49482','#9e8d80','#aa9886']), x+col, .07, y+row, 9.86, .12, 9.86);
      }
    }
    for (let i=-54; i<=54; i+=9) {
      tile('#dfc5a1', x+i, .15, y-39, .7, .15, 13);
      tile('#dfc5a1', x+i, .15, y+57, 7, .15, .75);
    }
  });
  for (const [color, parts] of batches) {
    const material = color.startsWith('!')
      ? new T.MeshBasicMaterial({ color: color.slice(1) })
      : new T.MeshStandardMaterial({ color, roughness: .86 });
    instances(parts, material);
  }
  return time => { sea.material.uniforms.tide.value = time; };
}
