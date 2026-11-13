class IconAtlasLoader {
 constructor(manifest){this.manifest=manifest;this.image=new Image();this.ready=new Promise((resolve,reject)=>{this.image.onload=resolve;this.image.onerror=()=>reject(new Error('Skill atlas failed'));});this.image.src=manifest.url;this.records=new Map(manifest.icons.map(e=>[e.fighter+'/'+e.slot,e]));}
 entry(fighter,action){return this.records.get(fighter+'/'+action)||this.records.get('common/'+({light:'attack',block:'guard'}[action]||action));}
 paint(element,fighter,action){const record=this.entry(fighter,action);if(!record)return;const [x,y,w,h]=record.rect,m=this.manifest;element.classList.add('skill-art');element.style.backgroundImage='url('+m.url+')';element.style.backgroundSize=`${m.width/w*100}% ${m.height/h*100}%`;element.style.backgroundPosition=`${x/(m.width-w)*100}% ${y/(m.height-h)*100}%`;element.dataset.icon=record.fighter+'/'+record.slot;}
}
const iconAtlas=new IconAtlasLoader(ICON_MANIFEST);
