// Pointer ownership is independent of the render loop. The fixed tick samples its state.
class TouchInput {
 constructor({surface,stick,actions,state,queue,enabled,onCancel,onPress}){
  Object.assign(this,{surface,stick,actions,state,queue,enabled,onCancel,onPress});this.pointers=new Map();this.owners=new Map();this.origin=null;this.deadZone=.14;this.floating=false;
  for(const el of [surface,actions]){
   el.addEventListener('pointerdown',e=>this.down(e),{passive:false});
   el.addEventListener('pointermove',e=>this.move(e),{passive:false});
   for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,e=>this.up(e,type!=='pointerup'),{passive:false});
  }
 }
 down(e){
  if(!this.enabled()||this.pointers.has(e.pointerId))return;
  const button=e.target.closest('[data-action]'),action=button?.dataset.action||(this.surface.contains(e.target)?'stick':null);
  if(!action||this.owners.has(action))return;e.preventDefault();e.stopPropagation();
  const element=button||this.surface;this.pointers.set(e.pointerId,{action,element});this.owners.set(action,e.pointerId);
  try{element.setPointerCapture(e.pointerId);}catch(_){} // Synthetic test events need not represent a native pointer.
  element.classList.add('pressed');if(button)button.setAttribute('aria-pressed','true');
  if(action==='stick'){
   const r=this.stick.getBoundingClientRect();this.origin=this.floating?{x:e.clientX,y:e.clientY}:{x:r.left+r.width/2,y:r.top+r.height/2};
   if(this.floating){const pad=this.surface.getBoundingClientRect();this.stick.style.left=(e.clientX-pad.left)+'px';this.stick.style.top=(e.clientY-pad.top)+'px';}
   this.move(e);
  }else if(action==='block')this.state.block=true;
  else if(this.aim?.begin(action,e,element)){}
  else{if(action==='heavy')this.state.heavy=true;if(this.queue.length<8)this.queue.push(action);this.onPress?.(action);}
 }
 move(e){
  const p=this.pointers.get(e.pointerId);if(!p)return;if(p.action!=='stick'){this.aim?.move(e);e.preventDefault();return;}if(!this.origin)return;e.preventDefault();
  const radius=this.stick.clientWidth*.34,dx=(e.clientX-this.origin.x)/radius,dz=(e.clientY-this.origin.y)/radius,length=Math.hypot(dx,dz),power=length<this.deadZone?0:Math.min(1,(length-this.deadZone)/(1-this.deadZone));
  this.state.x=length?dx/length*power:0;this.state.z=length?dz/length*power:0;
  this.stick.querySelector('i').style.transform=`translate(${this.state.x*radius}px,${this.state.z*radius}px)`;
 }
 up(e,cancel=false){
  const p=this.pointers.get(e.pointerId);if(!p)return;e.preventDefault();e.stopPropagation();this.pointers.delete(e.pointerId);this.owners.delete(p.action);
  const command=this.aim?.end(e,cancel);if(command&&this.queue.length<8){this.queue.push(command);this.onPress?.(p.action);}
  p.element.classList.remove('pressed');p.element.setAttribute('aria-pressed','false');
  if(p.action==='stick'){this.state.x=this.state.z=0;this.origin=null;this.stick.querySelector('i').style.transform='';this.stick.style.left=this.stick.style.top='';}
  if(p.action==='block')this.state.block=false;
  if(p.action==='heavy'){this.state.heavy=false;if(cancel){for(let i=this.queue.length-1;i>=0;i--)if(this.queue[i]==='heavy')this.queue.splice(i,1);this.onCancel?.('heavy');}}
  try{if(p.element.hasPointerCapture(e.pointerId))p.element.releasePointerCapture(e.pointerId);}catch(_){}
 }
 reset(){
  for(const [pointerId]of [...this.pointers])this.up({pointerId,preventDefault(){},stopPropagation(){}},true);
  this.state.x=this.state.z=0;this.state.block=this.state.heavy=false;this.queue.length=0;this.onCancel?.('heavy');
 }
}
