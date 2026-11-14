function solveIK(limb,target,pole){
 const c=limb.ikCache||(limb.ikCache={dir:V(),bend:V(),joint:V(),v:V(),q1:new THREE.Quaternion(),q2:new THREE.Quaternion(),axis:V(0,-1,0)});
 const p=limb.upper.position;c.dir.copy(target).sub(p);const d=clamp(c.dir.length(),.015,limb.a+limb.b-.001);c.dir.normalize();
 c.bend.copy(pole).addScaledVector(c.dir,-pole.dot(c.dir)).normalize();if(c.bend.lengthSq()<.1)c.bend.set(0,0,1);
 const along=(limb.a*limb.a+d*d-limb.b*limb.b)/(2*d),height=Math.sqrt(Math.max(0,limb.a*limb.a-along*along));
 c.joint.copy(p).addScaledVector(c.dir,along).addScaledVector(c.bend,height);
 c.q1.setFromUnitVectors(c.axis,c.v.copy(c.joint).sub(p).normalize());limb.upper.quaternion.copy(c.q1);
 c.q2.setFromUnitVectors(c.axis,c.v.copy(target).sub(c.joint).normalize());limb.lower.quaternion.copy(c.q1).invert().multiply(c.q2);limb.end.quaternion.copy(c.q2).invert();
}
function catmull(a,b,c,d,t){return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);}
function sampleKeys(keys,t){let i=0;while(i<keys.length-2&&t>keys[i+1][0])i++;let b=keys[i],c=keys[i+1],a=keys[Math.max(0,i-1)],d=keys[Math.min(keys.length-1,i+2)],u=clamp((t-b[0])/(c[0]-b[0]),0,1);u=u*u*(3-2*u);return V(...[1,2,3].map(j=>catmull(a[j],b[j],c[j],d[j],u)));}
const motionKeys={swing:[[0,-.44,-.24,.28],[.22,-.55,.23,-.15],[.44,.25,-.05,.59],[.63,.36,-.24,.22],[1,-.44,-.24,.28]],backhand:[[0,-.4,-.25,.25],[.25,.18,.08,.12],[.5,-.56,-.08,.51],[.7,-.6,-.25,.1],[1,-.4,-.25,.25]],thrust:[[0,-.4,-.2,.25],[.25,-.36,-.14,-.2],[.5,-.12,.05,.61],[.65,-.12,.02,.57],[1,-.4,-.2,.25]],cleave:[[0,-.4,-.25,.25],[.3,-.22,.65,-.1],[.5,-.2,.36,.46],[.62,-.2,-.32,.6],[1,-.4,-.25,.25]],smash:[[0,-.4,-.25,.25],[.3,-.19,.63,-.07],[.45,-.12,.49,.42],[.58,-.13,-.48,.57],[1,-.4,-.25,.25]],bash:[[0,.4,-.25,.25],[.3,.4,-.05,.1],[.48,.1,.1,.63],[.65,.15,.08,.58],[1,.4,-.25,.25]]};

