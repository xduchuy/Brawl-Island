touchInput.aim=skillAim;
function updateSkillHUD(){
 const f=match?.fighters.find(f=>f.controller==='p1')||match?.fighters[0];if(!f)return;
 for(const b of touchButtons){const action=b.dataset.action,s=FIGHTER_SKILLS[f.kind][action],skill=Array.isArray(s)?s[0]:s,remaining=f.cooldowns[action]||0,resource=skill&&f.stamina<skill.cost,energy=action==='ultimate'&&f.ultimate<100,disabled=f.dead||match.phase!=='fight';
  if(b.dataset.iconFighter!==f.kind){iconAtlas.paint(b.querySelector('b'),f.kind,action);b.dataset.iconFighter=f.kind;const label=skill?.label||({block:'Guard',dodge:'Dodge',dash:'Dash'}[action]);b.setAttribute('aria-label',label);b.title=label;}
  b.classList.toggle('resource-warning',!!resource);b.classList.toggle('disabled',disabled);b.classList.toggle('cooling',remaining>0);b.classList.toggle('energy-locked',energy);b.classList.toggle('ult-ready',action==='ultimate'&&!remaining&&!resource&&!energy&&!disabled);
  b.setAttribute('aria-disabled',String(!!(remaining||resource||energy||disabled)));b.style.setProperty('--cooldown',remaining/Math.max(1,skill?.cooldown||1)*100+'%');b.style.setProperty('--energy',f.ultimate+'%');
  b.querySelector('em').textContent=remaining?(remaining/60).toFixed(1):resource?'LOW':energy?Math.floor(f.ultimate)+'%':'';
 }
 if(skillAim.pending){if(paused||f.dead||match.phase!=='fight')touchInput.reset();else skillAim.preview();}
}
// An isolated deterministic match drives the same rig and VFX, without changing the live fight.
const skillPreview=document.createElement('dialog');skillPreview.id='skillPreview';skillPreview.innerHTML='<header><div><small>ISLE BRAWL / ABILITY CODEX</small><h2 id="previewFighterName"></h2></div><button id="closeSkillPreview">Done</button></header><div class="skill-preview-layout"><div><canvas id="abilityCanvas" aria-label="Live 3D ability preview"></canvas><p id="previewCaption">Select an ability to replay.</p></div><div id="abilityCards"></div></div>';$('stage').append(skillPreview);
let previewRuntime=null,previewPaused=false;
function openSkillPreview(kind){
 clearGameplayInput();previewPaused=paused;if(mobile.active){mobile.blocks.add('preview');mobile.syncPause();}else{paused=true;match.paused=true;}
 if(mobileSettings.open)mobileSettings.close();
 if(!skillPreview.open)skillPreview.showModal();
 if(previewRuntime)closePreviewRuntime();
 const stage=new THREE.Scene();stage.background=new THREE.Color('#13242c');stage.add(new THREE.HemisphereLight('#e7ecff','#344a32',1.1));const sun=new THREE.DirectionalLight('#fff2d4',.8);sun.position.set(4,7,3);stage.add(sun);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(12,64),new THREE.MeshStandardMaterial({color:'#294248',roughness:.8}));floor.rotation.x=-Math.PI/2;stage.add(floor);
 const sim=new BrawlMatch({gameMode:'training',slots:[{kind,controller:'p1'},{kind:'skeleton',controller:'p2'}]});sim.phase='fight';const f=sim.fighters[0];Object.assign(f,{x:0,z:0,angle:0,ultimate:100});Object.assign(sim.fighters[1],{x:0,z:2.5});
 const actor=createFighter(kind,0);stage.add(actor.g,actor.trail,...actor.renderBatches.map(b=>b.mesh));
 const effects=Object.assign(Object.create(VFXManager.prototype),{manifest:VFX_MANIFEST,textures:vfx.textures,pool:new EffectPooling(stage,32),density:.4,intensity:.85,decorativeLimit:8});
 const camera=new THREE.PerspectiveCamera(44,2,.1,100);camera.position.set(3.5,2.8,5);camera.lookAt(0,.9,.8);
 const renderer=new THREE.WebGLRenderer({canvas:$('abilityCanvas'),antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputEncoding=THREE.sRGBEncoding;
 previewRuntime={stage,sim,actor,effects,camera,renderer,floor,action:'special',time:0,accumulator:0};
 $('previewFighterName').textContent=IB_STATS[kind].name;
 $('abilityCards').innerHTML=['special','skill2','ultimate'].map(action=>{const s=FIGHTER_SKILLS[kind][action],h=s.hitbox,description=h.type==='radial'?'Self-centered area':h.type==='field'?'Forward shadow field':h.type==='projectile'?'Travelling projectile':h.type==='line'?'Straight directional strike':'Forward sweeping strike';return '<button data-preview-action="'+action+'"><i></i><div><strong>'+s.label+'</strong><p>'+description+' · '+s.damage+' damage</p><small>'+s.cooldown/60+'s cooldown · '+s.cost+' stamina'+(s.ultimateCost?' · '+s.ultimateCost+' energy':'')+'</small></div></button>';}).join('');
 for(const b of $('abilityCards').children){iconAtlas.paint(b.querySelector('i'),kind,b.dataset.previewAction);b.onclick=()=>replaySkill(b.dataset.previewAction);}
 replaySkill('special');
}
function replaySkill(action){const p=previewRuntime;if(!p)return;p.action=action;const skill=FIGHTER_SKILLS[p.sim.fighters[0].kind][action],wide=skill.hitbox.type==='line'&&skill.hitbox.radius>5;p.camera.position.set(wide?6:3.5,wide?5:2.8,wide?10:5);p.camera.lookAt(0,.9,wide?3:.8);p.time=0;p.accumulator=0;p.sim.resetFighters();p.sim.phase='fight';const f=p.sim.fighters[0];Object.assign(f,{x:0,z:0,angle:0,ultimate:100});Object.assign(p.sim.fighters[1],{x:0,z:2.5});p.effects.pool.clear();p.sim.attack(f,action);for(const e of p.sim.events.splice(0))p.effects.event(e,p.sim);$('previewCaption').textContent=FIGHTER_SKILLS[f.kind][action].label+' · live combat animation';for(const b of $('abilityCards').children)b.classList.toggle('selected',b.dataset.previewAction===action);}
function updateSkillPreview(dt){const p=previewRuntime;if(!skillPreview.open||!p)return;dt=Math.min(dt,.1);p.time+=dt;p.accumulator+=Math.min(dt,.1);while(p.accumulator>=1/60){p.sim.step();for(const e of p.sim.events.splice(0))p.effects.event(e,p.sim);p.accumulator-=1/60;}animateFighter(p.actor,p.sim.fighters[0],dt);p.effects.update(dt,p.sim,p.camera);const w=$('abilityCanvas').clientWidth,h=$('abilityCanvas').clientHeight;if(w&&h){if(p.renderer.domElement.width!==Math.round(w*p.renderer.getPixelRatio())||p.renderer.domElement.height!==Math.round(h*p.renderer.getPixelRatio()))p.renderer.setSize(w,h,false);p.camera.aspect=w/h;p.camera.updateProjectionMatrix();p.renderer.render(p.stage,p.camera);}if(p.time>3.6)replaySkill(p.action);}
function closePreviewRuntime(){const p=previewRuntime;if(!p)return;disposeActor(p.actor);p.effects.pool.items.forEach(i=>i.mesh.material.dispose());p.effects.pool.geometry.dispose();p.floor.geometry.dispose();p.floor.material.dispose();p.renderer.dispose();p.renderer.forceContextLoss();const old=$('abilityCanvas');old.replaceWith(old.cloneNode(false));previewRuntime=null;}
$('closeSkillPreview').onclick=()=>skillPreview.close();skillPreview.addEventListener('close',()=>{closePreviewRuntime();if(mobile.active){mobile.blocks.delete('preview');mobile.syncPause();}else{paused=previewPaused;match.paused=paused;}});
const previewButton=document.createElement('button');previewButton.id='fighterSkillPreview';previewButton.textContent='Explore abilities ↗';$('fighterDetails').after(previewButton);previewButton.onclick=()=>openSkillPreview(document.querySelector('[data-slot="'+rf.slot+'"] .fighter-select').value);
for(const parent of [$('trainingTools'),$('mobileTrainingSettings')]){const b=document.createElement('button');b.textContent='Fighter abilities';b.onclick=()=>openSkillPreview(match.fighters[0].kind);parent.append(b);}
updateSkillHUD();
