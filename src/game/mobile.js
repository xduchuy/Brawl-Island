// Device-specific presentation. Combat rules and clocks remain in BrawlMatch.
const mobile={device:matchMedia('(pointer:coarse)').matches||(navigator.maxTouchPoints>0&&innerWidth<=1200),active:false,landscape:innerWidth>innerHeight,blocks:new Set(),safe:null,manualClock:false,settingsReturn:false,qualityLevel:1,worldAccumulator:1,autoSlow:0,autoFast:0,qualityCooldown:0,viewportFrame:0};
const touchButtons=[...document.querySelectorAll('#touchControls [data-action]')];
const mobileDefaults={joystick:96,buttons:52,opacity:.85,left:18,right:18,preset:'arc',leftHanded:false,floating:false,shake:.4,intensity:.85,fps:false,quality:'auto',haptics:false,spacing:8,aimSensitivity:1,aimAssist:true,previewOpacity:.7,cancelSensitivity:10};
const mobilePrefs={...mobileDefaults};
try{const saved=JSON.parse(localStorage.getItem('isle-brawl.mobile.v1')||'null');if(saved&&typeof saved==='object')for(const key in mobileDefaults)if(typeof saved[key]===typeof mobileDefaults[key])mobilePrefs[key]=saved[key];}catch(_){}
for(const [key,min,max]of [['joystick',80,120],['buttons',44,60],['opacity',.3,1],['left',12,40],['right',12,40],['shake',0,1],['intensity',.5,1],['spacing',4,14],['aimSensitivity',.5,2],['previewOpacity',.2,1],['cancelSensitivity',0,24]])mobilePrefs[key]=clamp(Number(mobilePrefs[key]),min,max);
if(!['arc','compact'].includes(mobilePrefs.preset))mobilePrefs.preset='arc';if(!['low','medium','high','auto'].includes(mobilePrefs.quality))mobilePrefs.quality='auto';
const pauseActions=document.createElement('div');pauseActions.className='mobile-pause-actions';pauseActions.innerHTML='<button id="mobileRestart">Restart match</button><button id="mobileSettings">Controls & settings</button><button id="mobileExit">Main menu</button>';$('pauseScreen').append(pauseActions);
const pauseTop=document.createElement('button');pauseTop.id='combatPause';pauseTop.setAttribute('aria-label','Pause combat');pauseTop.textContent='Ⅱ';document.querySelector('.clock').append(pauseTop);
const rotate=document.createElement('section');rotate.id='rotatePrompt';rotate.hidden=true;rotate.setAttribute('role','dialog');rotate.setAttribute('aria-label','Rotate to play');rotate.innerHTML='<span class="rotate-icon" aria-hidden="true">↻</span><small>ISLE BRAWL / MOBILE</small><h2>Rotate to play.</h2><p>Your fight is ready. Turn your device sideways.</p><button id="rotateExit">Back to menu</button>';$('stage').append(rotate);
const mobileMenuExit=document.createElement('button');mobileMenuExit.id='victoryMenu';mobileMenuExit.textContent='Main menu';$('startOverlay').append(mobileMenuExit);
const fpsBadge=document.createElement('output');fpsBadge.id='mobileFPS';$('stage').append(fpsBadge);
const inputSurface=document.createElement('div');inputSurface.className='move-pad';$('stick').before(inputSurface);inputSurface.append($('stick'));
const cancelHeavy=()=>{const f=match?.fighters.find(f=>f.controller==='p1');if(f?.state==='charge'){f.state='idle';f.frame=0;f.charge=0;f.buffer=null;}};
const touchInput=new TouchInput({surface:inputSurface,stick:$('stick'),actions:document.querySelector('.touch-actions'),state:touch,queue:queued.p1,enabled:()=>!paused&&(!mobile.active||mobile.landscape)&&match?.phase!=='over',onCancel:cancelHeavy,onPress:()=>{initAudio();if(mobilePrefs.haptics&&navigator.vibrate)navigator.vibrate(8);}});
function clearGameplayInput(){touchInput.reset();held.clear();queued.p1.length=queued.p2.length=0;touch.x=touch.z=0;touch.heavy=touch.block=false;}
mobile.syncPause=()=>{
 if(!mobile.active)return;paused=mobile.blocks.size>0;match.paused=paused;accumulator=0;last=performance.now();
 $('pauseScreen').classList.toggle('show',mobile.blocks.has('user')&&!mobile.blocks.has('portrait')&&!mobile.blocks.has('settings'));$('pauseButton').textContent=paused?'Resume fight · P':'Pause / resume · P';
};
mobile.pause=()=>{if(match.phase==='ready'||match.phase==='over')return;if(mobile.blocks.has('user'))mobile.blocks.delete('user');else{mobile.blocks.add('user');clearGameplayInput();}mobile.syncPause();};
mobile.updateViewport=()=>{
 mobile.viewportFrame=0;const vv=window.visualViewport,w=vv?.width||innerWidth,h=vv?.height||innerHeight;mobile.landscape=w>h;
 document.body.classList.toggle('mobile-device',mobile.device);document.body.classList.toggle('mobile-combat',mobile.active);document.body.classList.toggle('mobile-landscape',mobile.active&&mobile.landscape);
 const stage=$('stage');stage.style.setProperty('--viewport-w',w+'px');stage.style.setProperty('--viewport-h',h+'px');stage.style.setProperty('--viewport-x',(vv?.offsetLeft||0)+'px');stage.style.setProperty('--viewport-y',(vv?.offsetTop||0)+'px');
 if(mobile.active){
  const was=mobile.blocks.has('portrait');if(!mobile.landscape){mobile.blocks.add('portrait');if(!was)clearGameplayInput();}else mobile.blocks.delete('portrait');
  rotate.hidden=mobile.landscape;mobile.syncPause();$('touchControls').classList.add('visible');
 }else rotate.hidden=true;
 mobile.layoutControls();resize();
};
mobile.scheduleViewport=()=>{if(!mobile.viewportFrame)mobile.viewportFrame=requestAnimationFrame(mobile.updateViewport);};
mobile.enter=()=>{
 if(!mobile.device)return;mobile.active=true;mobile.blocks.clear();mobile.manualClock=false;clearGameplayInput();introRemaining=0;viewAngle=.1;viewTilt=.5;pan.set(0,0,0);zoom=1;mobile.updateViewport();
 // Both APIs may reject, especially on iOS. Real viewport geometry remains authoritative.
 if(navigator.userActivation?.isActive){
  try{const full=$('stage').requestFullscreen?.({navigationUI:'hide'});Promise.resolve(full).then(()=>{if(!mobile.active){if(document.fullscreenElement)return document.exitFullscreen?.();return;}return screen.orientation?.lock?.('landscape');}).catch(()=>{});}catch(_){}
 }
};
mobile.exit=()=>{
 clearGameplayInput();mobile.active=false;mobile.blocks.clear();paused=false;match.paused=false;mobile.manualClock=false;
 if(document.fullscreenElement)Promise.resolve(document.exitFullscreen?.()).catch(()=>{});try{screen.orientation?.unlock?.();}catch(_){}
 if(mobileSettings.open)mobileSettings.close();document.body.classList.remove('mobile-combat','mobile-landscape','in-combat','panel-open');$('pauseScreen').classList.remove('show');
 match.phase='ready';previewMatch();$('startOverlay').style.display='flex';$('stageStart').textContent='LET’S BRAWL';$('startButton').querySelector('b').textContent='Start a brawl';mobile.updateViewport();window.scrollTo(0,0);
};
mobile.cameraFrame=()=>{
 const w=Math.max(1,$('stage').clientWidth),h=Math.max(1,$('stage').clientHeight),pad=mobile.safeInsets(),rect={left:pad.left+28,right:w-pad.right-28,top:pad.top+76,bottom:Math.min(h-pad.bottom-96,document.querySelector('.touch-actions').getBoundingClientRect().top-8)};
 const angle=.1,tilt=match.arena==='drowned-sanctuary'?1.05:.5,right=V(Math.cos(angle),0,-Math.sin(angle)),up=V(-Math.sin(angle)*Math.sin(tilt),Math.cos(tilt),-Math.cos(angle)*Math.sin(tilt));
 const fs=match.fighters.filter(f=>!f.dead);if(!fs.length)fs.push(...match.fighters);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;const center=V();
 for(const f of fs){center.add(V(f.x,0,f.z));for(const y of [0,f.stats.height+.25]){const p=V(f.x,y,f.z),x=p.dot(right),yy=p.dot(up);minX=Math.min(minX,x-.65);maxX=Math.max(maxX,x+.65);minY=Math.min(minY,yy-.25);maxY=Math.max(maxY,yy+.25);}}
 center.multiplyScalar(1/fs.length);center.addScaledVector(right,(minX+maxX)/2-center.dot(right));center.addScaledVector(up,(minY+maxY)/2-center.dot(up));
 let anticipation=0;for(const f of fs)if(f.state==='attack'&&f.moveName==='ultimate')anticipation=Math.max(anticipation,Math.sin(clamp(f.frame/f.move.start,0,1)*Math.PI/2));
 const aspect=w/h,span=(1+anticipation*.07)*Math.max(2.3,(maxY-minY)*h/(2*Math.max(80,rect.bottom-rect.top)),(maxX-minX)*h/(2*Math.max(200,rect.right-rect.left)));
 const nx=(rect.left+rect.right)/w-1,ny=1-(rect.top+rect.bottom)/h;center.addScaledVector(right,-nx*span*aspect);center.addScaledVector(up,-ny*span);
 mobile.safe=rect;return{center,span};
};
mobile.safeInsets=()=>{const s=getComputedStyle($('stage'));return{top:parseFloat(s.getPropertyValue('--safe-top'))||0,right:parseFloat(s.getPropertyValue('--safe-right'))||0,bottom:parseFloat(s.getPropertyValue('--safe-bottom'))||0,left:parseFloat(s.getPropertyValue('--safe-left'))||0};};
mobile.layoutControls=()=>{
 const w=mobile.active?$('stage').clientWidth:innerWidth,h=mobile.active?$('stage').clientHeight:innerHeight;
 const fit=Math.min(1,(h-95)/240,(w-250)/360),button=Math.max(44,Math.min(mobilePrefs.buttons,mobilePrefs.buttons*fit)),joy=Math.min(mobilePrefs.joystick,Math.max(80,h*.27));
 const s=$('stage').style;s.setProperty('--action-size',button+'px');s.setProperty('--joystick-size',joy+'px');s.setProperty('--control-opacity',mobilePrefs.opacity);s.setProperty('--control-left',mobilePrefs.left+'px');s.setProperty('--control-right',mobilePrefs.right+'px');
 $('touchControls').classList.toggle('left-handed',mobilePrefs.leftHanded);$('touchControls').classList.toggle('compact-layout',mobilePrefs.preset==='compact');touchInput.floating=mobilePrefs.floating;
 const gap=mobilePrefs.preset==='compact'?4:mobilePrefs.spacing,step=button+gap,positions={ultimate:[0,28,1],special:[step,6,1],skill2:[step*2,0,1],heavy:[step*3,18,1],block:[0,step+38,1],dash:[step,step+22,1],dodge:[step*2,step+12,1],light:[step*3,step+24,1.25]};
 const cluster=document.querySelector('.touch-actions'),cw=step*3+button*1.25,ch=Math.max(step+38+button,step+24+button*1.25);cluster.style.width=cw+'px';cluster.style.flexBasis=cw+'px';cluster.style.height=ch+'px';$('touchControls').style.height=ch+'px';
 for(const b of touchButtons){const [x,y,size]=positions[b.dataset.action],d=button*size;b.style.width=b.style.height=d+'px';b.style.left=(mobilePrefs.leftHanded?cw-x-d:x)+'px';b.style.top=y+'px';}

};
const graphicsPresets=[{scale:2.4,particles:.2,shadow:0,background:10,decorative:10},{scale:1.65,particles:.5,shadow:512,background:20,decorative:24},{scale:1.2,particles:.85,shadow:1024,background:30,decorative:48}];
mobile.applyQuality=(level)=>{
 mobile.qualityLevel=clamp(level,0,2);const q=graphicsPresets[mobile.qualityLevel];mobile.backgroundHz=q.background;vfx.decorativeLimit=q.decorative;vfx.density=q.particles;
 // Pixel ratio is capped, then internal resolution is reduced by the preset. Combat stays 60 Hz.
 pixelSize=q.scale/Math.min(devicePixelRatio||1,1.25);renderer.setPixelRatio(1);renderer.shadowMap.enabled=q.shadow>0;
 if(!q.shadow&&sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
 if(sun.shadow.mapSize.x!==q.shadow&&q.shadow){sun.shadow.map?.dispose();sun.shadow.map=null;sun.shadow.mapSize.set(q.shadow,q.shadow);}
 postMaterial.uniforms.bloom.value=mobile.qualityLevel===0?0:1;resize();
};
mobile.quality=(value)=>{mobilePrefs.quality=value;rf.quality=value;mobile.autoSlow=mobile.autoFast=0;mobile.qualityCooldown=8;mobile.applyQuality(value==='auto'?1:['low','medium','high'].indexOf(value));};
mobile.worldDelta=(dt)=>{if(!mobile.device)return dt;mobile.worldAccumulator+=dt;if(mobile.worldAccumulator<1/(mobile.backgroundHz||20))return 0;const elapsed=mobile.worldAccumulator;mobile.worldAccumulator=0;return elapsed;};
mobile.update=(dt)=>{
 if(!mobile.active)return;
 if(mobilePrefs.quality==='auto'&&!paused){mobile.qualityCooldown=Math.max(0,mobile.qualityCooldown-dt);mobile.autoSlow=fps<43?mobile.autoSlow+dt:0;mobile.autoFast=fps>57?mobile.autoFast+dt:0;
  if(!mobile.qualityCooldown&&(mobile.autoSlow>4&&mobile.qualityLevel>0||mobile.autoFast>18&&mobile.qualityLevel<2)){mobile.applyQuality(mobile.qualityLevel+(mobile.autoSlow>4?-1:1));mobile.qualityCooldown=12;mobile.autoSlow=mobile.autoFast=0;}}
 fpsBadge.hidden=!mobilePrefs.fps;fpsBadge.textContent=Math.round(fps)+' FPS';
 for(const b of touchButtons){const f=match.fighters.find(f=>f.controller==='p1')||match.fighters[0],key=b.dataset.action,skill=FIGHTER_SKILLS[f.kind][key],remaining=f.cooldowns[key]||0;
  const locked=remaining>0||(key==='ultimate'&&f.ultimate<100)||(skill&&!Array.isArray(skill)&&f.stamina<skill.cost);b.setAttribute('aria-disabled',String(!!locked));b.classList.toggle('cooling',!!locked);b.classList.toggle('ult-ready',key==='ultimate'&&!locked);b.style.setProperty('--cooldown',(remaining/Math.max(1,skill?.cooldown||1)*100)+'%');
  b.querySelector('em').textContent=remaining?(remaining/60).toFixed(1):key==='ultimate'?Math.floor(f.ultimate)+'%':'';
 }
};
// Controls preferences are stored locally; storage failures never block the game.
const mobileSettings=document.createElement('dialog');mobileSettings.id='mobileControlSettings';mobileSettings.innerHTML='<header><div><small>TWO THUMBS. ONE RIVALRY.</small><h2>Mobile controls</h2></div><button id="closeMobileSettings" aria-label="Close mobile settings">Done</button></header><div class="mobile-settings-grid">'+[
 ['joystick','Joystick size',80,120,1],['buttons','Button size',44,60,1],['opacity','Control opacity',.3,1,.05],['left','Left margin',12,40,1],['right','Right margin',12,40,1],['shake','Camera shake',0,1,.1],['intensity','VFX intensity',.5,1,.05],['spacing','Control spacing',4,14,1],['aimSensitivity','Aim sensitivity',.5,2,.1],['previewOpacity','Target preview opacity',.2,1,.05],['cancelSensitivity','Cancel region padding',0,24,1]
 ].map(([key,label,min,max,step])=>'<label>'+label+'<output data-pref-value="'+key+'"></output><input data-mobile-pref="'+key+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'"></label>').join('')+'<label>Layout<select data-mobile-pref="preset"><option value="arc">MOBA Arc</option><option value="compact">Compact</option></select></label><label>Graphics<select data-mobile-pref="quality"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="auto">Auto</option></select></label>'+[['aimAssist','Tap aim assist'],['leftHanded','Left-handed preset'],['floating','Floating joystick'],['fps','Show FPS'],['haptics','Haptic feedback']].map(([key,label])=>'<label class="mobile-check">'+label+'<input data-mobile-pref="'+key+'" type="checkbox"></label>').join('')+'</div><div class="control-preview" aria-label="Control layout preview"><i></i><span>✦　●<br>●　●　●</span></div><details id="mobileTrainingSettings"><summary>Training lab</summary></details><button id="resetMobilePreferences">Reset controls</button>';$('stage').append(mobileSettings);
function applyMobilePrefs(persist=true){
 mobile.layoutControls();if(mobile.device){feedback.settings.shake=mobilePrefs.shake;vfx.intensity=mobilePrefs.intensity;}
 mobileSettings.classList.toggle('preview-left',mobilePrefs.leftHanded);mobileSettings.style.setProperty('--preview-opacity',mobilePrefs.opacity);const preview=mobileSettings.querySelector('.control-preview');preview.style.paddingLeft=mobilePrefs.left+'px';preview.style.paddingRight=mobilePrefs.right+'px';mobileSettings.style.setProperty('--preview-joy',mobilePrefs.joystick/2+'px');mobileSettings.style.setProperty('--preview-button',mobilePrefs.buttons/2+'px');
 for(const el of mobileSettings.querySelectorAll('[data-mobile-pref]')){const value=mobilePrefs[el.dataset.mobilePref];if(el.type==='checkbox')el.checked=value;else el.value=value;const out=mobileSettings.querySelector('[data-pref-value="'+el.dataset.mobilePref+'"]');if(out)out.textContent=value;}
 if(persist)try{localStorage.setItem('isle-brawl.mobile.v1',JSON.stringify(mobilePrefs));}catch(_){}
}
mobile.openSettings=()=>{mobile.settingsReturn=mobile.active;if(mobile.active){mobile.blocks.add('settings');clearGameplayInput();mobile.syncPause();}$('mobileTrainingSettings').hidden=match?.gameMode!=='training';if(match?.gameMode==='training')$('mobileTrainingSettings').append($('trainingTools'));mobileSettings.showModal();applyMobilePrefs(false);};
mobileSettings.addEventListener('close',()=>{document.querySelector('.stage-shell').after($('trainingTools'));if(mobile.active){mobile.blocks.delete('settings');mobile.blocks.add('user');mobile.syncPause();}});
$('closeMobileSettings').onclick=()=>mobileSettings.close();$('resetMobilePreferences').onclick=()=>{Object.assign(mobilePrefs,mobileDefaults);mobile.quality(mobilePrefs.quality);applyMobilePrefs();};
mobileSettings.querySelectorAll('[data-mobile-pref]').forEach(el=>el.addEventListener('input',()=>{const key=el.dataset.mobilePref;mobilePrefs[key]=el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value;if(key==='quality')mobile.quality(el.value);applyMobilePrefs();}));
mobileSettings.querySelector('[data-mobile-pref="haptics"]').disabled=!navigator.vibrate;
const mobileSettingsButton=document.createElement('button');mobileSettingsButton.id='openMobileSettings';mobileSettingsButton.textContent='Mobile controls & graphics';$('tab-world').prepend(mobileSettingsButton);mobileSettingsButton.onclick=mobile.openSettings;
$('combatPause').onclick=pause;$('mobileRestart').onclick=()=>{rf.advance=false;startMatch();};$('mobileSettings').onclick=mobile.openSettings;$('mobileExit').onclick=$('rotateExit').onclick=$('victoryMenu').onclick=mobile.exit;
for(const b of touchButtons){const labels={light:['✦','LIGHT'],heavy:['◆','HEAVY'],special:['1','SKILL'],skill2:['2','SKILL'],ultimate:['✷','ULT'],block:['◇','GUARD'],dodge:['↶','DODGE'],dash:['»','DASH']};const [icon,label]=labels[b.dataset.action];b.setAttribute('aria-label',label+(b.dataset.action==='skill2'?' 2':b.dataset.action==='special'?' 1':''));b.setAttribute('aria-pressed','false');b.innerHTML='<b aria-hidden="true">'+icon+'</b><span>'+label+'</span><em></em>';}
window.addEventListener('resize',mobile.scheduleViewport);window.addEventListener('orientationchange',mobile.scheduleViewport);screen.orientation?.addEventListener?.('change',mobile.scheduleViewport);window.visualViewport?.addEventListener('resize',mobile.scheduleViewport);window.visualViewport?.addEventListener('scroll',mobile.scheduleViewport);
document.addEventListener('fullscreenchange',()=>{if(mobile.active&&!document.fullscreenElement){mobile.blocks.add('user');clearGameplayInput();}mobile.scheduleViewport();});
document.addEventListener('visibilitychange',()=>{if(mobile.active){clearGameplayInput();if(document.hidden)mobile.blocks.add('hidden');else{mobile.blocks.delete('hidden');mobile.blocks.add('user');}mobile.syncPause();}});
window.addEventListener('blur',()=>{clearGameplayInput();if(mobile.active){mobile.blocks.add('user');mobile.syncPause();}});
if(mobile.device)mobile.quality(mobilePrefs.quality);applyMobilePrefs(false);mobile.updateViewport();
vfx.ready.then(()=>{if(mobile.device){const items=vfx.pool.items.slice(0,2);items.forEach(i=>{i.mesh.material.uniforms.atlas.value=vfx.textures['common/hit_spark'];i.mesh.visible=true;});renderer.compile(scene,camera);items.forEach(i=>i.mesh.visible=false);}});
