const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:667,height:375},isMobile:true,hasTouch:true}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.setContent(fs.readFileSync('index.html','utf8'));await p.waitForFunction(()=>window.__ib);
  const before=await p.evaluate(()=>{__ib.setManualClock(true);return JSON.stringify(__ib.match);}),cycles=[];
  // Cancellation while geometry initialization is still queued must not orphan a map.
  await p.evaluate(()=>{__ib.openSanctuary();__ib.closeSanctuary();});
  for(let cycle=0;cycle<2;cycle++){
   await p.evaluate(()=>{document.getElementById('sanctuaryQuality').value='low';__ib.openSanctuary();});
   await p.waitForFunction(()=>__ib.sanctuaryPreview.map,null,{timeout:180000});
   const performance=await p.evaluate(async()=>{
    const times=[];let previous=await new Promise(requestAnimationFrame);
    for(let i=0;i<20;i++){const now=await new Promise(requestAnimationFrame);if(i>=5)times.push(now-previous);previous=now;}
    const meanFrameMs=times.reduce((a,b)=>a+b,0)/times.length;return{meanFrameMs,fps:1000/meanFrameMs,frames:times.length};
   });
   if(cycle===0)await p.screenshot({path:'docs/screenshots/drowned-sanctuary/mobile-preview.png'});
   const result=await p.evaluate(()=>{
    const p=__ib.sanctuaryPreview,m=p.map;
    const clocks=[];
    for(const t of [11.99,12.01,125]){m.update(.016,t);clocks.push(m.scene.children.find(o=>o.material?.uniforms?.uTime).material.uniforms.uTime.value);}
    m.setReducedMotion(true);m.update(.016,130);const reducedClock=m.scene.children.find(o=>o.material?.uniforms?.uTime).material.uniforms.uTime.value;m.setReducedMotion(false);
    p.paused=true;const time=p.time;__ib.renderSanctuary(.1);const paused=p.time===time;p.paused=false;
    m.activateRelic(0);m.activateRelic(1);const awakened=m.activateRelic(2);
    const spawns=m.spawnPoints.map(s=>({...s,ground:m.sampleGround(s.x,s.z),clear:m.isClear(s.x,s.y,s.z),connected:m.walkableSurfaces.some(c=>c.x===s.x&&c.z===s.z)}));
    const low={...p.metrics};m.setQuality('high');__ib.renderSanctuary(0);const high={...p.metrics};m.setQuality('low');__ib.renderSanctuary(0);
    return{spawns,awakened,clocks,reducedClock,paused,navCells:m.walkableSurfaces.length,componentCount:m.navigation.components.length,low,high,landmarks:m.metadata.landmarks};
   });
   assert.equal(result.spawns.length,4);assert(result.spawns.every(s=>Number.isFinite(s.ground)&&s.clear&&s.connected));
   assert.equal(result.spawns.filter(s=>s.side==='north').length,2);assert.equal(result.spawns.filter(s=>s.side==='south').length,2);
   assert(result.awakened&&result.paused);assert.deepEqual(result.clocks,[11.99,12.01,125]);assert.equal(result.reducedClock,0);
   assert(result.high.triangles>result.low.triangles,'quality tiers must affect renderer workload');
   await p.click('[data-sanctuary=hide]');assert(await p.locator('[data-sanctuary=close]').isVisible());
   await p.click('[data-sanctuary=close]');
   assert.equal(await p.evaluate(()=>JSON.stringify(__ib.match)),before);
   const memoryAfter=await p.evaluate(()=>{__ib.render();return{...__ib.renderer.info.memory};});
   cycles.push({...result,performance,memoryAfter});
  }
  assert.deepEqual(cycles[0].spawns,cycles[1].spawns,'same seed must reproduce grounded anchors');
  assert.deepEqual(cycles[0].memoryAfter,cycles[1].memoryAfter,'GPU resource counts must return to the same level after disposal');
  assert.deepEqual(errors,[]);
  fs.writeFileSync('tests/drowned-lifecycle-results.json',JSON.stringify({cycles,errors,environment:'Chromium / SwiftShader / 667x375 touch emulation / low'},null,2));
  console.log(JSON.stringify({cycles:cycles.map(c=>({spawns:c.spawns,performance:c.performance,memoryAfter:c.memoryAfter})),errors}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
