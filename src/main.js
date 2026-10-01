import * as THREE from 'three';
const $=s=>document.querySelector(s);
const canvas=$('#game-canvas'),start=$('#start-screen'),hud=$('#hud'),complete=$('#complete');
const nameInput=$('#player-name'),startBtn=$('#start-btn'),restartBtn=$('#restart-btn');
const chapterLabel=$('#chapter-label'),playerLabel=$('#player-label'),objective=$('#objective'),fragmentCount=$('#fragment-count'),modeLabel=$('#mode-label'),message=$('#message'),joystick=$('#joystick'),stick=$('#stick');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x050a14);scene.fog=new THREE.FogExp2(0x07101d,.025);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,300);
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight,false);renderer.shadowMap.enabled=true;
scene.add(new THREE.HemisphereLight(0xb9d4ff,0x151923,1.35));const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(-18,28,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const state={started:false,mode:'NORMAL',xp:0,fragment:false,history:[],historyTimer:0};const input={x:0,y:0,jump:false};const cam={yaw:.65,pitch:.42,distance:8.2,drag:false,x:0,y:0};
const player={pos:new THREE.Vector3(0,0,9),velY:0,grounded:true,speed:4.3,group:new THREE.Group(),walk:0};const hazards=[],switches=[];
const mat=(c,r=.8,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
function mesh(g,m,p,parent=scene){const o=new THREE.Mesh(g,m);o.position.copy(p);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function buildRoom(){
 mesh(new THREE.BoxGeometry(46,.5,46),mat(0x202c3b,1),new THREE.Vector3(0,-.28,0));const grid=new THREE.GridHelper(46,23,0x3f5269,0x2c3b4d);grid.material.opacity=.25;grid.material.transparent=true;scene.add(grid);
 const wall=mat(0x172331,.9);[[0,3,-22,46,6,.7],[0,3,22,46,6,.7],[-22,3,0,.7,6,46],[22,3,0,.7,6,46]].forEach(([x,y,z,w,h,d])=>mesh(new THREE.BoxGeometry(w,h,d),wall,new THREE.Vector3(x,y,z)));
 for(let i=0;i<7;i++)mesh(new THREE.BoxGeometry(3,4,3),mat(0x26374a,.82),new THREE.Vector3(-15+i*5,2,-8));
 const gate=mesh(new THREE.BoxGeometry(5,.3,.5),mat(0x8298b0,.35,.3),new THREE.Vector3(0,4,-15));gate.userData.gate=true;switches.push(gate);
 for(let i=0;i<3;i++){const p=mesh(new THREE.CylinderGeometry(.85,.85,.16,24),mat(0x4f667d,.65),new THREE.Vector3(-7+i*7,.08,3));p.userData.switch=i;switches.push(p)}
 const shard=mesh(new THREE.OctahedronGeometry(.75),mat(0xdbe8ff,.18,.8),new THREE.Vector3(0,2,-5));shard.userData.fragment=true;switches.push(shard);
 for(let i=0;i<4;i++){const h=mesh(new THREE.BoxGeometry(1.3,.55,1.3),mat(0x8d4550,.55),new THREE.Vector3(-10+i*6,.28,-2));h.userData.phase=i*1.7;hazards.push(h)}
 const exit=mesh(new THREE.TorusGeometry(2.1,.18,10,40),mat(0x91aac4,.35,.5),new THREE.Vector3(0,2,15));exit.rotation.x=Math.PI/2;exit.userData.exit=true;switches.push(exit);
}
function buildPlayer(){
 const body=new THREE.Group();mesh(new THREE.CapsuleGeometry(.42,.9,6,12),mat(0xe8edf5,.68),new THREE.Vector3(0,1.35,0),body);mesh(new THREE.SphereGeometry(.34,18,12),mat(0xdce5ef,.7),new THREE.Vector3(0,2.25,0),body);mesh(new THREE.BoxGeometry(.42,.13,.09),mat(0x07111d,.3,.2),new THREE.Vector3(0,2.25,-.31),body);
 const a=mat(0xaab8c9),l=mat(0x68788d),la=mesh(new THREE.BoxGeometry(.2,.8,.2),a,new THREE.Vector3(-.58,1.4,0),body),ra=mesh(new THREE.BoxGeometry(.2,.8,.2),a,new THREE.Vector3(.58,1.4,0),body),ll=mesh(new THREE.BoxGeometry(.25,.85,.25),l,new THREE.Vector3(-.2,.5,0),body),rl=mesh(new THREE.BoxGeometry(.25,.85,.25),l,new THREE.Vector3(.2,.5,0),body);
 player.group.add(body);player.group.userData.parts={la,ra,ll,rl};scene.add(player.group);
}
function setMode(mode){state.mode=mode;modeLabel.textContent='TIME: '+mode;document.querySelectorAll('.right-controls button').forEach(b=>b.classList.remove('active'));if(mode!=='NORMAL')$('#'+mode.toLowerCase()).classList.add('active');showMessage(mode==='NORMAL'?'Time flowing normally':mode==='REWIND'?'Rewinding recent movement':mode==='FREEZE'?'Time locked around hazards':'Time accelerated')}
function showMessage(t){message.textContent=t;clearTimeout(showMessage.timer);showMessage.timer=setTimeout(()=>message.textContent='',1600)}
function joystickMove(x,y){const r=joystick.getBoundingClientRect(),dx=x-(r.left+r.width/2),dy=y-(r.top+r.height/2),max=r.width*.34,len=Math.hypot(dx,dy)||1,s=Math.min(1,max/len),nx=dx*s,ny=dy*s;stick.style.transform=`translate(calc(-50% + ${nx}px),calc(-50% + ${ny}px))`;input.x=nx/max;input.y=ny/max}
joystick.addEventListener('pointerdown',e=>{joystick.setPointerCapture(e.pointerId);joystickMove(e.clientX,e.clientY)});joystick.addEventListener('pointermove',e=>{if(joystick.hasPointerCapture(e.pointerId))joystickMove(e.clientX,e.clientY)});['pointerup','pointercancel'].forEach(ev=>joystick.addEventListener(ev,()=>{input.x=0;input.y=0;stick.style.transform='translate(-50%,-50%)'}));
$('#jump').addEventListener('pointerdown',()=>input.jump=true);$('#rewind').addEventListener('pointerdown',()=>setMode(state.mode==='REWIND'?'NORMAL':'REWIND'));$('#freeze').addEventListener('pointerdown',()=>setMode(state.mode==='FREEZE'?'NORMAL':'FREEZE'));$('#forward').addEventListener('pointerdown',()=>setMode(state.mode==='FORWARD'?'NORMAL':'FORWARD'));
$('#interact').addEventListener('pointerdown',()=>{const d=player.pos.distanceTo(new THREE.Vector3(0,0,-5));if(d<3&&!state.fragment){state.fragment=true;state.xp+=25;fragmentCount.textContent='1 / 1';objective.textContent='Reach the Time Gate';showMessage('+25 XP • Time Fragment recovered')}if(state.fragment&&player.pos.z<-12){complete.classList.remove('hidden');hud.classList.add('hidden')}});
canvas.addEventListener('pointerdown',e=>{if(!hud.classList.contains('hidden')&&e.clientX>innerWidth*.25){cam.drag=true;cam.x=e.clientX;cam.y=e.clientY;canvas.setPointerCapture(e.pointerId)}});canvas.addEventListener('pointermove',e=>{if(!cam.drag)return;cam.yaw-=(e.clientX-cam.x)*.008;cam.pitch=THREE.MathUtils.clamp(cam.pitch+(e.clientY-cam.y)*.005,.12,1.05);cam.x=e.clientX;cam.y=e.clientY});canvas.addEventListener('pointerup',()=>cam.drag=false);canvas.addEventListener('pointercancel',()=>cam.drag=false);
function updatePlayer(dt){
 if(state.mode==='REWIND'&&state.history.length>2){player.pos.copy(state.history.pop());player.group.position.copy(player.pos);return}
 const f=new THREE.Vector3(Math.sin(cam.yaw),0,Math.cos(cam.yaw)),r=new THREE.Vector3(Math.cos(cam.yaw),0,-Math.sin(cam.yaw)),move=new THREE.Vector3().addScaledVector(f,-input.y).addScaledVector(r,input.x),mag=Math.min(1,move.length());if(mag>.01)move.normalize();
 const speed=player.speed*mag*(state.mode==='FORWARD'?1.45:1);player.pos.x=THREE.MathUtils.clamp(player.pos.x+move.x*speed*dt,-19,19);player.pos.z=THREE.MathUtils.clamp(player.pos.z+move.z*speed*dt,-19,19);
 if(input.jump&&player.grounded){player.velY=6.8;player.grounded=false}input.jump=false;player.velY-=18*dt;player.pos.y+=player.velY*dt;if(player.pos.y<=0){player.pos.y=0;player.velY=0;player.grounded=true}player.group.position.copy(player.pos);
 if(mag>.01){const yaw=Math.atan2(move.x,move.z);player.group.rotation.y=THREE.MathUtils.lerpAngle(player.group.rotation.y,yaw,Math.min(1,dt*10));player.walk+=dt*9*mag}
 const s=Math.sin(player.walk)*.5,p=player.group.userData.parts;p.la.rotation.x=s;p.ra.rotation.x=-s;p.ll.rotation.x=-s;p.rl.rotation.x=s;state.historyTimer+=dt;if(state.historyTimer>.09){state.history.push(player.pos.clone());if(state.history.length>90)state.history.shift();state.historyTimer=0}
}
function updateWorld(t){hazards.forEach(h=>{if(state.mode!=='FREEZE'){const rate=state.mode==='FORWARD'?2.1:1;h.position.y=.28+Math.abs(Math.sin(t*rate+h.userData.phase))*.75}});const shard=switches.find(x=>x.userData.fragment);if(shard&&!state.fragment){shard.rotation.y+=.025;shard.position.y=2+Math.sin(t*2)*.25}else if(shard)shard.visible=false}
function updateCamera(dt){const target=player.pos.clone().add(new THREE.Vector3(0,1.25,0)),off=new THREE.Vector3(Math.sin(cam.yaw)*Math.cos(cam.pitch)*cam.distance,Math.sin(cam.pitch)*cam.distance,Math.cos(cam.yaw)*Math.cos(cam.pitch)*cam.distance);camera.position.lerp(target.clone().add(off),Math.min(1,dt*7));camera.lookAt(target)}
function startGame(){playerLabel.textContent=(nameInput.value||'Explorer').trim().slice(0,18)||'Explorer';chapterLabel.textContent='CHAPTER 1 • THE FIRST FRACTURE';start.classList.add('hidden');hud.classList.remove('hidden');player.pos.set(0,0,9);player.group.position.copy(player.pos);state.started=true;state.fragment=false;state.history=[];fragmentCount.textContent='0 / 1';objective.textContent='Collect the Time Fragment';setMode('NORMAL');showMessage('Find the fragment, then reach the Time Gate')}
startBtn.addEventListener('click',startGame);restartBtn.addEventListener('click',()=>{complete.classList.add('hidden');hud.classList.remove('hidden');startGame()});
buildRoom();buildPlayer();let last=performance.now();function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(state.started)updatePlayer(dt);updateWorld(now*.001);updateCamera(dt);renderer.render(scene,camera)}loop(last);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)});
