// SVG portraits and selector entries are derived from the same shinobi roster.
for(const [kind,d] of Object.entries(NARUTO_ROSTER)){
 const skin=kind==='orochimaru'?'#e0dac4':'#e2b99c',symbol=document.createElementNS('http://www.w3.org/2000/svg','symbol');symbol.id=kind;symbol.setAttribute('viewBox','0 0 64 70');
 let detail='';
 if(!['gaara','tsunade','orochimaru','madara','obito','hinata','shikamaru'].includes(kind))detail+='<path fill="#303847" d="M16 19h33v9H16Z"/><path fill="#9db1b9" d="M22 20h21v7H22Z"/><path stroke="#4c6270" fill="none" d="M34 22c-6-4-10 5-2 3h5"/>';
 if(['neji','hinata','orochimaru','hashirama','madara','jiraiya'].includes(kind))detail+='<path fill="'+d.hair+'" d="M13 20h7v34h-8Zm33 0h6v34h-6Z"/>';
 if(d.group==='Akatsuki'){detail+='<path fill="#b24d59" stroke="#e3d5cb" d="m15 60 3-4 5 1 2-3 6 5-3 5-9 1Z"/><path fill="#b24d59" stroke="#e3d5cb" d="m37 65 3-4 5 1 2-3 6 5-3 5-9 1Z"/>';if(kind!=='obito')detail+='<path stroke="#323747" stroke-width="2" d="m22 25 21-3"/>';}
 if(kind==='naruto')detail+='<path stroke="#986c54" d="m21 37 7 2m-7 1 7 2m-7 1 7 2m9-8 7-2m-7 5 7-2m-7 5 7-2"/><path fill="#282d39" d="M17 52h32v7H17Z"/>';
 if(kind==='kakashi')detail+='<path fill="#364154" d="M20 37h26v12H20Z"/><path fill="#282d39" d="M20 26h13v12H20Z"/>';
 if(['sakura','tsunade'].includes(kind))detail+='<path fill="#80629b" d="m33 24 3 4-3 4-3-4Z"/>';
 if(kind==='tsunade')detail+='<path fill="'+d.hair+'" d="M17 20h6v33h-6m27-33h6v33h-6Z"/>';
 if(['hinata','neji'].includes(kind))detail+='<path fill="#ded9ed" d="M24 31h7v5h-7m12-5h7v5h-7Z"/>';
 if(d.weapon==='kick')detail+='<path fill="'+d.hair+'" d="M17 15h32v13H17Z"/><path stroke="#252d2c" stroke-width="3" d="M22 29h10m3 0h10"/>';
 if(kind==='shikamaru')detail+='<path fill="'+d.hair+'" d="m24 13-3-9 8 3 4-7 4 7 9-3-5 12Z"/>';
 if(kind==='gaara')detail+='<path fill="#a64042" d="M23 24h6v5h-6Z"/><path fill="#bca16d" d="M43 49h14v18H43Z"/>';
 if(kind==='jiraiya')detail+='<path stroke="#af5151" stroke-width="3" d="M26 36v10m14-10v10"/>';
 if(kind==='tobirama')detail+='<path fill="#e4e3d8" d="m16 48 8 5 9-3 9 3 8-5 3 10-20 6-20-6Z"/><path stroke="#a5544e" stroke-width="2" d="M23 37v9m20-9v9"/>';
 if(kind==='pain')detail+='<path fill="#b69fc9" d="M24 31h7v5h-7m12-5h7v5h-7Z"/><path stroke="#373c47" stroke-width="2" d="M21 39h4m-4 5h4m17-5h4m-4 5h4M30 38h6"/>';
 if(kind==='obito')detail+='<ellipse cx="33" cy="35" rx="15" ry="19" fill="#bb7846"/><path stroke="#764b34" fill="none" d="M37 34c-8-14-18 8-4 10s20-20 3-24-24 26-7 31"/><ellipse cx="37" cy="34" rx="3" ry="4" fill="#282d39"/>';
 if(['hashirama','madara','tobirama'].includes(kind))for(let j=0;j<3;j++)detail+='<path stroke="#443f4c" stroke-width="2" d="M15 '+(55+j*6)+'h35"/>';
 symbol.innerHTML='<path fill="'+d.coat+'" d="m8 70 7-18 17-5 18 5 6 18Z"/><path fill="'+skin+'" d="M20 21h25v22l-9 9h-8l-8-9Z"/><path fill="'+d.hair+'" d="m13 27 3-13 6 1 1-10 8 6 6-9 4 11 10-1-4 15-9-7-7 5-9-5-4 10Z"/><path fill="#eee7dc" d="M23 30h9v6h-9m13-6h8v6h-8"/><path fill="'+(['sasuke','itachi','madara'].includes(kind)?'#ab4357':'#4d627a')+'" d="M27 30h3v6h-3m10-6h3v6h-3"/><path fill="#986552" d="M30 44h7v2h-7Z"/>'+detail;
 document.querySelector('svg defs').append(symbol);
}
for(const select of document.querySelectorAll('.fighter-select')){
 const group=document.createElement('optgroup');group.label='Naruto · Shinobi';
 for(const [kind,d] of Object.entries(NARUTO_ROSTER)){const option=document.createElement('option');option.value=kind;option.textContent=d.name;group.append(option);}select.append(group);
}
