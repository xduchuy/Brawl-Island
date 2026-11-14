// Aiming owns no pointer listeners: TouchInput delegates its existing ownership here.
class SkillAim {
 constructor(){this.pending=null;this.ray=new THREE.Raycaster();this.plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);this.cancel=document.createElement('div');this.cancel.id='aimCancel';this.cancel.textContent='× CANCEL';this.cancel.hidden=true;$('stage').append(this.cancel);}
 fighter(){return match.fighters.find(f=>f.controller==='p1')||match.fighters[0];}
 begin(action,e,button){
  if(!['special','skill2','ultimate'].includes(action))return false;
  if(this.pending)return true;
  const f=this.fighter(),s=FIGHTER_SKILLS[f.kind][action];
  if(f.dead||f.cooldowns[action]>0||f.stamina<s.cost||f.ultimate<(s.ultimateCost||0))return true;
  const enemy=mobilePrefs.aimAssist?match.target(f):null;
  this.pending={action,skill:s,button,id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dz:0,angle:enemy?Math.atan2(enemy.x-f.x,enemy.z-f.z):f.angle,canceled:false};
  button.classList.add('aiming');this.cancel.hidden=false;this.preview();return true;
 }
 ground(x,y){this.plane.constant=-(match?.fighters[0]?.y||0);const r=$('stage').getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),camera);return this.ray.ray.intersectPlane(this.plane,new THREE.Vector3());}
 move(e){const p=this.pending;if(!p||e.pointerId!==p.id)return;
  const rect=this.cancel.getBoundingClientRect(),slop=mobilePrefs.cancelSensitivity;p.canceled=e.clientX>=rect.left-slop&&e.clientX<=rect.right+slop&&e.clientY>=rect.top-slop&&e.clientY<=rect.bottom+slop;
  this.cancel.classList.toggle('cancel-active',p.canceled);p.button.classList.toggle('canceling',p.canceled);
  const dx=(e.clientX-p.x)*mobilePrefs.aimSensitivity,dy=(e.clientY-p.y)*mobilePrefs.aimSensitivity;
  if(Math.hypot(dx,dy)>8&&p.skill.hitbox.type!=='radial'){
   const a=this.ground(p.x,p.y),b=this.ground(p.x+dx,p.y+dy);if(a&&b){p.dx=b.x-a.x;p.dz=b.z-a.z;p.angle=Math.atan2(p.dx,p.dz);}
  }
  this.preview();
 }
 preview(){if(this.pending)skillIndicators.show(this.fighter(),this.pending.skill,this.pending.angle,this.pending.canceled);}
 end(e,canceled){const p=this.pending;if(!p||p.id!==e.pointerId)return null;if(!canceled&&Number.isFinite(e.clientX)&&Number.isFinite(e.clientY))this.move(e);const command=!canceled&&!p.canceled?{action:p.action,aim:{x:Math.sin(p.angle),z:Math.cos(p.angle)}}:null;p.button.classList.remove('aiming','canceling');this.pending=null;this.cancel.hidden=true;this.cancel.classList.remove('cancel-active');skillIndicators.hide();return command;}
}
