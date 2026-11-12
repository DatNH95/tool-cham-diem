// Build once with an installed Tailwind 4 package; the shipped tool needs no runtime.
const fs=require('node:fs'),path=require('node:path');
const packageRoot=process.argv[2];
if(!packageRoot)throw Error('Usage: node scripts/build-styles.cjs <tailwindcss package directory>');
const {compile}=require(path.resolve(packageRoot,'dist/lib.js'));
(async()=>{
  const files=['index.html','shared/editor-workspace.js','shared/scoring-model.js'];
  const content=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
  const candidates=[...new Set(content.match(/[!a-zA-Z0-9_@:\-./%#[\](),]+/g)||[])];
  const compiler=await compile(fs.readFileSync(path.resolve(packageRoot,'index.css'),'utf8'));
  fs.writeFileSync('shared/utilities.css',compiler.build(candidates));
  console.log('Built offline utilities:',fs.statSync('shared/utilities.css').size,'bytes');
})().catch(e=>{console.error(e);process.exitCode=1;});
