const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try{const results=[];
  for(const mobile of [false,true]){
   const p=await b.newPage({viewport:mobile?{width:844,height:390}:{width:1100,height:760},isMobile:mobile,hasTouch:mobile}),errors=[];
   p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await p.setContent(fs.readFileSync('index.html','utf8'));await p.waitForFunction(()=>window.__ib);
   await p.selectOption('#arenaMode','drowned-sanctuary');
   assert(await p.evaluate(()=>{const r=document.getElementById('stage').getBoundingClientRect(),aim=__ib.skillAim.ground(r.x+r.width/2,r.y+r.height/2);return Math.abs(aim.y-__ib.match.fighters[0].y)<1e-6;}),'skill aiming must use the fighter ground height');
   for(const team of mobile?[false]:[false,true]){
    await p.evaluate(team=>{
     if(team){__ib.mobile.exit();document.querySelector('[data-mode="2"]').click();}
     document.querySelectorAll('.controller').forEach(e=>e.value='ai');__ib.start();__ib.setManualClock(true);__ib.step(1100);
     for(let i=0;i<6;i++)__ib.visualStep(.2);
    },team);
    await p.evaluate(()=>{__ib.match.paused=true;__ib.setManualClock(false);});
    await p.screenshot({path:'docs/screenshots/drowned-sanctuary/combat-'+(team?'teams':mobile?'mobile':'desktop')+'.png',timeout:120000});
    await p.evaluate(()=>{__ib.setManualClock(true);__ib.match.paused=false;});
    const result=await p.evaluate(()=>({arena:__ib.match.arena,phase:__ib.match.phase,fighters:__ib.match.fighters.map(f=>({x:f.x,y:f.y,z:f.z,hp:f.hp,clear:__ib.sanctuaryCombat.map.isClear(f.x,f.y,f.z,.3)})),map:!!__ib.sanctuaryCombat.map,canvasCount:document.querySelectorAll('#game').length}));
    assert.equal(result.arena,'drowned-sanctuary');assert(result.map);assert.equal(result.canvasCount,1);assert.equal(result.fighters.length,team?4:2);assert(result.fighters.every(f=>f.clear));
    results.push({mobile,team,...result});
   }
   const before=await p.evaluate(()=>JSON.stringify(__ib.match));
   await p.evaluate(()=>__ib.openSanctuary());await p.waitForFunction(()=>__ib.sanctuaryPreview.map,null,{timeout:120000});
   await p.evaluate(()=>__ib.closeSanctuary());assert.equal(await p.evaluate(()=>JSON.stringify(__ib.match)),before);
   // Human input is constrained by the same adapter as AI and knockback.
   assert(await p.evaluate(()=>{const f=__ib.match.fighters[0];f.controller='p1';__ib.match.phase='fight';f.dead=false;f.hp=100;for(let i=0;i<90;i++)__ib.match.step({p1:{x:1,z:0,action:i===0?'dash':undefined}});return !f.fall&&__ib.sanctuaryCombat.map.isClear(f.x,f.y,f.z,.3);}));
   await p.evaluate(()=>{__ib.mobile.exit();document.getElementById('arenaMode').value='skyreach';document.getElementById('arenaMode').dispatchEvent(new Event('change'));__ib.setManualClock(true);__ib.visualStep(0);});
   assert(await p.evaluate(()=>!__ib.sanctuaryCombat.map&&__ib.match.arena==='skyreach'));assert.deepEqual(errors,[]);await p.close();
  }
  console.log(JSON.stringify(results));fs.writeFileSync('tests/sanctuary-playable-results.json',JSON.stringify(results,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
