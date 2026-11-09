class CombatFeedback {
 constructor(){this.shake=0;this.zoom=0;this.direction=1;this.flash=0;this.volumes={music:.18,sfx:.65,ui:.35};this.settings={shake:1,flashes:.45};this.musicClock=0;this.noise=null;}
 tone(type,weight=1,pitch=1){
  if(!sound||!audioCtx||audioCtx.state!=='running')return;
  const ctx=audioCtx,now=ctx.currentTime,ui=['gong','menu'].includes(type),volume=ui?this.volumes.ui:this.volumes.sfx;
  const frequencies={swing:250,hit:100,heavy:65,weapon:720,special:330,charge:180,ultimate:55,block:850,parry:1400,guardbreak:90,ko:48,roll:180,dash:220,crowd:160,gong:220,menu:660,bone:600,fall:80,victory:440};
  const hz=(frequencies[type]||180)*pitch,duration=['ultimate','victory','gong'].includes(type)?.7:.18;
  for(let layer=0;layer<2;layer++){
   const o=ctx.createOscillator(),g=ctx.createGain();o.type=['parry','block','weapon'].includes(type)?'triangle':layer?'sine':'sawtooth';
   o.frequency.setValueAtTime(hz*(layer?1.5:1),now);o.frequency.exponentialRampToValueAtTime(Math.max(22,hz*(type==='charge'?3:.4)),now+duration);
   g.gain.setValueAtTime(volume*.085*weight/(layer+1),now);g.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(g).connect(ctx.destination);o.start();o.stop(now+duration);
  }
  if(['hit','heavy','weapon','ultimate','roll','guardbreak'].includes(type)){
   if(!this.noise){this.noise=ctx.createBuffer(1,ctx.sampleRate*.5,ctx.sampleRate);const d=this.noise.getChannelData(0);let seed=25;for(let i=0;i<d.length;i++){seed=(seed*1664525+1013904223)>>>0;d[i]=(seed/4294967296*2-1);}}
   const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=this.noise;f.type='lowpass';f.frequency.value=type==='weapon'?3200:700;g.gain.setValueAtTime(volume*.18*weight,now);g.gain.exponentialRampToValueAtTime(.001,now+.2);s.connect(f).connect(g).connect(ctx.destination);s.start();s.stop(now+.22);
  }
 }
 event(e,m){
  if(e.type==='hit'){this.shake=Math.max(this.shake,e.shake||.08);this.zoom=e.heavy?.06:.02;this.flash=e.heavy?.35:.16;const a=m.fighters[e.attacker],b=m.fighters[e.id];this.direction=Math.sign(b.x-a.x)||1;this.tone(e.heavy?'heavy':['toji','skeleton','nobara','geto'].includes(a.kind)?'weapon':'hit');}
  if(e.type==='active'&&['special','skill2'].includes(SKILLS[e.skill]?.category)){const index=Object.keys(FIGHTER_PROFILES).indexOf(m.fighters[e.id].kind);this.tone('special',.8,.7+index*.09);}
  if(e.type==='ultimate'){this.zoom=.14;this.tone('ultimate');}
  if(['parry','guardbreak','charge','dash'].includes(e.type))this.tone(e.type);
  if(e.type==='parry'){this.shake=.08;this.flash=.4;}
  if(e.type==='matchend')this.tone('victory');
 }
 update(dt){this.shake*=Math.exp(-dt*13);this.zoom*=Math.exp(-dt*3);this.flash*=Math.exp(-dt*10);
  $('stage').style.setProperty('--impact',String(this.flash*this.settings.flashes));
  if(audioCtx?.wind)audioCtx.wind.gain.value=sound?.035*this.volumes.music:0;
  this.musicClock+=dt;if(sound&&audioCtx&&this.volumes.music>0&&this.musicClock>2){this.musicClock=0;const now=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=[110,130.81,164.81,146.83][Math.floor(worldTime/2)%4];g.gain.setValueAtTime(.001,now);g.gain.linearRampToValueAtTime(this.volumes.music*.045,now+.2);g.gain.exponentialRampToValueAtTime(.001,now+1.8);o.connect(g).connect(audioCtx.destination);o.start();o.stop(now+1.9);}
 }
}
