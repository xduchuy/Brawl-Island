'use strict';
/* Deterministic source-space map contract verification. No Three.js dependency. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const map=require('../maps/witch-cauldron/map-contract.js');
const dir=path.join(__dirname,'../maps/witch-cauldron');
const read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const source=read('source-reference.html'),preview=read('preview.html');
assert.equal(map.id,'witch_cauldron');
assert.equal(map.combatIntegration,'deferred');
assert.equal(map.dynamicHazards,false);
assert.equal(map.landmarks.find(p=>p.id==='cauldron').x,0);
assert.equal(map.landmarks.find(p=>p.id==='cauldron').z,2);
assert.equal(map.landmarks.find(p=>p.id==='witch-hut').x,-21);
assert.equal(map.landmarks.find(p=>p.id==='witch-hut').z,-17);
assert.equal(map.surfaceHeight(-21,-17),2);
assert.equal(map.spawnPoints.length,4);
assert.equal(map.blockers.length,21);
assert.equal(map.canWalk(0,2),false,'cauldron must be solid');
assert.equal(map.canWalk(-21,-17),false,'witch hut must be solid');
assert.equal(map.canWalk(50,0),false,'no walking outside island');
assert.equal(map.canWalk(18,1),true,'open side lane');
for(const p of map.spawnPoints) assert.equal(map.canWalk(p.x,p.z),true,'unsafe spawn '+p.id);
const routes=[
  [map.spawnPoints[0],map.spawnPoints[1]],
  [map.spawnPoints[2],map.spawnPoints[3]],
  [map.spawnPoints[0],map.spawnPoints[2]],
  [map.spawnPoints[1],map.spawnPoints[3]]
];
for(const [a,b] of routes){
 const route=map.findReachable(a,b);
 assert.ok(route&&route.length>2,'disconnected '+a.id+' -> '+b.id);
 for(const p of route)assert.ok(map.canWalk(p.x,p.z),'path crosses a solid '+a.id+' -> '+b.id);
}
for(const p of map.spawnAnchors()){
 assert.equal(Number.isFinite(p.world.x)&&Number.isFinite(p.world.z),true);
 assert.ok(Math.abs(p.world.x-map.scale*p.x)<1e-7);
}
for(const f of ['map-lab.css','map-lab.js']) assert.ok(fs.existsSync(path.join(dir,f)),f+' missing');
assert.ok(source.includes('function buildStaticWorld()'),'source geometry must be preserved');
assert.ok(source.includes('function renderSceneAt(rawTime)'),'original animation runner must be preserved');
for(const feature of ['potion','mushrooms','candles','treeCrowns','hutWindowVoxels','moonVoxels']){
 assert.ok(source.includes(feature),'missing animated original feature '+feature);
}
assert.ok(preview.includes('window.WitchCauldronScene'),'preview controls must be available');
assert.ok(preview.includes('map-contract.js')&&preview.includes('map-lab.js'),'missing lab scripts');
assert.ok(!preview.includes('BrawlMatch'),'map lab must not contain fighters/combat runtime');
console.log(JSON.stringify({ok:true,spawns:map.spawnAnchors().map(p=>p.id),blockers:map.blockers.length,connectedRoutes:routes.length,animatedSystems:map.animatedSystems.length,mode:'map-only'},null,2));
