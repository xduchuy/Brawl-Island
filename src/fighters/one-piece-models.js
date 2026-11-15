// Procedural Straw Hat silhouettes on the shared 18-bone, instanced combat rig.
function createOnePiece(kind,team,statue=false){
 const d=ONE_PIECE_ROSTER[kind],g=new THREE.Group(),pivot=new THREE.Group(),bones={},limbs={};g.add(pivot);
 const ink='#222731',ivory='#e9dfc5',skin=statue?'#bdc6b4':kind==='jinbe'?'#85bfcc':kind==='chopper'?'#ba8d62':kind==='brook'?ivory:kind==='usopp'?'#b77c51':'#e7b997',hair=statue?'#7d8c81':d.hair,coat=statue?'#95a18e':d.coat,accent=statue?'#b9bc97':d.color;
 const bulky=['franky','jinbe'].includes(kind),skeleton=kind==='brook',animal=kind==='chopper',bare=['luffy','franky','usopp','chopper'].includes(kind),width=bulky?.82:.53;
 function bone(name,parent,x,y,z){const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);parent.add(b);bones[name]=b;return b;}
 function rod(parent,c,a,b,r){const from=V(...a),to=V(...b),mid=from.clone().add(to).multiplyScalar(.5),delta=to.sub(from);const m=addMesh(parent,cylGeo,c,mid.x,mid.y,mid.z,r,delta.length(),r);m.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());return m;}
 function star(parent,x,y,z,size,c){for(let i=0;i<5;i++){const a=i*TAU/5;rod(parent,c,[x+Math.sin(a)*size,y+Math.cos(a)*size,z],[x+Math.sin(a+TAU*2/5)*size,y+Math.cos(a+TAU*2/5)*size,z],.012);}}
 const root=bone('root',pivot,0,0,0),hips=bone('hips',root,0,.89,0),spine=bone('spine',hips,0,.19,0),chest=bone('chest',spine,0,.25,0),neck=bone('neck',chest,0,.31,0),head=bone('head',neck,0,.12,0),modelScale=d.height/2.25;g.scale.setScalar(modelScale);
 if(skeleton){for(let side of [-1,1])for(let j=0;j<4;j++)mb(chest,ivory,side*.13,.15-j*.12,.05,.26,.04,.18);mb(chest,ivory,0,-.04,0,.07,.5,.08);mb(spine,ivory,0,-.06,0,.08,.32,.09);}
 else{mb(chest,bare?skin:coat,0,-.015,0,width,.51,bulky?.43:.31);mb(spine,bare?skin:coat,0,-.06,0,width*.85,.29,.29);}
 mb(hips,['luffy','nami'].includes(kind)?'#456eaa':kind==='franky'?'#375793':coat,0,-.08,0,width*.88,.26,.32);
 if(['luffy','zoro','brook','sanji','robin'].includes(kind))for(const side of [-1,1]){
  mb(chest,coat,side*width*.40,-.01,.015,width*.23,.57,.38);
  if(['zoro','brook','robin'].includes(kind))mb(hips,coat,side*.22,-.24,-.04,.18,.43,.32);
 }
 if(kind==='luffy'){mb(hips,'#e1bf55',0,.03,.01,.58,.11,.38);for(const side of [-1,1])rod(chest,'#af7061',[side*.1,.1,.172],[-side*.1,-.16,.172],.013);}
 if(kind==='zoro'){mb(hips,'#913f4c',0,.04,0,.59,.13,.37);for(let j=0;j<3;j++){const sheath=mb(hips,['#e4ded1','#41434f','#8b4858'][j],.30+j*.035,-.15,-.08,.055,.74,.07);sheath.rotation.z=-.38;}}
 if(kind==='nami'){mb(spine,skin,0,-.065,.06,.43,.26,.23);for(const side of [-1,1]){const strap=mb(chest,ivory,side*.10,.08,.18,.045,.38,.018);strap.rotation.z=side*.35;}mb(hips,'#806245',0,0,.02,.49,.055,.34);}
 if(kind==='usopp'){for(const side of [-1,1])mb(chest,coat,side*.18,0,.17,.10,.55,.04);mb(hips,coat,0,.04,.06,.49,.14,.38);mb(hips,'#795539',.28,-.02,.05,.18,.25,.22);}
 if(kind==='sanji'){for(const side of [-1,1]){const lapel=mb(chest,'#566881',side*.10,.16,.18,.09,.25,.025);lapel.rotation.z=side*.4;for(let j=0;j<3;j++)ms(chest,'#c9ae68',side*.12,.03-j*.10,.19,.018,.018,.012);}mb(chest,ink,0,.16,.21,.045,.27,.025);}
 if(kind==='franky'){for(const side of [-1,1]){mb(chest,coat,side*.34,.03,.06,.18,.6,.43);for(let j=0;j<3;j++)star(chest,side*.34,.2-j*.17,.29,.045,'#e5c27b');}mb(chest,'#c39670',0,-.1,.22,.15,.31,.035);}
 if(kind==='robin'){mb(chest,skin,0,.18,.17,.16,.18,.03);mb(chest,'#c9b78c',0,-.02,.18,.018,.38,.02);}
 if(kind==='jinbe'){for(const side of [-1,1]){const collar=mb(chest,'#413b59',side*.17,.14,.24,.14,.44,.035);collar.rotation.z=side*.5;}mb(hips,'#913f59',0,.01,0,.78,.15,.48);addMesh(hips,new THREE.CylinderGeometry(.40,.45,.47,10),coat,0,-.28,0,1,1,1);for(const side of [-1,1])for(let j=0;j<3;j++){const tile=mb(chest,'#efe1bc',side*.29,.17-j*.15,.24,.11,.11,.018);tile.rotation.z=Math.PI/4;}}
 // Heads and distinctive faces.
 const headWidth=animal?.32:bulky?.27:.23;
 ms(head,skin,0,.12,0,headWidth,animal?.30:.27,.21);mb(head,skin,0,.01,.12,animal?.39:.32,.22,.15);
 for(const side of [-1,1]){
  ms(head,skin,side*(headWidth+.01),.09,0,.047,.08,.04);
  if(!(kind==='sanji'&&side===-1)){mb(head,skeleton?ink:ivory,side*.1,.13,.215,skeleton?.13:.105,skeleton?.10:.07,.025);if(!skeleton)mb(head,ink,side*.1,.13,.232,.033,.058,.012);}
  if(!animal&&!skeleton){const brow=mb(head,hair,side*.1,.205,.218,.12,.024,.018);brow.rotation.z=side*.12;}
 }
 if(skeleton){addMesh(head,coneGeo,ink,0,.015,.235,.035,.065,.02);mb(head,ink,0,-.075,.227,.27,.07,.02);for(let j=0;j<6;j++)mb(head,ivory,-.11+j*.044,-.065,.244,.03,.05,.016);}
 else{mb(head,'#975a51',0,-.07,.225,.10,.018,.012);ms(head,skin,0,.035,.23,.03,.04,kind==='usopp'?.22:.035);}
 if(!animal&&!skeleton){ms(head,hair,0,.32,-.035,.25,.14,.22);for(let j=0;j<7;j++){const lock=addMesh(head,coneGeo,hair,-.21+j*.07,.30,.12,.075,.18,.07);lock.rotation.z=Math.PI+(j-3)*.12;}}
 if(['nami','robin','usopp'].includes(kind))for(const side of [-1,1])for(let j=0;j<3;j++)mb(head,hair,side*.22,.08-j*.12,-.12,.09,.22,.16);
 if(['nami','robin'].includes(kind)){mb(head,hair,0,-.18,-.23,.40,.88,.10);for(const side of [-1,1])mb(head,hair,side*.24,-.19,-.12,.10,.82,.12);}
 if(kind==='luffy'){addMesh(head,cylGeo,'#d5b76e',0,.37,-.04,.41,.055,.37);addMesh(head,cylGeo,'#ddc07b',0,.46,-.04,.25,.16,.23);addMesh(head,cylGeo,'#ab3c3a',0,.405,-.04,.255,.05,.235);rod(head,'#9f6758',[.06,.055,.24],[.16,.055,.24],.012);}
 if(kind==='zoro'){rod(head,'#a37065',[-.10,.24,.242],[-.10,.04,.242],.012);for(let j=0;j<3;j++)addMesh(head,cylGeo,'#d5bc68',.245+j*.021,.005-j*.015,.01,.012,.1,.012);}
 if(kind==='sanji'){const fringe=mb(head,hair,-.12,.18,.235,.17,.32,.035);fringe.rotation.z=-.18;addMesh(head,new THREE.TorusGeometry(.025,.009,4,9),hair,.15,.215,.24,1,1,1);mb(head,'#655b4c',0,-.105,.22,.045,.04,.015);}
 if(kind==='usopp'){addMesh(head,cylGeo,'#d9d8c4',0,.37,-.035,.27,.17,.23);for(const side of [-1,1]){ms(head,'#84754a',side*.13,.32,.21,.092,.075,.035);ms(head,'#8fc5c9',side*.13,.32,.24,.065,.05,.018);}mb(head,'#c1b982',0,.31,.17,.46,.055,.045);}
 if(kind==='franky'){for(let j=0;j<5;j++)mb(head,hair,0,.38+j*.045,-.10+j*.025,.19,.12,.22);mb(head,'#8caab6',0,.035,.245,.065,.10,.065);for(const side of [-1,1]){mb(head,ink,side*.1,.24,.23,.15,.075,.02);ms(head,hair,side*.23,.03,-.03,.08,.14,.09);}}
 if(kind==='brook'){for(let j=0;j<14;j++){const a=j*TAU/14;ms(head,hair,Math.sin(a)*.25,.23+Math.cos(a)*.23,-.08,.15,.15,.17);}addMesh(head,cylGeo,ink,0,.56,-.07,.37,.045,.3);addMesh(head,cylGeo,ink,0,.72,-.07,.24,.3,.22);addMesh(head,cylGeo,'#8e634f',0,.60,-.07,.245,.06,.225);for(const side of [-1,1])ms(neck,'#db9f55',side*.17,-.02,.1,.17,.15,.16);mb(chest,'#629ebb',0,.17,.20,.10,.13,.04);}
 if(animal){ms(head,'#d5ad7a',0,-.005,.22,.15,.12,.09);ms(head,'#467aaf',0,.045,.30,.055,.04,.025);for(const side of [-1,1]){ms(head,skin,side*.33,.16,0,.15,.07,.09);rod(head,'#88613d',[side*.25,.33,0],[side*.46,.59,0],.035);rod(head,'#88613d',[side*.4,.51,0],[side*.53,.49,0],.026);rod(head,'#88613d',[side*.42,.55,0],[side*.39,.70,0],.025);}addMesh(head,cylGeo,'#e786ad',0,.36,-.025,.38,.08,.31);addMesh(head,cylGeo,'#59a4bd',0,.46,-.025,.29,.18,.26);mb(head,ivory,0,.46,.245,.15,.045,.02);mb(head,ivory,0,.46,.247,.045,.14,.02);}
 if(kind==='jinbe'){ms(head,hair,0,.32,-.12,.22,.15,.17);mb(head,hair,0,.45,-.13,.12,.22,.12);for(const side of [-1,1]){addMesh(head,coneGeo,ivory,side*.12,-.025,.25,.026,.13,.026);for(let j=0;j<3;j++)rod(head,'#488b9c',[side*.19,.05-j*.045,.20],[side*.27,.03-j*.045,.16],.012);ms(head,hair,side*.21,-.04,.09,.085,.11,.1);}}
 for(const side of [-1,1]){
  const n=side<0?'R':'L',upper=bone('upperArm'+n,chest,side*(bulky?.45:.34),.17,0),fore=bone('forearm'+n,upper,0,-.34,0),hand=bone('hand'+n,fore,0,-.31,0),thigh=bone('thigh'+n,hips,side*.17,-.07,0),shin=bone('shin'+n,thigh,0,-.38,0),foot=bone('foot'+n,shin,0,-.37,0);
  limbs['arm'+n]={upper,lower:fore,end:hand,a:.34,b:.31};limbs['leg'+n]={upper:thigh,lower:shin,end:foot,a:.38,b:.37};
  const sleeve=['sanji','brook','zoro','jinbe'].includes(kind),armWidth=kind==='franky'?.32:bulky?.27:skeleton?.08:animal?.18:.19;
  mb(upper,sleeve?coat:skin,0,-.15,0,armWidth,.31,armWidth);mb(fore,sleeve?coat:skin,0,-.15,0,kind==='franky'?.38:armWidth*.85,.28,kind==='franky'?.34:armWidth*.9);mb(hand,animal?'#674837':skin,0,-.055,.025,kind==='franky'?.30:.14,.17,.13);
  const shorts=['luffy','chopper','franky'].includes(kind),trouser=['luffy','nami'].includes(kind)?'#4775aa':kind==='usopp'?'#aa995f':coat;
  mb(thigh,trouser,0,-.18,0,bulky?.29:skeleton?.14:.24,.36,.25);mb(shin,shorts?skin:trouser,0,-.17,0,skeleton?.12:.18,.32,.19);mb(foot,animal?'#674837':ink,0,-.04,.08,.22,.09,.35);
  if(shorts&&!animal){mb(foot,skin,0,.015,.12,.20,.05,.23);mb(foot,'#836448',0,.045,.12,.21,.035,.045);}
  if(kind==='franky'){ms(upper,'#c64d4b',0,-.03,0,.24,.22,.24);star(fore,0,-.15,.19,.12,'#4b8ed2');for(let j=0;j<3;j++)mb(fore,'#859ba5',-.1+j*.1,-.27,.18,.05,.035,.02);}
  if(kind==='jinbe')addMesh(fore,coneGeo,skin,side*.14,-.1,0,.07,.24,.11);
  if(kind==='nami'&&side===1){for(let j=0;j<3;j++)rod(upper,'#3b75aa',[-.05,-.04-j*.04,.11],[.06,-.04-j*.04,.11],.012);}
 }
 const weapon=new THREE.Group(),shield=new THREE.Group(),offhand=new THREE.Group();bones.handR.add(weapon);bones.forearmL.add(shield);bones.handL.add(offhand);
 function sword(parent,c='#d0d7d3'){mb(parent,ink,0,.03,0,.055,.23,.06);mb(parent,'#c5ad64',0,.17,0,.18,.035,.075);mb(parent,c,0,.64,0,.055,.87,.03);addMesh(parent,coneGeo,ivory,0,1.12,0,.04,.13,.025);}
 if(kind==='zoro'){sword(weapon);sword(offhand);const mouth=new THREE.Group();head.add(mouth);mouth.position.set(0,-.04,.27);mouth.rotation.z=Math.PI/2;sword(mouth);}
 if(kind==='brook'){sword(weapon,'#9dd4dd');mb(offhand,'#785943',0,.35,0,.055,.85,.055);}
 if(kind==='nami'){rod(weapon,'#67accc',[0,-.35,0],[0,.95,0],.04);for(const y of [-.25,.3,.85])ms(weapon,'#cfaf60',0,y,0,.06,.065,.06);}
 if(kind==='usopp'){rod(weapon,'#606f42',[0,-.12,0],[0,.55,0],.045);for(const side of [-1,1]){rod(weapon,'#6ca354',[0,.45,0],[side*.20,.77,0],.04);rod(weapon,'#dcc47c',[side*.20,.77,0],[0,.52,.16],.014);}}
 if(kind==='franky'){addMesh(weapon,cylGeo,'#748a95',0,.12,.06,.12,.32,.12);ms(weapon,'#67cfe5',0,.30,.06,.08,.025,.08);}
 // Robin's extra hands are temporary visual manifestations, never extra hitboxes.
 const bloom=new THREE.Group();bloom.userData.effect=true;chest.add(bloom);
 for(let j=0;kind==='robin'&&j<6;j++){const a=j*TAU/6,palm=mb(bloom,skin,Math.sin(a)*.63,Math.cos(a)*.44,.20,.14,.18,.10);palm.userData.effect=true;for(let k=0;k<4;k++){const finger=mb(bloom,skin,Math.sin(a)*.63-.055+k*.035,Math.cos(a)*.44+.14,.20,.025,.13,.07);finger.userData.effect=true;}}bloom.visible=false;
 const aura=new THREE.Mesh(new THREE.TorusGeometry(.23,.025,5,20),new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.75,depthWrite:false}));aura.userData.effect=true;aura.visible=false;(kind==='sanji'?bones.footR:weapon).add(aura);
 const actor=finishFighter({g,pivot,bones,limbs,weapon,shield,head,hips,chest,root,modelScale,kind,team,statue});Object.assign(actor,{onePiece:true,unarmed:['fists','kick','hooves','hands','palms','cannon'].includes(d.weapon),strikeHand:kind==='sanji'?bones.footR:bones.handR,offhandWeapon:offhand,aura,bloom});return actor;
}
