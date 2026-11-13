/* Interactive 2D engineering inspection for the environment-only preview.
 * This script never creates actors and never changes BrawlMatch. */
(() => {
  'use strict';
  const map=window.WitchCauldronMap;
  if(!map) { console.error('Witch Cauldron map contract missing'); return; }
  const toggle=document.createElement('button');
  toggle.id='wc-tool-toggle';toggle.textContent='MAP LAB · INSPECT';toggle.setAttribute('aria-expanded','false');
  const panel=document.createElement('section');panel.id='wc-map-panel';panel.hidden=true;
  panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Witch Cauldron terrain inspection');
  panel.innerHTML='<header><div><h2>Witch’s Cauldron / Map Lab</h2><small>Environment only · no fighters · 90 × 90 source voxels</small></div><button class="wc-close" id="wc-close" aria-label="Close map inspector">×</button></header><canvas id="wc-map-canvas" width="360" height="360" aria-label="Walkable terrain top-down plan"></canvas><div id="wc-map-legend"><span style="--swatch:#e2f4a8">Spawn anchors</span><span style="--swatch:#647284">Hard cover</span><span style="--swatch:#35eb72">Cauldron</span></div><div id="wc-map-actions"><button id="wc-show-blocks">Obstacle layer</button><button id="wc-show-routes">Validate routes</button><button id="wc-pause">Pause ambience</button><button id="wc-erupt">Potion geyser</button></div><p id="wc-map-status">Original procedural map preserved. Toggle collisions or inspect routes.</p>';
  document.body.append(toggle,panel);
  const $=id=>document.getElementById(id);
  const canvas=$('wc-map-canvas'),ctx=canvas.getContext('2d');
  const N=canvas.width,scale=N/90,coord=(x,z)=>[(x+45)*scale,(z+45)*scale];
  let showBlocks=true,showRoutes=false;
  function disk(x,z,r,col,stroke){
    const [cx,cz]=coord(x,z);
    ctx.beginPath();ctx.arc(cx,cz,r*scale,0,Math.PI*2);
    if(col){ctx.fillStyle=col;ctx.fill();}
    if(stroke){ctx.lineWidth=1.3;ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function draw(){
    ctx.clearRect(0,0,N,N);ctx.fillStyle='#101c29';ctx.fillRect(0,0,N,N);
    for(let x=-44;x<=44;x++)for(let z=-44;z<=44;z++){
      const d=map.islandSDF(x,z);if(d>1)continue;
      const [px,pz]=coord(x,z);
      const h=map.surfaceHeight(x,z)||0;
      ctx.fillStyle=d>.93?'#24352f':Math.hypot(x,z-2)<13?'#53616b':h>=2?'#385444':'#2e4d39';
      ctx.fillRect(Math.round(px),Math.round(pz),Math.ceil(scale)+.5,Math.ceil(scale)+.5);
    }
    disk(0,2,12,'#56616a');
    disk(-21,-17,11,'#405548');
    if(showBlocks){
      for(const b of map.blockers){
        if(b.type==='circle') disk(b.x,b.z,b.radius,b.id==='cauldron'?'#122c25':'#657283',b.id==='cauldron'?'#4efd8b':'#a8b4be');
        else {
          const [px,pz]=coord(b.x-b.halfX,b.z-b.halfZ);
          ctx.fillStyle='#422d55';ctx.fillRect(px,pz,b.halfX*2*scale,b.halfZ*2*scale);
          ctx.strokeStyle='#ba93e7';ctx.strokeRect(px,pz,b.halfX*2*scale,b.halfZ*2*scale);
        }
      }
      for(const p of [[-13,9],[14,9],[2,17],[-24,3],[23,2],[-18,22]])disk(p[0],p[1],1.4,'#a951d2');
      disk(8,8,1.4,'#11161f','#99eb6b');
    }
    if(showRoutes){
      for(const [a,b] of [[map.spawnPoints[0],map.spawnPoints[1]],[map.spawnPoints[2],map.spawnPoints[3]]]){
        const path=map.findReachable(a,b);
        if(!path)continue;
        ctx.beginPath();path.forEach((p,i)=>{const [x,z]=coord(p.x,p.z);i?ctx.lineTo(x,z):ctx.moveTo(x,z);});
        ctx.strokeStyle=a.team===0?'#8ef6fd':'#e9de91';ctx.lineWidth=2;ctx.stroke();
      }
    }
    for(const p of map.spawnPoints){
      const [x,z]=coord(p.x,p.z);
      disk(p.x,p.z,1.9,p.team===0?'#ebf1a5':'#a2e6ff','#152d32');
      ctx.fillStyle='#101c29';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.id.toUpperCase(),x,z);
    }
    ctx.fillStyle='#c5e9d9';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.font='bold 10px system-ui';ctx.fillText('N ↑',12,18);
  }
  function status(message){$('wc-map-status').textContent=message;}
  function open(opened){panel.hidden=!opened;toggle.setAttribute('aria-expanded',String(opened));if(opened)draw();}
  toggle.onclick=()=>open(panel.hidden);
  $('wc-close').onclick=()=>open(false);
  $('wc-show-blocks').onclick=()=>{showBlocks=!showBlocks;draw();status(showBlocks?'Physical blockers highlighted.':'Physical blocker overlay hidden.');};
  $('wc-show-routes').onclick=()=>{
    showRoutes=!showRoutes;draw();
    const paths=[map.findReachable(map.spawnPoints[0],map.spawnPoints[1]),map.findReachable(map.spawnPoints[2],map.spawnPoints[3])];
    status(paths.every(Boolean)?'Both 1v1 and 2v2 test routes connect; visual-only route validation.':'WARNING: a spawn route is disconnected.');
  };
  $('wc-pause').onclick=()=>{
    const scene=window.WitchCauldronScene;
    if(!scene){status('3D scene is loading; check network access to jsDelivr.');return;}
    if(scene.paused){scene.resume();$('wc-pause').textContent='Pause ambience';status('Ambient animation resumed.');}
    else {scene.pause();$('wc-pause').textContent='Resume ambience';status('Ambient animation paused for inspection.');}
  };
  $('wc-erupt').onclick=()=>{window.WitchCauldronScene?.triggerGeyser();status('Potion geyser triggered in the original animated scene.');};
  document.addEventListener('keydown',e=>{
    if(e.target?.matches?.('input,textarea,select'))return;
    if(e.key==='Escape'&&!panel.hidden){open(false);return;}
    const cameras={1:'overview',2:'cauldron',3:'hut',4:'moon'};
    if(cameras[e.key])window.WitchCauldronScene?.setCamera(cameras[e.key]);
    if(e.key.toLowerCase()==='g')window.WitchCauldronScene?.triggerGeyser();
    if(e.code==='Space'){e.preventDefault();$('wc-pause').click();}
    if(e.key.toLowerCase()==='m')open(panel.hidden);
  });
  draw();
})();
