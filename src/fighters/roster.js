
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
