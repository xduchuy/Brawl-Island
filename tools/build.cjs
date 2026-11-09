const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const combat = ['src/fighters/roster.js', 'src/fighters/skills.js', 'src/combat/match.js'].map(read).join('\n');
const assets = JSON.parse(read('assets/vfx/manifest.json'));
for (const a of Object.values(assets.assets)) a.url = 'data:image/png;base64,' + fs.readFileSync(path.join(root, a.path)).toString('base64');
const extension = ['src/vfx/engine.js','src/audio/feedback.js','src/game/reforged.js'].map(read).join('\n');
let world = read('src/game/world.js').replace('/* FIGHTER_MODELS */',()=>read('src/fighters/models.js')).replace('/* FIGHTER_ANIMATION */',()=>read('src/animation/rig.js')).replace('/* REFORGED_INIT */', 'const VFX_MANIFEST='+JSON.stringify(assets)+';\n'+extension);
let html = read('src/ui/shell.html').replace('{{THREE}}', () => read('vendor/three.r128.min.js')).replace('{{COMBAT}}', () => combat).replace('{{WORLD}}', () => world).replace('{{REFORGED_CSS}}', () => read('src/ui/reforged.css'));
if (/\{\{\w+\}\}/.test(html)) throw new Error('Unresolved build token');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--out-dir' || !args[1])) {
  throw new Error('Usage: node tools/build.cjs [--out-dir directory]');
}
const output = path.resolve(root, args[1] || '.');
fs.mkdirSync(output, {recursive:true});
fs.writeFileSync(path.join(output,'index.html'),html);
console.log('Offline build:', Buffer.byteLength(html), 'bytes;', Object.keys(assets.assets).length, 'embedded VFX assets');
