// Bounded GPU effect pool. Simulation emits contacts; effects only consume them.
class SpriteSheetAnimator {
 static frame(asset,age,duration){return Math.min(asset.frames-1,Math.floor(age/duration*asset.frames));}
}
class EffectPooling {
 constructor(scene,capacity=96){
  this.items=[];this.cursor=0;this.geometry=new THREE.PlaneGeometry(1,1);
  for(let i=0;i<capacity;i++){
   const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{atlas:{value:null},frame:{value:0},columns:{value:8},opacity:{value:1},tint:{value:new THREE.Color(1,1,1)}},
    vertexShader:'varying vec2 uvv;void main(){uvv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform sampler2D atlas;uniform float frame,columns,opacity;uniform vec3 tint;varying vec2 uvv;void main(){vec2 q=vec2((frame+clamp(uvv.x,.042,.958))/columns,clamp(uvv.y,.042,.958));vec4 c=texture2D(atlas,q);if(c.a<.02)discard;gl_FragColor=vec4(c.rgb*tint,c.a*opacity);}'
   });
   const mesh=new THREE.Mesh(this.geometry,material);mesh.visible=false;mesh.frustumCulled=false;mesh.renderOrder=8;scene.add(mesh);
   this.items.push({mesh,active:false,age:0,duration:1,base:1,ground:false,owner:null,projectile:null,velocity:null});
  }
 }
 take(decorative=false){if(decorative&&this.items.filter(i=>i.active).length>=this.items.length-24)return null;for(let n=0;n<this.items.length;n++){const i=(this.cursor+n)%this.items.length;if(!this.items[i].active){this.cursor=(i+1)%this.items.length;return this.items[i];}}if(decorative)return null;const item=this.items.find(i=>i.decorative)||this.items[this.cursor];this.cursor=(this.cursor+1)%this.items.length;return item;}
 clear(){for(const i of this.items){i.active=false;i.mesh.visible=false;}}
}
class ImpactEffect {static spawn(v,key,x,y,z,scale=1){return v.spawn(key,x,y,z,{scale,duration:.35});}}
class GroundEffect {static spawn(v,key,x,z,scale=3,duration=.8){return v.spawn(key,x,.04,z,{scale,duration,ground:true});}}
class UltimateEffect {static spawn(v,key,f,ground){return v.spawn(key,f.x,ground?.08:1.2,f.z,{scale:ground?8:5,duration:1.25,ground});}}
class SlashTrailRenderer {static spawn(v,key,f,scale=2){return v.spawn(key,f.x+Math.sin(f.angle)*.8,1.1,f.z+Math.cos(f.angle)*.8,{scale,duration:.36});}}
class ProjectileVFX {static spawn(v,key,p){return v.spawn(key,p.x,1,p.z,{scale:1.25,duration:p.life/60,projectile:p.id});}}
class ParticleEmitter {
 static emit(v,key,f,count=4){
  const total=Math.ceil(count*v.density);
  for(let i=0;i<total;i++){const a=i*2.39996;v.spawn(key,f.x,.15,f.z,{scale:.35+(i%3)*.15,duration:.45+(i%3)*.1,decorative:true,velocity:[Math.cos(a)*1.5,1+i%2,Math.sin(a)*1.5]});}
 }
}
class VFXManager {
 constructor(scene,manifest){this.manifest=manifest;this.textures={};this.pool=new EffectPooling(scene);this.density=1;this.intensity=1;this.loaded=0;this.failed=[];
  const loader=new THREE.TextureLoader();this.ready=Promise.all(Object.entries(manifest.assets).map(([key,a])=>new Promise(resolve=>{
   loader.load(a.url,t=>{t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;this.textures[key]=t;this.loaded++;resolve();},undefined,()=>{this.failed.push(key);resolve();});
  })));
 }
 spawn(key,x,y,z,opts={}){
  const asset=this.manifest.assets[key],texture=this.textures[key];if(!asset||!texture)return null;
  if(opts.decorative&&this.pool.items.filter(i=>i.active&&i.decorative).length>=(this.decorativeLimit??48))return null;const i=this.pool.take(!!opts.decorative);if(!i)return null;Object.assign(i,{active:true,decorative:!!opts.decorative,age:0,duration:opts.duration||.55,base:opts.scale||1,ground:!!opts.ground,owner:opts.owner??null,projectile:opts.projectile??null,velocity:opts.velocity||null,asset,line:opts.line||false,angle:opts.angle||0,width:opts.width||1,fade:!!opts.fade});
  i.mesh.visible=true;i.mesh.position.set(x,y,z);i.mesh.scale.setScalar(i.base);i.mesh.material.uniforms.atlas.value=texture;i.mesh.material.uniforms.frame.value=0;i.mesh.material.uniforms.columns.value=asset.columns;i.mesh.material.uniforms.opacity.value=this.intensity;
  i.mesh.material.blending=asset.blend==='normal'?THREE.NormalBlending:THREE.AdditiveBlending;
  i.mesh.material.uniforms.tint.value.set(opts.tint||'#ffffff');return i;
 }
 event(e,m){
  const f=m.fighters[e.id],a=m.fighters[e.attacker];if(!f)return;
  const skill=SKILLS[e.skill],binding=this.manifest.skills[e.skill];
  if(e.type==='swing'&&['ultimate','skill2','special'].includes(e.action))this.spawn(binding.startup,f.x,1,f.z,{scale:e.action==='ultimate'?2.4:1.1,duration:skill.start/60,owner:f.id,tint:FIGHTER_PROFILES[f.kind][1]});
  if(e.type==='active'){
   if(skill.hitbox.type!=='projectile'){
    if(skill.category==='ultimate'&&skill.hitbox.type!=='line')UltimateEffect.spawn(this,binding.asset,f,binding.ground);
    else if(binding.ground)GroundEffect.spawn(this,binding.asset,e.x,e.z,skill.hitbox.radius*2,.7);
    else if(skill.hitbox.type==='line')this.spawn(binding.asset,f.x+Math.sin(f.angle)*skill.hitbox.radius/2,1,f.z+Math.cos(f.angle)*skill.hitbox.radius/2,{scale:skill.hitbox.radius,width:skill.hitbox.width*2,line:true,angle:f.angle,duration:.6});else SlashTrailRenderer.spawn(this,binding.asset,f,binding.scale);
   }
   if(skill.category==='ultimate')GroundEffect.spawn(this,'common/ground_cracks',f.x,f.z,7,1.2);
  }
  if(e.type==='recovery'&&['special','skill2','ultimate'].includes(skill.category))this.spawn(binding.recovery,f.x,.3,f.z,{scale:binding.scale*.7,duration:Math.min(.5,binding.recoveryDuration),ground:binding.ground,decorative:true,fade:true});
  if(e.type==='projectile'){const p=m.projectiles.find(p=>p.id===e.projectile);if(p)ProjectileVFX.spawn(this,binding.asset,p);}
  if(e.type==='hit'){
   ImpactEffect.spawn(this,binding?.impact||'common/hit_spark',f.x,.9,f.z,e.heavy?2:1.2);
   ParticleEmitter.emit(this,'common/magic_particle',f,e.heavy?6:3);
   if(e.heavy)GroundEffect.spawn(this,'common/shockwave',f.x,f.z,2.6,.55);
  }
  if(e.type==='block')ImpactEffect.spawn(this,'common/block_impact',f.x,1,f.z,.9);
  if(e.type==='parry')ImpactEffect.spawn(this,'common/parry_flash',f.x,1,f.z,2);
  if(e.type==='guardbreak')ImpactEffect.spawn(this,'common/lightning',f.x,1,f.z,2);
  if(['roll','dash','wall','ko'].includes(e.type))ParticleEmitter.emit(this,'common/dust_sheet',f,e.type==='ko'?8:4);
  if(e.type==='dash')SlashTrailRenderer.spawn(this,'common/dash_trail',f,1.5);
 }
 update(dt,m,camera){
  for(const i of this.pool.items){if(!i.active)continue;i.age+=dt;
   if(i.age>=i.duration){i.active=false;i.mesh.visible=false;continue;}
   if(i.owner!==null){const f=m.fighters[i.owner];if(!f||f.state!=='attack'){i.active=false;i.mesh.visible=false;continue;}i.mesh.position.set(f.x,1.1,f.z);}
   if(i.projectile!==null){const p=m.projectiles.find(p=>p.id===i.projectile);if(!p){i.active=false;i.mesh.visible=false;continue;}i.mesh.position.set(p.x,1,p.z);}
   if(i.velocity){i.mesh.position.x+=i.velocity[0]*dt;i.mesh.position.y+=i.velocity[1]*dt;i.mesh.position.z+=i.velocity[2]*dt;}
   if(i.line)i.mesh.rotation.set(-Math.PI/2,0,i.angle-Math.PI/2);else if(i.ground)i.mesh.rotation.set(-Math.PI/2,0,0);else i.mesh.quaternion.copy(camera.quaternion);
   i.mesh.material.uniforms.frame.value=SpriteSheetAnimator.frame(i.asset,i.age,i.duration);
   i.mesh.material.uniforms.opacity.value=Math.min(1,this.intensity)*(1-i.age/i.duration*(i.fade?1:.6));
   if(i.line)i.mesh.scale.set(i.base,i.width,1);else i.mesh.scale.setScalar(i.base*(1+i.age/i.duration*.25));
  }
 }
}
