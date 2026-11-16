// Original procedural shinobi, sharing the existing eighteen-bone combat rig.
function createNaruto(kind,team,statue=false){
 const d=NARUTO_ROSTER[kind],g=new THREE.Group(),pivot=new THREE.Group(),bones={},limbs={};g.add(pivot);
 const ink='#282d39',skin=statue?'#bbc5b2':kind==='orochimaru'?'#e0dac4':'#e2b99c',hair=statue?'#7c8b7e':d.hair,coat=statue?'#99a58f':d.coat,accent=statue?'#b8bba1':d.color,metal='#9db1b9';
 const cloak=d.group==='Akatsuki',armor=['hashirama','tobirama','madara'].includes(kind),long=['neji','hinata','orochimaru','hashirama','madara','jiraiya'].includes(kind),kicker=d.weapon==='kick';
 function bone(name,parent,x,y,z){const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);parent.add(b);bones[name]=b;return b;}
 function rod(parent,c,a,b,r){const from=V(...a),to=V(...b),mid=from.clone().add(to).multiplyScalar(.5),delta=to.sub(from);const m=addMesh(parent,cylGeo,c,mid.x,mid.y,mid.z,r,delta.length(),r);m.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());return m;}
 const root=bone('root',pivot,0,0,0),hips=bone('hips',root,0,.89,0),spine=bone('spine',hips,0,.19,0),chest=bone('chest',spine,0,.25,0),neck=bone('neck',chest,0,.31,0),head=bone('head',neck,0,.12,0),modelScale=d.height/2.25;g.scale.setScalar(modelScale);
 mb(chest,coat,0,-.015,0,.55,.51,.34);mb(spine,coat,0,-.06,0,.48,.29,.30);mb(hips,kind==='naruto'?coat:ink,0,-.07,0,.50,.24,.33);
 if(['kakashi','shikamaru','minato'].includes(kind)){for(const side of [-1,1]){mb(chest,'#6f8973',side*.14,.01,.19,.22,.43,.07);for(let j=0;j<3;j++)mb(chest,'#526956',side*.14,.15-j*.13,.235,.18,.03,.025);}mb(chest,ink,0,-.01,.19,.025,.48,.03);}
 if(kind==='naruto'){mb(chest,ink,0,.14,.18,.53,.20,.035);for(const side of [-1,1])mb(chest,ink,side*.24,.02,.01,.08,.49,.35);mb(chest,'#c4c4ad',0,-.02,.20,.02,.48,.02);}
 if(kind==='sasuke'){mb(chest,skin,0,.17,.18,.14,.20,.035);for(const side of [-1,1]){const lapel=mb(chest,'#d0cbd0',side*.08,.16,.20,.06,.26,.025);lapel.rotation.z=side*.4;}}
 if(['sasuke','orochimaru'].includes(kind)){for(let j=0;j<2;j++)addMesh(hips,new THREE.TorusGeometry(.285,.034,5,20),'#8b6eae',0,.04-j*.06,0,1,1,.72).rotation.x=Math.PI/2;for(const side of [-1,1]){const rope=mb(hips,'#9075b3',side*.16,-.17,-.22,.08,.45,.07);rope.rotation.z=side*.38;}}
 if(kind==='sakura'){mb(chest,'#c7b8b1',0,-.01,.185,.018,.48,.025);for(const side of [-1,1])mb(hips,coat,side*.18,-.24,0,.17,.36,.34);}
 if(kind==='hinata'){mb(chest,'#ddd7ce',0,.06,.19,.26,.4,.03);ms(neck,'#e0dbd3',0,-.03,-.03,.34,.10,.26);mb(chest,ink,0,-.02,.22,.018,.5,.02);}
 if(kind==='neji'){mb(chest,'#b2a38d',0,-.14,.19,.51,.07,.03);mb(hips,'#9b8b6c',0,.02,0,.53,.075,.37);}
 if(cloak){mb(chest,'#923f4c',0,.03,.185,.025,.59,.025);for(const side of [-1,1]){mb(hips,coat,side*.16,-.27,-.02,.31,.53,.39);mb(neck,coat,side*.22,-.01,.03,.16,.26,.34);for(let j=0;j<2;j++){const x=side*(j?.17:.11),y=.10-j*.28;for(let k=0;k<3;k++){ms(chest,'#d4c8c2',x+(k-1)*.045,y+Math.sin(k*2)*.025,.205,.067,.045,.018);ms(chest,'#ab4b57',x+(k-1)*.045,y+Math.sin(k*2)*.025,.224,.053,.032,.01);}}}}
 if(armor){for(let j=0;j<4;j++){mb(chest,coat,0,.19-j*.13,.19,.57,.105,.07);mb(chest,'#573f4b',0,.14-j*.13,.232,.52,.018,.018);}for(const side of [-1,1])for(let j=0;j<3;j++)mb(hips,coat,side*.24,-.1-j*.12,.02,.17,.10,.38);}
 if(['jiraiya','tsunade','minato'].includes(kind)){for(const side of [-1,1]){mb(chest,coat,side*.23,0,.02,.17,.61,.40);mb(hips,coat,side*.22,-.26,-.06,.20,.45,.36);}mb(chest,kind==='tsunade'?'#bbb6a5':'#5e7963',0,0,.185,.25,.48,.04);}
 if(kind==='minato')for(const side of [-1,1])for(let j=0;j<3;j++)addMesh(hips,coneGeo,'#b8493c',side*(.15+j*.05),-.38,.15,.045,.19,.02);
 if(kind==='gaara'){const strap=mb(chest,'#b29d77',0,0,.20,.10,.58,.025);strap.rotation.z=-.52;ms(chest,'#b79761',.14,.03,-.40,.29,.43,.27);ms(chest,'#c3a76d',.14,.44,-.40,.18,.23,.18);addMesh(chest,cylGeo,'#735d42',.14,.65,-.40,.095,.10,.095);for(let j=0;j<3;j++)mb(chest,'#826544',.14,-.19+j*.20,-.665,.18,.035,.02);}
 if(kind==='jiraiya'){const scroll=addMesh(chest,cylGeo,'#b6c7aa',0,.05,-.34,.15,.70,.15);scroll.rotation.z=Math.PI/2;for(const side of [-1,1]){const cap=addMesh(chest,cylGeo,'#8f4545',side*.36,.05,-.34,.17,.09,.17);cap.rotation.z=Math.PI/2;}}
 // Face, headband, eyes and hair.
 ms(head,skin,0,.12,0,.23,.27,.20);mb(head,skin,0,.025,.13,.33,.23,.13);
 for(const side of [-1,1]){ms(head,skin,side*.235,.10,0,.043,.075,.045);mb(head,'#f2e8dc',side*.10,.14,.21,.11,.064,.018);mb(head,['hinata','neji'].includes(kind)?'#d8d1e5':['sasuke','itachi','madara'].includes(kind)?'#ab4357':kind==='pain'?'#b39fc6':kind==='orochimaru'?'#cbbb65':'#496b83',side*.10,.14,.228,.041,.056,.01);if(!['hinata','neji'].includes(kind))mb(head,ink,side*.10,.14,.24,.012,.044,.006);const brow=mb(head,hair,side*.10,.215,.218,.13,kicker?.045:.022,.018);brow.rotation.z=side*.13;}
 mb(head,'#996b5a',0,-.065,.22,.09,.014,.01);ms(head,skin,0,.04,.225,.027,.04,.025);
 ms(head,hair,0,.33,-.03,.25,.15,.22);
 if(kicker){ms(head,hair,0,.28,-.025,.265,.18,.235);mb(head,hair,0,.255,.18,.44,.08,.055);}else if(['hinata','neji','tsunade','orochimaru','hashirama','itachi','sakura'].includes(kind)){mb(head,hair,0,.295,.16,.43,.10,.09);for(const side of [-1,1]){const fringe=mb(head,hair,side*.17,.23,.18,.09,.21,.06);fringe.rotation.z=side*.18;}}else for(let j=0;j<9;j++){const a=j*TAU/9,lock=addMesh(head,coneGeo,hair,Math.sin(a)*.19,.35,Math.cos(a)*.15,.08,kind==='jiraiya'||kind==='madara'?.34:.22,.075);lock.rotation.z=-Math.sin(a)*.6;lock.rotation.x=Math.cos(a)*.5;}
 if(long){mb(head,hair,0,-.18,-.22,.40,.85,.11);for(const side of [-1,1])mb(head,hair,side*.23,-.09,-.11,.09,.66,.15);}
 if(['sakura','itachi'].includes(kind))for(const side of [-1,1])mb(head,hair,side*.23,.04,-.01,.075,.38,.13);
 if(kind==='tsunade')for(const side of [-1,1]){mb(head,hair,side*.21,-.05,-.06,.10,.47,.12);mb(head,'#96774e',side*.21,-.08,.01,.11,.04,.02);}
 if(kind==='shikamaru'){ms(head,hair,0,.42,-.14,.14,.10,.13);for(let j=0;j<4;j++){const tail=addMesh(head,coneGeo,hair,(j-1.5)*.05,.55,-.17,.055,.28,.07);tail.rotation.x=-.5;}}
 const headband=!['gaara','tsunade','orochimaru','madara','obito','hinata','shikamaru'].includes(kind);
 if(headband){const band=mb(head,kind==='sakura'?'#9c3f51':ink,0,.255,.18,.48,.105,.075);if(kind==='kakashi')band.rotation.z=-.20;mb(head,metal,kind==='kakashi'?-.055:0,kind==='kakashi'?.225:.255,.225,.29,.08,.018);for(const side of [-1,1])ms(head,'#4b606b',side*.12,.255,.238,.009,.009,.006);addMesh(head,new THREE.TorusGeometry(.023,.006,3,10),'#536574',0,.255,.242,1,1,1);rod(head,'#536574',[-.015,.24,.244],[.036,.24,.244],.006);if(cloak)rod(head,'#3d454f',[-.14,.27,.247],[.14,.245,.247],.006);}
 if(kind==='kakashi'){mb(head,'#384255',0,-.005,.217,.35,.16,.026);mb(head,ink,-.11,.175,.225,.15,.12,.023);}
 if(kind==='naruto')for(const side of [-1,1])for(let j=0;j<3;j++)rod(head,'#9c6e56',[side*.10,.025-j*.038,.235],[side*.19,.035-j*.038,.22],.006);
 if(kind==='sakura'||kind==='tsunade'){const seal=mb(head,'#796094',0,.245,.225,.032,.048,.012);seal.rotation.z=Math.PI/4;}
 if(kind==='jiraiya')for(const side of [-1,1])mb(head,'#a64848',side*.11,.005,.226,.03,.20,.015);
 if(kind==='tobirama'){for(const side of [-1,1]){mb(head,'#ad5350',side*.16,.04,.225,.025,.16,.012);ms(neck,'#e0e0d0',side*.23,-.04,0,.18,.14,.21);}mb(neck,'#e0e0d0',0,-.045,-.19,.50,.16,.12);}
 if(kind==='gaara'){mb(head,'#a5403e',-.12,.25,.215,.055,.06,.015);for(const side of [-1,1])mb(head,'#77524c',side*.10,.10,.229,.12,.016,.012);}
 if(kind==='pain'){for(const side of [-1,1])for(let j=0;j<3;j++)ms(head,'#454856',side*.18,.05-j*.055,.22,.013,.013,.012);for(let j=0;j<3;j++)mb(head,'#454856',-.035+j*.035,.065,.26,.018,.025,.016);}
 if(kind==='obito'){ms(head,'#bb7846',0,.12,.16,.235,.265,.13);for(let j=0;j<4;j++){const ring=addMesh(head,new THREE.TorusGeometry(.045+j*.043,.008,4,20),'#7c4d35',.065,.12,.277-j*.007,1,1.15,1);}ms(head,ink,.065,.12,.30,.034,.041,.015);ms(head,'#a74b56',.065,.12,.316,.013,.02,.008);}
 for(const side of [-1,1]){
  const n=side<0?'R':'L',upper=bone('upperArm'+n,chest,side*.34,.17,0),fore=bone('forearm'+n,upper,0,-.34,0),hand=bone('hand'+n,fore,0,-.31,0),thigh=bone('thigh'+n,hips,side*.17,-.07,0),shin=bone('shin'+n,thigh,0,-.38,0),foot=bone('foot'+n,shin,0,-.37,0);
  limbs['arm'+n]={upper,lower:fore,end:hand,a:.34,b:.31};limbs['leg'+n]={upper:thigh,lower:shin,end:foot,a:.38,b:.37};
  mb(upper,kind==='sakura'?skin:coat,0,-.15,0,.23,.31,.25);mb(fore,['sakura','sasuke','tsunade'].includes(kind)?skin:cloak?coat:ink,0,-.15,0,.18,.28,.19);mb(hand,kind==='sakura'?ink:skin,0,-.06,.02,.14,.17,.11);
  mb(thigh,kind==='naruto'||kicker?coat:ink,0,-.18,0,.24,.36,.25);mb(shin,kicker?'#ba864c':kind==='naruto'?coat:ink,0,-.17,0,.18,.32,.19);mb(foot,'#344655',0,-.04,.08,.22,.09,.35);mb(foot,skin,0,.015,.19,.18,.06,.14);mb(foot,'#344655',0,.045,.08,.21,.065,.15);
  if(!cloak)for(let j=0;j<3;j++)mb(shin,kicker?'#d2aa72':'#c7c9bb',0,-.08-j*.07,.105,.18,.025,.015);
  if(['neji','rocklee','mightguy'].includes(kind))for(let j=0;j<4;j++)mb(fore,'#d7d5c4',0,-.08-j*.05,0,.19,.036,.20);
  if(armor)for(let j=0;j<3;j++)mb(upper,coat,side*.02,.02-j*.10,0,.28,.085,.31);
  if(side===1&&!cloak)mb(thigh,'#8c7e6a',.13,-.14,0,.10,.20,.20);
 }
 const weapon=new THREE.Group(),shield=new THREE.Group();bones.handR.add(weapon);bones.forearmL.add(shield);
 if(d.weapon==='kunai'){mb(weapon,ink,0,.04,0,.04,.22,.04);addMesh(weapon,coneGeo,metal,0,.25,0,.075,.24,.035);addMesh(weapon,new THREE.TorusGeometry(.045,.012,4,12),metal,0,-.10,0,1,1,1);if(kind==='minato')for(const side of [-1,1]){const prong=addMesh(weapon,coneGeo,metal,side*.075,.19,0,.04,.16,.025);prong.rotation.z=-side*.5;}}
 if(d.weapon==='sword'){mb(weapon,ink,0,.04,0,.055,.24,.055);mb(weapon,metal,0,.18,0,.16,.035,.06);mb(weapon,'#c5d1d3',0,.59,0,.06,.77,.025);addMesh(weapon,coneGeo,'#d9ded8',0,1.04,0,.04,.14,.02);}
 if(d.weapon==='fan'){mb(weapon,'#6c5551',0,.15,0,.055,.55,.06);ms(weapon,'#c5b6a4',0,.64,0,.29,.37,.035);for(const side of [-1,1])ms(weapon,'#7d4850',side*.11,.67,.04,.06,.07,.01);}
 if(d.weapon==='rods')mb(weapon,ink,0,.30,0,.045,.85,.045);
 if(d.weapon==='chain')for(let j=0;j<8;j++)addMesh(weapon,new THREE.TorusGeometry(.034,.011,4,8),metal,Math.sin(j*.5)*.08,.05+j*.06,0,1,1,1).rotation.y=j%2*Math.PI/2;
 // Cast visuals are transient meshes, excluded from instanced body parts and hit detection.
 function effect(parent,geo,c,x,y,z,sx,sy,sz,opacity=.5){const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:c,transparent:true,opacity,depthWrite:false}));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.userData.effect=true;parent.add(m);return m;}
 const chakra=new THREE.Group();bones.handR.add(chakra);effect(chakra,sphereGeo,accent,0,-.04,.16,.15,.15,.15,.65);const chakraRing=effect(chakra,new THREE.TorusGeometry(.20,.018,5,20),accent,0,-.04,.16,1,1,1,.85);chakra.visible=false;
 const manifestation=new THREE.Group();root.add(manifestation);manifestation.visible=false;
 if(kind==='naruto')for(const side of [-1,1]){effect(manifestation,boxGeo,coat,side*.66,1.26,.05,.30,.47,.22,.28);effect(manifestation,sphereGeo,hair,side*.66,1.67,.05,.17,.18,.16,.32);for(const leg of [-1,1])effect(manifestation,boxGeo,coat,side*.66+leg*.10,.68,.05,.13,.6,.15,.28);}
 if(['itachi','madara'].includes(kind)){for(let j=0;j<4;j++)effect(manifestation,new THREE.TorusGeometry(.57,.026,5,20),accent,0,.95+j*.18,0,1,1,.7,.34).rotation.x=Math.PI/2;for(const side of [-1,1])effect(manifestation,boxGeo,accent,side*.65,1.25,0,.12,.85,.13,.30);}
 if(['gaara','shikamaru','pain','obito'].includes(kind)){const ring=effect(manifestation,new THREE.RingGeometry(.30,.8,32),kind==='shikamaru'?'#40394d':accent,0,.045,0,1,1,1,.42);ring.rotation.x=-Math.PI/2;ring.material.side=THREE.DoubleSide;}
 const actor=finishFighter({g,pivot,bones,limbs,weapon,shield,head,hips,chest,root,modelScale,kind,team,statue});Object.assign(actor,{ninja:true,unarmed:['fists','palms','kick','sand'].includes(d.weapon),strikeHand:kicker?bones.footR:bones.handR,chakra,chakraRing,manifestation});return actor;
}
