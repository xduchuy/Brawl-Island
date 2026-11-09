const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'brawl-deployment-'));
(async()=>{
 let browser,server;
 try{
  // Reproduce the host build in an isolated tree with no installed dependencies.
  for(const name of ['src','vendor','assets','tools'])fs.cpSync(path.join(root,name),path.join(temp,name),{recursive:true});
  execFileSync(config.installCommand.split(' ')[0],config.installCommand.split(' ').slice(1),{cwd:temp});
  execFileSync(process.execPath,config.buildCommand.split(' ').slice(1),{cwd:temp});
  const output=path.join(temp,config.outputDirectory),html=fs.readFileSync(path.join(output,'index.html'));
  assert.deepEqual(fs.readdirSync(output),['index.html']);assert(html.equals(fs.readFileSync(path.join(root,'index.html'))));
  server=http.createServer((req,res)=>{if(req.url!=='/'&&req.url!=='/index.html'){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const{chromium}=require('playwright');browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const page=await browser.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  const response=await page.goto('http://127.0.0.1:'+server.address().port+'/');assert.equal(response.status(),200);await page.waitForFunction(()=>window.__ib);await page.evaluate(()=>__ib.vfx.ready);
  assert.equal(await page.evaluate(()=>__ib.vfx.loaded),49);assert.deepEqual(await page.evaluate(()=>__ib.vfx.failed),[]);assert.equal(await page.locator('[data-fighter]').count(),11);assert.deepEqual(errors,[]);assert.equal(requests.length,1);
  console.log('Vercel build: dependency-free; public/index.html matches offline build; HTTP 200; 11 fighters; 49 textures; no runtime asset requests or page errors.');
 }finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));fs.rmSync(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
