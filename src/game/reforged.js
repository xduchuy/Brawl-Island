const rf={mode:'versus',arena:'skyreach',slot:0,stage:0,active:false,advance:false,finished:false,carry:0,quality:'high',hitboxes:false,sessionKills:0,adaptive:1,slowFrames:0};
const feedback=new CombatFeedback(),vfx=new VFXManager(scene,VFX_MANIFEST);
// The island remains intact; Sanctum adds a legible sealed perimeter and rune floor.
const sanctum=new THREE.Group();scene.add(sanctum);
for(const radius of [4.7,7.7,9.3]){const ring=new THREE.Mesh(new THREE.RingGeometry(radius-.025,radius+.025,96),new THREE.MeshBasicMaterial({color:'#786e9b',side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.076;sanctum.add(ring);}
const sanctumFloor=new THREE.Mesh(new THREE.CylinderGeometry(9.35,9.35,.045,64),new THREE.MeshStandardMaterial({color:'#333c59',roughness:.65,metalness:.15}));sanctumFloor.material.map=pixelTexture('stone');sanctumFloor.material.map.repeat.set(12,12);sanctumFloor.position.y=.045;sanctumFloor.receiveShadow=true;sanctum.add(sanctumFloor);
for(let i=0;i<24;i++){const a=i*TAU/24,g=new THREE.Mesh(new THREE.BoxGeometry(.11,.32,.65),new THREE.MeshStandardMaterial({color:'#b3a8df',emissive:'#65539a',emissiveIntensity:.45}));g.position.set(Math.sin(a)*9.5,.16,Math.cos(a)*9.5);g.rotation.y=a;sanctum.add(g);}
const ward=new THREE.Mesh(new THREE.CylinderGeometry(9.5,9.5,.55,64,1,true),new THREE.MeshBasicMaterial({color:'#b1a0e5',transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));ward.position.y=.28;sanctum.add(ward);
const rune=new THREE.Mesh(new THREE.PlaneGeometry(15,15),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,opacity:.6}));rune.rotation.x=-Math.PI/2;rune.position.y=.073;sanctum.add(rune);sanctum.visible=false;
vfx.ready.then(()=>{rune.material.map=vfx.textures['common/domain_field'].clone();rune.material.map.needsUpdate=true;rune.material.map.repeat.set(1/8,1);rune.material.needsUpdate=true;});
// Contact shadows keep feet grounded even in reduced shadow quality.
const contactShadows=Array.from({length:4},()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,31);g.addColorStop(0,'rgba(8,13,22,.38)');g.addColorStop(1,'rgba(8,13,22,0)');x.fillStyle=g;x.fillRect(0,0,64,64);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));mesh.rotation.x=-Math.PI/2;scene.add(mesh);return mesh;});
const debugBoxes=Array.from({length:4},()=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(64*3*3),3));const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:'#62e4bf',side:THREE.DoubleSide,transparent:true,opacity:.2,depthWrite:false}));mesh.frustumCulled=false;scene.add(mesh);return mesh;});
function updateHitboxes(){for(let i=0;i<4;i++){const f=match.fighters[i],mesh=debugBoxes[i];mesh.visible=rf.hitboxes&&f?.state==='attack';if(!mesh.visible)continue;const h=f.move.hitbox,active=f.frame>=f.move.start&&f.frame<=f.move.end;
 mesh.material.color.set(active?'#ff696b':'#62e4bf');const arr=mesh.geometry.attributes.position.array;let vertices=[];
 if(h.type==='line'){vertices=[-h.width,0,0,h.width,0,0,h.width,0,h.radius,-h.width,0,0,h.width,0,h.radius,-h.width,0,h.radius];}
 else{const angle=['radial','field'].includes(h.type)?Math.PI:h.angle;for(let n=0;n<32;n++){const a=-angle+n*angle*2/32,b=-angle+(n+1)*angle*2/32;vertices.push(0,0,0,Math.sin(a)*h.radius,0,Math.cos(a)*h.radius,Math.sin(b)*h.radius,0,Math.cos(b)*h.radius);}}
 arr.set(vertices);mesh.geometry.setDrawRange(0,vertices.length/3);mesh.geometry.attributes.position.needsUpdate=true;mesh.position.set(f.move.hitbox.type==='field'?f.field.x:f.x,.11,f.move.hitbox.type==='field'?f.field.z:f.z);mesh.rotation.y=f.angle;
}}
function reforgedConfiguration(config){
 config.gameMode=rf.mode;config.arena=rf.arena;config.training={dummy:$('dummyMode')?.value||'stand',unlimited:$('unlimited')?.checked||false};
 if(['arcade','survival','training','local'].includes(rf.mode))config.mode=1;
 if(rf.mode==='local'){config.slots[0].controller='p1';config.slots[1].controller='p2';}
 if(rf.mode==='training')config.slots[1].controller='ai';
 if(['arcade','survival'].includes(rf.mode)){
  const order=Object.keys(IB_STATS).filter(k=>k!==config.slots[0].kind);config.slots[1]={kind:order[rf.stage%order.length],controller:'ai'};config.rounds=1;
  config.difficulty=rf.stage<2?'normal':'hard';config.seed+=rf.stage*241;
 }
 return config;
}
function reforgedBeforeStart(){
 if(['arcade','survival'].includes(rf.mode)){
  if(rf.advance){rf.stage++;rf.advance=false;}else if(!rf.active||rf.finished){rf.stage=0;rf.carry=0;rf.finished=false;}
  rf.active=true;
 }
 vfx.pool.clear();document.body.classList.add('in-combat');document.body.classList.remove('panel-open');held.clear();queued.p1.length=queued.p2.length=0;touch.heavy=false;
}
function reforgedAfterStart(){
 if(rf.mode==='survival'&&rf.stage>0&&rf.carry)match.fighters[0].hp=Math.min(match.fighters[0].stats.hp,rf.carry+24);
 sanctum.visible=rf.arena==='sanctum';setTime(sanctum.visible?2:0);
 $('trainingTools').hidden=rf.mode!=='training';$('endTraining').hidden=rf.mode!=='training';
 $('statusText').textContent=rf.mode.toUpperCase()+(rf.mode==='arcade'?' · '+(rf.stage+1)+'/10':rf.mode==='survival'?' · WAVE '+(rf.stage+1)+'/5':'')+' · '+(sanctum.visible?'MOONLIT SANCTUM':'SKYREACH RING');
}
function reforgedEvent(e){
 vfx.event(e,match);feedback.event(e,match);
 if(e.type==='parry')announce('PARRY','Counter window · 40 frames',.65);
 if(e.type==='ultimate')announce(SKILLS[e.skill].label,'ULTIMATE',.9);
 if(e.type==='matchend'){
  rf.carry=match.fighters[0].hp;
  const limit=rf.mode==='arcade'?10:5;
  rf.advance=['arcade','survival'].includes(rf.mode)&&e.winner===0&&rf.stage+1<limit;
  rf.finished=!rf.advance;
  const title=e.training?'TRAINING COMPLETE':rf.advance?'ENCOUNTER CLEARED':e.winner===0?(['arcade','survival'].includes(rf.mode)?'RUN COMPLETE':'CRIMSON VICTORY'):e.winner===1?'AZURE VICTORY':'DRAW';
  $('stageStart').textContent=rf.advance?'NEXT ENCOUNTER →':e.training?'TRAIN AGAIN':'REMATCH ↵';
  announce(title,rf.advance?'Recover. Then take on the next challenger.':e.training?'Your practice statistics are below.':'A small island. Another story.',8);
  $('startButton').querySelector('b').textContent=rf.advance?'Next encounter':'Run it back';
  $('sessionStatus').textContent=title+' · '+Math.round(match.fighters[0].damageTotal)+' damage dealt';
 }
}
function updateReforgedHUD(){
 if(!match)return;
 for(let team=0;team<2;team++){
  const f=match.fighters.find(f=>f.team===team),el=$('meter'+team);if(!f)continue;
  el.querySelector('i').style.width=f.ultimate+'%';el.querySelector('span').textContent=f.ultimate>=100?'ULTIMATE READY':Math.floor(f.ultimate)+'%';
  const combo=$('combo'+team);combo.textContent=match.tick<f.comboUntil&&f.comboHits>1?f.comboHits+' HITS · '+f.comboDamage+' DMG':'';
  $('skills'+team).innerHTML=['special','skill2','ultimate'].map((key,i)=>{const s=FIGHTER_SKILLS[f.kind][key],cd=f.cooldowns[key]||0;return '<span class="skill-chip '+(cd||key==='ultimate'&&f.ultimate<100?'cooling':'ready')+'"><b>'+(['I','O','H'][i])+'</b> '+s.label+' <em>'+(cd?(cd/60).toFixed(1)+'s':key==='ultimate'?Math.floor(f.ultimate)+'%':'READY')+'</em></span>';}).join('');
 }
 const a=match.fighters[0],m=a.move;
 $('trainingReadout').textContent=(a.state==='attack'?a.frame<m.start?'STARTUP':a.frame<=m.end?'ACTIVE':'RECOVERY':a.state.toUpperCase())+' · frame '+a.frame+(m?' · '+m.start+'/'+(m.end-m.start+1)+'/'+(m.length-m.end)+'f':'')+' · combo '+a.comboHits+' / '+a.comboDamage+' dmg · total '+a.damageTotal;
 $('trainingTools').hidden=rf.mode!=='training';
 document.querySelectorAll('#touchControls [data-action]').forEach(b=>{const cd=a.cooldowns[b.dataset.action]||0;b.classList.toggle('cooling',cd>0||b.dataset.action==='ultimate'&&a.ultimate<100);});
}
function updateReforged(dt){
 ocean.material.uniforms.time.value=worldTime;feedback.update(dt);vfx.update(dt,match,camera);updateHitboxes();
 for(let i=0;i<4;i++){const f=match.fighters[i],s=contactShadows[i];s.visible=!!f&&!f.fall;if(f)s.position.set(f.x,rf.arena==='sanctum'?.09:.025,f.z);}
 ward.material.opacity=.12+feedback.shake*.5;
 if(rf.quality==='auto'){
  rf.slowFrames=fps<42?rf.slowFrames+dt:Math.max(0,rf.slowFrames-dt);
  if(rf.slowFrames>4&&pixelSize<3){pixelSize=3;renderer.shadowMap.enabled=false;vfx.density=.4;resize();rf.slowFrames=0;}
 }
 $('renderInfo').textContent='60 HZ COMBAT · '+Math.round(fps)+' FPS · '+(renderer.capabilities.isWebGL2?'WEBGL2':'WEBGL');

}
// Compact menu and roster drawer. Combat canvas stays primary.
const menu=document.createElement('nav');menu.className='reforge-nav';menu.setAttribute('aria-label','Main menu');menu.innerHTML='<button data-screen="play" class="active">Play</button><button data-screen="fighters">Fighters</button><button data-screen="training">Training</button><button data-screen="settings">Settings</button>';
document.querySelector('.top-links').prepend(menu);
document.querySelector('.edition').remove();document.querySelector('.subtitle').textContent='COMBAT REFORGED';
document.querySelector('.intro h1').innerHTML='SMALL ISLAND.<br><span>UNLIMITED RIVALRY.</span>';
document.querySelector('.intro p').textContent='Eleven fighters. Two arenas. Every opening matters.';
document.querySelector('.locale').innerHTML='<span>✦</span> COMBAT REFORGED <span>/</span> LOCAL · OFFLINE';
const toolbar=document.createElement('div');toolbar.className='reforge-toolbar';toolbar.innerHTML='<label>MODE <select id="gameMode"><option value="versus">Quick match</option><option value="local">Local versus</option><option value="arcade">Arcade · 10 encounters</option><option value="survival">Survival · 5 waves</option><option value="training">Training lab</option></select></label><label>ARENA <select id="arenaMode"><option value="skyreach">Skyreach · Open ring</option><option value="sanctum">Moonlit Sanctum · Sealed</option></select></label><button id="chooseFighters">Choose fighters ↗</button><button id="galleryButton">VFX gallery</button><span id="sessionStatus">Find your opening.</span>';
document.querySelector('.layout').before(toolbar);
for(let team=0;team<2;team++){
 const el=document.createElement('div');el.className='ultimate-meter';el.id='meter'+team;el.innerHTML='<i></i><span>0%</span>';$('hud'+team).append(el);
 const combo=document.createElement('div');combo.className='combo-count';combo.id='combo'+team;$('hud'+team).append(combo);
}
const skillHud=document.createElement('div');skillHud.className='skill-hud';skillHud.innerHTML='<div id="skills0"></div><div id="skills1"></div>';$('stage').append(skillHud);
const toolsPanel=document.createElement('section');toolsPanel.id='trainingTools';toolsPanel.hidden=true;toolsPanel.innerHTML='<label>DUMMY <select id="dummyMode"><option value="stand">Stand</option><option value="guard">Guard</option><option value="attack">Attack</option><option value="evade">Evade</option></select></label><label><input id="hitboxes" type="checkbox"> Hitboxes</label><label><input id="unlimited" type="checkbox"> Unlimited resources</label><button id="resetTraining">Reset practice</button><button id="endTraining">Finish session</button><output id="trainingReadout"></output>';
document.querySelector('.stage-shell').after(toolsPanel);
const roster=document.createElement('div');roster.className='fighter-browser';roster.innerHTML='<div class="section-label">CHOOSE YOUR FIGHTER <button id="closeRoster">Close ×</button></div><label class="slot-picker">EDIT SLOT <select id="editSlot"><option value="0">Crimson · Fighter 1</option><option value="1">Azure · Fighter 1</option><option value="2">Crimson · Fighter 2 (2v2)</option><option value="3">Azure · Fighter 2 (2v2)</option></select></label><div class="fighter-grid">'+Object.entries(IB_STATS).map(([key,s])=>'<button class="fighter-tile" data-fighter="'+key+'"><svg viewBox="0 0 64 70"><use href="#'+key+'"/></svg><span>'+s.name+'</span><small>'+FIGHTER_PROFILES[key][0]+'</small></button>').join('')+'</div><div id="fighterDetails"></div>';
$('tab-match').prepend(roster);
function showFighterDetails(){const key=document.querySelector('[data-slot="'+rf.slot+'"] .fighter-select').value,p=FIGHTER_PROFILES[key],s=FIGHTER_SKILLS[key];$('fighterDetails').innerHTML='<strong>'+IB_STATS[key].name+' / '+p[0]+'</strong><p>'+p[2]+'</p><small>I · '+s.special.label+' &nbsp; O · '+s.skill2.label+' &nbsp; H · '+s.ultimate.label+'</small>';document.querySelectorAll('.fighter-tile').forEach(b=>b.classList.toggle('selected',b.dataset.fighter===key));}
function openPanel(tab){document.body.classList.add('panel-open');showTab(tab);$('panel').scrollIntoView({behavior:'smooth',block:'nearest'});}
$('chooseFighters').onclick=()=>openPanel('match');$('closeRoster').onclick=()=>document.body.classList.remove('panel-open');
menu.querySelectorAll('button').forEach(b=>b.onclick=()=>{
 menu.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));
 if(b.dataset.screen==='play')document.body.classList.remove('panel-open');
 else if(b.dataset.screen==='training'){$('gameMode').value='training';$('gameMode').dispatchEvent(new Event('change'));startMatch();}
 else openPanel(b.dataset.screen==='settings'?'world':'match');
});
$('editSlot').onchange=e=>{rf.slot=Number(e.target.value);showFighterDetails();};
document.querySelectorAll('[data-fighter]').forEach(b=>b.onclick=()=>{const select=document.querySelector('[data-slot="'+rf.slot+'"] .fighter-select');select.value=b.dataset.fighter;select.dispatchEvent(new Event('change'));showFighterDetails();if(match.phase==='ready')setView('fight');});
$('gameMode').onchange=e=>{rf.mode=e.target.value;if(rf.mode!=='versus')setMode(1);rf.stage=0;rf.active=false;rf.finished=false;rf.advance=false;rf.carry=0;$('sessionStatus').textContent=rf.mode==='survival'?'Five waves. Health carries; recover 24 HP between wins.':rf.mode==='training'?'Practice freely. Finish the session when ready.':'Find your opening.';if(match.phase==='ready')previewMatch();};
$('arenaMode').onchange=e=>{rf.arena=e.target.value;if(match.phase==='ready'){sanctum.visible=rf.arena==='sanctum';setTime(sanctum.visible?2:0);previewMatch();}};
$('dummyMode').onchange=e=>{match.training.dummy=e.target.value;};$('unlimited').onchange=e=>match.training.unlimited=e.target.checked;$('hitboxes').onchange=e=>rf.hitboxes=e.target.checked;
$('resetTraining').onclick=()=>{match.resetFighters();match.phase='fight';buildActors();vfx.pool.clear();updateHUD();};
$('endTraining').onclick=()=>{match.phase='over';match.emit('matchend',{winner:-1,score:[0,0],training:true});events();updateHUD();};
const settings=document.createElement('div');settings.className='reforge-settings';settings.innerHTML='<h3>Combat & accessibility</h3><label>Quality <select id="qualityPreset"><option value="high">High</option><option value="low">Low</option><option value="auto">Adaptive</option></select></label><label>Camera shake <input id="shakeAmount" type="range" min="0" max="100" value="60"></label><label>Impact flashes <input id="flashAmount" type="range" min="0" max="100" value="35"></label><label>Particle density <input id="particleAmount" type="range" min="0" max="100" value="75"></label><h3>Audio mix</h3>'+['music','sfx','ui'].map((k,i)=>'<label>'+k.toUpperCase()+' <input data-volume="'+k+'" type="range" min="0" max="100" value="'+[18,65,35][i]+'"></label>').join('');$('tab-world').prepend(settings);
feedback.settings.shake=.6;feedback.settings.flashes=.35;vfx.density=.75;
$('qualityPreset').onchange=e=>{rf.quality=e.target.value;const low=rf.quality==='low';pixelSize=low?3:1.5;renderer.shadowMap.enabled=!low;vfx.density=low?.35:.75;$('particleAmount').value=vfx.density*100;resize();};
$('shakeAmount').oninput=e=>feedback.settings.shake=Number(e.target.value)/100;$('flashAmount').oninput=e=>feedback.settings.flashes=Number(e.target.value)/100;$('particleAmount').oninput=e=>vfx.density=Number(e.target.value)/100;
document.querySelectorAll('[data-volume]').forEach(e=>e.oninput=()=>feedback.volumes[e.dataset.volume]=Number(e.value)/100);
// Gallery uses the very same shipped atlas manifest and animator as live combat.
const gallery=document.createElement('dialog');gallery.id='vfxGallery';gallery.innerHTML='<header><div><small>DEVELOPER TOOLS / 49 FLIPBOOKS</small><h2>VFX ATLAS</h2></div><button id="closeGallery">Close ×</button></header><div class="gallery-layout"><div id="galleryAssets"></div><section><canvas id="galleryCanvas" width="384" height="384"></canvas><h3 id="galleryName"></h3><label>Intensity <input id="galleryIntensity" type="range" min="25" max="100" value="100"></label><button id="replayEffect">Replay animation</button><button id="previewEffect">Preview in arena</button><p id="galleryMeta"></p></section></div>';document.body.append(gallery);
let galleryKey='yuji/special',galleryAge=0,galleryImage=new Image(),galleryWasPaused=false;
$('galleryAssets').innerHTML=Object.entries(VFX_MANIFEST.assets).map(([key,a])=>'<button data-asset="'+key+'">'+key.replaceAll('/',' / ').replaceAll('_',' ')+'</button>').join('');
function chooseAsset(key){galleryKey=key;galleryAge=0;galleryImage.src=VFX_MANIFEST.assets[key].url;$('galleryName').textContent=key;$('galleryMeta').textContent='8 frames · 96 × 96 px · RGBA · '+VFX_MANIFEST.assets[key].blend+' blend';document.querySelectorAll('[data-asset]').forEach(b=>b.classList.toggle('selected',b.dataset.asset===key));}
function drawGallery(dt){galleryAge+=dt;const c=$('galleryCanvas'),x=c.getContext('2d'),asset=VFX_MANIFEST.assets[galleryKey];x.clearRect(0,0,c.width,c.height);x.imageSmoothingEnabled=false;const f=SpriteSheetAnimator.frame(asset,galleryAge%1.6,1.6);x.globalAlpha=Math.min(1,Number($('galleryIntensity').value)/100);if(galleryImage.complete&&galleryImage.naturalWidth)x.drawImage(galleryImage,f*96,0,96,96,0,0,384,384);x.globalAlpha=1;}
$('galleryAssets').onclick=e=>{if(e.target.dataset.asset)chooseAsset(e.target.dataset.asset);};
$('galleryButton').onclick=()=>{galleryWasPaused=paused;if(match.phase==='fight'&&!paused)pause();gallery.showModal();chooseAsset(galleryKey);};
$('closeGallery').onclick=()=>gallery.close();gallery.addEventListener('close',()=>{if(!galleryWasPaused&&paused)pause();});
$('replayEffect').onclick=()=>galleryAge=0;
$('previewEffect').onclick=()=>{gallery.close();const f=match.fighters[0];vfx.intensity=Number($('galleryIntensity').value)/100;vfx.spawn(galleryKey,f.x,1,f.z,{scale:4,duration:1.4});};
// Touch and pad get the same actions as keyboard; no decorative skill buttons.
for(const [action,label]of [['skill2','SKILL 2'],['ultimate','ULT'],['dash','DASH']]){const b=document.createElement('button');b.dataset.action=action;b.textContent=label;document.querySelector('.touch-actions').append(b);b.onpointerdown=e=>{e.preventDefault();queued.p1.push(action);initAudio();};}
const heavyTouch=document.querySelector('[data-action="heavy"]');heavyTouch.addEventListener('pointerdown',()=>touch.heavy=true);for(const ev of ['pointerup','pointercancel','lostpointercapture'])heavyTouch.addEventListener(ev,()=>touch.heavy=false);
document.querySelector('.key-cluster').innerHTML='<span><kbd>WASD</kbd> Move</span><span><kbd>J</kbd> Combo</span><span><kbd>K</kbd> Hold heavy</span><span><kbd>I / O</kbd> Skills</span><span><kbd>H</kbd> Ultimate</span><span><kbd>L</kbd> Guard / parry</span><span><kbd>SPACE</kbd> Dodge</span><span><kbd>SHIFT</kbd> Dash</span>';
$('helpButton').onclick=()=>openPanel('guide');
const help=document.createElement('div');help.innerHTML='<h3>Combat Reforged controls</h3><p>Tap guard just before impact for a 5-frame parry and 40-frame counter window. Hold K to charge heavy. Confirm a light hit, then cancel its recovery into I / O or dodge (30 stamina). Dodge grants invulnerability; dash does not. Ultimates require 100 energy and 25 stamina. Combo damage scales to 40%, and long chains force knockdown.</p><p>P1: O skill 2, H ultimate, left Shift dash. P2: quote skill 2, right bracket ultimate, right Control dash; hold period or numpad 2 to charge. Gamepad: right trigger skill 2, left trigger ultimate, left stick click dash. Hold Y to charge. Touch heavy supports holding.</p>';$('tab-guide').prepend(help);
// Defaults showcase the validated vertical slice without hiding any roster entries.
document.querySelector('[data-slot="0"] .fighter-select').value='yuji';document.querySelector('[data-slot="1"] .fighter-select').value='gojo';showFighterDetails();
pixelSize=matchMedia('(pointer:coarse)').matches?2.5:1.5;setView('fight');viewTilt=.48;postMaterial.uniforms.dither.value=.25;

const ocean=new THREE.Mesh(new THREE.PlaneGeometry(420,420,1,1),new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec2 p;void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 p;uniform float time;void main(){vec2 q=p*90.;float w=sin(q.x*.7+sin(q.y*.9)+time*.7)*sin(q.y*.6-time*.4);float foam=smoothstep(.86,.96,w);vec3 c=mix(vec3(.12,.27,.31),vec3(.22,.40,.42),w*.5+.5);c+=foam*.09;gl_FragColor=vec4(c,1.);}'}));ocean.rotation.x=-Math.PI/2;ocean.position.y=-18;scene.add(ocean);

document.querySelectorAll('.reforge-nav button,#chooseFighters,#galleryButton').forEach(b=>b.addEventListener('click',()=>{initAudio();feedback.tone('menu');}));
