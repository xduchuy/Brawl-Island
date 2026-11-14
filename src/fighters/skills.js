'use strict';
// All simulation timing is in 60 Hz frames. Render assets never apply damage.
const FIGHTER_PROFILES = {
 yuji: ['PRESSURE', '#ff496b', 'Close the gap. Confirm a jab into Divergent Fist.', 'DIVERGENT FIST', 'BLACK FLASH RUSH', 'echo', 'rush'],
 gojo: ['SPACE CONTROL', '#8cbbff', 'Pull with Blue, repel with Red, punish with Purple.', 'BLUE', 'HOLLOW PURPLE', 'gravity', 'beam'],
 sukuna: ['SLASH CONTROL', '#ef6377', 'Threaten broad arcs, then catch recovery with Dismantle.', 'CLEAVE', 'MALEVOLENT SHRINE', 'slash', 'domain'],
 megumi: ['SHADOW TACTICS', '#8d9de2', 'Send Divine Dog, then control the ground beneath your rival.', 'SHADOW SNARE', 'CHIMERA SHADOW GARDEN', 'field', 'domain'],
 nobara: ['PRECISION', '#ffb36c', 'Nails mark a target. Resonance cashes in the mark.', 'NAIL VOLLEY', 'STRAW DOLL RESONANCE', 'projectile', 'burst'],
 toji: ['WEAPON RUSH', '#cce6d2', 'Fast footwork, measured blade pressure, no energy armor.', 'CHAIN OF A THOUSAND MILES', 'HEAVENLY EXECUTION', 'line', 'rush'],
 kenjaku: ['GRAVITY', '#c89bef', 'Compress space with gravity, then release a cursed swarm.', 'GRAVITY WELL', 'WOMB PROFUSION', 'gravity', 'domain'],
 geto: ['SUMMON CONTROL', '#b29bfc', 'Staff pressure backed by ranged spirits and Uzumaki.', 'CURSED SPIRIT', 'MAXIMUM UZUMAKI', 'projectile', 'beam'],
 mahito: ['TRANSFORMATION', '#90ded3', 'Stretch past guards and punish close range with Soul Touch.', 'TRANSFIGURATION', 'SELF EMBODIMENT', 'line', 'domain'],
 goblin: ['TRICKSTER', '#b0e978', 'Fast mace strings, a green feint dash and a dirty finisher.', 'MISCHIEF RUSH', 'EMERALD MAYHEM', 'rush', 'burst'],
 skeleton: ['HEAVY DEFENSE', '#b3d6e5', 'Long sword reach, an efficient shield and spectral pressure.', 'SPECTRAL EDGE', 'LAST WATCH', 'projectile', 'burst']
};
for(const [kind,d] of Object.entries(KIMETSU_ROSTER))FIGHTER_PROFILES[kind]=[d.style.toUpperCase(),d.color,d.group+' · '+d.skills[0]+' opens pressure; '+d.skills[1]+' controls space.',d.skills[1],d.skills[2],'arc','burst'];
const SKILLS = {}, FIGHTER_SKILLS = {};
function registerSkill(kind, slot, move, index=0) {
 const id = kind+'_'+slot+(slot==='light'?'_'+index:'');
 const radius = move.radius ?? IB_STATS[kind].reach+(move.reach??(slot==='special'?.3:0))+(index===2?.22:0);
 const skill = {...move, id, fighter:kind, category:slot, startupFrames:move.start,
  activeFrames:move.end-move.start+1, recoveryFrames:move.length-move.end,
  damage:move.damage, staminaCost:move.cost, cooldown:move.cooldown??(['special','skill2'].includes(slot)?210:slot==='ultimate'?600:0),
  hitbox:{type:move.type||'arc',radius,angle:move.arc??(kind==='goblin'&&slot==='heavy'?Math.PI:1.28),width:move.width??.7},
  animation:move.animation||slot, vfx:id, sound:move.sound||slot, hitstop:move.hitstop??(slot==='ultimate'?10:move.down?6:3),
  cameraShake:slot==='ultimate'?.32:move.down?.16:.065, label:move.label||({light:'COMBO',heavy:'HEAVY',special:kind==='goblin'?'LEAP SMASH':'SHIELD BASH'}[slot])};
 SKILLS[id]=Object.freeze(skill); return skill;
}
function configureFighter(kind) {
 const base=IB_CHARACTER_MOVES[kind]||IB_MOVES, p=FIGHTER_PROFILES[kind];
 const second={label:p[3],length:61,start:21,end:29,damage:22,cost:27,push:3.6,lunge:.25,reach:.6,cooldown:240,type:p[5]};
 if(kind==='yuji')Object.assign(second,{length:56,start:12,end:28,damage:11,cost:24,push:1.2,lunge:.6,type:'arc',pulses:[12,25],echo:true});
 if(kind==='gojo'||kind==='kenjaku')Object.assign(second,{type:'radial',radius:3.4,pull:true,push:4.2,damage:19,down:false,cooldown:270});
 if(kind==='sukuna')Object.assign(second,{type:'arc',radius:2.5,arc:2.6,damage:25,down:true});
 if(kind==='megumi')Object.assign(second,{type:'field',radius:2.8,offset:1.8,start:32,end:42,length:74,damage:21,down:true});
 if(kind==='nobara')Object.assign(second,{type:'projectile',radius:.28,range:8,speed:13,damage:18,mark:true,start:16,end:19,length:48,cooldown:170});
 if(kind==='geto'||kind==='skeleton')Object.assign(second,{type:'projectile',radius:.5,range:7,speed:8,damage:24,cooldown:260});
 if(kind==='toji')Object.assign(second,{type:'line',radius:4.1,width:.45,damage:23,start:19,end:24,length:52});
 if(kind==='mahito')Object.assign(second,{type:'line',radius:3.6,width:.8,damage:25,start:25,end:33,down:true});
 if(kind==='goblin')Object.assign(second,{type:'arc',radius:1.65,lunge:2.2,start:15,end:23,length:50,damage:20,invulnerable:6});
 const ultimate={label:p[4],length:112,start:48,end:60,damage:46,cost:25,push:7,lunge:.15,down:true,break:true,cooldown:600,ultimateCost:100,type:p[6],radius:5.4,width:1.15};
 if(p[6]==='domain')Object.assign(ultimate,{type:'radial',radius:4.7,push:4.5,damage:42,start:56,end:68,length:120});
 if(p[6]==='beam')Object.assign(ultimate,{type:'line',radius:9,width:1.05,damage:48});
 if(p[6]==='rush')Object.assign(ultimate,{type:'arc',radius:2.1,lunge:3.5,start:34,end:48,length:96,damage:48});
 if(p[6]==='burst')Object.assign(ultimate,{type:'radial',radius:3.8,damage:44});
 if(KIMETSU_ROSTER[kind]){
  const d=KIMETSU_ROSTER[kind],i=Object.keys(KIMETSU_ROSTER).indexOf(kind);
  const types={water:'arc',blood:'radial',thunder:'line',beast:'arc',flower:'arc',gun:'projectile',insect:'line',flame:'arc',sound:'radial',love:'line',mist:'field',stone:'arc',wind:'radial',serpent:'line',moon:'arc',ice:'field',compass:'radial',wood:'field',pot:'field',sickle:'projectile',obi:'line',castle:'field',darkthunder:'projectile'};
  const type=types[d.style];Object.assign(second,{type,radius:type==='projectile'?.36:type==='line'?3.9:type==='field'?2.3:2.5,width:.5,range:7.5,speed:10,offset:1.5,damage:21+i%4,start:20+i%5,end:30+i%5,length:64+i%4,lunge:type==='arc'?.8:0,down:['stone','wind','sound'].includes(d.style)});
  const rush=['zenitsu','kaigaku','rengoku','inosuke','kanao','shinobu'].includes(kind),beam=['genya','tanjiro','kokushibo','gyokko'].includes(kind);
  Object.assign(ultimate,{type:rush?'arc':beam?'line':'radial',radius:rush?2.3:beam?7:4.2,width:1.05,lunge:rush?3.2:0,start:rush?34:48,end:rush?46:60,length:rush?96:112,damage:44+i%5});
 }
 FIGHTER_SKILLS[kind]={light:base.light.map((m,i)=>registerSkill(kind,'light',m,i)),heavy:registerSkill(kind,'heavy',base.heavy),special:registerSkill(kind,'special',base.special),skill2:registerSkill(kind,'skill2',second),ultimate:registerSkill(kind,'ultimate',ultimate)};
}
// Yuji and Gojo form the initial vertical slice. Remaining fighters share validated rules.
configureFighter('yuji'); configureFighter('gojo');
for(const kind of Object.keys(IB_STATS))if(!FIGHTER_SKILLS[kind])configureFighter(kind);
function skillFor(f,action,combo=0){return action==='light'?FIGHTER_SKILLS[f.kind].light[combo]:FIGHTER_SKILLS[f.kind][action];}
function contactTest(a,t,m,origin=a) {
 const dx=t.x-origin.x,dz=t.z-origin.z,dist=Math.hypot(dx,dz),h=m.hitbox;
 if(h.type==='radial'||h.type==='field')return dist<=h.radius;
 const forward=dx*Math.sin(a.angle)+dz*Math.cos(a.angle),side=dx*Math.cos(a.angle)-dz*Math.sin(a.angle);
 if(h.type==='line')return forward>=-.2&&forward<=h.radius&&Math.abs(side)<=h.width;
 return dist<h.radius&&Math.abs(angleDelta(a.angle,Math.atan2(dx,dz)))<h.angle;
}
