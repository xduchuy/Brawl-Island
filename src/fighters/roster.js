
'use strict';
// The simulation is independent of WebGL and runs at exactly 60 ticks per second.
const IB_STATS={goblin:{name:'Grinsk',hp:104,height:1.36,speed:4.6,reach:1.56,guard:.95},skeleton:{name:'Bonewarden',hp:112,height:1.86,speed:3.95,reach:1.83,guard:.65},yuji:{name:'Yuji Itadori',hp:108,height:1.73,speed:4.45,reach:1.50,guard:.95},gojo:{name:'Satoru Gojo',hp:110,height:1.90,speed:4.10,reach:1.90,guard:.75},nobara:{name:'Nobara Kugisaki',hp:100,height:1.60,speed:4.25,reach:1.75,guard:.95},megumi:{name:'Megumi Fushiguro',hp:106,height:1.75,speed:4.25,reach:1.65,guard:.90}};
function rng32(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t,angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const IB_MOVES={light:[{length:32,start:10,end:16,chain:21,damage:12,cost:9,push:1.4,lunge:.55},{length:34,start:11,end:18,chain:22,damage:14,cost:10,push:1.8,lunge:.65},{length:48,start:18,end:25,chain:38,damage:20,cost:14,push:5.3,lunge:.8,down:true}],heavy:{length:65,start:27,end:38,damage:28,cost:28,push:6.2,lunge:.8,down:true},special:{length:70,start:29,end:40,damage:23,cost:34,push:5.3,lunge:1.65,break:true}};

const IB_CHARACTER_MOVES={
 yuji:{light:[{length:28,start:8,end:13,chain:18,damage:13,cost:9,push:1.3,lunge:.48},{length:31,start:10,end:15,chain:20,damage:15,cost:10,push:1.7,lunge:.60},{length:46,start:16,end:23,chain:36,damage:22,cost:15,push:5.1,lunge:.72,down:true}],heavy:{length:57,start:23,end:31,damage:27,cost:27,push:5.6,lunge:.85,down:true},special:{length:66,start:28,end:35,damage:32,cost:35,push:5.7,lunge:1.15,break:true,label:'BLACK FLASH'}},
 gojo:{light:[{length:30,start:10,end:15,chain:20,damage:13,cost:10,push:1.4,lunge:.40},{length:32,start:12,end:17,chain:22,damage:16,cost:11,push:1.9,lunge:.48},{length:44,start:18,end:24,chain:35,damage:24,cost:15,push:4.8,lunge:.6,down:true}],heavy:{length:57,start:23,end:32,damage:28,cost:29,push:3.2,lunge:.35,down:true,pull:true,reach:.35,label:'BLUE'},special:{length:65,start:28,end:36,damage:29,cost:36,push:6.6,lunge:.6,reach:.55,break:true,label:'RED'}},
 nobara:{light:[{length:31,start:10,end:16,chain:21,damage:14,cost:9,push:1.4,lunge:.45},{length:34,start:12,end:18,chain:23,damage:16,cost:11,push:1.9,lunge:.55},{length:46,start:17,end:24,chain:36,damage:22,cost:15,push:5,lunge:.65,down:true}],heavy:{length:59,start:24,end:33,damage:29,cost:28,push:5.6,lunge:.7,down:true},special:{length:68,start:28,end:37,damage:27,cost:35,push:4.8,lunge:.65,reach:.55,break:true,label:'RESONANCE'}},
 megumi:{light:[{length:29,start:9,end:15,chain:19,damage:13,cost:9,push:1.3,lunge:.48},{length:33,start:11,end:18,chain:22,damage:15,cost:10,push:1.8,lunge:.60},{length:46,start:18,end:25,chain:36,damage:22,cost:15,push:5,lunge:.70,down:true}],heavy:{length:58,start:23,end:32,damage:27,cost:28,push:5.5,lunge:.7,reach:.35,down:true,label:'SHADOW SWEEP'},special:{length:70,start:29,end:40,damage:29,cost:36,push:5.8,lunge:.4,reach:1.3,down:true,label:'DIVINE DOG'}}
};

Object.assign(IB_STATS,{"sukuna": {"name": "Ryomen Sukuna", "hp": 110, "height": 1.8, "speed": 4.3, "reach": 1.7, "guard": 0.95}, "kenjaku": {"name": "Kenjaku", "hp": 106, "height": 1.9, "speed": 4.05, "reach": 1.85, "guard": 0.85}, "geto": {"name": "Suguru Geto", "hp": 108, "height": 1.9, "speed": 4.1, "reach": 1.95, "guard": 0.9}, "mahito": {"name": "Mahito", "hp": 110, "height": 1.79, "speed": 4.3, "reach": 1.65, "guard": 0.95}, "toji": {"name": "Toji Fushiguro", "hp": 106, "height": 1.88, "speed": 4.85, "reach": 1.65, "guard": 1.0}});
// Each added fighter uses the same frame-based combat and resource rules.
function makeCombo(lengths,damages,costs=[9,11,15]){return lengths.map((length,i)=>({length,start:[9,12,18][i],end:[15,19,25][i],chain:length-10,damage:damages[i],cost:costs[i],push:[1.4,1.9,5.2][i],lunge:[.5,.6,.8][i],down:i===2}));}
Object.assign(IB_CHARACTER_MOVES,{
 sukuna:{light:makeCombo([30,33,46],[14,16,23]),heavy:{length:60,start:24,end:34,damage:29,cost:29,push:5.7,lunge:.7,down:true,arc:2.4,label:'CLEAVE'},special:{length:69,start:29,end:38,damage:28,cost:36,push:5.2,lunge:.5,reach:1.1,break:true,label:'DISMANTLE'}},
 kenjaku:{light:makeCombo([31,34,47],[13,15,22]),heavy:{length:60,start:24,end:34,damage:26,cost:28,push:3.5,lunge:.3,reach:.4,pull:true,down:true,label:'GRAVITY'},special:{length:70,start:29,end:40,damage:30,cost:36,push:5.5,lunge:.4,reach:1.1,label:'CURSED SWARM'}},
 geto:{light:makeCombo([32,35,48],[14,16,22]),heavy:{length:61,start:25,end:35,damage:28,cost:29,push:5.8,lunge:.55,down:true,arc:2.5,label:'STAFF SWEEP'},special:{length:72,start:30,end:40,damage:31,cost:37,push:6,lunge:.3,reach:.9,break:true,label:'UZUMAKI'}},
 mahito:{light:makeCombo([29,33,46],[13,15,22]),heavy:{length:58,start:23,end:32,damage:28,cost:28,push:5.5,lunge:.7,reach:.45,down:true,label:'TRANSFIGURATION'},special:{length:67,start:28,end:37,damage:30,cost:35,push:4.7,lunge:.9,reach:.35,break:true,label:'SOUL TOUCH'}},
 toji:{light:makeCombo([27,30,44],[13,15,21]),heavy:{length:54,start:22,end:30,damage:28,cost:28,push:5.5,lunge:.85,down:true,label:'INVERTED SPEAR'},special:{length:64,start:26,end:35,damage:28,cost:34,push:5.8,lunge:1.9,down:true,label:'HEAVENLY RUSH'}}
});

// Kimetsu no Yaiba pack: six leads, nine Hashira, Muzan and nine Upper Moons.
const KIMETSU_ROSTER = {
 "tanjiro": {
  "name": "Tanjiro Kamado",
  "group": "Main cast",
  "style": "water",
  "color": "#50c6df",
  "hair": "#55282d",
  "coat": "#24886b",
  "pattern": "check",
  "weapon": "sword",
  "skills": [
   "Water Wheel",
   "Hinokami Kagura",
   "Sun Halo Dragon"
  ],
  "height": 1.65
 },
 "nezuko": {
  "name": "Nezuko Kamado",
  "group": "Main cast",
  "style": "blood",
  "color": "#ff7398",
  "hair": "#201c26",
  "coat": "#ed9aaa",
  "pattern": "hemp",
  "weapon": "claws",
  "skills": [
   "Exploding Blood",
   "Claw Rush",
   "Crimson Blood Burst"
  ],
  "height": 1.53
 },
 "zenitsu": {
  "name": "Zenitsu Agatsuma",
  "group": "Main cast",
  "style": "thunder",
  "color": "#ffe26b",
  "hair": "#efbd48",
  "coat": "#e9a63b",
  "pattern": "triangles",
  "weapon": "sword",
  "skills": [
   "Thunderclap and Flash",
   "Rice Spirit",
   "Flaming Thunder God"
  ],
  "height": 1.64
 },
 "inosuke": {
  "name": "Inosuke Hashibira",
  "group": "Main cast",
  "style": "beast",
  "color": "#a6d6e4",
  "hair": "#47434a",
  "coat": "#816d57",
  "pattern": "fur",
  "weapon": "dual",
  "skills": [
   "Piercing Fangs",
   "Crazy Cutting",
   "Devouring Rush"
  ],
  "height": 1.64
 },
 "kanao": {
  "name": "Kanao Tsuyuri",
  "group": "Main cast",
  "style": "flower",
  "color": "#eea7de",
  "hair": "#282332",
  "coat": "#f4ebde",
  "pattern": "cape",
  "weapon": "sword",
  "skills": [
   "Crimson Hanagoromo",
   "Peonies of Futility",
   "Vermilion Eye"
  ],
  "height": 1.56
 },
 "genya": {
  "name": "Genya Shinazugawa",
  "group": "Main cast",
  "style": "gun",
  "color": "#b199de",
  "hair": "#24232c",
  "coat": "#5e456d",
  "pattern": "vest",
  "weapon": "gun",
  "skills": [
   "Nichirin Shot",
   "Flesh Gun",
   "Blood Demon Barrage"
  ],
  "height": 1.8
 },
 "giyu": {
  "name": "Giyu Tomioka",
  "group": "Hashira",
  "style": "water",
  "color": "#65b9f4",
  "hair": "#1b2634",
  "coat": "#8b3047",
  "pattern": "split",
  "weapon": "sword",
  "skills": [
   "Water Surface Slash",
   "Flowing Dance",
   "Dead Calm"
  ],
  "height": 1.76
 },
 "shinobu": {
  "name": "Shinobu Kocho",
  "group": "Hashira",
  "style": "insect",
  "color": "#bf9af2",
  "hair": "#282338",
  "coat": "#d8d9d6",
  "pattern": "butterfly",
  "weapon": "rapier",
  "skills": [
   "Butterfly Dance",
   "Bee Sting",
   "Centipede Zigzag"
  ],
  "height": 1.51
 },
 "rengoku": {
  "name": "Kyojuro Rengoku",
  "group": "Hashira",
  "style": "flame",
  "color": "#ff8846",
  "hair": "#f8d45d",
  "coat": "#f3e7ca",
  "pattern": "flame",
  "weapon": "sword",
  "skills": [
   "Rising Scorching Sun",
   "Flame Tiger",
   "Ninth Form: Rengoku"
  ],
  "height": 1.77
 },
 "tengen": {
  "name": "Tengen Uzui",
  "group": "Hashira",
  "style": "sound",
  "color": "#e2c16a",
  "hair": "#e8e5df",
  "coat": "#233b3d",
  "pattern": "vest",
  "weapon": "cleavers",
  "skills": [
   "Roar",
   "Resounding Slashes",
   "String Performance"
  ],
  "height": 1.98
 },
 "mitsuri": {
  "name": "Mitsuri Kanroji",
  "group": "Hashira",
  "style": "love",
  "color": "#f695c6",
  "hair": "#eaa4c5",
  "coat": "#f3eadb",
  "pattern": "cape",
  "weapon": "whip",
  "skills": [
   "Shivers of First Love",
   "Love Pangs",
   "Catlegged Winds of Love"
  ],
  "height": 1.67
 },
 "muichiro": {
  "name": "Muichiro Tokito",
  "group": "Hashira",
  "style": "mist",
  "color": "#8cded8",
  "hair": "#202e36",
  "coat": "#253a3d",
  "pattern": "plain",
  "weapon": "sword",
  "skills": [
   "Sea of Clouds",
   "Shifting Flow Slash",
   "Obscuring Clouds"
  ],
  "height": 1.6
 },
 "gyomei": {
  "name": "Gyomei Himejima",
  "group": "Hashira",
  "style": "stone",
  "color": "#c7b599",
  "hair": "#34332f",
  "coat": "#7c8062",
  "pattern": "vest",
  "weapon": "flail",
  "skills": [
   "Serpentinite Bipolar",
   "Upper Smash",
   "Arcs of Justice"
  ],
  "height": 2.2
 },
 "sanemi": {
  "name": "Sanemi Shinazugawa",
  "group": "Hashira",
  "style": "wind",
  "color": "#a2e4ac",
  "hair": "#e6e8df",
  "coat": "#ece9dc",
  "pattern": "open",
  "weapon": "sword",
  "skills": [
   "Dust Whirlwind Cutter",
   "Black Wind Mountain Mist",
   "Idaten Typhoon"
  ],
  "height": 1.79
 },
 "obanai": {
  "name": "Obanai Iguro",
  "group": "Hashira",
  "style": "serpent",
  "color": "#c2b2ee",
  "hair": "#24232c",
  "coat": "#e3e2db",
  "pattern": "stripes",
  "weapon": "sword",
  "skills": [
   "Winding Serpent Slash",
   "Venom Fangs",
   "Slithering Serpent"
  ],
  "height": 1.62
 },
 "muzan": {
  "name": "Muzan Kibutsuji",
  "group": "Demons",
  "style": "blood",
  "color": "#e5536a",
  "hair": "#22222c",
  "coat": "#e8e5dc",
  "pattern": "suit",
  "weapon": "whips",
  "skills": [
   "Barbed Whips",
   "Black Blood Brambles",
   "Demon King Onslaught"
  ],
  "height": 1.79
 },
 "kokushibo": {
  "name": "Kokushibo",
  "group": "Upper Moons",
  "style": "moon",
  "color": "#c99aea",
  "hair": "#302237",
  "coat": "#6b4979",
  "pattern": "hex",
  "weapon": "sword",
  "skills": [
   "Evening Palace",
   "Calamitous Eddy",
   "Moonbow Half Moon"
  ],
  "height": 1.9
 },
 "doma": {
  "name": "Doma",
  "group": "Upper Moons",
  "style": "ice",
  "color": "#9fe8e7",
  "hair": "#e5d2b2",
  "coat": "#a83443",
  "pattern": "lotus",
  "weapon": "fans",
  "skills": [
   "Frozen Lotuses",
   "Crystalline Divine Child",
   "Rime Water Lily"
  ],
  "height": 1.87
 },
 "akaza": {
  "name": "Akaza",
  "group": "Upper Moons",
  "style": "compass",
  "color": "#8fdaef",
  "hair": "#d68d9b",
  "coat": "#3b5680",
  "pattern": "tattoos",
  "weapon": "fists",
  "skills": [
   "Air Type",
   "Disorder",
   "Annihilation Type"
  ],
  "height": 1.73
 },
 "hantengu": {
  "name": "Hantengu",
  "group": "Upper Moons",
  "style": "wood",
  "color": "#bdbe78",
  "hair": "#2c2825",
  "coat": "#654634",
  "pattern": "stripes",
  "weapon": "staff",
  "skills": [
   "Weeping Spears",
   "Thunder Drums",
   "Wood Dragon Menace"
  ],
  "height": 1.66
 },
 "gyokko": {
  "name": "Gyokko",
  "group": "Upper Moons",
  "style": "pot",
  "color": "#a7cecd",
  "hair": "#d9d7c6",
  "coat": "#6a5290",
  "pattern": "scales",
  "weapon": "claws",
  "skills": [
   "Thousand Needle Fish",
   "Water Prison Pot",
   "Killer Fish Scales"
  ],
  "height": 1.7
 },
 "gyutaro": {
  "name": "Gyutaro",
  "group": "Upper Moons",
  "style": "sickle",
  "color": "#bedc68",
  "hair": "#75865b",
  "coat": "#47403c",
  "pattern": "spots",
  "weapon": "sickles",
  "skills": [
   "Blood Sickles",
   "Rampant Arc Rampage",
   "Rotating Circular Slashes"
  ],
  "height": 1.83
 },
 "daki": {
  "name": "Daki",
  "group": "Upper Moons",
  "style": "obi",
  "color": "#f494ce",
  "hair": "#ecece3",
  "coat": "#cc4b7d",
  "pattern": "obi",
  "weapon": "ribbons",
  "skills": [
   "Obi Slash",
   "Eight-Layered Obi",
   "Sash Maelstrom"
  ],
  "height": 1.7
 },
 "nakime": {
  "name": "Nakime",
  "group": "Upper Moons",
  "style": "castle",
  "color": "#c591c6",
  "hair": "#242028",
  "coat": "#4d2a36",
  "pattern": "kimono",
  "weapon": "biwa",
  "skills": [
   "String Resonance",
   "Shifting Rooms",
   "Infinity Castle"
  ],
  "height": 1.65
 },
 "kaigaku": {
  "name": "Kaigaku",
  "group": "Upper Moons",
  "style": "darkthunder",
  "color": "#8b9bdb",
  "hair": "#242d32",
  "coat": "#253c49",
  "pattern": "vest",
  "weapon": "sword",
  "skills": [
   "Dark Thunder",
   "Thunder Swarm",
   "Rumble and Flash"
  ],
  "height": 1.67
 }
};
for(const [kind,d] of Object.entries(KIMETSU_ROSTER)){
 const heavy=['gyomei','kokushibo','muzan','tengen'].includes(kind),fast=['zenitsu','shinobu','kaigaku','inosuke'].includes(kind);
 IB_STATS[kind]={name:d.name,hp:heavy?116:fast?98:106,height:d.height,speed:fast?4.8:heavy?3.9:4.35,reach:['whip','flail','whips','ribbons','staff'].includes(d.weapon)?1.95:1.65,guard:heavy?.8:.95};
 const ranged=['gun','ice','pot','compass'].includes(d.style);
 IB_CHARACTER_MOVES[kind]={light:makeCombo(fast?[27,30,43]:heavy?[32,36,49]:[29,33,46],heavy?[14,16,23]:[12,15,21]),heavy:{length:heavy?64:58,start:heavy?26:23,end:heavy?35:32,damage:heavy?30:27,cost:28,push:5.5,lunge:.65,down:true,label:d.weapon==='fists'?'HEAVY PALM':'HEAVY CUT'},special:{label:d.skills[0],length:64,start:23,end:32,damage:25,cost:31,push:4.6,lunge:ranged?0:['thunder','darkthunder','beast'].includes(d.style)?2:.8,break:true,cooldown:220,type:ranged?'projectile':'arc',radius:ranged?.32:2,range:7,speed:11,arc:1.8}};
}

// The ten Straw Hat crew members aboard the Thousand Sunny; no guest passengers.
const ONE_PIECE_ROSTER = {
 luffy:{name:'Monkey D. Luffy',role:'CAPTAIN',style:'rubber',color:'#ff6752',hair:'#22242c',coat:'#c93c40',height:1.74,hp:110,speed:4.45,reach:1.7,weapon:'fists',skills:['Gum-Gum Pistol','Gum-Gum Gatling','King Kong Gun']},
 zoro:{name:'Roronoa Zoro',role:'SWORDSMAN',style:'three-sword',color:'#88d77b',hair:'#6b9460',coat:'#315f4c',height:1.81,hp:112,speed:4.15,reach:1.95,weapon:'three-swords',skills:['Oni Giri','1080 Pound Phoenix','Three Thousand Worlds']},
 nami:{name:'Nami',role:'NAVIGATOR',style:'weather',color:'#ffc567',hair:'#e48b3f',coat:'#65b9ad',height:1.70,hp:98,speed:4.5,reach:1.8,weapon:'staff',skills:['Thunderbolt Tempo','Thunder Lance Tempo','Zeus Thundercloud']},
 usopp:{name:'Usopp',role:'SNIPER',style:'slingshot',color:'#9edb66',hair:'#30272a',coat:'#c3a454',height:1.75,hp:100,speed:4.45,reach:1.6,weapon:'slingshot',skills:['Green Star: Skull Bombgrass','Green Star: Sargasso','Firebird Star']},
 sanji:{name:'Vinsmoke Sanji',role:'COOK',style:'kick',color:'#ffad52',hair:'#e2c567',coat:'#272e42',height:1.80,hp:104,speed:4.75,reach:1.75,weapon:'kick',skills:['Diable Jambe','Collier Strike','Ifrit Jambe']},
 chopper:{name:'Tony Tony Chopper',role:'DOCTOR',style:'hoof',color:'#f694bc',hair:'#a77b52',coat:'#c2496d',height:1.18,hp:102,speed:4.55,reach:1.5,weapon:'hooves',skills:['Heavy Gong','Cloven Palm','Monster Point Slam']},
 robin:{name:'Nico Robin',role:'ARCHAEOLOGIST',style:'bloom',color:'#c29aef',hair:'#222334',coat:'#6957a0',height:1.86,hp:102,speed:4.15,reach:1.65,weapon:'hands',skills:['Treinta Fleur: Clutch','Mil Fleur: Gigantesco Mano','Demonio Fleur']},
 franky:{name:'Franky',role:'SHIPWRIGHT',style:'cyborg',color:'#7cd9ed',hair:'#55c1d4',coat:'#c54b48',height:2.10,hp:118,speed:3.75,reach:1.9,weapon:'cannon',skills:['Weapons Left','Strong Right','Radical Beam']},
 brook:{name:'Brook',role:'MUSICIAN',style:'soul-music',color:'#91e4ef',hair:'#242633',coat:'#313a4e',height:2.13,hp:98,speed:4.65,reach:1.95,weapon:'cane',skills:['Soul Solid','Soul Parade','Soul King Requiem']},
 jinbe:{name:'Jinbe',role:'HELMSMAN',style:'fishman',color:'#62b6f3',hair:'#273744',coat:'#db9d4b',height:2.04,hp:118,speed:3.85,reach:1.85,weapon:'palms',skills:['Five Thousand Brick Fist','Water Shot','Vagabond Drill']}
};
// Hitboxes and resources use the established deterministic combat system.
const ONE_PIECE_TECHNIQUES = {
 luffy:[{type:'line',radius:3.8,width:.45,lunge:.35},{type:'arc',radius:2.5,damage:9,pulses:[16,24,32],start:16,end:33,length:65,lunge:.7},{type:'line',radius:5.4,width:1.25,damage:48,lunge:1.4}],
 zoro:[{type:'arc',radius:2.4,arc:2.1,lunge:1.5},{type:'projectile',radius:.46,range:8,speed:12,damage:24},{type:'arc',radius:3.0,arc:2.8,lunge:2.9,start:36,end:49,length:99}],
 nami:[{type:'projectile',radius:.3,range:8,speed:13,lunge:0},{type:'field',radius:2.4,offset:1.5,start:30,end:39,length:71,lunge:0},{type:'radial',radius:4.6,damage:43,lunge:0}],
 usopp:[{type:'projectile',radius:.34,range:9,speed:12,lunge:0},{type:'field',radius:2.6,offset:1.7,down:true,lunge:0},{type:'line',radius:8.5,width:1.1,damage:45,lunge:0}],
 sanji:[{type:'arc',radius:2.2,lunge:1.7},{type:'line',radius:3.1,width:.6,start:17,end:26,length:56,lunge:1},{type:'arc',radius:2.8,arc:2.3,lunge:3.1,start:34,end:47,length:96}],
 chopper:[{type:'arc',radius:2.0,damage:26,down:true,lunge:1},{type:'line',radius:2.9,width:.7,damage:24,down:true},{type:'radial',radius:4,damage:47,lunge:0}],
 robin:[{type:'field',radius:2.2,offset:1.4,lunge:0},{type:'line',radius:4,width:.8,damage:25,down:true,lunge:0},{type:'radial',radius:4.4,damage:43,lunge:0}],
 franky:[{type:'projectile',radius:.43,range:8,speed:10,lunge:0},{type:'line',radius:4.2,width:.65,damage:27,down:true,lunge:.2},{type:'line',radius:9,width:1,damage:49,lunge:0}],
 brook:[{type:'line',radius:3.1,width:.4,lunge:1.3},{type:'field',radius:2.5,offset:1.1,down:true,lunge:0},{type:'radial',radius:4.5,damage:43,lunge:0}],
 jinbe:[{type:'line',radius:2.8,width:.75,damage:28,down:true,lunge:.6},{type:'projectile',radius:.55,range:7,speed:11,damage:25,lunge:0},{type:'line',radius:6,width:1.3,damage:48,lunge:.7}]
};
for(const [kind,d] of Object.entries(ONE_PIECE_ROSTER)){
 IB_STATS[kind]={name:d.name,hp:d.hp,height:d.height,speed:d.speed,reach:d.reach,guard:['franky','jinbe','zoro'].includes(kind)?.8:.95};
 const fast=['sanji','brook','chopper'].includes(kind),heavy=['franky','jinbe'].includes(kind);
 IB_CHARACTER_MOVES[kind]={light:makeCombo(fast?[27,31,44]:heavy?[33,36,49]:[30,33,46],heavy?[14,16,23]:[12,15,21]),heavy:{length:heavy?65:58,start:heavy?27:23,end:heavy?36:32,damage:heavy?30:27,cost:28,push:5.6,lunge:.7,down:true,label:kind==='sanji'?'HEAVY KICK':'HEAVY STRIKE'},special:{label:d.skills[0],length:65,start:24,end:33,damage:25,cost:32,push:4.5,lunge:.6,break:true,cooldown:220,...ONE_PIECE_TECHNIQUES[kind][0]}};
}

// Naruto / Shippuden ensemble: each named fighter is one roster slot.
const NARUTO_ROSTER = {
 naruto:{name:'Naruto Uzumaki',group:'Leaf shinobi',style:'rasengan',color:'#68c9ff',hair:'#ebc451',coat:'#d87835',height:1.68,weapon:'kunai',skills:['Rasengan','Shadow Clone Barrage','Wind Style: Rasenshuriken']},
 sasuke:{name:'Sasuke Uchiha',group:'Leaf shinobi',style:'lightning',color:'#a3a0ff',hair:'#252835',coat:'#b7b5c2',height:1.77,weapon:'sword',skills:['Chidori','Fire Style: Fireball','Kirin']},
 sakura:{name:'Sakura Haruno',group:'Leaf shinobi',style:'impact',color:'#f49bb9',hair:'#d692a3',coat:'#9e394d',height:1.65,weapon:'fists',skills:['Cherry Blossom Impact','Ground Fracture','Strength of a Hundred']},
 kakashi:{name:'Kakashi Hatake',group:'Leaf shinobi',style:'lightning',color:'#8adcea',hair:'#b7c6ce',coat:'#638375',height:1.81,weapon:'kunai',skills:['Lightning Blade','Lightning Hound','Kamui']},
 hinata:{name:'Hinata Hyuga',group:'Leaf shinobi',style:'gentle-fist',color:'#a9b9f1',hair:'#34324d',coat:'#b1a9d1',height:1.63,weapon:'palms',skills:['Twin Lion Fists','Eight Trigrams Air Palm','Eight Trigrams Sixty-Four Palms']},
 rocklee:{name:'Rock Lee',group:'Leaf shinobi',style:'taijutsu',color:'#9ed773',hair:'#252d2c',coat:'#527953',height:1.72,weapon:'kick',skills:['Leaf Hurricane','Primary Lotus','Hidden Lotus']},
 neji:{name:'Neji Hyuga',group:'Leaf shinobi',style:'gentle-fist',color:'#c4dcec',hair:'#524139',coat:'#d7d1bd',height:1.72,weapon:'palms',skills:['Eight Trigrams Air Palm','Eight Trigrams Rotation','Eight Trigrams Sixty-Four Palms']},
 shikamaru:{name:'Shikamaru Nara',group:'Leaf shinobi',style:'shadow',color:'#b3a2cc',hair:'#2c3031',coat:'#6f8566',height:1.70,weapon:'kunai',skills:['Shadow Possession','Shadow Strangle','Shadow Stitching']},
 mightguy:{name:'Might Guy',group:'Leaf shinobi',style:'taijutsu',color:'#f1876a',hair:'#28302d',coat:'#44715a',height:1.84,weapon:'kick',skills:['Dynamic Entry','Daytime Tiger','Night Guy']},
 gaara:{name:'Gaara',group:'Sand shinobi',style:'sand',color:'#e1be79',hair:'#984d46',coat:'#763e47',height:1.66,weapon:'sand',skills:['Sand Coffin','Sand Shower','Imperial Sand Burial']},
 jiraiya:{name:'Jiraiya',group:'Sannin',style:'sage',color:'#e68a67',hair:'#dfdfd3',coat:'#a84742',height:1.91,weapon:'fists',skills:['Rasengan','Fire Style: Flame Bomb','Sage Art: Goemon']},
 tsunade:{name:'Tsunade',group:'Sannin',style:'impact',color:'#84dbb3',hair:'#d5bd79',coat:'#588b77',height:1.66,weapon:'fists',skills:['Heavenly Foot of Pain','Heavenly Spear Kick','Hundred Healings Strike']},
 orochimaru:{name:'Orochimaru',group:'Sannin',style:'snake',color:'#ba91da',hair:'#262532',coat:'#c7b99c',height:1.80,weapon:'sword',skills:['Striking Shadow Snake','Wind Style: Great Breakthrough','Eight Branches']},
 minato:{name:'Minato Namikaze',group:'Legends',style:'flash',color:'#f1d66f',hair:'#e2c765',coat:'#e5dfca',height:1.80,weapon:'kunai',skills:['Flying Raijin Strike','Rasengan','Yellow Flash Barrage']},
 hashirama:{name:'Hashirama Senju',group:'Legends',style:'wood',color:'#8dc18a',hair:'#332e2b',coat:'#8f4949',height:1.85,weapon:'fists',skills:['Wood Dragon','Deep Forest Emergence','True Several Thousand Hands']},
 tobirama:{name:'Tobirama Senju',group:'Legends',style:'water',color:'#7acbe8',hair:'#d7dfdf',coat:'#426387',height:1.82,weapon:'sword',skills:['Water Dragon','Water Severing Wave','Tandem Explosive Tags']},
 madara:{name:'Madara Uchiha',group:'Legends',style:'susanoo',color:'#769df1',hair:'#292935',coat:'#9e494d',height:1.85,weapon:'fan',skills:['Fire Style: Majestic Flame','Uchiha Reflection','Perfect Susanoo']},
 itachi:{name:'Itachi Uchiha',group:'Akatsuki',style:'crow',color:'#e88b94',hair:'#292b35',coat:'#282b37',height:1.78,weapon:'kunai',skills:['Fire Style: Fireball','Amaterasu','Totsuka Blade']},
 pain:{name:'Pain',group:'Akatsuki',style:'gravity',color:'#cc9eee',hair:'#d18b4e',coat:'#292b38',height:1.76,weapon:'rods',skills:['Almighty Push','Universal Pull','Planetary Devastation']},
 obito:{name:'Obito Uchiha',group:'Akatsuki',style:'vortex',color:'#db9569',hair:'#30323a',coat:'#2e2d39',height:1.82,weapon:'chain',skills:['Kamui Strike','Fire Style: Bomb Blast Dance','Kamui Vortex']}
};
const NARUTO_TECHNIQUES = {
 naruto:[{type:'line',radius:3,width:.65,lunge:1},{type:'arc',radius:2.5,start:16,end:33,length:66,pulses:[16,24,32],damage:9,lunge:.8},{type:'projectile',radius:.75,range:9,speed:11,damage:47,lunge:0}],
 sasuke:[{type:'line',radius:3.4,width:.45,lunge:1.3},{type:'projectile',radius:.5,range:8,speed:10,lunge:0},{type:'field',radius:4.3,offset:1.5,damage:46,lunge:0}],
 sakura:[{type:'arc',radius:2.3,damage:28,down:true,lunge:.8},{type:'field',radius:2.7,offset:1,down:true,lunge:0},{type:'radial',radius:4.2,damage:48,lunge:0}],
 kakashi:[{type:'line',radius:3.1,width:.5,lunge:1.1},{type:'projectile',radius:.4,range:8,speed:12,lunge:0},{type:'field',radius:4,offset:1.6,lunge:0}],
 hinata:[{type:'arc',radius:2.2,lunge:1.1},{type:'projectile',radius:.4,range:7,speed:12,lunge:0},{type:'arc',radius:2.6,start:40,end:57,length:110,pulses:[40,48,56],damage:15,lunge:1.8}],
 rocklee:[{type:'arc',radius:2.2,arc:2.4,lunge:1.4},{type:'line',radius:2.8,width:.65,down:true,lunge:1},{type:'arc',radius:2.6,start:34,end:48,length:96,lunge:3.1,damage:46}],
 neji:[{type:'projectile',radius:.38,range:7,speed:12,lunge:0},{type:'radial',radius:2.8,damage:23,lunge:0},{type:'arc',radius:2.7,start:40,end:57,length:110,pulses:[40,48,56],damage:15,lunge:1.6}],
 shikamaru:[{type:'field',radius:2.2,offset:1.5,down:true,lunge:0},{type:'line',radius:4,width:.55,down:true,lunge:0},{type:'field',radius:4.1,offset:1.3,lunge:0}],
 mightguy:[{type:'line',radius:2.8,width:.6,lunge:1.6},{type:'projectile',radius:.55,range:7,speed:12,lunge:0},{type:'line',radius:6,width:1.1,start:36,end:49,length:100,lunge:2.2,damage:49}],
 gaara:[{type:'field',radius:2.3,offset:1.3,down:true,lunge:0},{type:'projectile',radius:.48,range:8,speed:9,lunge:0},{type:'radial',radius:4.6,lunge:0}],
 jiraiya:[{type:'line',radius:3,width:.7,lunge:.8},{type:'projectile',radius:.55,range:8,speed:10,lunge:0},{type:'field',radius:4.3,offset:1.3,lunge:0}],
 tsunade:[{type:'arc',radius:2.4,damage:29,down:true,lunge:.6},{type:'line',radius:3,width:.7,down:true,lunge:.9},{type:'radial',radius:4.1,damage:49,lunge:0}],
 orochimaru:[{type:'line',radius:3.8,width:.55,lunge:.3},{type:'projectile',radius:.5,range:8,speed:11,lunge:0},{type:'radial',radius:4.6,damage:44,lunge:0}],
 minato:[{type:'line',radius:3.5,width:.45,lunge:2.1,start:18,end:27,length:58},{type:'arc',radius:2.5,damage:26,lunge:1},{type:'arc',radius:2.6,start:34,end:51,length:100,pulses:[34,42,50],damage:15,lunge:3.2}],
 hashirama:[{type:'projectile',radius:.6,range:7,speed:9,lunge:0},{type:'field',radius:3,offset:1.1,down:true,lunge:0},{type:'radial',radius:4.8,damage:45,lunge:0}],
 tobirama:[{type:'projectile',radius:.5,range:8,speed:11,lunge:0},{type:'line',radius:4.6,width:.4,lunge:0},{type:'field',radius:4.2,offset:1.5,lunge:0}],
 madara:[{type:'projectile',radius:.65,range:8,speed:10,lunge:0},{type:'radial',radius:2.8,push:5.5,lunge:0},{type:'line',radius:6,width:1.3,damage:48,lunge:0}],
 itachi:[{type:'projectile',radius:.5,range:8,speed:10,lunge:0},{type:'field',radius:2.6,offset:1.7,lunge:0},{type:'line',radius:6,width:.85,damage:47,lunge:.3}],
 pain:[{type:'radial',radius:2.8,push:6,lunge:0},{type:'radial',radius:3.4,pull:true,push:4.5,damage:20,lunge:0},{type:'radial',radius:4.8,damage:44,lunge:0}],
 obito:[{type:'line',radius:3.2,width:.55,lunge:1.4},{type:'projectile',radius:.55,range:8,speed:10,lunge:0},{type:'field',radius:4.1,offset:1.5,lunge:0}]
};
for(const [kind,d] of Object.entries(NARUTO_ROSTER)){
 const fast=['minato','rocklee','mightguy','sasuke'].includes(kind),heavy=['tsunade','hashirama','madara','pain'].includes(kind);
 IB_STATS[kind]={name:d.name,height:d.height,hp:heavy?116:fast?102:106,speed:fast?4.75:heavy?3.95:4.35,reach:d.weapon==='sword'||d.weapon==='fan'?1.9:1.65,guard:heavy?.8:.95};
 IB_CHARACTER_MOVES[kind]={light:makeCombo(fast?[27,30,44]:heavy?[32,36,49]:[29,33,46],heavy?[14,16,23]:[12,15,21]),heavy:{length:heavy?64:58,start:heavy?26:23,end:heavy?35:32,damage:heavy?30:27,cost:28,push:5.6,lunge:.7,down:true,label:d.weapon==='kick'?'HEAVY KICK':'HEAVY STRIKE'},special:{label:d.skills[0],length:65,start:24,end:33,damage:25,cost:32,push:4.6,lunge:.6,break:true,cooldown:220,...NARUTO_TECHNIQUES[kind][0]}};
}
