// Ground-plane presentation derived from the registry. Never participates in contacts.
class SkillIndicators {
 constructor(){this.group=new THREE.Group();scene.add(this.group);this.geometry=new THREE.BufferGeometry();this.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(2400),3));this.material=new THREE.LineBasicMaterial({color:'#b8ffe4',transparent:true,opacity:.7,depthWrite:false,depthTest:false});this.lines=new THREE.LineSegments(this.geometry,this.material);this.lines.frustumCulled=false;this.lines.renderOrder=12;this.fillGeometry=new THREE.BufferGeometry();this.fillGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(3600),3));this.fillMaterial=new THREE.MeshBasicMaterial({color:'#50dfbe',transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false,depthTest:false});this.fill=new THREE.Mesh(this.fillGeometry,this.fillMaterial);this.fill.frustumCulled=false;this.fill.renderOrder=11;this.group.add(this.fill,this.lines);this.group.visible=false;}
 hide(){this.group.visible=false;}
 show(f,s,angle,canceled){
  const h=s.hitbox,vertices=[],radius=h.type==='projectile'?s.range:h.radius;
  const segment=(x,z,xx,zz)=>vertices.push(x,.12,z,xx,.12,zz);
  const circle=(r,cx=0,cz=0,start=-Math.PI,end=Math.PI)=>{for(let i=0;i<64;i++){const a=start+(end-start)*i/64,b=start+(end-start)*(i+1)/64;segment(cx+Math.sin(a)*r,cz+Math.cos(a)*r,cx+Math.sin(b)*r,cz+Math.cos(b)*r);}};
  if(h.type==='radial')circle(radius);
  else if(h.type==='field'){circle(radius,0,s.offset||0);circle(.15,0,s.offset||0);segment(0,0,0,s.offset||0);}
  else if(h.type==='line'||h.type==='projectile'){
   const w=h.type==='projectile'?h.radius:h.width;segment(-w,0,-w,radius);segment(w,0,w,radius);segment(-w,radius,w,radius);segment(0,0,0,radius);segment(-.22,radius-.4,0,radius);segment(.22,radius-.4,0,radius);circle(.12,0,radius);
  }else{circle(radius,0,0,-h.angle,h.angle);for(const a of [-h.angle,h.angle])segment(0,0,Math.sin(a)*radius,Math.cos(a)*radius);segment(0,0,0,radius);}
  const triangles=[],cz=h.type==='field'?(s.offset||0):0;for(let i=0;i<vertices.length;i+=6)triangles.push(0,.11,cz,...vertices.slice(i,i+6));this.fillGeometry.attributes.position.array.set(triangles);this.fillGeometry.attributes.position.needsUpdate=true;this.fillGeometry.setDrawRange(0,triangles.length/3);this.fillMaterial.color.set(canceled?'#f1607d':'#36dbba');this.fillMaterial.opacity=mobilePrefs.previewOpacity*.4;
  this.geometry.attributes.position.array.set(vertices);this.geometry.attributes.position.needsUpdate=true;this.geometry.setDrawRange(0,vertices.length/3);this.group.position.set(f.x,f.y||0,f.z);this.group.rotation.y=angle;this.material.color.set(canceled?'#bb264a':'#164e59');this.material.opacity=mobilePrefs.previewOpacity;this.group.visible=true;
 }
}
const skillIndicators=new SkillIndicators(),skillAim=new SkillAim();
