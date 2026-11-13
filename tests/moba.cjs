const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=require('node:path').resolve(__dirname,'..'),c={};vm.createContext(c);vm.runInContext(['src/fighters/roster.js','src/fighters/skills.js','src/combat/match.js'].map(p=>fs.readFileSync(root+'/'+p,'utf8')).join('\n')+';this.B=BrawlMatch;this.skills=SKILLS;',c);
const icons=JSON.parse(fs.readFileSync(root+'/assets/ui/skills/manifest.json')),vfx=JSON.parse(fs.readFileSync(root+'/assets/vfx/manifest.json'));
assert.equal(icons.icons.length,38);const hashes=new Set();for(const entry of icons.icons){const bytes=fs.readFileSync(root+'/'+entry.icon);assert.equal(bytes.readUInt32BE(16),128);assert.equal(bytes.readUInt32BE(20),128);assert.equal(bytes[25],6);hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));if(entry.skillId){const s=c.skills[entry.skillId];assert.equal(entry.cooldown,s.cooldown);assert.equal(entry.label,s.label);assert.equal(entry.staminaCost,s.cost);}}
assert.equal(hashes.size,38);const sig=Object.entries(vfx.assets).filter(([key])=>!key.startsWith('common/'));assert.equal(new Set(sig.map(([,a])=>crypto.createHash('sha256').update(fs.readFileSync(root+'/'+a.path)).digest('hex'))).size,33);
function ready(kind){const m=new c.B({gameMode:'training',seed:222,slots:[{kind,controller:'p1'},{kind:'gojo',controller:'p2'}]});m.phase='fight';Object.assign(m.fighters[0],{x:0,z:0,angle:0,ultimate:100});Object.assign(m.fighters[1],{x:6,z:0});return m;}
for(const entry of icons.icons.filter(e=>e.skillId)){
 const m=ready(entry.fighter),f=m.fighters[0],s=c.skills[entry.skillId];m.step({p1:{action:entry.slot,aim:{x:-1,z:0}}});assert.equal(f.move.id,entry.skillId);if(s.hitbox.type!=='radial')assert.equal(f.angle,-Math.PI/2);assert.equal(f.cooldowns[entry.slot],s.cooldown);
 const n=ready(entry.fighter);n.step({p1:{action:entry.slot,aim:{x:-1,z:0}}});for(let tick=0;tick<160;tick++){const input={p1:{x:Math.sin(tick)*.2}};m.step(input);n.step(input);}assert.equal(JSON.stringify(m),JSON.stringify(n),'aim deterministic '+entry.skillId);
}
// Buffer retains aim through hit recovery; malformed input cannot poison the pose.
{const m=ready('gojo'),f=m.fighters[0];f.state='hit';f.frame=14;m.step({p1:{action:'special',aim:{x:0,z:-1}}});for(let i=0;i<3;i++)m.step();assert.equal(f.angle,Math.PI);}
{const m=ready('gojo'),f=m.fighters[0];m.step({p1:{action:'special',aim:{x:Infinity,z:NaN}}});assert(Number.isFinite(f.angle));}
console.log('38 RGBA icons; 33 unique signatures; registry mappings; all directional commands; buffered aim; deterministic replay passed');
