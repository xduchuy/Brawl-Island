// Map-specific simulation adapter: no renderer or wall-clock dependency.
function createSanctuaryRules(map) {
 const step=map.navigation.resolution,key=(x,z)=>Math.round(x/step)+','+Math.round(z/step);
 const cells=new Map(map.walkableSurfaces.map(c=>[key(c.x,c.z),c]));
 const links=new Map();
 for(const [k,c] of cells){const out=[];for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){const n=cells.get(key(c.x+dx,c.z+dz));if(n&&Math.abs(n.y-c.y)<=.4&&[.25,.5,.75].every(t=>map.isClear(c.x+(n.x-c.x)*t,c.y+(n.y-c.y)*t,c.z+(n.z-c.z)*t)))out.push(key(n.x,n.z));}links.set(k,out);}
 const spawnPoints=[map.spawnPoints.find(s=>s.side==='north'&&s.primary),map.spawnPoints.find(s=>s.side==='south'&&s.primary),map.spawnPoints.find(s=>s.side==='north'&&!s.primary),map.spawnPoints.find(s=>s.side==='south'&&!s.primary)];
 function valid(x,z,from){const c=cells.get(key(x,z));if(!c)return null;const fk=key(from.x,from.z),ck=key(x,z);if(fk!==ck&&!(links.get(fk)||[]).includes(ck))return null;return map.isClear(x,c.y,z,.3)?c:null;}
 function constrain(f,oldX,oldZ){
  let x=oldX,z=oldZ;const dx=f.x-x,dz=f.z-z,n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));let y=cells.get(key(x,z))?.y;
  if(y===undefined){const s=spawnPoints[f.id];x=s.x;z=s.z;y=s.y;}
  for(let i=0;i<n;i++){const from={x,z};let c=valid(x+dx/n,z+dz/n,from);if(c){x+=dx/n;z+=dz/n;y=c.y;}else{c=valid(x+dx/n,z,from);if(c){x+=dx/n;y=c.y;}c=valid(x,z+dz/n,{x,z});if(c){z+=dz/n;y=c.y;}f.vx=f.vz=0;}}
  f.x=x;f.z=z;f.y=y;
 }
 function canHit(a,b){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.25));for(let i=1;i<=n;i++){const t=i/n;if(!map.isClear(a.x+(b.x-a.x)*t,(a.y||0)+((b.y||0)-(a.y||0))*t,a.z+(b.z-a.z)*t,.04))return false;}return true;}
 function steer(f,t){
  const start=key(f.x,f.z),goal=key(t.x,t.z);if(start===goal)return{x:t.x-f.x,z:t.z-f.z};
  const parent=new Map([[goal,null]]),queue=[goal];for(let i=0;i<queue.length&&!parent.has(start);i++)for(const k of links.get(queue[i])||[])if(!parent.has(k)){parent.set(k,queue[i]);queue.push(k);}
  const next=cells.get(parent.get(start));if(!next)return{x:0,z:0};const dx=next.x-f.x,dz=next.z-f.z,d=Math.hypot(dx,dz)||1;return{x:dx/d,z:dz/d};
 }
 return {spawnPoints,constrain,canHit,steer,ground(x,z){return cells.get(key(x,z))?.y??null;}};
}
const sanctuaryCombat={map:null,rules:null,time:0,quality:null};
function prepareSanctuaryCombat(id){
 const c=sanctuaryCombat;
 if(id!=='drowned-sanctuary'){if(c.map){c.map.dispose();c.map=null;c.rules=null;resize();}return null;}
 if(!c.map){c.map=createDrownedSanctuary({THREE,renderer,quality:'low'});c.map.metadata.previewOnly=false;c.map.setReducedMotion(matchMedia('(prefers-reduced-motion: reduce)').matches);c.rules=createSanctuaryRules(c.map);c.time=0;c.quality='low';}
 return c.rules;
}
function renderSanctuaryCombat(){
 const c=sanctuaryCombat;if(!c.map)return false;
 const quality=mobile.device?'low':rf.quality==='high'?'medium':'low';if(c.quality!==quality){c.map.setQuality(quality);c.quality=quality;}
 const rect=$('stage').getBoundingClientRect(),scale=quality==='low'?.7:1,w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));if(renderer.domElement.width!==w||renderer.domElement.height!==h)renderer.setSize(w,h,false);
 // Dynamic objects remain owned by the game. Reparent only for this render, then restore.
 const objects=[...actors.flatMap(a=>[a.g,a.trail,...a.renderBatches.map(b=>b.mesh)]),...contactShadows,...debugBoxes,...vfx.pool.items.map(i=>i.mesh),skillIndicators.group];
 const parents=objects.map(o=>o.parent),offsets=[];
 for(const item of vfx.pool.items)if(item.active){const y=c.rules.ground(item.mesh.position.x,item.mesh.position.z)||0;offsets.push([item.mesh,y]);item.mesh.position.y+=y;}
 const saved={toneMapping:renderer.toneMapping,toneMappingExposure:renderer.toneMappingExposure,outputEncoding:renderer.outputEncoding,physicallyCorrectLights:renderer.physicallyCorrectLights};
 try{
  objects.forEach(o=>c.map.scene.add(o));renderer.setRenderTarget(null);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.outputEncoding=THREE.sRGBEncoding;renderer.physicallyCorrectLights=true;renderer.render(c.map.scene,camera);
 }finally{objects.forEach((o,i)=>parents[i]?.add(o));offsets.forEach(([o,y])=>o.position.y-=y);Object.assign(renderer,saved);}
 return true;
}
