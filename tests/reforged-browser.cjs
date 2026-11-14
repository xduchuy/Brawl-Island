const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/screenshots');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const context=await b.newContext({viewport:{width:1440,height:1100},offline:true});const p=await context.newPage(),errors=[],network=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await p.setContent(fs.readFileSync(path.join(root,'index.html'),'utf8'));await p.waitForFunction(()=>window.__ib);await p.evaluate(()=>__ib.vfx.ready);
 assert.equal(await p.evaluate(()=>__ib.vfx.loaded),124);assert.deepEqual(await p.evaluate(()=>__ib.vfx.failed),[]);
 await p.screenshot({path:path.join(out,'01-menu.png'),fullPage:true});
 await p.click('#chooseFighters');assert.equal(await p.locator('[data-fighter]').count(),36);await p.locator('#panel').screenshot({path:path.join(out,'02-fighter-select.png')});
 // All registered model factories and all signature attack/ultimate poses, with stable IK.
 const kinds=await p.evaluate(()=>{__ib.setManualClock(true);return Object.keys(__ib.profiles);});
 for(const kind of kinds){
  await p.evaluate(kind=>{__ib.match.phase='ready';const s=document.querySelector('[data-slot="0"] .fighter-select');s.value=kind;s.dispatchEvent(new Event('change'));},kind);
  await p.evaluate(()=>{__ib.start();__ib.step(151);if(!__ib.state.paused)__ib.pause();});
  for(const action of ['light','heavy','skill2','special','ultimate']){
   const stable=await p.evaluate(action=>{const m=__ib.match,[a,b]=m.fighters;Object.assign(a,{state:'idle',stamina:100,ultimate:100,cooldowns:{},x:-.9,z:0});Object.assign(b,{controller:'p2',x:.9,z:0,state:'idle'});m.attack(a,action);a.frame=a.move.start;__ib.visualStep(.02);return __ib.getActors().every(a=>Object.keys(a.bones).length===18&&Object.values(a.bones).every(b=>b.matrixWorld.elements.every(Number.isFinite)));},action);assert(stable,kind+' '+action);
  }
  console.log('Rig and five attack poses:',kind);
 }
 await p.evaluate(()=>__ib.setManualClock(false));
 // Return to the vertical slice and freeze only after normal inputs have advanced it.
 await p.evaluate(()=>{__ib.match.phase='ready';const s=document.querySelector('[data-slot="0"] .fighter-select');s.value='yuji';s.dispatchEvent(new Event('change'));__ib.start();__ib.step(151);__ib.pause();__ib.visualStep(3);});
 await p.addStyleTag({content:'.pause-screen{visibility:hidden!important}'});
 await p.locator('#stage').screenshot({path:path.join(out,'03-combat.png')});
 async function showcase(kind,action,name){
  await p.evaluate(({kind,action})=>{
   const m=__ib.match;const select=document.querySelector('[data-slot="0"] .fighter-select');m.phase='ready';select.value=kind;select.dispatchEvent(new Event('change'));__ib.start();__ib.step(151);__ib.pause();
   const [a,b]=__ib.match.fighters;Object.assign(a,{state:'idle',stamina:100,ultimate:100,cooldowns:{},x:-.8,z:0,angle:Math.PI/2});Object.assign(b,{controller:'p2',x:.8,z:0,state:'idle',hp:110});
   __ib.visualStep(3);__ib.match.attack(a,action);__ib.match.paused=false;
   while(a.frame<a.move.start)__ib.match.step();__ib.match.paused=true;__ib.processEvents();__ib.updateHUD();__ib.visualStep(.07);if(!__ib.vfx.pool.items.some(i=>i.active))throw new Error('No live VFX for '+action);
  },{kind,action});
  await p.locator('#stage').screenshot({path:path.join(out,name)});
 }
 await showcase('yuji','special','04-black-flash.png');await showcase('gojo','ultimate','05-hollow-purple.png');
 await p.evaluate(()=>{__ib.match.phase='ready';document.getElementById('arenaMode').value='sanctum';document.getElementById('arenaMode').dispatchEvent(new Event('change'));});
 await showcase('sukuna','ultimate','06-domain-sanctum.png');
 await p.click('#galleryButton');await p.click('[data-asset="yuji/special"]');await p.screenshot({path:path.join(out,'07-vfx-gallery.png')});assert(await p.locator('#vfxGallery').isVisible());await p.click('#closeGallery');
 await p.evaluate(()=>__ib.configureMode('training'));await p.evaluate(()=>{__ib.start();__ib.step(151);__ib.pause();});
 await p.selectOption('#dummyMode','guard');await p.check('#hitboxes');await p.check('#unlimited');assert(await p.evaluate(()=>__ib.match.training.unlimited&&__ib.match.training.dummy==='guard'));
 await p.click('#endTraining');assert.equal(await p.evaluate(()=>__ib.match.phase),'over');
 // Full AI matches for quick/local/team play. Inputs remain normal controller samples elsewhere.
 const modes=[];
 for(const mode of ['versus','local','arcade','survival']){
  await p.evaluate(mode=>{__ib.configureMode(mode);__ib.start();},mode);
  const result=await p.evaluate(()=>{const m=__ib.match;m.fighters.forEach(f=>f.controller='ai');m.slots.forEach(s=>s.controller='ai');for(let i=0;i<24000&&m.phase!=='over';i++){m.events.length=0;m.step();}__ib.processEvents();__ib.updateHUD();return{mode:m.gameMode,phase:m.phase,advance:__ib.reforged.advance};});assert.equal(result.phase,'over',result.mode);modes.push(result);
 }
 // Encounter progression and terminal states, using deterministic result fixtures to cover both paths.
 for(const mode of ['arcade','survival']){
  const count=mode==='arcade'?kinds.length-1:5;await p.evaluate(mode=>__ib.configureMode(mode),mode);
  for(let stage=0;stage<count;stage++){
   await p.evaluate(()=>__ib.start());assert.equal(await p.evaluate(()=>__ib.reforged.stage),stage);
   await p.evaluate(()=>{const m=__ib.match;m.phase='fight';m.fighters[1].dead=true;m.fighters[1].hp=0;m.step();__ib.processEvents();});
   assert.equal(await p.evaluate(()=>__ib.reforged.advance),stage<count-1);
  }
  assert(await p.evaluate(()=>__ib.reforged.finished));
 }
 await p.locator('#stage').screenshot({path:path.join(out,'08-victory.png')});
 await p.evaluate(()=>{__ib.configureMode('versus');document.querySelector('[data-mode="2"]').click();__ib.start();});
 assert.equal(await p.evaluate(()=>__ib.match.fighters.length),4);
 const team=await p.evaluate(()=>{const m=__ib.match;m.fighters.forEach(f=>f.controller='ai');m.slots.forEach(s=>s.controller='ai');for(let i=0;i<24000&&m.phase!=='over';i++){m.events.length=0;m.step();}__ib.processEvents();return m.phase;});assert.equal(team,'over');
 // Real keyboard paths for charge, skill 2, dash and ultimate.
 await p.evaluate(()=>{__ib.configureMode('training');__ib.start();__ib.step(151);__ib.match.fighters[1].x=6;});
 await p.keyboard.down('KeyK');await p.evaluate(()=>__ib.step(20));assert.equal(await p.evaluate(()=>__ib.match.fighters[0].state),'charge');await p.keyboard.up('KeyK');await p.evaluate(()=>__ib.step(1));assert.equal(await p.evaluate(()=>__ib.match.fighters[0].moveName),'heavy');
 await p.evaluate(()=>Object.assign(__ib.match.fighters[0],{state:'idle',stamina:100,ultimate:100,cooldowns:{}}));await p.keyboard.press('KeyO');await p.evaluate(()=>__ib.step(1));assert.equal(await p.evaluate(()=>__ib.match.fighters[0].moveName),'skill2');
 await p.evaluate(()=>Object.assign(__ib.match.fighters[0],{state:'idle',stamina:100,ultimate:100,cooldowns:{}}));await p.keyboard.press('KeyH');await p.evaluate(()=>__ib.step(1));assert.equal(await p.evaluate(()=>__ib.match.fighters[0].moveName),'ultimate');
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{document.getElementById('touchToggle').checked=true;document.getElementById('touchToggle').dispatchEvent(new Event('change'));__ib.pause();__ib.visualStep(3);});
 assert(await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth));assert.equal(await p.locator('#touchControls button').count(),8);await p.screenshot({path:path.join(out,'09-mobile-combat.png'),fullPage:true});
 await p.click('#chooseFighters');assert(await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 const report={fighters:36,poses:180,textures:124,modes,team,offline:true,externalRequests:network,errors,mobileWidth:390,screenshots:9};fs.writeFileSync(path.join(__dirname,'reforged-browser-results.json'),JSON.stringify(report,null,2));console.log(report);await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
