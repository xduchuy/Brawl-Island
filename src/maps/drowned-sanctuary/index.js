// Uses the host renderer and one host-owned update loop.
function createDrownedSanctuary({THREE,scene:hostScene,renderer,quality='medium',seed=13374209}){
 const CONFIG={seed};const scene=new THREE.Scene(),root=scene;scene.background=new THREE.Color('#111918');scene.fog=new THREE.FogExp2('#26302b',.0066);const isSmall=false;
 /* SANCTUARY_GEOMETRY */
 /* SANCTUARY_AMBIENCE */
        const architecture=buildSanctuaryArchitecture(mossSpots);
        const rootGeometry=buildAllRootSystems();
        const saintGeometryBuilder=new VoxelBatchBuilder();
        const saintGeometry=buildCentralStatueAndPedestal(saintGeometryBuilder,mossSpots);
        const architectureMesh=new THREE.Mesh(architecture.stone,stoneMaterial);
        architectureMesh.castShadow=true;architectureMesh.receiveShadow=true;
        const woodMesh=new THREE.Mesh(architecture.wood,woodMaterial);
        woodMesh.castShadow=true;
        const cliffMesh=new THREE.Mesh(architecture.cliffs,stoneMaterial);
        cliffMesh.castShadow=true;cliffMesh.receiveShadow=true;
        const rootsMesh=new THREE.Mesh(rootGeometry,barkMaterial);
        rootsMesh.castShadow=true;
        const baseMesh=new THREE.Mesh(saintGeometryBuilder.toBufferGeometry(),stoneMaterial);
        baseMesh.castShadow=true;baseMesh.receiveShadow=true;
        const saintMesh=new THREE.Mesh(saintGeometry,stoneMaterial);
        saintMesh.castShadow=true;saintMesh.receiveShadow=true;
        scene.add(architectureMesh,woodMesh,cliffMesh,rootsMesh,baseMesh,saintMesh);
 const solids=[architectureMesh,woodMesh,cliffMesh,rootsMesh,baseMesh,saintMesh];
 solids.forEach((m,i)=>m.name=["architecture","timbers-bells","terrain","roots","pedestal","saint"][i]);
        addFoliage(mossSpots);addReeds();addMotes();addFogSheets();makeBirds();createRelics();
        // Ancient halo is discreet until relics have been awakened.
        const halo=new THREE.Mesh(new THREE.TorusGeometry(4.15,.075,6,80),new THREE.MeshBasicMaterial({
          color:'#c6c4a1',transparent:true,opacity:.055,depthWrite:false
        }));
        halo.position.set(0,19.5,0);halo.rotation.x=.13;scene.add(halo);living.halo=halo;

 const converted=new Set();scene.traverse(o=>{if(o.isLight)o.color.convertSRGBToLinear();for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m&&!converted.has(m)){converted.add(m);m.color?.convertSRGBToLinear();m.emissive?.convertSRGBToLinear();}});
 const cameraPresets={hero:{pos:[14,14,52],at:[0,11,1]},arch:{pos:[-39,22,56],at:[-2,11,-3]},wide:{pos:[58,58,76],at:[0,9,0]},top:{pos:[0,110,4],at:[0,0,4]},gameplay:{pos:[35,40,48],at:[0,0,5]},statue:{pos:[10,19,19],at:[0,15,0]},roots:{pos:[-28,19,51],at:[-18,13,2]},courtyard:{pos:[9,6,32],at:[0,0,8]}};
 let awakened=false,mood=0,disposed=false,clock=0,reducedMotion=false;
 const tones=[['#141d1a','#344239','#e5d4ad','#d2ddd0','#142a28'],['#080e19','#253343','#8badc9','#7ea0c5','#0e2034'],['#373735','#77776d','#ffd8a3','#f4d2ae','#283f3a']];
 // Low submerged paving joins small source terrain seams without moving landmarks.
 const paving=new VoxelBatchBuilder();for(let x=-15;x<=15;x+=1.5)for(let z=-13.5;z<=16.5;z+=1.5){if(Math.abs(x)<4.5&&Math.abs(z)<4.5)continue;paving.addBox(x,-.82,z,1.51,.18,1.51,(x,y,z,a)=>computeStoneColor(x,y,z,a,.3),{mortar:0,skipBottom:true});}
 const pavingMesh=new THREE.Mesh(paving.toBufferGeometry(),stoneMaterial);pavingMesh.name='submerged-paving';pavingMesh.receiveShadow=true;scene.add(pavingMesh);solids.push(pavingMesh);
 const navigation=buildSanctuaryNavigation(THREE,solids,bed,collisionBoxes);
 const bounds={};for(const mesh of solids){mesh.geometry.computeBoundingBox();bounds[mesh.name]=mesh.geometry.boundingBox.clone();}
 function setQuality(level){quality=level;const low=level==='low',high=level==='high';water.geometry.dispose();water.geometry=new THREE.PlaneGeometry(215,215,low?48:high?160:90,low?48:high?160:90);sun.castShadow=!low;sun.shadow.mapSize.set(high?2048:1024,high?2048:1024);sun.shadow.map?.dispose();sun.shadow.map=null;living.reeds.count=low?300:high?1100:650;living.motes.geometry.setDrawRange(0,low?250:high?1050:600);living.fog.forEach((f,i)=>f.visible=i<(low?3:high?12:6));living.foliage.forEach(m=>{m.userData.fullCount??=m.count;m.count=Math.floor(m.userData.fullCount*(low?.5:high?1:.75));});}
 function update(dt,elapsed){if(disposed)return;dt=Math.min(.1,Math.max(0,dt));clock=elapsed;const t=reducedMotion?0:elapsed;waterUniforms.uTime.value=t;
      for(const r of relics){
        r.gem.rotation.y=t*.9;
        r.gem.position.y=.35+Math.sin(t*1.8+r.g.position.x)*.11;
        r.ring.rotation.y=t*.4;
        r.ring.rotation.z=Math.sin(t*.4)*.35;
        r.light.intensity=(r.active?2.9:1.5)+(Math.sin(t*2+r.g.position.x)+1)*.35;
        r.gem.material.emissiveIntensity=r.active?3.3:1.4;
      }
      for(const b of living.birds||[]){
        const i=b.userData.i;
        b.position.set(Math.sin(t*(.18+i*.007)+i*.87)*28,26+i*.82+Math.sin(t*.6+i)*2,Math.cos(t*.17+i*.62)*33-5);
        b.rotation.y=-t*.18-i*.45;
        b.userData.left.rotation.z=Math.sin(t*(5+i*.11)+i)*.43;
        b.userData.right.rotation.z=-Math.sin(t*(5+i*.11)+i)*.43;
      }
      for(const f of living.fog||[]){
        f.position.x=f.userData.x+Math.sin(t*.11+f.userData.phase)*2.0;
        f.position.z=f.userData.z+Math.cos(t*.08+f.userData.phase)*1.5;
        f.material.opacity=.065+Math.sin(t*.17+f.userData.phase)*.01;
      }
      if(living.halo){
        living.halo.material.opacity=awakened?.25+Math.sin(t*2)*.06:.055;
        living.halo.rotation.y=t*.08;
      }
      if(awakened) {
        sun.intensity=(mood===1?1.65:3.55)+Math.sin(t*.65)*.15;
      }

 const target=tones[mood],k=1-Math.exp(-dt*2);scene.background.lerp(new THREE.Color(target[0]).convertSRGBToLinear(),k);scene.fog.color.lerp(new THREE.Color(target[1]).convertSRGBToLinear(),k);sun.color.lerp(new THREE.Color(target[2]).convertSRGBToLinear(),k);hemi.color.lerp(new THREE.Color(target[3]).convertSRGBToLinear(),k);waterUniforms.uColorA.value.lerp(new THREE.Color(target[4]).convertSRGBToLinear(),k);waterUniforms.uMoon.value+=( (mood===1?1:.35)-waterUniforms.uMoon.value)*k;sun.intensity+=((mood===1?1.45:3.15)+(awakened?.4:0)-sun.intensity)*k;
 living.reeds.rotation.z=reducedMotion?0:Math.sin(t*.7)*.0015;
 }
 setQuality(quality);
 return {id:'drowned-sanctuary',root,scene,metadata:{name:'THE DROWNED SANCTUARY',seed,bounds,previewOnly:true,landmarks,stairs:stairs.map(s=>({...s,status:'source stair geometry; access only where connected ground samples exist'})),platforms:[{name:'left-balcony',bounds:[-27.2,8.125,16.5,-19.2,8.775,28.5],accessible:false}],cameraSafeAreas:['hero','wide','top','gameplay'],waterLevel:-.005,balconyAccess:'inspection-only; no continuous stairs to balcony in source'},...navigation,cameraPresets,update,setMood(n){mood=typeof n==='string'?['dusk','moonlight','dawn'].indexOf(n):n;mood=Math.max(0,mood)%3;},setQuality,setReducedMotion(v){reducedMotion=v;},activateRelic(i){if(relics[i])relics[i].active=true;awakened=relics.every(r=>r.active);return awakened;},relics,dispose(){if(disposed)return;disposed=true;const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m)ms.add(m);if(o.isInstancedMesh)o.dispose?.();});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());sun.shadow.map?.dispose();root.clear();}};
}
