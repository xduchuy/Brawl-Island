// One roster source drives the four team selectors and illustrated SVG portraits.
const kimetsuSymbols=document.querySelector('svg defs');
for(const [kind,d] of Object.entries(KIMETSU_ROSTER)){
 const skin=['akaza','gyokko'].includes(kind)?'#e7d7d2':kind==='gyutaro'?'#b5bf98':'#e6bda2';
 const symbol=document.createElementNS('http://www.w3.org/2000/svg','symbol');symbol.id=kind;symbol.setAttribute('viewBox','0 0 64 70');
 let detail='';
 if(d.pattern==='check')for(let y=52;y<70;y+=8)for(let x=12;x<53;x+=8)if((x+y)%16)detail+='<path fill="#222b2a" d="M'+x+' '+y+'h8v8h-8Z"/>';
 if(d.pattern==='triangles')for(let x=15;x<55;x+=12)detail+='<path fill="#fff0c9" d="m'+x+' 57 4 8h-8Z"/>';
 if(d.pattern==='stripes')for(let x=15;x<55;x+=8)detail+='<path stroke="#33323b" stroke-width="3" d="M'+x+' 51v19"/>';
 if(kind==='tanjiro')detail+='<path fill="#9d4447" d="M22 21h9v6h-9"/><path fill="#eee7d4" d="M16 36h4v12h-4m28-12h4v12h-4"/>';
 if(kind==='nezuko')detail+='<rect x="20" y="39" width="26" height="7" rx="3" fill="#77aa67"/>';
 if(kind==='inosuke')detail+='<path fill="#94827a" d="m13 17 5-10 9 10 15-1 8-9 4 17-5 23-18 5-16-11Z"/><path fill="#7badcf" d="M20 28h8v8h-8m17-8h8v8h-8"/><ellipse cx="33" cy="40" rx="9" ry="6" fill="#cea79f"/><path fill="#f2e5c8" d="m18 39 5-9 3 14m14 0 4-13 4 9Z"/>';
 if(kind==='kokushibo')for(let y=24;y<44;y+=8)detail+='<path fill="#e0a15d" d="M21 '+y+'h9v5h-9m14-5h9v5h-9"/><path fill="#ac4850" d="M25 '+y+'h2v5h-2m13-5h2v5h-2"/>';
 if(kind==='muzan')detail+='<path fill="#eee5d8" d="M13 18h40v5H13Zm9-13h23v14H22Z"/><path fill="#4b353d" d="M22 14h23v4H22Z"/>';
 if(kind==='tengen')detail+='<path fill="#e4e3dd" d="M16 20h33v8H16Z"/><path fill="#a880b5" d="M21 21h6v6h-6m9-6h6v6h-6m9-6h6v6h-6"/>';
 if(kind==='obanai')detail+='<path fill="#e9e4d9" d="M21 37h24v10H21Z"/><path stroke="#aaa59e" d="M21 40h24m-24 4h24"/>';
 if(kind==='akaza')detail+='<path stroke="#426ca0" stroke-width="3" d="M24 24v20m16-20v20M17 58h30m-30 7h30"/>';
 if(kind==='nakime')detail+='<path fill="#211e28" d="M18 18h30v24H18Z"/><path fill="#f2ddd9" d="M27 29h13v7H27Z"/><path fill="#d07c8e" d="M32 29h4v7h-4Z"/>';
 symbol.innerHTML='<path fill="'+d.coat+'" d="m8 70 7-18 17-5 18 5 6 18Z"/><path fill="'+skin+'" d="M20 21h25v22l-9 9h-8l-8-9Z"/><path fill="'+d.hair+'" d="m14 29 1-15 10-8 17 2 10 11-4 18-5-15-8 5-7-7-8 13Z"/><path fill="#faf0df" d="M23 30h9v6h-9m13-6h8v6h-8"/><path fill="'+d.color+'" d="M27 30h4v6h-4m10-6h4v6h-4"/><path fill="#493c41" d="M30 43h7v2h-7"/>'+detail;
 kimetsuSymbols.append(symbol);
}
for(const select of document.querySelectorAll('.fighter-select'))for(const group of ['Main cast','Hashira','Demons','Upper Moons']){
 const optgroup=document.createElement('optgroup');optgroup.label='Kimetsu · '+group;
 for(const [kind,d]of Object.entries(KIMETSU_ROSTER))if(d.group===group){const option=document.createElement('option');option.value=kind;option.textContent=d.name;optgroup.append(option);}select.append(optgroup);
}
