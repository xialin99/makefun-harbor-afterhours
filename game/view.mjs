import {routesTo} from './route.mjs';
import {createCityView} from './city3d.mjs';
import {districtAt} from './streets.mjs';
import {SIZE,ROAD,places,missions,createWorld,step,interact,shoot,saveWorld,loadWorld,notify,courtyardBlock,garageCar} from './world.mjs';
const { t } = window;
const c=document.querySelector('#world'),x=c.getContext('2d'),map=document.querySelector('#map'),mx=map.getContext('2d'),menu=document.querySelector('#menu');let w=createWorld(),playing=false,paused=false,W=0,H=0,last=0,keys={},pointer={x:0,y:0},firing=false,audio;
const colors=['#dca96a','#69a7a7','#d56c69','#b9b4cd','#6f7e98'];const escape=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function resize(){W=innerWidth;H=innerHeight;c.width=W*devicePixelRatio;c.height=H*devicePixelRatio;x.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}resize();addEventListener('resize',resize);
let saveError=false;
function showSaveError(){saveError=true;document.querySelector('.fine').textContent=t('No valid saved story found. Start a new night.');}
addEventListener('ui-language-change',()=>{if(saveError)showSaveError();});
function start(load){try{w=load?loadWorld(localStorage.getItem('harbor-afterhours')):createWorld();playing=true;paused=false;menu.style.display='none';audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume()}catch{showSaveError()}}
document.querySelector('#new').onclick=()=>start(false);document.querySelector('#load').onclick=()=>start(true);
function tone(){if(!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(130,audio.currentTime);o.frequency.exponentialRampToValueAtTime(35,audio.currentTime+.08);g.gain.setValueAtTime(.06,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.08);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.09)}
addEventListener('keydown',e=>{if(e.target instanceof HTMLSelectElement)return;keys[e.code]=true;if(['Space','F5'].includes(e.code))e.preventDefault();if(!playing)return;if(e.code==='KeyE'&&!e.repeat)interact(w);if(e.code==='KeyP'&&!e.repeat)paused=!paused;if(e.code==='F5'){try{localStorage.setItem('harbor-afterhours',saveWorld(w));notify(w,'Story saved locally.')}catch{notify(w,'Cannot save a failed story. Start a new night.')}}});addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>{keys={};firing=false;paused=true});addEventListener('pointermove',e=>pointer={x:e.clientX,y:e.clientY});c.addEventListener('pointerdown',e=>{if(playing&&!paused&&e.button===0)firing=true});addEventListener('pointerup',()=>firing=false);addEventListener('pointercancel',()=>firing=false);
function car(a,police=false){x.save();x.translate(a.x,a.y);x.rotate(a.a);x.fillStyle='#0007';x.fillRect(-17,-9,39,22);x.fillStyle=police?'#c5dae0':colors[a.color];x.fillRect(-20,-11,40,22);x.fillStyle='#183643';x.fillRect(-9,-9,18,18);x.fillStyle='#8acbd1';x.fillRect(5,-9,5,18);x.fillStyle='#fff0ae';x.fillRect(17,-10,3,5);x.fillRect(17,5,3,5);if(police){x.fillStyle=Math.sin(w.time*15)>0?'#ef6161':'#5494ed';x.fillRect(-2,-10,4,20)}x.restore()}
function person(p,color){x.fillStyle='#0006';x.beginPath();x.ellipse(p.x+3,p.y+5,6,4,0,0,7);x.fill();x.fillStyle=color;x.beginPath();x.arc(p.x,p.y,6,0,7);x.fill();x.fillStyle='#e6b690';x.beginPath();x.arc(p.x,p.y-2,3,0,7);x.fill()}
const routeFinders=places.map(routesTo); let routeKey="", route=[];
const missionPanel = document.querySelector('#mission');
const districtPanel = document.createElement('div');
districtPanel.className = 'district';
document.querySelector('.logo').after(districtPanel);
function briefing(task, player) {
  if (task.car && player.car === null) {
    const nearby = w.cars.find(car => car.hp > 0 && Math.hypot(player.x-car.x, player.y-car.y)<65);
    return nearby ? t('Press E to get in. Hold W to drive.') : t('Find a parked car and press E to get in.');
  }
  if (task.clean && w.wanted > 0) {
    return t('Get beyond the patrols on your map. Wait for the wanted stars to clear.');
  }
  return task.text;
}
function translateNotice(text) {
  const completed = /^Mission complete (\+\$\d+) · (.+)$/.exec(text);
  return completed ? t('Mission complete') + ' ' + completed[1] + ' · ' + t(completed[2]) : t(text);
}
function render(){const p=w.player,zoom=p.car===null?1.35:1; x.clearRect(0,0,W,H);if(!drawCity){x.fillStyle='#0c2636';x.fillRect(0,0,W,H);x.save();x.translate(W/2,H/2);x.scale(zoom,zoom);x.translate(-p.x,-p.y);
x.fillStyle='#23363c';x.fillRect(0,0,SIZE,SIZE);for(let i=0;i<SIZE;i+=ROAD){x.fillStyle='#39474a';x.fillRect(i,0,90,SIZE);x.fillRect(0,i,SIZE,90);x.strokeStyle='#b4a77750';x.lineWidth=2;x.setLineDash([14,20]);x.beginPath();x.moveTo(i+45,0);x.lineTo(i+45,SIZE);x.moveTo(0,i+45);x.lineTo(SIZE,i+45);x.stroke();x.setLineDash([]);for(let j=0;j<SIZE;j+=ROAD){if(courtyardBlock(i,j))continue;x.fillStyle='#526062';x.fillRect(i+95,j+95,135,135);x.fillStyle='#172b37';x.fillRect(i+108,j+111,119,120);x.fillStyle=(i+j)%480?'#344c59':'#415566';x.fillRect(i+100,j+100,116,115);x.fillStyle='#9bafae55';for(let k=0;k<5;k++){x.fillRect(i+109+k*20,j+110,6,5);x.fillRect(i+109+k*20,j+193,6,5)}x.strokeStyle='#ffffff0d';x.strokeRect(i+108,j+121,100,60)}}
places.forEach((a,i)=>{x.fillStyle='#314e50';x.fillRect(a.x-75,a.y-75,150,150);x.strokeStyle='#729b91';x.strokeRect(a.x-65,a.y-65,130,130);x.fillStyle='#a4c0b4';x.font='10px system-ui';x.textAlign='center';x.fillText(t(a.name.toUpperCase()),a.x,a.y+62);if(missions[w.mission]?.target===i){x.strokeStyle='#f2c67c';x.lineWidth=3;x.beginPath();x.arc(a.x,a.y,28+Math.sin(w.time*3)*4,0,7);x.stroke();x.fillStyle='#f2c67c';x.font='bold 22px system-ui';x.fillText('◆',a.x,a.y+8)}});
for(const a of w.peds)if(a.hp)person(a,'#bd8e6b');for(const a of w.cars)if(a.hp>0)car(a);for(const a of w.police)car(a,true);if(p.car===null){person(p,'#82c8b0');x.strokeStyle='#bdeed8';x.beginPath();x.arc(p.x,p.y,11,0,7);x.stroke()}
for(const b of w.bullets){x.strokeStyle='#ffdf97';x.lineWidth=2;x.beginPath();x.moveTo(b.x,b.y);x.lineTo(b.x-b.vx*.02,b.y-b.vy*.02);x.stroke()}x.restore();}
const task=missions[w.mission];
districtPanel.textContent = t(districtAt(p.x, p.y).name);
if (task) {
  const target = places[task.target];
  const d = Math.hypot(target.x-p.x, target.y-p.y);
  const waitingForCar = task.car && p.car === null;
  missionPanel.innerHTML = `<small>${t('STORY')} ${w.mission+1} / ${missions.length}</small><b>${escape(t(task.title))}</b>${escape(t(briefing(task,p)))}
    <footer>${waitingForCar ? t('GET A VEHICLE') : `${Math.round(d)}${t(' m')} · ${escape(t(target.name))}`}</footer>`;
} else {
  route = [];
  missionPanel.innerHTML = `<b>${t('Story complete · Free roam')}</b>${t('The harbor has a voice again.')}`;
}
const stars = Math.ceil(w.wanted);
document.querySelector('#status').innerHTML = `${t('HEALTH')} ${Math.round(p.hp)}% &nbsp; $${p.cash.toLocaleString()}<br>
  <span class="wanted" aria-label="${t('Wanted level')} ${stars}">${'★'.repeat(stars)}</span><span class="peace">${'☆'.repeat(5-stars)}</span>
  &nbsp; ${p.car===null ? t('ON FOOT') : Math.round(Math.abs(w.cars.find(c=>c.id===p.car)?.v??0))+t(' km/h')}`;
document.querySelector('#notice').textContent=w.noticeTime>0?translateNotice(w.notice):'';
mx.fillStyle='#172c35';mx.fillRect(0,0,180,180);mx.strokeStyle='#526963';mx.lineWidth=5;for(let i=0;i<SIZE;i+=ROAD){const q=(i+45)/SIZE*180;mx.beginPath();mx.moveTo(q,0);mx.lineTo(q,180);mx.moveTo(0,q);mx.lineTo(180,q);mx.stroke()}if(task){const key=[task.target,Math.round(p.x/20),Math.round(p.y/20)].join(":");if(key!==routeKey){routeKey=key;route=routeFinders[task.target](p)}if(route.length){mx.beginPath();mx.moveTo(p.x/SIZE*180,p.y/SIZE*180);for(const point of route)mx.lineTo(point.x/SIZE*180,point.y/SIZE*180);mx.strokeStyle="#f5c77e";mx.lineWidth=2;mx.stroke()}}for(const a of places){mx.fillStyle=task&&a===places[task.target]?'#f5c77e':'#7ba9a1';mx.fillRect(a.x/SIZE*180-3,a.y/SIZE*180-3,6,6)}for(const a of w.police){mx.fillStyle='#f5746d';mx.fillRect(a.x/SIZE*180-2,a.y/SIZE*180-2,4,4)}mx.fillStyle='#e2fff2';mx.beginPath();mx.arc(p.x/SIZE*180,p.y/SIZE*180,3,0,7);mx.fill();
if(paused&&playing){x.fillStyle='#061b2caa';x.fillRect(0,0,W,H);x.fillStyle='#e8dfc8';x.font='bold 40px system-ui';x.textAlign='center';x.fillText(t('NIGHT ON HOLD'),W/2,H/2);x.font='14px system-ui';x.fillText(t('P to resume · F5 to save'),W/2,H/2+35)}if(p.hp<=0){x.fillStyle='#0a172bd9';x.fillRect(0,0,W,H);x.fillStyle='#e5bc86';x.font='bold 50px system-ui';x.textAlign='center';x.fillText(t('BUSTED'),W/2,H/2);x.font='14px system-ui';x.fillText(t('Refresh and continue your last saved story.'),W/2,H/2+35)}}
let drawCity;try{drawCity=createCityView()}catch(error){console.warn("3D unavailable",error)}
function frame(now) {
  const dt = last ? Math.min(.15, (now-last)/1000) : 0;
  last = now;
  const input = {
    up: keys.KeyW || keys.ArrowUp, down: keys.KeyS || keys.ArrowDown,
    left: keys.KeyA || keys.ArrowLeft, right: keys.KeyD || keys.ArrowRight,
    run: keys.ShiftLeft, brake: keys.Space,
  };
  if (playing && !paused) {
    const substeps = Math.max(1, Math.ceil(dt/.04));
    for (let i=0; i<substeps; i++) step(w, input, dt/substeps);
    if (firing && w.player.hp > 0 && w.cooldown === 0) {
      const angle = drawCity?.aim(pointer, w.player) ?? Math.atan2(pointer.y-H/2,pointer.x-W/2);
      shoot(w, angle);
      tone();
    }
  }
  render();
  const starter = w.cars.find(car => car.id === garageCar.id);
  const nearbyStarter = w.mission === 0 && w.player.car === null && starter?.hp > 0 &&
    Math.hypot(starter.x-w.player.x, starter.y-w.player.y) < 100;
  drawCity?.(w, W, H, dt, playing, nearbyStarter ? [] : route,
    !paused && (input.up || input.down || input.left || input.right), nearbyStarter ? starter : null);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