Object.assign(motionKeys,{
 jab:[[0,-.28,.06,.28],[.15,-.35,.10,.10],[.34,-.12,.13,.60],[.53,-.08,.09,.59],[1,-.28,.06,.28]],
 uppercut:[[0,-.3,.06,.29],[.25,-.4,-.28,.13],[.43,-.21,-.10,.51],[.56,-.14,.48,.44],[1,-.3,.06,.29]],
 blackflash:[[0,-.28,.06,.28],[.31,-.47,-.05,-.05],[.46,-.11,.08,.61],[.58,-.09,.07,.61],[1,-.28,.06,.28]],
 blue:[[0,-.25,.14,.28],[.27,-.14,.25,.44],[.44,-.10,.16,.60],[.64,-.25,.06,.23],[1,-.25,.14,.28]],
 red:[[0,-.25,.14,.28],[.3,-.20,.30,.25],[.45,-.10,.20,.60],[.60,-.11,.17,.60],[1,-.25,.14,.28]]
});
let actors=[],crowdEnergy=0,worldTime=0,crowdTick=1;
function animateFighter(actor,f,dt,preview=false){const {g,pivot,bones,limbs}=actor;g.position.set(f.x,f.y||0,f.z);g.rotation.y=f.angle;let phase=f.distance/actor.scale/.85*TAU,walk=f.travel>.0003&&['walk','block','attack','dash'].includes(f.state),t=f.state==='attack'?(f.frame<f.move.start?f.frame/f.move.start*.36:f.frame<=f.move.end?.36+(f.frame-f.move.start)/Math.max(1,f.move.end-f.move.start)*.22:.58+(f.frame-f.move.end)/Math.max(1,f.move.length-f.move.end)*.42):0;
 let right=V(-.43,-.22,.20),left=V(.43,-.26,.22),bodyY=.89+(walk?Math.sin(phase*2)*.018:Math.sin(worldTime*2+f.id)*.009),bodyTwist=0,lean=walk?.06:0,jump=0,roll=0;
 if(walk){right.z+=Math.sin(phase)*.15;left.z-=Math.sin(phase)*.15;bodyTwist=Math.sin(phase)*.04;}
 if(f.state==='attack'){if(f.moveName==='light'){right=sampleKeys(motionKeys[f.combo===1?'backhand':f.combo===2&&f.kind==='skeleton'?'thrust':'swing'],t);bodyTwist=Math.sin(t*TAU)*.32;}else if(f.moveName==='heavy'){if(f.kind==='goblin'){right=V(-.57,-.02,.23);bodyTwist=0;}else{right=sampleKeys(motionKeys.cleave,t);lean=Math.sin(t*Math.PI)*.2;}}else if(f.kind==='goblin'){right=sampleKeys(motionKeys.smash,t);jump=Math.max(0,Math.sin(clamp(t/.63,0,1)*Math.PI))*.72;left=V(.4,.2,.25);}else left=sampleKeys(motionKeys.bash,t);}

 if(actor.sorcerer){right=V(-.28,.06,.28);left=V(.28,.10,.30);if(f.kind==='gojo'){right.y=.18;left=V(.35,-.23,.12);}if(walk){right.z+=Math.sin(phase)*.07;left.z-=Math.sin(phase)*.07;}if(f.state==='attack'){const cross=actor.unarmed&&f.moveName==='light'&&f.combo===1;const key=f.kind==='geto'?(f.moveName==='special'?'red':f.moveName==='heavy'?'cleave':'swing'):f.kind==='toji'?(f.moveName==='special'?'thrust':f.moveName==='heavy'?'cleave':f.combo===1?'backhand':'swing'):f.kind==='sukuna'?(f.moveName==='special'?'red':'swing'):f.kind==='mahito'?(f.moveName==='light'?'jab':'blackflash'):f.kind==='kenjaku'?(f.moveName==='light'?'jab':'blue'):f.kind==='nobara'?(f.moveName==='light'?(f.combo===1?'backhand':'swing'):'cleave'):f.kind==='megumi'&&f.moveName!=='light'?'blue':f.moveName==='light'?(f.combo===2?'uppercut':'jab'):f.kind==='yuji'?(f.moveName==='heavy'?'uppercut':'blackflash'):(f.moveName==='heavy'?'blue':'red');let hand=sampleKeys(motionKeys[key],t);if(cross){hand.x*=-1;left=hand;}else right=hand;bodyTwist=Math.sin(t*TAU)*(cross?-.22:.22);lean=Math.sin(t*Math.PI)*.10;jump=0;}actor.strikeHand=actor.unarmed&&f.moveName==='light'&&f.combo===1?bones.handL:bones.handR;if(actor.aura.parent!==actor.strikeHand)actor.strikeHand.add(actor.aura);
 const active=f.state==='attack'&&f.frame>=f.move.start-6&&f.frame<=f.move.end+5;actor.aura.visible=active&&f.kind!=='toji';actor.technique.visible=active&&f.moveName!=='light';actor.technique.rotation.y=f.kind==='geto'?worldTime*3:0;actor.technique.scale.setScalar(f.moveName==='special'?1.1:.75);actor.blackFlash.visible=active&&f.kind==='yuji'&&f.moveName==='special';actor.aura.scale.setScalar((f.moveName==='light'?.55:1.15)*(1+Math.sin(worldTime*32)*.12));actor.halo.rotation.z=worldTime*5;const colour=f.kind==='sukuna'?'#f29e92':f.kind==='kenjaku'?'#bd8ee0':f.kind==='geto'?'#a391ce':f.kind==='mahito'?'#b3e3da':f.kind==='toji'?'#d6d8c3':f.kind==='nobara'?'#ffc776':f.kind==='megumi'?'#8b9acb':f.kind==='yuji'?(f.moveName==='special'?'#f62c54':'#6dcfd3'):(f.moveName==='special'?'#ff739b':'#6ec9ff');actor.energy.material.color.set(colour);actor.halo.material.color.set(colour);actor.trail.material.color.set(colour);actor.barrier.visible=f.kind==='gojo'&&f.state==='block';actor.summon.visible=f.kind==='megumi'&&f.state==='attack'&&f.moveName==='special'&&f.frame>=f.move.start-10&&f.frame<=f.move.end+8;if(actor.summon.visible){let charge=clamp((f.frame-(f.move.start-10))/24,0,1);actor.summon.position.set(0,Math.sin(charge*Math.PI)*.25,.3+charge*2.2);actor.summon.scale.setScalar(.8+Math.sin(charge*Math.PI)*.25);}
 }
 if(actor.kimetsu){
  const d=KIMETSU_ROSTER[f.kind];right=V(-.30,.01,.28);left=V(.32,-.08,.26);
  if(walk){right.z+=Math.sin(phase)*.08;left.z-=Math.sin(phase)*.08;}
  if(f.state==='attack'){const key=actor.unarmed?(f.combo===2?'uppercut':'jab'):d.weapon==='gun'||d.weapon==='biwa'?'red':f.moveName==='heavy'?'cleave':f.combo===1?'backhand':f.move.hitbox.type==='line'?'thrust':'swing';right=sampleKeys(motionKeys[key],t);if(['dual','cleavers','fans','sickles'].includes(d.weapon)){left=sampleKeys(motionKeys.backhand,Math.max(0,t-.12));left.x*=-1;}bodyTwist=Math.sin(t*TAU)*.25;lean=Math.sin(t*Math.PI)*.1;}
  actor.aura.visible=f.state==='attack'&&f.moveName!=='light';actor.aura.rotation.z=worldTime*3;actor.trail.material.color.set(d.color);actor.offhandWeapon.rotation.x=f.state==='attack'?Math.sin(t*Math.PI)*2:.4;
 }
 // Individual weight distribution and signature casting poses.
 if(!['attack','down','ko','fall','getup','dodge'].includes(f.state)){
  const stances={yuji:[-.04,.09,.08],gojo:[.03,-.04,-.03],sukuna:[-.03,.13,.07],megumi:[-.02,.06,.03],nobara:[.01,.02,.04],toji:[-.07,.15,.12],kenjaku:[.03,-.06,-.02],geto:[.02,-.03,.02],mahito:[-.05,-.08,-.06],goblin:[-.08,.12,.11],skeleton:[.02,.04,.01]};
  const st=stances[f.kind]||[0,0,0];bodyY+=st[0];bodyTwist+=st[1];lean+=st[2];left.y+=st[1];right.z+=st[2];
 }
 if(f.state==='charge'){right=V(-.3,.45,-.12);left=V(.3,.1,.3);bodyY-=.08;lean=-.12;}
 if(f.state==='dash'){bodyY-=.14;lean=.28;right=V(-.45,-.3,-.2);left=V(.45,-.3,-.2);}
 if(f.state==='attack'&&f.moveName==='skill2'){
  if(['gojo','kenjaku','megumi'].includes(f.kind)){left=sampleKeys(motionKeys.blue,t);right=V(-.3,.15,.42);}
  if(f.kind==='yuji'){right=sampleKeys(motionKeys.jab,t);left=sampleKeys(motionKeys.jab,Math.max(0,t-.18));left.x*=-1;}
  if(['nobara','geto','skeleton'].includes(f.kind)){left=sampleKeys(motionKeys.red,t);}
  if(f.kind==='mahito')right=sampleKeys(motionKeys.blackflash,t);
 }
 if(f.state==='attack'&&f.moveName==='ultimate'){
  const release=f.frame>=f.move.start;
  if(['gojo','geto'].includes(f.kind)){right=V(-.16,release?.06:.27,release?.64:.3);left=V(.16,release?.06:.27,release?.64:.3);lean=release?.15:-.08;}
  else if(['sukuna','megumi','kenjaku','mahito'].includes(f.kind)){right=V(-.18,.25,release?.55:.3);left=V(.18,.25,release?.55:.3);bodyY-=.05;}
  else{right=sampleKeys(motionKeys.smash,t);left=V(.3,.2,.35);bodyTwist=Math.sin(t*TAU)*.35;}
 }
 if(f.state==='block'){left=V(.12,.05,.54);right=V(-.33,-.03,.42);bodyY-=.07;lean=.08;}
 if(f.state==='dodge'){roll=-Math.PI*2*clamp(f.frame/32,0,1);jump=Math.sin(clamp(f.frame/32,0,1)*Math.PI)*.25;right=V(-.23,-.15,.2);left=V(.23,-.15,.2);bodyY-=.25;}
 if(['down','ko','fall'].includes(f.state)){roll=-Math.min(1,f.frame/14)*Math.PI*.48;bodyY=.5;right=V(-.55,.1,.1);left=V(.55,.1,.1);if(f.state==='fall')roll+=f.frame*.04;}
 if(f.state==='getup'){roll=-Math.PI*.48*(1-clamp(f.frame/28,0,1));bodyY=lerp(.5,.89,clamp(f.frame/28,0,1));}
 if(f.state==='taunt'){right=V(-.4,.45,.1);left=V(.45,.2,.1);bodyTwist=Math.sin(f.frame*.2)*.12;}
 if(preview&&f.victory){right=V(-.35,.57,.1);left=V(.45,.2,.1);}
 lean-=f.flinch*.13;actor.hips.position.y=bodyY+jump;actor.chest.rotation.y+=angleDelta(actor.chest.rotation.y,bodyTwist)*Math.min(1,dt*22);actor.chest.rotation.x=lerp(actor.chest.rotation.x,lean,Math.min(1,dt*22));actor.chest.rotation.z=Math.sin(angleDelta(f.angle,f.hitDirection||f.angle))*f.flinch*.22;pivot.rotation.x+=angleDelta(pivot.rotation.x,roll)*Math.min(1,dt*25);actor.root.position.y=f.state==='dodge'?-1.1:0;pivot.position.y=f.state==='dodge'?1.1+Math.sin(clamp(f.frame/32,0,1)*Math.PI)*.2:roll?.25:0;pivot.rotation.y=f.state==='attack'&&f.kind==='goblin'&&f.moveName==='heavy'?Math.PI*2*(t*t*(3-2*t)):0;
 const smooth=(name,target)=>{if(!actor.smoothed.has(name))actor.smoothed.set(name,target.clone());let v=actor.smoothed.get(name);v.lerp(target,Math.min(1,dt*24));return v;};solveIK(limbs.armR,smooth('R',right),V(-1,-.1,-.3));solveIK(limbs.armL,smooth('L',left),V(1,-.1,-.3));
 // Weapon axis is aimed independently of the upper arm; sword/mace arcs continue through impact.
 let weaponAngle=f.state==='attack'?(f.moveName==='light'?(f.combo===2&&f.kind==='skeleton'?Math.PI/2:lerp(-.9,2.3,clamp(t*1.5,0,1))):lerp(-.7,2.6,clamp(t*1.4,0,1))):.4;
 actor.weapon.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(weaponAngle,0,f.state==='attack'?-.4:0)),Math.min(1,dt*28));actor.shield.rotation.y=lerp(actor.shield.rotation.y,f.state==='block'?-.3:0,Math.min(1,dt*20));
 let target=match?.fighters.find(e=>e.id===f.target);let look=target?angleDelta(f.angle,Math.atan2(target.x-f.x,target.z-f.z)):0;actor.head.rotation.y=clamp(look,-.5,.5)*.5;actor.head.rotation.z=Math.sin(worldTime*1.5+f.id)*.02;
 // Stance feet remain at world anchors. Swing endpoints advance with measured travel.
 for(let j=0;j<2;j++){let side=j===0?-1:1,key=j===0?'R':'L',foot=actor.feet[j],p=((f.distance/actor.scale/.85+j*.5)%1+1)%1;let neutral=V(side*.18*actor.scale,.045,0).applyAxisAngle(V(0,1,0),f.angle).add(V(f.x,0,f.z));if(!foot.anchor)foot.anchor=neutral.clone();let dest=foot.anchor.clone();if(walk){let swing=p>.58;if(swing){if(!foot.swing){foot.start=foot.anchor.clone();let dx=f.x-f.previousX,dz=f.z-f.previousZ,len=Math.hypot(dx,dz)||1;foot.end=neutral.clone().add(V(dx/len,0,dz/len).multiplyScalar(.3*actor.scale));}let u=(p-.58)/.42;dest=foot.start.clone().lerp(foot.end,u);dest.y+=Math.sin(u*Math.PI)*.12*actor.scale;foot.anchor.copy(dest);}foot.swing=swing;}else{foot.swing=false;foot.anchor.lerp(neutral,Math.min(1,dt*12));dest.copy(foot.anchor);}dest.sub(V(f.x,0,f.z)).applyAxisAngle(V(0,1,0),-f.angle).multiplyScalar(1/actor.scale);dest.y-=bodyY;if(jump||roll){dest=V(side*.18,-.7,Math.sin(phase+j*Math.PI)*.08);if(jump)dest.z=.15;}solveIK(limbs['leg'+key],dest,V(0,0,1));}
 g.updateMatrixWorld(true);for(const b of actor.renderBatches){b.parts.forEach((o,i)=>b.mesh.setMatrixAt(i,o.matrixWorld));b.mesh.instanceMatrix.needsUpdate=true;b.mesh.material.emissive.setRGB(f.flinch*.4*feedback.settings.flashes,f.flinch*.28*feedback.settings.flashes,f.flinch*.13*feedback.settings.flashes);}if(f.state==='attack'&&f.frame>f.move.start-3&&f.frame<f.move.end+4){let tip=actor.unarmed?actor.strikeHand.localToWorld(V(0,-.12,.17)):actor.weapon.localToWorld(V(0,f.kind==='nobara'?.60:f.kind==='toji'?.85:f.kind==='geto'?.92:1.15,0)),base=actor.unarmed?actor.strikeHand.localToWorld(V(0,-.02,-.03)):actor.weapon.localToWorld(V(0,.4,0));actor.trailPoints.push([base,tip]);if(actor.trailPoints.length>12)actor.trailPoints.shift();let arr=actor.trail.geometry.attributes.position.array;arr.fill(0);for(let i=0;i<actor.trailPoints.length-1;i++){let [a,b]=actor.trailPoints[i],[c,d]=actor.trailPoints[i+1];[a,b,c,b,d,c].forEach((v,j)=>v.toArray(arr,(i*6+j)*3));}actor.trail.geometry.setDrawRange(0,(actor.trailPoints.length-1)*6);actor.trail.geometry.attributes.position.needsUpdate=true;actor.trail.visible=true;}else{actor.trail.visible=false;actor.trailPoints.length=0;}actor.disc.visible=!f.dead&&!actor.statue;

}
