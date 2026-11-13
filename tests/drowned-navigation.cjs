const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const THREE=require('../vendor/three.r128.min.js');
const context={};vm.runInNewContext(fs.readFileSync('src/maps/drowned-sanctuary/navigation.js','utf8')+';globalThis.build=buildSanctuaryNavigation;',context);
function box(w,h,d,x,y,z){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);return new THREE.Mesh(g);}
const floor=box(12,.2,12,0,-.1,0),wall=box(.4,3,8,0,1.5,-2);
const nav=context.build(THREE,[floor,wall],null,[]);
assert(nav.walkableSurfaces.some(p=>p.x<-2)&&nav.walkableSurfaces.some(p=>p.x>2),'route must connect both sides through the opening');
assert.equal(nav.isClear(0,0,0),false,'capsule may not intersect a wall');
assert.equal(nav.isClear(0,0,4),true,'open passage must remain accessible');
assert.equal(nav.sampleGround(50,50),null,'deep water has no fabricated ground');
assert.equal(nav.spawnPoints.length,4);assert(nav.spawnPoints.every(p=>nav.isClear(p.x,p.y,p.z)));
const closedWall=box(.4,3,15,0,1.5,0),split=context.build(THREE,[floor,closedWall],null,[]);
assert(split.navigation.components.length>=2,'wall must split navigation');
assert(!split.walkableSurfaces.some(p=>p.x<-.5)||!split.walkableSurfaces.some(p=>p.x>.5),'selected connected component cannot cross solid wall');
const lowRoof=box(12,.2,12,0,1.2,0),blocked=context.build(THREE,[floor,lowRoof],null,[]);
assert(!blocked.walkableSurfaces.some(p=>p.y<.1),'reject floor with insufficient headroom');
console.log('Drowned Sanctuary: wall clearance, open passage, graph connectivity, water boundary, headroom and spawn checks passed.');
