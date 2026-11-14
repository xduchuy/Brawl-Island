// Original procedural character interpretations, built on the shared eighteen-bone rig.
function createKimetsu(kind,team,statue=false){
 const d=KIMETSU_ROSTER[kind],g=new THREE.Group(),pivot=new THREE.Group(),bones={},limbs={};g.add(pivot);
 const demon=d.group==='Upper Moons'||d.group==='Demons'||kind==='nezuko';
 const skin=statue?'#bbc3b1':kind==='gyutaro'?'#b6bf97':kind==='gyokko'?'#e1dfd2':kind==='akaza'?'#e5d5d1':demon?'#eed6ca':'#e5ba9b';
 const hair=statue?'#889486':d.hair,coat=statue?'#9aa18c':d.coat,ink='#24252c',cloth='#273038',accent=statue?'#c0b492':d.color;
 function bone(name,parent,x,y,z){const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);parent.add(b);bones[name]=b;return b;}
 const root=bone('root',pivot,0,0,0),hips=bone('hips',root,0,.89,0),spine=bone('spine',hips,0,.19,0),chest=bone('chest',spine,0,.25,0),neck=bone('neck',chest,0,.31,0),head=bone('head',neck,0,.12,0),modelScale=IB_STATS[kind].height/2.25;g.scale.setScalar(modelScale);
 const bare=['inosuke','akaza','gyutaro','gyokko'].includes(kind),long=['nezuko','nakime','doma','kokushibo','hantengu'].includes(kind);
 mb(chest,bare?skin:cloth,0,-.015,0,.55,.51,.32);mb(spine,bare?skin:cloth,0,-.06,0,.48,.29,.3);mb(hips,cloth,0,-.04,0,.5,.2,.34);
 mb(hips,kind==='daki'?'#64a66c':'#ede3cf',0,.01,0,.57,.07,.37);for(let i=0;i<3&&!bare;i++)ms(chest,'#c6a96b',.035,.12-i*.14,.18,.022,.023,.014);
 // Haori panels are individual cloth pieces. Patterns use geometry, not external textures.
 if(!bare){for(const side of [-1,1]){
  const panel=mb(chest,coat,side*.225,-.04,-.015,.19,.62,.4);panel.rotation.z=side*-.06;
  mb(hips,coat,side*.23,-.24,-.04,.21,long?.58:.35,.38);mb(chest,coat,0,.02,-.22,.54,.62,.055);
  for(let row=0;row<4;row++)for(let col=0;col<2;col++){
   const x=side*(.16+col*.08),y=.18-row*.14;
   if(d.pattern==='check')mb(chest,(row+col+(side>0?1:0))%2?ink:coat,x,y,.205,.08,.12,.018);
   if(d.pattern==='triangles'){const t=addMesh(chest,coneGeo,'#fff1c6',x,y,.21,.032,.07,.012);t.rotation.z=row%2?Math.PI:0;}
   if(['stripes','hex'].includes(d.pattern))mb(chest,d.pattern==='hex'?ink:'#343344',x,y,.21,.025,.14,.016);
   if(d.pattern==='hemp'){const t=mb(chest,'#f5d3df',x,y,.213,.055,.055,.014);t.rotation.z=Math.PI/4;}
  }
  if(d.pattern==='split'&&side>0){mb(chest,'#b3a86f',side*.23,-.02,.205,.19,.6,.018);for(let j=0;j<4;j++){const t=mb(chest,'#407e6e',side*.23,.19-j*.14,.22,.10,.10,.014);t.rotation.z=Math.PI/4;}}
  if(d.pattern==='flame'){for(let j=0;j<4;j++){const tip=addMesh(hips,coneGeo,j%2?'#e4442e':'#efa139',side*(.15+j*.025),-.36+j*.035,.17,.05,.20,.025);tip.rotation.z=side*.35;}}
  if(d.pattern==='butterfly'){mb(hips,'#b3a1cd',side*.26,-.32,.18,.19,.16,.02);for(let j=0;j<4;j++)ms(chest,'#535468',side*.29,.16-j*.14,.215,.025,.035,.015);}
 }}
 if(long)addMesh(hips,new THREE.CylinderGeometry(.27,.38,.6,10),coat,0,-.32,0,1,1,1);
 if(kind==='mitsuri'){mb(chest,skin,0,.17,.18,.13,.23,.02);mb(chest,'#e8dbd6',0,-.02,.18,.18,.06,.02);}
 if(['sanemi','genya'].includes(kind))mb(chest,skin,0,.02,.19,.22,.45,.025);
 if(kind==='gyomei'){for(let j=0;j<8;j++)ms(chest,'#aa463e',Math.sin(j*Math.PI/7-.5)*.27,.26-j*.026,.23,.046,.046,.046);for(const side of [-1,1])for(let j=0;j<4;j++)mb(chest,ink,side*.24,.15-j*.12,.22,.10,.018,.014);}
 // Face, eyes, hair and signature head accessories.
 ms(head,skin,0,.12,0,.23,.27,.20);mb(head,skin,0,.04,.12,.32,.25,.13);
 for(const side of [-1,1]){ms(head,skin,side*.235,.08,0,.045,.085,.04);mb(head,'#f7f1e7',side*.1,.13,.202,.12,.065,.025);mb(head,kind==='gyomei'?'#ddd9d1':kind==='obanai'?(side<0?'#e5c36b':'#74b88d'):accent,side*.1,.13,.22,.043,.06,.012);mb(head,ink,side*.1,.13,.23,.017,.047,.008);const brow=mb(head,kind==='rengoku'?ink:hair,side*.10,.21,.207,.14,.026,.024);brow.rotation.z=side*.2;}
 mb(head,'#99685f',0,-.065,.202,.085,.014,.012);ms(head,skin,0,.035,.218,.025,.04,.03);
 const longHair=['nezuko','giyu','muichiro','kokushibo','daki','nakime','mitsuri','kanao'].includes(kind);
 ms(head,hair,0,.32,-.025,.25,.15,.22);
 for(let j=0;j<9;j++){const a=j*Math.PI*2/9;const lock=addMesh(head,coneGeo,hair,Math.sin(a)*.19,.35,Math.cos(a)*.16,.08,kind==='rengoku'?.32:.20,.07);lock.rotation.z=-Math.sin(a)*.65;lock.rotation.x=Math.cos(a)*.6;
  if(longHair&&j<7){const strand=mb(head,hair,Math.sin(a)*.22,.03,-.14-Math.abs(Math.cos(a))*.08,.075,kind==='muichiro'?.65:.48,.08);if(['muichiro','nezuko','mitsuri'].includes(kind))mb(strand,kind==='muichiro'?'#69aaa6':kind==='nezuko'?'#bc7145':'#9ebf70',0,-.35,0,1, .32,1.03);}}
 if(kind==='rengoku')for(let j=0;j<7;j++){const flame=addMesh(head,coneGeo,'#d9502e',-.22+j*.073,.31,.17,.06,.18,.04);flame.rotation.z=Math.PI;}
 if(kind==='mitsuri')for(const side of [-1,1])for(let j=0;j<7;j++)ms(head,j>3?'#9db56a':hair,side*(.24+Math.sin(j)*.02),.05-j*.08,-.08,.065,.073,.065);
 if(['shinobu','kanao'].includes(kind)){for(const side of [-1,1]){const wing=mb(head,kind==='shinobu'?'#ad91c6':'#d78dba',.23+side*.06,.34,-.15,.11,.14,.025);wing.rotation.z=side*.65;}if(kind==='kanao')ms(head,hair,.25,.12,-.16,.1,.28,.09);}
 if(kind==='tanjiro'){mb(head,'#943b3d',-.1,.245,.21,.13,.075,.016);for(const side of [-1,1]){mb(head,'#e5e2cf',side*.255,-.035,0,.04,.14,.018);ms(head,'#bb4d47',side*.255,-.005,.013,.017,.017,.009);}}
 if(kind==='nezuko'){const bamboo=addMesh(head,cylGeo,'#7caa68',0,-.035,.235,.045,.29,.045);bamboo.rotation.z=Math.PI/2;for(const side of [-1,1])mb(head,'#e59fb1',side*.2,-.02,.12,.03,.025,.2);}
 if(kind==='inosuke'){ms(head,'#92847c',0,.15,.04,.30,.29,.26);ms(head,'#cfaaa3',0,.04,.30,.13,.09,.09);for(const side of [-1,1]){ms(head,'#729aba',side*.19,.17,.25,.075,.08,.03);ms(head,ink,side*.18,.17,.28,.025,.035,.012);const ear=addMesh(head,coneGeo,'#c3b1a2',side*.24,.37,.02,.10,.24,.08);ear.rotation.z=-side*.4;addMesh(head,coneGeo,'#e4d9c1',side*.16,-.02,.27,.035,.18,.035);}}
 if(kind==='tengen'){mb(head,'#e1e2dc',0,.25,.2,.47,.10,.05);for(let j=0;j<3;j++)ms(head,['#a96ab0','#8abacb','#bb6c91'][j],-.14+j*.14,.25,.24,.06,.045,.025);for(let side of [-1,1])for(let j=0;j<4;j++)ms(head,'#ede4da',side*.25,.2-j*.09,.08,.025,.035,.025);}
 if(kind==='obanai'){mb(head,'#e4e1d7',0,-.01,.212,.35,.13,.026);for(let j=0;j<4;j++)mb(head,'#a9aaa5',0,-.05+j*.03,.229,.35,.008,.008);for(let j=0;j<7;j++)ms(neck,'#dbdfcb',Math.sin(j*.7)*.24,-.08,Math.cos(j*.7)*.18,.055,.055,.055);ms(neck,'#e3e6d5',.25,-.01,.2,.085,.06,.075);}
 if(kind==='muzan'){addMesh(head,cylGeo,'#f0e9de',0,.39,-.02,.34,.045,.28);addMesh(head,cylGeo,'#e5dfd6',0,.48,-.02,.24,.19,.22);mb(head,'#563c46',0,.43,.19,.42,.06,.025);mb(neck,'#50232d',0,-.07,.18,.06,.2,.035);}
 if(kind==='kokushibo')for(const side of [-1,1])for(let j=0;j<3;j++){mb(head,'#df9b54',side*.11,.24-j*.12,.225,.12,.055,.02);mb(head,'#a93e49',side*.11,.24-j*.12,.24,.022,.04,.01);}
 if(kind==='akaza'){for(const side of [-1,1]){for(let j=0;j<3;j++)mb(chest,'#426fa0',side*.15,.16-j*.14,.18,.16,.035,.025);for(let j=0;j<2;j++){let stripe=mb(head,'#426fa0',side*(.08+j*.08),.06,.217,.025,.32,.025);stripe.rotation.z=side*.18;}}}
 if(['sanemi','genya','kaigaku'].includes(kind))for(let j=0;j<3;j++){let scar=mb(head,kind==='kaigaku'?'#333b4d':'#ae7a72',-.13+j*.11,.09-j*.045,.22,.012,.15,.014);scar.rotation.z=.75;}
 if(kind==='hantengu')for(const side of [-1,1])addMesh(head,coneGeo,'#ad7b58',side*.19,.46,.03,.055,.30,.055);
 if(kind==='gyutaro')for(let j=0;j<9;j++)ms(chest,'#4b5140',Math.sin(j*2)*.23,.19-(j%4)*.12,.175,.033,.05,.018);
 if(kind==='doma'){mb(head,'#a72d3b',0,.32,.20,.30,.08,.03);for(const side of [-1,1])mb(head,'#79ccbf',side*.1,.13,.24,.025,.035,.008);}
 if(kind==='daki'){for(const side of [-1,1]){mb(head,'#b43f75',side*.16,.02,.22,.07,.07,.016);const pin=mb(head,'#c7a65b',side*.24,.36,-.04,.025,.30,.025);pin.rotation.z=side*.65;}mb(hips,'#8aae6c',0,.04,.23,.42,.15,.05);}
 if(kind==='nakime'){mb(head,hair,0,.19,.22,.39,.28,.03);mb(head,'#eee3da',0,.16,.244,.14,.07,.014);mb(head,'#d18485',0,.16,.255,.04,.065,.01);}
 if(kind==='gyokko'){mb(head,'#963d63',0,.25,.218,.13,.045,.02);mb(head,'#e1b366',0,-.04,.22,.09,.06,.025);addMesh(hips,new THREE.CylinderGeometry(.35,.28,.38,12),'#d9d9cb',0,-.26,0,1,1,1);for(let j=0;j<6;j++)mb(hips,'#5c86a1',Math.sin(j)*.32,-.23,Math.cos(j)*.3,.06,.16,.03);}
 for(const side of [-1,1]){const n=side<0?'R':'L',upper=bone('upperArm'+n,chest,side*.34,.17,0),fore=bone('forearm'+n,upper,0,-.34,0),hand=bone('hand'+n,fore,0,-.31,0),thigh=bone('thigh'+n,hips,side*.16,-.07,0),shin=bone('shin'+n,thigh,0,-.38,0),foot=bone('foot'+n,shin,0,-.37,0);limbs['arm'+n]={upper,lower:fore,end:hand,a:.34,b:.31};limbs['leg'+n]={upper:thigh,lower:shin,end:foot,a:.38,b:.37};
  mb(upper,bare||['tengen','sanemi'].includes(kind)?skin:coat,0,-.15,0,.23,.32,.24);mb(fore,bare?skin:cloth,0,-.15,0,.18,.28,.19);mb(hand,skin,0,-.06,.02,.14,.16,.1);
  mb(thigh,cloth,0,-.18,0,.24,.36,.24);mb(shin,kind==='mitsuri'?'#93b869':kind==='zenitsu'?'#e2af48':'#dad8ce',0,-.17,0,.18,.32,.19);for(let j=0;j<3;j++)mb(shin,coat,0,-.06-j*.1,.105,.18,.025,.016);
  mb(foot,'#513d35',0,-.04,.08,.21,.08,.35);mb(foot,skin,0,.015,.12,.18,.045,.23);mb(foot,ink,0,.05,.12,.20,.035,.045);
  if(kind==='akaza')for(let j=0;j<3;j++)mb(upper,'#426fa0',0,-.04-j*.1,.125,.23,.03,.02);
 }
 const weapon=new THREE.Group(),shield=new THREE.Group();bones.handR.add(weapon);bones.forearmL.add(shield);const offhand=new THREE.Group();bones.handL.add(offhand);
 function blade(parent,wide=false){mb(parent,ink,0,.04,0,.065,.23,.065);mb(parent,'#ba9a62',0,.17,0,wide?.24:.18,.045,.07);mb(parent,'#b5c4ca',0,.65,0,wide?.19:.065,.88,.035);mb(parent,accent,.04,.65,.008,.014,.86,.014);addMesh(parent,coneGeo,'#e4e6d8',0,1.15,0,wide?.11:.045,.16,.025);if(kind==='inosuke')for(let j=0;j<5;j++)mb(parent,ink,.045,.35+j*.14,0,.05,.035,.06);}
 if(['sword','rapier','dual','cleavers'].includes(d.weapon)){blade(weapon,d.weapon==='cleavers');if(['dual','cleavers'].includes(d.weapon))blade(offhand,d.weapon==='cleavers');}
 if(d.weapon==='gun'){mb(weapon,'#704d3e',0,.12,0,.12,.32,.12);for(const side of [-1,1])mb(weapon,'#68777e',side*.045,.44,0,.065,.45,.08);}
 if(d.weapon==='fans')for(const parent of [weapon,offhand]){mb(parent,'#a68d54',0,.13,0,.035,.35,.035);for(let j=0;j<9;j++){const rib=mb(parent,j%2?'#d6c66d':'#f0dd9d',0,.30,0,.07,.45,.025);rib.rotation.z=(j-4)*.21;}}
 if(d.weapon==='sickles')for(const parent of [weapon,offhand]){mb(parent,'#744e40',0,.18,0,.05,.46,.06);const hook=mb(parent,'#bbbd96',.11,.43,0,.28,.055,.04);hook.rotation.z=.4;}
 if(d.weapon==='flail'){mb(weapon,'#685b4c',0,.25,0,.065,.6,.065);mb(weapon,'#a6b0a6',.07,.57,0,.29,.23,.06);for(let j=0;j<9;j++)ms(offhand,'#949d98',0,.05+j*.08,0,.035,.045,.035);ms(offhand,'#969b91',0,.82,0,.19,.19,.19);}
 if(d.weapon==='staff'){mb(weapon,'#7e5a3f',0,.35,0,.06,1.3,.06);addMesh(weapon,coneGeo,'#aeb7af',0,1.08,0,.07,.25,.04);}
 if(d.weapon==='biwa'){ms(weapon,'#aa7749',0,.28,0,.21,.27,.065);mb(weapon,'#644733',0,.63,0,.065,.50,.05);for(let j=0;j<4;j++)mb(weapon,'#e0c991',-.05+j*.034,.39,.07,.008,.65,.012);}
 if(['whip','whips','ribbons'].includes(d.weapon))for(let j=0;j<9;j++){const ribbon=mb(weapon,d.weapon==='whips'?'#8e3d51':accent,Math.sin(j*.8)*.14,.14+j*.11,0,d.weapon==='ribbons'?.13:.045,.15,.025);ribbon.rotation.z=-Math.cos(j*.8)*.4;}
 if(d.weapon==='claws')for(const parent of [weapon,offhand])for(let j=0;j<3;j++)addMesh(parent,coneGeo,'#e4cfce',-.06+j*.06,.13,0,.02,.25,.02);
 const aura=new THREE.Mesh(new THREE.TorusGeometry(.28,.014,4,20),new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.7,depthWrite:false}));aura.userData.effect=true;aura.visible=false;weapon.add(aura);
 const actor=finishFighter({g,pivot,bones,limbs,weapon,shield,head,hips,chest,root,modelScale,kind,team,statue});Object.assign(actor,{kimetsu:true,unarmed:['fists','claws'].includes(d.weapon),strikeHand:bones.handR,offhandWeapon:offhand,aura});return actor;
}
