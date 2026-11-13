const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const shots='docs/screenshots/drowned-sanctuary';
const referenceCache=path.join(os.tmpdir(),'sanctuary-reference');
async function measure(page,reference=false){
 return page.evaluate(async reference=>{
  const times=[];let previous=await new Promise(requestAnimationFrame);
  for(let i=0;i<20;i++){const now=await new Promise(requestAnimationFrame);if(i>=5)times.push(now-previous);previous=now;}
  const meanFrameMs=times.reduce((a,b)=>a+b,0)/times.length;
  const renderer=reference?window.__reference.renderer:__ib.renderer;
  return{meanFrameMs,fps:1000/meanFrameMs,frames:times.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,memory:{...renderer.info.memory}};
 },reference);
}
(async()=>{
 fs.mkdirSync(shots,{recursive:true});
 // r160 is used only in this isolated reference page, never in the production build.
 if(!process.env.SKIP_REFERENCE){
  fs.mkdirSync(referenceCache,{recursive:true});
  for(const [name,url] of Object.entries({
   'three.js':'build/three.module.js',
   'OrbitControls.js':'examples/jsm/controls/OrbitControls.js',
   'BufferGeometryUtils.js':'examples/jsm/utils/BufferGeometryUtils.js'
  }))if(!fs.existsSync(path.join(referenceCache,name)))execFileSync('curl',['--fail','--location','--silent','--show-error','https://cdn.jsdelivr.net/npm/three@0.160.0/'+url,'--output',path.join(referenceCache,name)]);
 }
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:1000,height:700}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route('https://cdn.jsdelivr.net/**',r=>{const n=r.request().url().split('/').at(-1);return r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(referenceCache,n==='three.module.js'?'three.js':n))});});
  let reference;
  if(!process.env.SKIP_REFERENCE){
   const source=fs.readFileSync('reference/drowned-sanctuary/source.html','utf8').replace('const controls=new OrbitControls','window.__reference={renderer};const controls=new OrbitControls');
   await p.setContent(source);
   await p.waitForSelector('#loading-screen.hidden',{timeout:120000});
   for(const mode of ['hero','arch','wide']){await p.click('[data-mode='+mode+']');await p.screenshot({path:shots+'/source-'+mode+'.png'});if(mode==='hero')reference=await measure(p,true);}
   fs.writeFileSync('tests/drowned-source-results.json',JSON.stringify({environment:'Chromium / SwiftShader / 1000x700',reference},null,2));
  }
  await p.goto('about:blank');errors.length=0;
  await p.setContent(fs.readFileSync('index.html','utf8'));await p.waitForFunction(()=>window.__ib);
  await p.click('#sanctuaryPreviewButton');
  await p.waitForFunction(()=>__ib.sanctuaryPreview.map,null,{timeout:120000});
  const performance=await measure(p);
  const report=await p.evaluate(()=>({metadata:__ib.sanctuaryPreview.map.metadata,spawns:__ib.sanctuaryPreview.map.spawnPoints,nav:__ib.sanctuaryPreview.map.navigation,metrics:__ib.sanctuaryPreview.metrics}));
  report.nav.unreachableSamples=report.nav.unreachableSamples.length;report.performance=performance;report.environment='Chromium / SwiftShader / 1000x700 / medium';
  for(const mode of ['hero','arch','wide','top','gameplay','statue','roots','courtyard']){
   await p.evaluate(mode=>{__ib.sanctuaryCameraPreset(mode,true);__ib.renderSanctuary(0);},mode);
   await p.screenshot({path:shots+'/integrated-'+mode+'.png'});
  }
  await p.evaluate(()=>{__ib.sanctuaryCameraPreset('top',true);document.querySelector('[data-sanctuary=debug]').click();__ib.renderSanctuary(0);});
  await p.screenshot({path:shots+'/walkable-top.png'});await p.click('[data-sanctuary=debug]');
  for(const mood of ['dusk','moonlight','dawn']){
   await p.evaluate(mood=>{__ib.sanctuaryCameraPreset('hero',true);document.getElementById('sanctuaryMood').value=mood;__ib.sanctuaryPreview.map.setMood(mood);for(let i=0;i<90;i++)__ib.sanctuaryPreview.map.update(.1,30+i*.1);__ib.renderSanctuary(0);},mood);
   await p.screenshot({path:shots+'/'+mood+'.png'});
  }
  await p.click('[data-sanctuary=close]');assert(!await p.evaluate(()=>__ib.sanctuaryPreview.active));
  assert.deepEqual(errors,[]);report.errors=errors;
  fs.writeFileSync('tests/drowned-results.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({performance,spawns:report.spawns,errors}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
