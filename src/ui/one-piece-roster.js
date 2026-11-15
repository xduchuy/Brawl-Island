// Crew portraits and all four team selectors share the same authoritative roster.
for(const [kind,d] of Object.entries(ONE_PIECE_ROSTER)){
 const skin=kind==='jinbe'?'#85bfcc':kind==='chopper'?'#ba8d62':kind==='brook'?'#e9dfc5':kind==='usopp'?'#b77c51':'#e7b997';
 const symbol=document.createElementNS('http://www.w3.org/2000/svg','symbol');symbol.id=kind;symbol.setAttribute('viewBox','0 0 64 70');
 let detail='';
 if(kind==='luffy')detail='<path fill="#d9bc72" d="M7 18h50v6H7Zm12-9h26v10H19Z"/><path fill="#af3f42" d="M19 15h26v4H19Z"/><path stroke="#915e52" d="M35 38h8"/>';
 if(kind==='zoro')detail='<path stroke="#a06b62" stroke-width="2" d="M25 25v16"/><path stroke="#e2c677" stroke-width="2" d="M46 37v9m3-9v9m3-9v9"/><path fill="#913f4c" d="M12 65h40v5H12Z"/>';
 if(kind==='nami')detail='<path fill="#e48b3f" d="M15 24h7v29h-9Zm29 0h7v30h-7Z"/><path stroke="#f4e5c7" stroke-width="2" d="m22 52 10 12 10-12"/>';
 if(kind==='usopp')detail='<path fill="#d9d8c4" d="M17 11h30v15H17Z"/><path fill="#84754a" d="M18 19h12v10H18m17-10h12v10H35Z"/><path fill="#8fc5c9" d="M21 21h6v6h-6m17-6h6v6h-6Z"/><path fill="#b77c51" d="M31 36h18v6H31Z"/>';
 if(kind==='sanji')detail='<path fill="#e2c567" d="m18 18 19 2-7 22H20Z"/><path fill="#586d8c" d="m24 52 8 8 8-8-8 18Z"/><path fill="#151e2d" d="m30 56 4 0 2 14h-8Z"/>';
 if(kind==='chopper')detail='<path stroke="#89623e" stroke-width="4" fill="none" d="m18 22-10-9 1-7m37 16 10-9-1-7M9 13 3 12m52 1 6-1"/><path fill="#e786ad" d="M9 20h46v6H9Z"/><path fill="#59a4bd" d="M18 8h29v14H18Z"/><path stroke="#eee8de" stroke-width="4" d="M26 15h14m-7-6v12"/><path fill="#467aaf" d="M29 37h8v5h-8Z"/>';
 if(kind==='robin')detail='<path fill="#222334" d="M15 23h7v31h-8Zm29 0h7v31h-7Z"/><path fill="#668db6" d="M20 19h11v5H20m15-5h11v5H35Z"/>';
 if(kind==='franky')detail='<path fill="#55c1d4" d="M25 2h15v20H25Z"/><path fill="#222731" d="M21 24h11v6H21m14-6h11v6H35Z"/><path fill="#8caab6" d="M30 33h6v9h-6Z"/><path fill="#c54b48" d="M5 51h14v19H5m40-19h14v19H45Z"/>';
 if(kind==='brook')detail='<path fill="#242633" d="M13 14h39v20h-7V22H21v12h-8Z"/><path fill="#171d27" d="M12 12h41v6H12Zm10-12h23v13H22Z"/><path fill="#83614c" d="M22 8h23v4H22Z"/><path fill="#222731" d="M23 29h9v9h-9m12-9h9v9h-9M23 43h21v5H23Z"/><path stroke="#e9dfc5" stroke-width="2" d="M27 42v6m5-6v6m5-6v6m5-6v6"/><path fill="#dfaa61" d="M15 51h12v9H15m24-9h12v9H39Z"/>';
 if(kind==='jinbe')detail='<path fill="#273744" d="M28 0h10v16H28Zm-10 36h6v14h-6m24-14h6v14h-6Z"/><path fill="#eee1bc" d="m25 44 2-8 3 8m7 0 2-8 3 8Z"/><path fill="#913f59" d="M13 65h40v5H13Z"/>';
 symbol.innerHTML='<path fill="'+d.coat+'" d="m8 70 7-18 17-5 18 5 6 18Z"/><path fill="'+skin+'" d="M20 21h25v22l-9 9h-8l-8-9Z"/><path fill="'+d.hair+'" d="m15 27 1-12 10-9 17 4 8 12-7 6-5-9-11 7-6-3-2 8Z"/><path fill="#f7ecda" d="M23 30h9v6h-9m13-6h8v6h-8"/><path fill="#222731" d="M27 30h3v6h-3m10-6h3v6h-3M30 43h7v2h-7"/>'+detail;
 document.querySelector('svg defs').append(symbol);
}
for(const select of document.querySelectorAll('.fighter-select')){
 const group=document.createElement('optgroup');group.label='One Piece · Straw Hat crew';
 for(const [kind,d] of Object.entries(ONE_PIECE_ROSTER)){const option=document.createElement('option');option.value=kind;option.textContent=d.name;group.append(option);}select.append(group);
}
