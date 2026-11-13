// Spatially indexed triangle/capsule clearance; ignores decorative foliage and water.
function sanctuaryClearance(THREE, meshes) {
 const buckets = new Map(), bucketSize = 2, scratch = new THREE.Vector3();
 const ray = new THREE.Ray(), low = new THREE.Vector3(), high = new THREE.Vector3();
 for (const mesh of meshes) {
  const p = mesh.geometry.attributes.position, idx = mesh.geometry.index;
  for (let n = 0; n < (idx ? idx.count : p.count); n += 3) {
   const v = [0,1,2].map(j => new THREE.Vector3().fromBufferAttribute(p, idx ? idx.getX(n+j) : n+j));
   const minY = Math.min(...v.map(p=>p.y)), maxY = Math.max(...v.map(p=>p.y));
   if (minY > 4 || maxY < -.95) continue;
   const tri = new THREE.Triangle(...v), entry = {tri,minY,maxY};
   const minX=Math.floor(Math.min(...v.map(p=>p.x))/bucketSize),maxX=Math.floor(Math.max(...v.map(p=>p.x))/bucketSize);
   const minZ=Math.floor(Math.min(...v.map(p=>p.z))/bucketSize),maxZ=Math.floor(Math.max(...v.map(p=>p.z))/bucketSize);
   for(let x=minX;x<=maxX;x++) for(let z=minZ;z<=maxZ;z++) {
    const key=x+','+z;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(entry);
   }
  }
 }
 // Squared distance between vertical capsule axis and a triangle edge.
 function edgeDistance(a,b) {
  const ex=b.x-a.x,ey=b.y-a.y,ez=b.z-a.z, h=high.y-low.y;
  const rx=low.x-a.x,ry=low.y-a.y,rz=low.z-a.z;
  const A=h*h,E=ex*ex+ey*ey+ez*ez,B=h*ey,C=h*ry,F=ex*rx+ey*ry+ez*rz;
  const clamp01=v=>Math.max(0,Math.min(1,v));
  let s=0,t=0;
  if(E<1e-12)s=clamp01(-C/A);
  else {const den=A*E-B*B;s=den>1e-12?clamp01((B*F-C*E)/den):0;t=(B*s+F)/E;
   if(t<0){t=0;s=clamp01(-C/A);}else if(t>1){t=1;s=clamp01((B-C)/A);}}
  return (rx-ex*t)**2+(ry+h*s-ey*t)**2+(rz-ez*t)**2;
 }
 return function clear(x,y,z,radius=.42) {
  low.set(x,y+.45,z);high.set(x,y+1.5,z);ray.set(low,new THREE.Vector3(0,1,0));
  const visited=new Set();
  for(let bx=Math.floor((x-radius)/bucketSize);bx<=Math.floor((x+radius)/bucketSize);bx++)
   for(let bz=Math.floor((z-radius)/bucketSize);bz<=Math.floor((z+radius)/bucketSize);bz++)
    for(const entry of buckets.get(bx+','+bz)||[]) {
     if(visited.has(entry)||entry.maxY<low.y-radius||entry.minY>high.y+radius)continue;
     visited.add(entry);const t=entry.tri,r2=radius*radius;
     if(ray.intersectTriangle(t.a,t.b,t.c,false,scratch)&&scratch.y<=high.y)return false;
     t.closestPointToPoint(low,scratch);if(scratch.distanceToSquared(low)<r2)return false;
     t.closestPointToPoint(high,scratch);if(scratch.distanceToSquared(high)<r2)return false;
     if(edgeDistance(t.a,t.b)<r2||edgeDistance(t.b,t.c)<r2||edgeDistance(t.c,t.a)<r2)return false;
    }
  return true;
 };
}

