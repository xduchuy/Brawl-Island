const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:640,height:480}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(fs.readFileSync('index.html','utf8'));await page.waitForFunction(()=>window.__ib);
  const report=await page.evaluate(()=>{
   __ib.setManualClock(true);document.querySelector('[data-slot="0"] .fighter-select').value='luffy';__ib.configureMode('arcade');
   const count=Object.keys(__ib.profiles).length-1,enemies=[];
   // Explicit result fixtures exercise progression, not combat outcome or balance.
   for(let i=0;i<count;i++){
    __ib.start();if(__ib.reforged.stage!==i)throw Error('Wrong Arcade stage');
    const m=__ib.match;enemies.push(m.fighters[1].kind);m.phase='fight';m.fighters[1].dead=true;m.fighters[1].hp=0;m.step();__ib.processEvents();
    if(__ib.reforged.advance!==(i<count-1))throw Error('Wrong Arcade continuation');
   }
   return{count,enemies,finished:__ib.reforged.finished,fixture:'forced round victories'};
  });
  assert.equal(report.count,45);assert.equal(new Set(report.enemies).size,45);assert(!report.enemies.includes('luffy'));assert(report.finished);assert.deepEqual(errors,[]);
  fs.writeFileSync('tests/roster-progression-results.json',JSON.stringify({...report,errors},null,2));console.log('Arcade: all 45 distinct opponents, no self-match, correct terminal state');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
