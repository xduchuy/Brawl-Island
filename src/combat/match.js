class BrawlMatch {
 constructor(config={}) {
  this.seed=config.seed||1; this.rng=rng32(this.seed); this.mode=config.mode||1; this.rounds=config.rounds||2;
  this.difficulty=config.difficulty||'normal'; this.arena=config.arena||'skyreach';this.arenaRules=config.arenaRules||null;
  this.gameMode=config.gameMode||'versus'; this.training={dummy:'stand',unlimited:false,...config.training};
  this.slots=config.slots||[{kind:'goblin',controller:'p1'},{kind:'skeleton',controller:'ai'},{kind:'skeleton',controller:'ai'},{kind:'goblin',controller:'ai'}];
  this.events=[];this.results=[];this.score=[0,0];this.round=1;this.tick=0;this.phase='ready';this.phaseTick=0;this.time=5940;this.paused=false;this.hitstop=0;
  this.resetFighters();
 }
 emit(type,data={}){this.events.push({type,tick:this.tick,...data});}
 resetFighters(){
  this.projectiles=[];this.projectileId=0;
  this.fighters=this.slots.slice(0,this.mode*2).map((s,i)=>({id:i,team:i%2,kind:s.kind,controller:s.controller,stats:IB_STATS[s.kind],hp:IB_STATS[s.kind].hp,stamina:100,
   x:i%2?2.8:-2.8,z:i>1?2:-.8,y:0,angle:i%2?-Math.PI/2:Math.PI/2,state:'idle',frame:0,combo:0,move:null,buffer:null,hitIds:new Set(),
   vx:0,vz:0,mx:0,mz:0,distance:0,travel:0,invul:0,flinch:0,dead:false,fall:false,aiThink:0,aiInput:{x:0,z:0},dodgeX:0,dodgeZ:0,regen:0,guardLocked:0,target:null,
   previousX:i%2?2.8:-2.8,previousZ:i>1?2:-.8,ultimate:0,cooldowns:{},guardStart:-999,counter:0,charge:0,comboHits:0,comboDamage:0,comboUntil:0,damageTotal:0,receivedChain:0,chainUntil:0,markUntil:0,confirmed:false,spawned:false}));
  if(this.arenaRules)for(const f of this.fighters){const p=this.arenaRules.spawnPoints[f.id];Object.assign(f,{x:p.x,z:p.z,y:p.y,previousX:p.x,previousZ:p.z,angle:f.team?Math.PI:0});}
  this.time=5940;
 }
 start(){this.score=[0,0];this.round=1;this.resetFighters();this.phase='intro';this.phaseTick=0;this.emit('round',{round:1});}
 target(f){let best=null,d=Infinity;for(const t of this.fighters)if(t.team!==f.team&&!t.dead){const dd=Math.hypot(t.x-f.x,t.z-f.z);if(dd<d){d=dd;best=t;}}return best;}
 attack(f,action,charge=0,aim=null){
  if(f.dead||!['light','heavy','special','skill2','ultimate'].includes(action))return false;
  const chaining=f.state==='attack'&&f.moveName==='light'&&f.frame>=f.move.chain&&f.combo<2;
  const cancel=f.state==='attack'&&f.moveName==='light'&&f.confirmed&&f.frame>f.move.end&&f.frame<f.move.length&&['special','skill2'].includes(action);
  if(!['idle','walk','charge'].includes(f.state)&&!(action==='light'&&chaining)&&!cancel)return false;
  const combo=action==='light'&&chaining?f.combo+1:0,m=skillFor(f,action,combo);
  if(!m||f.stamina<m.cost||(f.cooldowns[action]||0)>0||f.ultimate<(m.ultimateCost||0))return false;
  if(aim&&Number.isFinite(aim.x)&&Number.isFinite(aim.z)&&Math.hypot(aim.x,aim.z)>.001&&m.hitbox.type!=='radial')f.angle=Math.atan2(aim.x,aim.z);
  f.stamina-=m.cost;f.ultimate-=m.ultimateCost||0;f.cooldowns[action]=m.cooldown;f.regen=35;f.state='attack';f.moveName=action;f.combo=combo;
  f.move={...m,damage:Math.round(m.damage*(1+charge*.55)*(f.counter>0?1.15:1)),push:m.push*(1+charge*.35)};
  f.counter=0;f.charge=0;f.frame=0;f.field=null;f.hitIds.clear();f.buffer=null;f.confirmed=false;f.spawned=false;
  if(m.invulnerable)f.invul=m.invulnerable;
  if(m.hitbox.type==='field')f.field={x:f.x+Math.sin(f.angle)*(m.offset||0),z:f.z+Math.cos(f.angle)*(m.offset||0)};
  this.emit('swing',{id:f.id,action,skill:m.id});
  if(action==='ultimate')this.emit('ultimate',{id:f.id,skill:m.id});
  return true;
 }
 ai(f){
  const t=this.target(f);if(!t)return{x:0,z:0};
  if(this.gameMode==='training'&&f.team===1){const dummy=this.training.dummy;return dummy==='guard'?{block:true}:dummy==='attack'?{action:'light'}:dummy==='evade'?{action:'dodge',x:1}:{x:0,z:0};}
  if(--f.aiThink>0)return f.aiInput;
  const level={easy:0,normal:1,hard:2}[this.difficulty]??1;
  f.aiThink=[23,12,5][level]+Math.floor(this.rng()*7);
  const dist=Math.hypot(t.x-f.x,t.z-f.z),dx=(t.x-f.x)/(dist||1),dz=(t.z-f.z)/(dist||1),range=f.stats.reach;
  const input={x:0,z:0,block:false},rad=Math.hypot(f.x,f.z),danger=t.state==='attack'&&t.frame<=t.move.end&&dist<3;
  const zoner=['gojo','nobara','geto','kenjaku','megumi'].includes(f.kind);
  if(!this.arenaRules&&rad>7.3){input.x=-f.x/rad;input.z=-f.z/rad;}
  else if(f.stamina<24&&dist<3){input.x=-dx*.65;input.z=-dz*.65;}
  else if(dist>range*.9){input.x=dx;input.z=dz;}
  else {const s=this.rng()-.5;input.x=-dz*s*.55;input.z=dx*s*.55;}
  if(danger&&this.rng()<[.14,.43,.72][level]&&f.stamina>22){if(this.rng()<.32){input.action='dodge';input.x=-dz;input.z=dx;}else input.block=true;}
  else if(f.ultimate>=100&&dist<(zoner?5:2.8)&&!f.cooldowns.ultimate)input.action='ultimate';
  else if(zoner&&dist>2&&dist<5&&!f.cooldowns.skill2&&f.stamina>35)input.action='skill2';
  else if(dist<range+.5&&f.stamina>12){
   const r=this.rng(),punish=t.state==='attack'&&t.frame>t.move.end;
   input.action=(t.state==='block'||punish)&&!f.cooldowns.special&&f.stamina>40?'special':r<.65?'light':r<.83?'heavy':!f.cooldowns.skill2?'skill2':'light';
  }else if(!zoner&&dist>4&&f.stamina>60&&this.rng()<.25)input.action='dash';
  if(this.arenaRules&&(dist>range*.9||!this.arenaRules.canHit(f,t))){const dir=this.arenaRules.steer(f,t);input.x=dir.x;input.z=dir.z;if(!this.arenaRules.canHit(f,t))delete input.action;}
  f.aiInput=input;return input;
 }
 step(inputs={}){
  if(this.paused)return;this.tick++;this.phaseTick++;
  if(this.hitstop>0){this.hitstop--;return;}
  if(this.phase==='ready')return;
  if(this.phase==='over'||this.phase==='between'){
   for(const f of this.fighters)if(f.dead){f.frame++;if(f.fall)f.y=Math.max(-40,f.y-.13);}
   if(this.phase==='between'&&this.phaseTick>150){this.round++;this.resetFighters();this.phase='intro';this.phaseTick=65;this.emit('round',{round:this.round});}return;
  }
  if(this.phase==='intro'){if(this.phaseTick>=150){this.phase='fight';this.phaseTick=0;this.emit('fight');}return;}
  if(this.gameMode!=='training')this.time--;
  const order=this.fighters.slice();for(let i=order.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  const pending=[];
  for(const f of order){
   f.previousX=f.x;f.previousZ=f.z;
   if(f.dead){f.frame++;if(f.fall)f.y-=.13;continue;}
   f.frame++;f.invul=Math.max(0,f.invul-1);f.guardLocked=Math.max(0,f.guardLocked-1);f.counter=Math.max(0,f.counter-1);f.flinch=Math.max(0,f.flinch-.06);f.regen=Math.max(0,f.regen-1);
   for(const k in f.cooldowns)f.cooldowns[k]=Math.max(0,f.cooldowns[k]-1);
   f.stamina=Math.min(100,f.stamina+(f.regen?0:f.state==='block'?.045:.25));
   if(this.gameMode==='training'&&this.training.unlimited){f.stamina=100;f.ultimate=100;for(const k in f.cooldowns)f.cooldowns[k]=0;}
   const t=this.target(f);f.target=t?.id;
   if(t&&!['dodge','dash','down','attack','charge'].includes(f.state))f.angle+=angleDelta(f.angle,Math.atan2(t.x-f.x,t.z-f.z))*.22;
   const input=f.controller==='ai'?this.ai(f):(inputs[f.controller]||{});
   if(input.action){f.buffer={action:input.action,aim:input.aim?{x:input.aim.x,z:input.aim.z}:null,expires:this.tick+12};if(f.controller==='ai')f.aiInput.action=null;}
   if(f.state==='charge'){
    const length=Math.max(1,Math.hypot(input.x||0,input.z||0));f.x+=(input.x||0)/length*f.stats.speed/60*.22;f.z+=(input.z||0)/length*f.stats.speed/60*.22;
    f.charge=Math.min(45,f.charge+1);
    if(!input.heavyHeld||f.charge===45){const charge=f.charge/45;if(!this.attack(f,'heavy',charge)){f.state='idle';f.charge=0;}}
   }else if(f.state==='attack'){
    const m=f.move;
    if(f.frame>=m.start-5&&f.frame<=m.end){f.x+=Math.sin(f.angle)*m.lunge/(m.end-m.start+6);f.z+=Math.cos(f.angle)*m.lunge/(m.end-m.start+6);}
    if(f.frame===m.start){this.emit('active',{id:f.id,skill:m.id,x:f.field?.x??f.x,z:f.field?.z??f.z});}
    if(f.frame===m.end+1)this.emit('recovery',{id:f.id,skill:m.id});
    if(f.frame>=m.start&&f.frame<=m.end){
     if(m.hitbox.type==='projectile'){
      if(!f.spawned){f.spawned=true;const p={id:++this.projectileId,owner:f.id,x:f.x,z:f.z,angle:f.angle,age:0,life:Math.ceil(m.range/m.speed*60),move:m,hitIds:new Set()};this.projectiles.push(p);this.emit('projectile',{id:f.id,projectile:p.id,skill:m.id});}
     }else{
      if(m.pulses&&m.pulses.includes(f.frame))f.hitIds.clear();
      if(!m.pulses||m.pulses.includes(f.frame))for(const enemy of this.fighters){
       if(enemy.team===f.team||enemy.dead||f.hitIds.has(enemy.id)||enemy.invul||['down','getup'].includes(enemy.state))continue;
       if(contactTest(f,enemy,m,m.hitbox.type==='field'?f.field:f)&&(!this.arenaRules||this.arenaRules.canHit(f,enemy))){f.hitIds.add(enemy.id);pending.push({attacker:f,target:enemy,move:m});}
      }
     }
    }
    if(f.buffer?.expires>=this.tick&&f.moveName==='light'){
     if(f.buffer.action==='dodge'&&f.confirmed&&f.frame>m.end&&f.stamina>=30){this.evade(f,'dodge',input,30);}
     else this.attack(f,f.buffer.action,0,f.buffer.aim);
    }
    if(f.state==='attack'&&f.frame>=f.move.length){f.state='idle';f.frame=0;}
   }else if(f.state==='dodge'||f.state==='dash'){
    const dash=f.state==='dash';f.x+=f.dodgeX*(dash?.17:.125);f.z+=f.dodgeZ*(dash?.17:.125);
    if(f.frame>=(dash?18:32)){f.state='idle';f.frame=0;}
   }else if(f.state==='down'){if(f.frame>=60){f.state='getup';f.frame=0;f.invul=26;}}
   else if(['getup','stagger','hit','blocked','taunt'].includes(f.state)){
    if(f.frame>=({getup:28,stagger:58,hit:17,blocked:18,taunt:65}[f.state])){f.state='idle';f.frame=0;}
   }
   if(['idle','walk','block'].includes(f.state)){
    const blocking=input.block&&f.stamina>2&&!f.guardLocked;
    if(blocking&&f.state!=='block')f.guardStart=this.tick;
    f.state=blocking?'block':'idle';if(blocking)f.stamina=Math.max(0,f.stamina-.055);
    let x=input.x||0,z=input.z||0,len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}
    f.mx=lerp(f.mx,x,.55);f.mz=lerp(f.mz,z,.55);
    const speed=f.stats.speed/60*(blocking?.27:1);f.x+=f.mx*speed;f.z+=f.mz*speed;
    if(len>.05&&!blocking)f.state='walk';
    if(f.buffer?.expires>=this.tick){const action=f.buffer.action;
     if(['dodge','dash'].includes(action)&&f.stamina>=(action==='dash'?16:22))this.evade(f,action,input,action==='dash'?16:22);
     else if(action==='taunt'){f.state='taunt';f.frame=0;f.buffer=null;}
     else if(!blocking&&action==='heavy'&&input.heavyHeld&&f.stamina>=skillFor(f,'heavy').cost){f.state='charge';f.frame=0;f.charge=0;f.buffer=null;this.emit('charge',{id:f.id});}
     else if(!blocking)this.attack(f,action,0,f.buffer.aim);
    }
   }
   f.x+=f.vx/60;f.z+=f.vz/60;f.vx*=.87;f.vz*=.87;
   const radius=Math.hypot(f.x,f.z);
   if(this.arenaRules){this.arenaRules.constrain(f,f.previousX,f.previousZ);}
   else if(this.arena==='sanctum'&&radius>9.4){f.x*=9.4/radius;f.z*=9.4/radius;if(Math.hypot(f.vx,f.vz)>2){f.vx*=-.5;f.vz*=-.5;this.emit('wall',{id:f.id});}}
   else if(radius>10.15){f.dead=true;f.fall=true;f.state='fall';f.frame=0;f.hp=0;this.emit('ringout',{id:f.id});}
   f.travel=Math.hypot(f.x-f.previousX,f.z-f.previousZ);f.distance+=f.travel;
  }
  for(const p of this.projectiles){
   const a=this.fighters[p.owner],m=p.move,oldX=p.x,oldZ=p.z;p.x+=Math.sin(p.angle)*m.speed/60;p.z+=Math.cos(p.angle)*m.speed/60;p.age++;
   if(this.arenaRules&&!this.arenaRules.canHit({x:oldX,z:oldZ,y:a.y},{x:p.x,z:p.z,y:a.y})){p.age=p.life;continue;}
   for(const t of this.fighters){if(t.team===a.team||t.dead||t.invul||p.hitIds.has(t.id)||['down','getup'].includes(t.state))continue;
    const dx=p.x-oldX,dz=p.z-oldZ,u=clamp(((t.x-oldX)*dx+(t.z-oldZ)*dz)/(dx*dx+dz*dz||1),0,1);
    if(Math.hypot(t.x-oldX-dx*u,t.z-oldZ-dz*u)<m.hitbox.radius+.3){p.hitIds.add(t.id);pending.push({attacker:a,target:t,move:m});p.age=p.life;}
   }
  }
  this.projectiles=this.projectiles.filter(p=>p.age<p.life);
  for(const h of pending)this.hit(h);
  for(let i=0;i<this.fighters.length;i++)for(let j=i+1;j<this.fighters.length;j++){
   const a=this.fighters[i],b=this.fighters[j];if(a.dead||b.dead)continue;let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
   const ax=a.x,az=a.z,bx=b.x,bz=b.z;
   if(d<.62){if(d<.001){dx=.01;d=.01;}const push=(.62-d)/2;a.x-=dx/d*push;a.z-=dz/d*push;b.x+=dx/d*push;b.z+=dz/d*push;}
   if(this.arenaRules){this.arenaRules.constrain(a,ax,az);this.arenaRules.constrain(b,bx,bz);}
  }
  if(this.gameMode==='training'){
   for(const f of this.fighters)if(f.dead){this.emit('trainingko',{id:f.id});Object.assign(f,{dead:false,fall:false,hp:f.stats.hp,x:f.team?2.8:-2.8,z:0,y:0,state:'getup',frame:0,invul:60,vx:0,vz:0});if(this.arenaRules){const p=this.arenaRules.spawnPoints[f.id];Object.assign(f,{x:p.x,y:p.y,z:p.z,previousX:p.x,previousZ:p.z});}}
   return;
  }
  const alive=[0,0];for(const f of this.fighters)if(!f.dead)alive[f.team]++;
  if(!alive[0]||!alive[1]||this.time<=0)this.endRound(alive);
 }
 evade(f,action,input,cost){
  const len=Math.hypot(input.x||0,input.z||0),div=Math.max(1,len);
  f.stamina-=cost;f.regen=40;f.state=action;f.frame=0;f.invul=action==='dodge'?19:0;f.mx=f.mz=0;
  f.dodgeX=len>.1?input.x/div:Math.sin(f.angle);f.dodgeZ=len>.1?input.z/div:Math.cos(f.angle);f.buffer=null;
  this.emit(action==='dash'?'dash':'roll',{id:f.id});
 }
 endRound(alive){
  let winner=-1;
  if(alive[0]&&!alive[1])winner=0;else if(alive[1]&&!alive[0])winner=1;
  else if(alive[0]&&alive[1]){const hp=[0,0];for(const f of this.fighters)hp[f.team]+=f.hp/f.stats.hp;if(Math.abs(hp[0]-hp[1])>.0001)winner=hp[0]>hp[1]?0:1;}
  if(winner>=0)this.score[winner]++;
  this.emit('roundend',{winner,timeout:this.time<=0});
  if(this.score.some(s=>s>=this.rounds)){this.phase='over';const result={winner,score:[...this.score],ticks:this.tick,seed:this.seed,round:this.round};this.results.push(result);this.emit('matchend',result);}
  else this.phase='between';this.phaseTick=0;
 }
 hit({attacker:a,target:t,move:m}){
  if(t.dead||t.invul>0)return;
  const dx=t.x-a.x,dz=t.z-a.z,d=Math.hypot(dx,dz)||1,facing=Math.abs(angleDelta(t.angle,Math.atan2(-dx,-dz)))<1.6;
  const blocked=t.state==='block'&&facing;let broken=false,damage=m.damage;
  if(blocked&&this.tick-t.guardStart<=5&&t.stamina>=12&&m.category!=='ultimate'){
   t.stamina-=12;t.counter=40;t.ultimate=Math.min(100,t.ultimate+12);a.state='blocked';a.frame=0;a.buffer=null;
   this.hitstop=7;this.emit('parry',{id:t.id,attacker:a.id,skill:m.id});return;
  }
  if(blocked){
   t.stamina=Math.max(0,t.stamina-(m.damage*1.1+9)*t.stats.guard*(m.break?2.7:1));t.regen=45;
   if(t.stamina>0&&!m.break){damage=1;t.vx=dx/d*2;t.vz=dz/d*2;this.emit('block',{id:t.id,attacker:a.id,skill:m.id});this.hitstop=3;}
   else{broken=true;t.guardLocked=100;t.state='stagger';t.frame=0;damage=Math.round(damage*.8);this.emit('guardbreak',{id:t.id,attacker:a.id});}
  }
  if(!blocked||broken){
   if(a.kind==='goblin')damage=Math.round(damage*1.18);
   const chain=this.tick<t.chainUntil?t.receivedChain:0;damage=Math.max(1,Math.round(damage*Math.max(.4,1-chain*.14)));
   if(a.kind==='nobara'&&m.category==='special'&&t.markUntil>this.tick){damage+=9;t.markUntil=0;}
   if(m.mark)t.markUntil=this.tick+300;
   t.receivedChain=chain+1;t.chainUntil=this.tick+65;
   a.comboHits=this.tick<a.comboUntil?a.comboHits+1:1;a.comboDamage=this.tick<a.comboUntil?a.comboDamage+damage:damage;a.comboUntil=this.tick+65;a.damageTotal+=damage;
   a.confirmed=true;a.ultimate=Math.min(100,a.ultimate+(m.category==='ultimate'?0:damage*.8));t.ultimate=Math.min(100,t.ultimate+damage*.45);
   t.hp=Math.max(0,t.hp-damage);t.state=broken?'stagger':m.down||chain>=5?'down':'hit';t.frame=0;t.charge=0;t.buffer=null;t.flinch=1;t.hitDirection=Math.atan2(dx,dz);
   t.vx=dx/d*m.push*(m.pull?-1:1);t.vz=dz/d*m.push*(m.pull?-1:1);t.regen=30;this.hitstop=m.hitstop||3;
   this.emit('hit',{id:t.id,attacker:a.id,damage,heavy:m.down,kind:t.kind,technique:m.label,skill:m.id,combo:a.comboHits,shake:m.cameraShake});
  }else t.hp=Math.max(0,t.hp-damage);
  if(t.hp<=0){t.dead=true;t.state='ko';t.frame=0;this.emit('ko',{id:t.id,attacker:a.id});}
 }
}
