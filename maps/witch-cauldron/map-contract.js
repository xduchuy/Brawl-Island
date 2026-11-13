/* Witch's Cauldron map-only spatial contract.
 * Coordinate source: user-supplied 90x90 voxel diorama.
 * Visual rendering remains in preview.html; combat integration is deliberately deferred.
 * All values are deterministic and independent of WebGL. */
(function(root){
  'use strict';
  const SCALE=0.23;
  const CAULDRON={id:'cauldron',type:'circle',x:0,z:2,radius:7.4,role:'hero-blocker'};
  const HUT={id:'witch-hut',type:'box',x:-21,z:-17,halfX:8,halfZ:7,role:'solid-building'};
  const ROCKS=[
    [16,-7,3.4],[19,-4,2.3],[-16,14,3.6],[-13,17,2.4],
    [22,21,3.8],[26,19,2.5],[-32,-7,3.3],[-29,-10,2.2],
    [6,27,3.1],[9,29,2.1],[-6,-18,2.7],[33,-5,3],
    [-21,28,2.9],[13,16,2.2]
  ].map(([x,z,radius],i)=>({id:'boulder-'+(i+1),type:'circle',x,z,radius,role:'hard-cover'}));
  const TREES=[
    [25,-18,2.7],[-31,9,2.7],[29,11,2.7],[-7,-29,2.7],[14,-28,2.7]
  ].map(([x,z,radius],i)=>({id:'tree-'+(i+1),type:'circle',x,z,radius,role:'hard-cover'}));
  const BLOCKERS=[CAULDRON,HUT,...ROCKS,...TREES];
  const SPAWNS=[
    {id:'p1',team:0,x:-19,z:1},
    {id:'p2',team:1,x:19,z:1},
    {id:'p3',team:0,x:-8,z:23},
    {id:'p4',team:1,x:8,z:23}
  ];
  const LANDMARKS=[
    {id:'cauldron',label:'Boiling cauldron',x:0,z:2,y:1,kind:'hero'},
    {id:'witch-hut',label:'Crooked witch hut',x:-21,z:-17,y:2,kind:'secondary'},
    {id:'cat',label:'Black cat',x:8,z:8,y:1,kind:'animated-dressing'},
    {id:'moon',label:'Voxel moon',x:36,z:-48,y:38,kind:'sky-only'},
    {id:'clearing',label:'Stone clearing',x:0,z:2,y:0,kind:'walkable-ring'}
  ];
  // Exactly the source island rounded-square SDF; 1.0 is the outer edge.
  function islandSDF(x,z){
    const ax=Math.abs(x)/43.5,az=Math.abs(z)/43.5;
    const rounded=Math.pow(Math.pow(ax,4.2)+Math.pow(az,4.2),1/4.2);
    const noise=.045*Math.sin(x*.19+z*.13)+.03*Math.cos(x*.31-z*.27);
    return rounded+noise;
  }
  function surfaceHeight(x,z){
    const dCenter=Math.hypot(x,z-2),n=islandSDF(x,z);
    if(n>1)return null;
    let h=0;
    if(dCenter>15&&n<.92){
      const hill=Math.sin(x*.11)*Math.cos(z*.11)+Math.sin((x-z)*.07)*.5;
      if(hill>.35)h=1;
      if(hill>.85&&n<.78)h=2;
    }
    const dHut=Math.hypot(x+21,z+17);
    if(dHut<13)h=Math.max(h,dHut<10?2:1);
    return h;
  }
  function collides(x,z,radius=0.9){
    for(const b of BLOCKERS){
      if(b.type==='circle'&&Math.hypot(x-b.x,z-b.z)<b.radius+radius)return b.id;
      if(b.type==='box'&&Math.abs(x-b.x)<b.halfX+radius&&Math.abs(z-b.z)<b.halfZ+radius)return b.id;
    }
    return null;
  }
  function canWalk(x,z,radius=0.9){
    if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(radius)||radius<0)return false;
    // Source units: a small safety strip at the cliff, not a circular ring.
    if(islandSDF(x,z)>1-(2.8+radius)/44)return false;
    return !collides(x,z,radius);
  }
  function toGame(point){
    return {x:point.x*SCALE,y:(point.y||0)*SCALE,z:point.z*SCALE};
  }
  function toSource(point){return {x:point.x/SCALE,y:(point.y||0)/SCALE,z:point.z/SCALE};}
  function spawnAnchors(){
    return SPAWNS.map(p=>({...p,y:surfaceHeight(p.x,p.z)||0,world:toGame({...p,y:surfaceHeight(p.x,p.z)||0})}));
  }
  function findReachable(start,end,step=1){
    // Inspection pathfinder, not production combat AI.
    const key=(x,z)=>x+','+z;
    const from={x:Math.round(start.x/step),z:Math.round(start.z/step)};
    const target={x:Math.round(end.x/step),z:Math.round(end.z/step)};
    if(!canWalk(from.x*step,from.z*step)||!canWalk(target.x*step,target.z*step))return null;
    const q=[from],seen=new Map([[key(from.x,from.z),null]]);
    let found=false;
    for(let at=0;at<q.length&&q.length<30000;at++){
      const p=q[at],k=key(p.x,p.z);
      if(p.x===target.x&&p.z===target.z){found=true;break;}
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=p.x+dx,nz=p.z+dz,nk=key(nx,nz);
        if(seen.has(nk)||!canWalk(nx*step,nz*step))continue;
        seen.set(nk,k);q.push({x:nx,z:nz});
      }
    }
    if(!found)return null;
    const path=[];
    let k=key(target.x,target.z);
    while(k!==null){const [x,z]=k.split(',').map(Number);path.push({x:x*step,z:z*step});k=seen.get(k)??null;}
    return path.reverse();
  }
  const contract={
    id:'witch_cauldron',name:"Witch's Cauldron",version:1,seed:133742,
    type:'map-only-environment',sourceVoxelWidth:90,scale:SCALE,
    environment:'moonlit-voxel-witch-island',boundary:'rounded-square-cliff',
    combatIntegration:'deferred',dynamicHazards:false,
    landmarks:LANDMARKS,blockers:BLOCKERS,spawnPoints:SPAWNS,
    animatedSystems:['potion','geyser','fire','hut-windows','chimney-smoke','mushrooms','candles','ghosts','bats','cat','mist','moon'],
    islandSDF,surfaceHeight,collides,canWalk,toGame,toSource,spawnAnchors,findReachable
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=contract;
  root.WitchCauldronMap=contract;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:this);
