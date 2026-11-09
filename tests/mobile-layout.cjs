const{chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/screenshots/mobile'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const p=await context.newPage(),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 // An origin grants localStorage access; the HTML and all runtime media remain offline.
 await context.route('https://isle-brawl.test/**',r=>r.fulfill({contentType:'text/html',body:html}));await p.goto('https://isle-brawl.test/');requests.length=0;await p.evaluate(()=>__ib.vfx.ready);
 await p.screenshot({path:path.join(out,'01-mobile-menu-portrait.png'),fullPage:true});
 await p.evaluate(()=>{__ib.configureMode('training');window.orientationAttempts=0;document.getElementById('stage').requestFullscreen=()=>Promise.resolve();if(screen.orientation)Object.defineProperty(screen.orientation,'lock',{configurable:true,value:()=>{window.orientationAttempts++;return Promise.reject(new Error('Emulated unsupported orientation lock'));}});});await p.click('#stageStart');await p.evaluate(()=>__ib.setManualClock(true));
 assert(await p.locator('#rotatePrompt').isVisible());const portraitTick=await p.evaluate(()=>__ib.match.tick);await p.evaluate(()=>__ib.step(20));assert.equal(await p.evaluate(()=>__ib.match.tick),portraitTick);
 await p.screenshot({path:path.join(out,'02-rotate-prompt.png')});
 const before=await p.evaluate(()=>__ib.match.fighters.map(f=>[f.hp,f.x,f.z]));
 await p.setViewportSize({width:844,height:390});await p.waitForFunction(()=>__ib.mobile.landscape&&!__ib.state.paused);
 assert.deepEqual(await p.evaluate(()=>__ib.match.fighters.map(f=>[f.hp,f.x,f.z])),before);await p.evaluate(()=>{__ib.step(151);__ib.visualStep(3);});
 const layouts=[];
 async function geometry(w,h){
  await p.setViewportSize({width:w,height:h});await p.waitForFunction(()=>Math.abs(document.getElementById('stage').clientWidth-innerWidth)<2);await p.evaluate(()=>{__ib.mobile.updateViewport();__ib.visualStep(3);});
  const g=await p.evaluate(()=>{
   const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   return{stage:box(document.getElementById('stage')),hud:[...document.querySelectorAll('.fighter-card,.clock')].map(box),buttons:[...document.querySelectorAll('#touchControls button')].map(b=>({action:b.dataset.action,...box(b)})),width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,bodyHeight:innerHeight,safe:__ib.mobile.safe,
    fighters:__ib.match.fighters.filter(f=>!f.dead).flatMap(f=>[0,f.stats.height].map(y=>{const v=new THREE.Vector3(f.x,y,f.z).project(__ib.camera);return{x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight};}))};
  });
  assert.equal(g.stage.width,w);assert.equal(g.stage.height,h);assert(g.width<=w&&g.height<=h,'combat scroll');
  for(const b of g.buttons){assert(b.width>=44&&b.height>=44,b.action+' small');assert(b.x>=12&&b.y>=70&&b.right<=w-12&&b.bottom<=h-8,b.action+' clipped');}
  for(let i=0;i<g.buttons.length;i++)for(let j=i+1;j<g.buttons.length;j++){const a=g.buttons[i],b=g.buttons[j];assert(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y,'overlap '+a.action+'/'+b.action);}
  for(const e of g.hud)assert(e.x>=0&&e.y>=0&&e.right<=w&&e.bottom<=h,'HUD clipped');
  for(const f of g.fighters){assert(f.x>=g.safe.left-2&&f.x<=g.safe.right+2&&f.y>=g.safe.top-2&&f.y<=g.safe.bottom+2,JSON.stringify({viewport:[w,h],f,safe:g.safe}));for(const b of g.buttons)assert(f.x<b.x||f.x>b.right||f.y<b.y||f.y>b.bottom,'fighter behind '+b.action);}
  layouts.push({width:w,height:h,targets:8,safe:g.safe});
 }
 for(const [w,h]of [[844,390],[932,430],[740,360],[667,375],[1024,768]])await geometry(w,h);
 await geometry(844,390);await p.screenshot({path:path.join(out,'03-landscape-combat.png')});
 // Simulate notch / gesture insets through the same CSS variables populated by env().
 await p.evaluate(()=>{const s=document.getElementById('stage').style;s.setProperty('--safe-left','44px');s.setProperty('--safe-right','34px');s.setProperty('--safe-top','8px');s.setProperty('--safe-bottom','20px');});await geometry(844,390);
 await p.evaluate(()=>document.getElementById('stage').removeAttribute('style'));await p.evaluate(()=>__ib.mobile.updateViewport());
 const cdp=await context.newCDPSession(p);
 const point=(id,x,y)=>({id,x,y,radiusX:2,radiusY:2,force:1});
 let activePoints=[];const touches=async(type,points)=>{if(!activePoints.length&&['touchEnd','touchCancel'].includes(type))return;const touchPoints=type==='touchEnd'?activePoints.filter(p=>!points.some(next=>next.id===p.id)):points;await cdp.send('Input.dispatchTouchEvent',{type,touchPoints});activePoints=points;};
 const center=async selector=>{const r=await p.locator(selector).boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2};};
 async function reset(){await touches('touchEnd',[]);await p.evaluate(()=>{__ib.touchInput.reset();const[a,b]=__ib.match.fighters;Object.assign(a,{x:-1,z:0,state:'idle',frame:0,stamina:100,ultimate:100,cooldowns:{},vx:0,vz:0});Object.assign(b,{x:6,z:0,controller:'p2',state:'idle'});__ib.updateHUD();});}
 const joy=await center('#stick');
 for(const action of ['light','special','skill2','dodge','dash']){
  await reset();const b=await center('[data-action="'+action+'"]');const start=await p.evaluate(()=>__ib.match.fighters[0].x);
  await touches('touchStart',[point(1,joy.x,joy.y)]);await touches('touchMove',[point(1,joy.x+24,joy.y)]);await touches('touchStart',[point(1,joy.x+24,joy.y),point(2,b.x,b.y)]);
  await p.evaluate(()=>__ib.step(1));const state=await p.evaluate(()=>({move:__ib.match.fighters[0].moveName,state:__ib.match.fighters[0].state,owners:__ib.touchInput.pointers.size}));assert.equal(state.owners,2);assert(['dash','dodge'].includes(action)?state.state===action:state.move===action,action);
  await touches('touchEnd',[point(1,joy.x+24,joy.y)]);await p.evaluate(()=>__ib.step(4));assert(await p.evaluate(()=>__ib.touchInput.state.x>0));assert(await p.evaluate(()=>__ib.match.fighters[0].x)>start);await touches('touchEnd',[]);
 }
 await reset();const angle=await p.evaluate(()=>__ib.cameraState.angle);await touches('touchStart',[point(1,350,155),point(2,400,155)]);await touches('touchMove',[point(1,330,140),point(2,430,170)]);await touches('touchEnd',[]);assert.equal(await p.evaluate(()=>__ib.cameraState.angle),angle);
 await reset();const guard=await center('[data-action=block]'),light=await center('[data-action=light]');await touches('touchStart',[point(1,joy.x,joy.y)]);await touches('touchMove',[point(1,joy.x+24,joy.y)]);await touches('touchStart',[point(1,joy.x+24,joy.y),point(2,guard.x,guard.y)]);await p.evaluate(()=>__ib.step(2));assert.equal(await p.evaluate(()=>__ib.match.fighters[0].state),'block');
 await touches('touchStart',[point(1,joy.x+24,joy.y),point(2,guard.x,guard.y),point(3,light.x,light.y)]);await touches('touchEnd',[point(1,joy.x+24,joy.y),point(2,guard.x,guard.y)]);assert(await p.evaluate(()=>__ib.touchInput.state.block));await touches('touchCancel',[]);assert(await p.evaluate(()=>!__ib.touchInput.state.block&&__ib.touchInput.state.x===0));
 await reset();const heavy=await center('[data-action=heavy]');await touches('touchStart',[point(1,joy.x,joy.y)]);await touches('touchMove',[point(1,joy.x+24,joy.y)]);await touches('touchStart',[point(1,joy.x+24,joy.y),point(2,heavy.x,heavy.y)]);await p.evaluate(()=>__ib.step(1));assert.equal(await p.evaluate(()=>__ib.match.fighters[0].state),'charge');const chargeX=await p.evaluate(()=>__ib.match.fighters[0].x);await p.evaluate(()=>__ib.step(15));assert(await p.evaluate(()=>__ib.match.fighters[0].x)>chargeX);
 await touches('touchStart',[point(1,joy.x+24,joy.y),point(2,heavy.x,heavy.y),point(3,light.x,light.y)]);await touches('touchEnd',[point(1,joy.x+24,joy.y),point(2,heavy.x,heavy.y)]);assert(await p.evaluate(()=>__ib.touchInput.state.heavy));
 await touches('touchEnd',[point(1,joy.x+24,joy.y)]);await p.evaluate(()=>__ib.step(1));assert.equal(await p.evaluate(()=>__ib.match.fighters[0].moveName),'heavy');assert.equal(await p.evaluate(()=>__ib.match.fighters[0].frame),0); // Release starts a single attack at its startup frame.
 assert.equal(await p.evaluate(()=>__ib.sampleInput().p1.action),undefined);
 await reset();await touches('touchStart',[point(2,heavy.x,heavy.y)]);await p.evaluate(()=>__ib.step(10));await touches('touchCancel',[]);assert(await p.evaluate(()=>!__ib.touchInput.state.heavy&&__ib.match.fighters[0].state==='idle'));
 await reset();for(let i=0;i<3;i++){await touches('touchStart',[point(5,light.x,light.y)]);await touches('touchEnd',[]);}assert.deepEqual(await p.evaluate(()=>[__ib.sampleInput().p1.action,__ib.sampleInput().p1.action,__ib.sampleInput().p1.action,__ib.sampleInput().p1.action]),['light','light','light',undefined]);
 // Pause, settings, preferences persistence and safe exit never reset a running match.
 await p.click('#combatPause');assert(await p.evaluate(()=>__ib.state.paused));const tick=await p.evaluate(()=>__ib.match.tick);await p.evaluate(()=>__ib.step(30));assert.equal(await p.evaluate(()=>__ib.match.tick),tick);await p.screenshot({path:path.join(out,'06-mobile-pause.png')});
 await p.click('#mobileSettings');await p.locator('[data-mobile-pref=leftHanded]').check();await p.locator('[data-mobile-pref=buttons]').fill('56');await p.locator('[data-mobile-pref=opacity]').fill('0.7');await p.selectOption('[data-mobile-pref=quality]','low');await p.screenshot({path:path.join(out,'07-mobile-settings.png')});
 assert(await p.evaluate(()=>JSON.parse(localStorage.getItem('isle-brawl.mobile.v1')).leftHanded));await p.click('#closeMobileSettings');await p.click('#resumeButton');assert(!await p.evaluate(()=>__ib.state.paused));
 // Verify storage across a fresh page, preserving the current game's test clock.
 const saved=await context.newPage();await saved.goto('https://isle-brawl.test/');await saved.waitForFunction(()=>window.__ib);assert(await saved.evaluate(()=>__ib.mobilePrefs.leftHanded&&__ib.mobilePrefs.buttons===56));await saved.close();await p.bringToFront();await p.evaluate(()=>{__ib.mobile.blocks.clear();__ib.mobile.syncPause();});
 const snapshot=await p.evaluate(()=>({tick:__ib.match.tick,hp:__ib.match.fighters.map(f=>f.hp)}));
 for(const [w,h]of [[390,844],[430,932]]){await p.setViewportSize({width:w,height:h});await p.waitForFunction(()=>__ib.mobile.blocks.has('portrait'));assert(await p.locator('#rotatePrompt').isVisible());await p.evaluate(()=>__ib.step(10));assert.equal(await p.evaluate(()=>__ib.match.tick),snapshot.tick);}
 await p.setViewportSize({width:844,height:390});await p.waitForFunction(()=>!__ib.state.paused);assert.deepEqual(await p.evaluate(()=>__ib.match.fighters.map(f=>f.hp)),snapshot.hp);
 await p.evaluate(()=>{window.dispatchEvent(new Event('blur'));});assert(await p.evaluate(()=>__ib.state.paused&&__ib.touchInput.pointers.size===0));await p.click('#resumeButton');
 // Restore default controls for the visual review and exercise critical VFX on low quality.
 await p.evaluate(()=>{Object.assign(__ib.mobilePrefs,{buttons:52,leftHanded:false,opacity:.85});__ib.mobile.updateViewport();});
 for(const [action,file]of [['special','04-landscape-special.png'],['ultimate','05-landscape-ultimate.png']]){
  await reset();await p.evaluate(action=>{const m=__ib.match,[a,b]=m.fighters;b.x=.8;a.x=-.8;a.angle=Math.PI/2;b.angle=-Math.PI/2;m.attack(a,action);while(a.frame<a.move.start)m.step();__ib.processEvents();__ib.updateHUD();__ib.visualStep(.08);},action);assert(await p.evaluate(()=>__ib.vfx.pool.items.some(i=>i.active&&!i.decorative)));await p.screenshot({path:path.join(out,file)});
 }
 await p.evaluate(()=>{__ib.mobile.pause();});await p.click('#mobileRestart');await p.evaluate(()=>{__ib.setManualClock(true);__ib.step(151);});assert.equal(await p.evaluate(()=>__ib.match.round),1);
 await p.evaluate(()=>{__ib.mobile.exit();document.querySelector('[data-mode="2"]').click();}); // show drawer before native UI if needed
 await p.evaluate(()=>{__ib.start();__ib.setManualClock(true);__ib.step(151);});assert.equal(await p.evaluate(()=>__ib.match.fighters.length),2); // Training intentionally stays a duel.
 await p.evaluate(()=>{__ib.mobile.exit();__ib.configureMode('versus');document.querySelector('[data-mode="2"]').click();__ib.start();__ib.setManualClock(true);__ib.step(151);__ib.visualStep(3);});assert.equal(await p.evaluate(()=>__ib.match.fighters.length),4);
 await geometry(667,375);await p.screenshot({path:path.join(out,'08-compact-landscape.png')});
 // Rendering presets do not touch the deterministic combat state.
 const state=await p.evaluate(()=>JSON.stringify(__ib.match.fighters.map(f=>[f.hp,f.x,f.z,f.stamina])));for(const preset of ['low','medium','high','auto'])await p.evaluate(preset=>__ib.mobile.quality(preset),preset);assert.equal(await p.evaluate(()=>JSON.stringify(__ib.match.fighters.map(f=>[f.hp,f.x,f.z,f.stamina]))),state);
 // Rematch resource counts should plateau after warm-up for the same roster.
 const memory=await p.evaluate(()=>{const counts=[];for(let i=0;i<7;i++){__ib.start();__ib.setManualClock(true);__ib.visualStep(.02);counts.push({...__ib.renderer.info.memory});}return counts;});assert(memory.at(-1).geometries<=memory[2].geometries+4,JSON.stringify(memory));assert(memory.at(-1).textures<=memory[2].textures+2,JSON.stringify(memory));
 await p.evaluate(()=>__ib.mobile.exit());assert(!await p.evaluate(()=>document.body.classList.contains('mobile-combat')));
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 const report={layouts,portrait:[390,430],multitouch:true,chargeRelease:true,pointerCancel:true,preferences:true,pause:true,rotationPreservesState:true,criticalVFX:true,qualityDeterminism:true,memory,network:requests,errors};fs.writeFileSync(path.join(__dirname,'mobile-layout-results.json'),JSON.stringify(report,null,2));console.log(report);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
