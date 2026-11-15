const {chromium}=require('playwright'),fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('src/fighters/roster.js','utf8')+';this.pack=NARUTO_ROSTER;',c);
const expected='naruto sasuke sakura kakashi hinata rocklee neji shikamaru mightguy gaara jiraiya tsunade orochimaru minato hashirama tobirama madara itachi pain obito'.split(' ');
assert.deepEqual(Object.keys(c.pack).sort(),expected.sort());
const ids=Object.keys(c.pack),out='docs/screenshots/naruto';fs.mkdirSync(out+'/portraits',{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});try{
 const page=await browser.newPage({viewport:{width:420,height:620}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setContent(fs.readFileSync('index.html','utf8'));await page.waitForFunction(()=>window.__ib);await page.evaluate(()=>Promise.all([__ib.vfx.ready,__ib.iconAtlas.ready]));
 assert.equal(await page.locator('[data-fighter]').count(),66);
 for(const id of ids)assert.equal(await page.locator('.fighter-select option[value="'+id+'"]').count(),4,id+' selectable in every slot');
 await page.click('#chooseFighters');
 await page.selectOption('#fighterGroup','Hashira');assert.equal(await page.locator('.fighter-tile:not([hidden])').count(),9);
 await page.selectOption('#fighterGroup','Upper Moons');assert.equal(await page.locator('.fighter-tile:not([hidden])').count(),9);
 await page.selectOption('#fighterGroup','original');assert.equal(await page.locator('.fighter-tile:not([hidden])').count(),11);await page.selectOption('#fighterGroup','kimetsu');assert.equal(await page.locator('.fighter-tile:not([hidden])').count(),25);await page.selectOption('#fighterGroup','onepiece');assert.equal(await page.locator('.fighter-tile:not([hidden])').count(),10);await page.selectOption('#fighterGroup','naruto');assert.equal(await page.locator('.fighter-tile:not([hidden])').count(),20);await page.fill('#fighterSearch','Naruto');assert.equal(await page.locator('.fighter-tile:not([hidden])').count(),1);await page.locator('[data-fighter=naruto]').dispatchEvent('click');assert.equal(await page.locator('[data-slot="0"] .fighter-select').inputValue(),'naruto');
 await page.fill('#fighterSearch','');await page.locator('#panel').screenshot({path:out+'/fighter-selection.png'});
 await page.addStyleTag({content:'#stage{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;max-height:none!important;z-index:99999}#stage>*:not(#game){display:none!important}'});
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await page.evaluate(()=>{__ib.setManualClock(true);window.dispatchEvent(new Event('resize'));});
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const records=[];
 for(const kind of ids){
  const record=await page.evaluate(kind=>{
   __ib.match.phase='ready';const s=document.querySelector('[data-slot="0"] .fighter-select');s.value=kind;s.dispatchEvent(new Event('change'));const f=__ib.match.fighters[0];Object.assign(f,{x:0,z:0,y:0,angle:0});
   const actor=__ib.getActors()[0],keep=new Set([actor.g,actor.trail,...actor.renderBatches.map(b=>b.mesh)]);__ib.scene.children.forEach(o=>o.visible=!!o.isLight||keep.has(o));__ib.scene.background.set('#253138');
   for(const action of ['light','heavy','special','skill2','ultimate']){Object.assign(f,{state:'idle',stamina:100,ultimate:100,cooldowns:{}});__ib.match.attack(f,action);f.frame=f.move.start;__ib.visualStep(.016);if(kind==='naruto'&&action==='skill2'&&!actor.manifestation.visible)throw Error('Missing shadow-clone manifestation');if(!Object.values(actor.bones).every(b=>b.matrixWorld.elements.every(Number.isFinite)))throw Error('Invalid rig '+kind+' '+action);}
   if(!actor.chakra.visible)throw Error('Missing cast chakra');
   f.state='idle';f.frame=0;for(let i=0;i<4;i++)__ib.visualStep(.05);if(actor.chakra.visible||actor.manifestation.visible||actor.weapon.scale.x!==1)throw Error('Ability visual did not reset');
   const cam=__ib.camera;cam.left=-1.1;cam.right=1.1;cam.top=1.6;cam.bottom=-1.6;cam.zoom=1;cam.position.set(3,1.2,7);cam.lookAt(0,1.05,0);cam.updateProjectionMatrix();__ib.render();
   return{image:document.getElementById('game').toDataURL('image/png'),kind,ninja:actor.ninja,bones:Object.keys(actor.bones).length,parts:actor.renderBatches.reduce((n,b)=>n+b.parts.length,0),icon:__ib.iconAtlas.entry(kind,'ultimate').skillId};
  },kind);
  assert.equal(record.bones,18);assert(record.ninja);assert(record.parts>0);fs.writeFileSync(out+'/portraits/'+kind+'.png',Buffer.from(record.image.split(',')[1],'base64'));delete record.image;records.push(record);
 }
 assert.deepEqual(errors,[]);await page.close();
 // Real mobile combat with four new fighters, native skill UI and the sanctuary arena.
 const mobile=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.setContent(fs.readFileSync('index.html','utf8'));await mobile.waitForFunction(()=>window.__ib);await mobile.evaluate(()=>__ib.vfx.ready);
 await mobile.selectOption('#arenaMode','drowned-sanctuary');await mobile.evaluate(()=>{document.querySelector('[data-mode="2"]').click();['naruto','sasuke','sakura','kakashi'].forEach((k,i)=>{document.querySelector('[data-slot="'+i+'"] .fighter-select').value=k;document.querySelector('[data-slot="'+i+'"] .controller').value='ai';});__ib.start();__ib.setManualClock(true);__ib.step(900);__ib.setManualClock(false);});
 await mobile.screenshot({path:out+'/mobile-sanctuary.png',timeout:120000});
 const mobileResult=await mobile.evaluate(()=>({fighters:__ib.match.fighters.map(f=>({kind:f.kind,hp:f.hp,clear:__ib.sanctuaryCombat.map.isClear(f.x,f.y,f.z,.3)})),icons:[...document.querySelectorAll('.touch-actions [data-action]')].map(b=>b.querySelector('b')?.dataset.icon).filter(Boolean)}));
 assert.equal(mobileResult.fighters.length,4);assert(mobileResult.fighters.every(f=>f.clear));assert(mobileResult.icons.some(i=>i.startsWith('naruto/')));assert.deepEqual(errors,[]);
 fs.writeFileSync('tests/naruto-browser-results.json',JSON.stringify({records,mobileResult,errors},null,2));console.log(JSON.stringify({models:records.length,poses:records.length*5,mobileResult,errors}));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