// Conservative geometry-derived samples for future navigation, never BrawlMatch rules.
function buildSanctuaryNavigation(THREE,meshes,bed,boxes){
 const clear=sanctuaryClearance(THREE,meshes);
 const cells=new Map(),step=.75,key=(x,z)=>x+','+z,heights=new Map();
 for(const mesh of meshes){const g=mesh.geometry,p=g.attributes.position,idx=g.index;for(let n=0;n<(idx?idx.count:p.count);n+=3){const v=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,idx?idx.getX(n+j):n+j)),normal=new THREE.Vector3().subVectors(v[1],v[0]).cross(new THREE.Vector3().subVectors(v[2],v[0])).normalize();if(normal.y<.7)continue;const minX=Math.ceil(Math.min(...v.map(p=>p.x))/step),maxX=Math.floor(Math.max(...v.map(p=>p.x))/step),minZ=Math.ceil(Math.min(...v.map(p=>p.z))/step),maxZ=Math.floor(Math.max(...v.map(p=>p.z))/step);for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){const q=new THREE.Vector3(x*step,0,z*step),a=v[0],b=v[1],c=v[2],den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(den)<1e-9)continue;const u=((b.z-c.z)*(q.x-c.x)+(c.x-b.x)*(q.z-c.z))/den,w=((c.z-a.z)*(q.x-c.x)+(a.x-c.x)*(q.z-c.z))/den;if(u<0||w<0||u+w>1)continue;q.y=u*a.y+w*b.y+(1-u-w)*c.y;const k=key(x,z);if(!heights.has(k))heights.set(k,[]);heights.get(k).push(q.y);}}
 }
 for(const[k,ys]of heights){const [ix,iz]=k.split(',').map(Number);const y=ys.filter(y=>y>-.95&&y<2).sort((a,b)=>b-a)[0];if(y===undefined||ys.some(h=>h>y+.25&&h<y+2.1))continue;const x=ix*step,z=iz*step;if(boxes.some(b=>{const [cx,cy,cz]=b.center,[sx,sy,sz]=b.size;if(cy+sy/2<=y+.4||cy-sy/2>=y+2)return false;const a=b.rotation[1],dx=x-cx,dz=z-cz;return Math.abs(dx*Math.cos(a)-dz*Math.sin(a))<sx/2+.25&&Math.abs(dx*Math.sin(a)+dz*Math.cos(a))<sz/2+.25;}))continue;if(clear(x,y,z))cells.set(k,{x,y,z});}
 // Conservative swept clearance: quarter-step samples, inflated capsule radius.
 const edgeCache=new Map();
 function connected(a,b){const ka=key(a.x,a.z),kb=key(b.x,b.z),k=[ka,kb].sort().join('|');if(edgeCache.has(k))return edgeCache.get(k);const safe=Math.abs(a.y-b.y)<=.4&&[.25,.5,.75].every(t=>clear(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t));edgeCache.set(k,safe);return safe;}
 // Largest connected sampled component, with a conservative step-up bound.
 const unseen=new Set(cells.keys()),components=[];while(unseen.size){const start=unseen.values().next().value,queue=[start];unseen.delete(start);for(let i=0;i<queue.length;i++){const k=queue[i],[x,z]=k.split(',').map(Number);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const next=key(x+dx,z+dz);if(unseen.has(next)&&connected(cells.get(k),cells.get(next))){unseen.delete(next);queue.push(next);}}}components.push(queue);}components.sort((a,b)=>b.length-a.length);
 const walkableSurfaces=(components[0]||[]).map(k=>cells.get(k));
 const spawnPoints=[],region=new Set((components[0]||[]));
 const candidates=[...walkableSurfaces].filter(c=>[[-1,0],[1,0],[0,1],[0,-1]].every(([dx,dz])=>region.has(key(Math.round(c.x/step)+dx,Math.round(c.z/step)+dz)))).sort((a,b)=>a.z-b.z);
 const middle=candidates.length?(candidates[0].z+candidates[candidates.length-1].z)/2:0;
 for(const side of ['north','south']) {
  const ordered=side==='north'?candidates:[...candidates].reverse();let count=0;
  for(const c of ordered) {if((side==='north'?c.z<middle:c.z>middle)&&spawnPoints.every(s=>Math.hypot(s.x-c.x,s.z-c.z)>2.5)){spawnPoints.push({...c,side,primary:count===0});if(++count===2)break;}}
 }

 return{walkableSurfaces,spawnPoints,blockers:meshes.map(m=>({type:'triangle-mesh',geometry:m.geometry,name:m.name})),waterRegions:[{height:-.005,walkableOnlyWhereSampled:true,unmappedWaterTraversable:false,bounds:[-107.5,-107.5,107.5,107.5]}],navigation:{resolution:step,components:components.map(c=>c.length),unreachableSamples:[].concat(...components.slice(1)).map(k=>cells.get(k)),agent:{radius:.3,height:1.8,maxStep:.4,clearanceRadius:.42},status:'conservative capsule-clearance graph; future controller integration required'},isClear(x,y,z){return clear(x,y,z);},sampleGround(x,z){return cells.get(key(Math.round(x/step),Math.round(z/step)))?.y??null;}};
}
