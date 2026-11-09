const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={};vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname+'/../index.html','utf8').match(/<script id="combat-engine">([\s\S]*?)<\/script>/)[1]+';this.B=BrawlMatch;this.skills=SKILLS;this.stats=IB_STATS;this.hit=contactTest;',context);
const {B,skills,stats}=context,checks=[];
function ready(kind='yuji',extra={}){const m=new B({rounds:1,slots:[{kind,controller:'p1'},{kind:'skeleton',controller:'p2'}],...extra});m.start();for(let i=0;i<151;i++)m.step();const[a,b]=m.fighters;Object.assign(a,{x:-.5,z:0,angle:Math.PI/2});Object.assign(b,{x:.5,z:0,angle:-Math.PI/2});m.events.length=0;return m;}
assert.equal(Object.keys(skills).length,77);
for(const kind of Object.keys(stats))for(const action of ['light','heavy','special','skill2','ultimate']){
 const m=ready(kind),[a,b]=m.fighters;a.ultimate=100;assert(m.attack(a,action));const skill=a.move;
 assert(skill.start>0&&skill.end>=skill.start&&skill.length>skill.end);assert(skill.animation&&skill.vfx&&skill.sound&&skill.hitbox);
 while(a.frame<skill.start-1){m.step();assert.equal(b.hp,112,kind+' '+action+' premature damage');}
 for(let i=0;i<180&&m.phase!=='over';i++)m.step();assert(b.hp<112,kind+' '+action+' failed contact');
 const hits=m.events.filter(e=>e.type==='hit');assert(hits.length<=(skill.pulses?.length||1));
 const hp=b.hp;for(let i=0;i<80;i++)m.step();assert.equal(b.hp,hp,'damage after recovery');
}
checks.push('55 base attacks: startup safety, collision, one contact per pulse, no recovery damage');
for(const kind of Object.keys(stats))for(let combo=1;combo<3;combo++){
 const m=ready(kind),[a,b]=m.fighters;m.attack(a,'light');a.frame=a.move.chain;a.combo=combo-1;assert(m.attack(a,'light'));assert.equal(a.combo,combo);for(let n=0;n<70;n++)m.step();assert(b.hp<112);
}
checks.push('22 light combo follow-ups execute; all 77 registry entries exercised');
{
 const m=ready(),[a,b]=m.fighters;assert(!m.attack(a,'ultimate'));a.ultimate=100;a.stamina=24;assert(!m.attack(a,'ultimate'));assert.equal(a.ultimate,100);a.stamina=100;assert(m.attack(a,'ultimate'));assert.equal(a.ultimate,0);assert(!m.attack(a,'ultimate'));for(let i=0;i<130;i++)m.step();a.stamina=100;assert(!m.attack(a,'ultimate'));assert(a.ultimate===0,'ultimate must not refund its own meter');
}
checks.push('Ultimate requires meter and stamina, consumes once, never refunds its damage');
{
 const m=ready(),a=m.fighters[0];assert(m.attack(a,'special'));a.state='idle';a.stamina=100;assert(!m.attack(a,'special'));for(let i=0;i<220;i++)m.step();a.state='idle';a.stamina=0;assert(!m.attack(a,'special'));a.stamina=100;assert(m.attack(a,'special'));
}
checks.push('Cooldown and stamina gates independently reject recasts');
{
 const m=ready(),[a,b]=m.fighters;m.attack(a,'light');while(a.frame<7)m.step();m.step({p2:{block:true}});for(let i=0;i<5;i++)m.step({p2:{block:true}});assert(m.events.some(e=>e.type==='parry'));assert.equal(b.hp,112);assert(b.counter>0);assert.equal(a.state,'blocked');
}
checks.push('Timed parry prevents damage, staggers attacker and opens counter window');
{
 const m=ready(),[a,b]=m.fighters;m.attack(a,'light');while(a.frame<=a.move.end)m.step();assert(a.confirmed);assert(m.attack(a,'skill2'));
 const miss=ready(),[c,d]=miss.fighters;d.x=8;miss.attack(c,'light');while(c.frame<=c.move.end)miss.step();assert(!c.confirmed);assert(!miss.attack(c,'skill2'));
}
checks.push('Light-to-special cancel requires confirmed contact; whiffs stay punishable');
{
 const m=ready(),a=m.fighters[0];m.step({p1:{action:'heavy',heavyHeld:true}});assert.equal(a.state,'charge');for(let i=0;i<40;i++)m.step({p1:{heavyHeld:true}});m.step({p1:{heavyHeld:false}});assert.equal(a.state,'attack');assert(a.move.damage>skills.yuji_heavy.damage);
}
checks.push('Held heavy charges, release enters startup with increased damage');
{
 const m=ready(),[a,b]=m.fighters;const move=skills.yuji_light_0;for(let i=0;i<7;i++)m.hit({attacker:a,target:b,move});assert.equal(b.state,'down');const hits=m.events.filter(e=>e.type==='hit');assert(hits[5].damage<hits[0].damage);
}
checks.push('Combo scaling and forced knockdown bound extended strings');
{
 const m=ready('nobara'),[a,b]=m.fighters;a.x=0;b.x=4;m.attack(a,'skill2');while(a.frame<a.move.start)m.step();assert.equal(b.hp,112);assert.equal(m.projectiles.length,1);for(let i=0;i<40;i++)m.step();assert(b.hp<112&&b.markUntil>m.tick);
 const beam=skills.gojo_ultimate;assert(!context.hit({x:0,z:0,angle:Math.PI/2},{x:3,z:3},beam));assert(context.hit({x:0,z:0,angle:Math.PI/2},{x:3,z:0},beam));
}
checks.push('Nails travel before collision and mark targets; beam has a narrow directional hitbox');
{
 const m=ready('yuji',{arena:'sanctum'}),a=m.fighters[0];a.x=10.3;a.vx=8;m.step();assert(!a.dead&&a.x<=9.4);assert(m.events.some(e=>e.type==='wall'));
 const t=ready('yuji',{gameMode:'training',training:{unlimited:true}});t.fighters[0].hp=0;t.fighters[0].dead=true;t.step();assert(!t.fighters[0].dead);t.step();assert.equal(t.fighters[0].ultimate,100);assert.equal(t.phase,'fight');
}
checks.push('Sealed arena bounces; training resets KO and supports unlimited resources');
const seeded=[];
for(const arena of ['skyreach','sanctum'])for(const mode of [1,2])for(let seed=1;seed<=8;seed++){
 const slots=Object.keys(stats).slice(seed%7,seed%7+4).map(kind=>({kind,controller:'ai'}));const m=new B({arena,mode,seed,slots,rounds:1});m.start();while(m.phase!=='over'&&m.tick<24000){m.step();m.events.length=0;}assert.equal(m.phase,'over');seeded.push({arena,mode,seed,winner:m.results[0].winner,ticks:m.tick});
}
checks.push('32 seeded AI matches complete across both arenas and 1v1/2v2');
function snapshot(){const m=new B({mode:2,seed:729,slots:['yuji','gojo','nobara','geto'].map(kind=>({kind,controller:'ai'}))});m.start();for(let i=0;i<2200;i++){m.step();m.events.length=0;}return JSON.stringify(m.fighters.map(f=>[f.hp,f.x,f.z,f.stamina,f.ultimate,f.state]));}
assert.equal(snapshot(),snapshot());checks.push('Identical seed produces identical fixed-step state');
const manifest=JSON.parse(fs.readFileSync(__dirname+'/../assets/vfx/manifest.json'));for(const s of Object.values(skills)){const binding=manifest.skills[s.id];assert(binding);for(const key of [binding.asset,binding.startup,binding.impact])assert(fs.existsSync(__dirname+'/../'+manifest.assets[key].path));}
checks.push('All 77 skills resolve their startup, release and impact asset files');
fs.writeFileSync(__dirname+'/reforged-results.json',JSON.stringify({checks,matches:seeded},null,2));console.log(checks.join('\n'));
