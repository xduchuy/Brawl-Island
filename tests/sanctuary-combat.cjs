const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),THREE=require('../vendor/three.r128.min.js');
const read=p=>fs.readFileSync(p,'utf8');
const factory=read('src/maps/drowned-sanctuary/index.js').replace('/* SANCTUARY_GEOMETRY */',()=>read('src/maps/drowned-sanctuary/geometry.js')).replace('/* SANCTUARY_AMBIENCE */',()=>read('src/maps/drowned-sanctuary/ambience.js'));
const ctx={THREE};vm.createContext(ctx);vm.runInContext(['src/fighters/roster.js','src/fighters/skills.js','src/combat/match.js','src/maps/drowned-sanctuary/navigation.js'].map(read).join('\n')+'\n'+factory+'\n'+read('src/maps/drowned-sanctuary/combat.js').split('const sanctuaryCombat=')[0]+'\nthis.make=createDrownedSanctuary;this.rules=createSanctuaryRules;this.Match=BrawlMatch;',ctx);
const map=ctx.make({THREE,quality:'low'}),rules=ctx.rules(map),out=[];
assert.equal(rules.spawnPoints.length,4);
for(const mode of [1,2]){
 const m=new ctx.Match({arena:'drowned-sanctuary',arenaRules:rules,mode,rounds:1,seed:123+mode,slots:Array.from({length:4},(_,i)=>({kind:i%2?'skeleton':'yuji',controller:'ai'}))});m.start();
 assert(m.fighters.every(f=>map.isClear(f.x,f.y,f.z,.3)));
 let hits=0;for(let tick=0;tick<6200&&m.phase!=='over';tick++){m.step();hits+=m.events.filter(e=>e.type==='hit').length;m.events.length=0;if(tick%60===0)for(const f of m.fighters)if(!f.dead){assert(rules.ground(f.x,f.z)!==null);assert(map.isClear(f.x,f.y,f.z,.3));}}
 assert(hits>0,'AI must navigate the ruins and land attacks');assert.equal(m.phase,'over');assert(m.fighters.every(f=>!f.fall),'ruin boundary must not use Skyreach ring-out');out.push({mode,hits,ticks:m.tick,score:m.score});
}
// Sweep a large knockback through the central monument: endpoint must stay on navigable ground.
const f={...rules.spawnPoints[0],id:0,vx:100,vz:100};const old={...f};f.x=0;f.z=4;rules.constrain(f,old.x,old.z);assert(map.isClear(f.x,f.y,f.z,.3));assert(rules.ground(f.x,f.z)!==null);
assert(!rules.canHit({x:0,y:-.73,z:-6},{x:0,y:-.73,z:6}),'attacks cannot pass through the statue');
const training=new ctx.Match({arena:'drowned-sanctuary',arenaRules:rules,gameMode:'training'});training.start();training.phase='fight';training.fighters[0].dead=true;training.fighters[0].hp=0;training.step();assert.equal(training.fighters[0].x,rules.spawnPoints[0].x);assert.equal(training.fighters[0].y,rules.spawnPoints[0].y);
map.dispose();console.log(JSON.stringify({out,grounded:true,occlusion:true,trainingRespawn:true}));
