const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2] || 'C:/Users/haidat/Desktop/Travel Awards 2026';
const source = root + '/Vibe code/travel-awards-2026';
fs.mkdirSync('assets/key-visual', {recursive:true});
for (const name of ['logo.svg','home.svg','facebook.svg','sms.svg']) fs.copyFileSync(source+'/public/assets/key-visual/'+name, 'assets/key-visual/'+name);
const read = p => fs.readFileSync(source+'/'+p,'utf8');
let css = read('src/styles/tokens.css').replace('@theme static', ':host').replace(/--color-\*: initial;/g,'');
css += read('src/app/globals.css').replace(/^@import.*$/gm,'') + read('src/app/home.css');
css = css.replaceAll("/assets/", "../assets/");
for (const name of ['facebook.svg','sms.svg']) {
  const svg=encodeURIComponent(fs.readFileSync('assets/key-visual/'+name,'utf8')).replaceAll("'",'%27');
  css=css.replaceAll("url('../assets/key-visual/"+name+"')",'url("data:image/svg+xml,'+svg+'")');
}
css += '\n:host{display:block;font-family:Inter,Arial,sans-serif;color:#263c53}*{box-sizing:border-box}a{color:inherit;text-decoration:none}img{display:block;max-width:100%;height:auto}p,dl,dd{margin:0}button{font:inherit}.home-header-brand-row{display:flex;align-items:center;gap:2rem}.home-header{position:static}@media(max-width:600px){.home-header-inner{height:auto;min-height:65px;flex-wrap:wrap;gap:0;padding-block:12px}.home-header-brand-row{width:100%;justify-content:space-between;gap:12px}.home-header nav{width:100%;justify-content:center;margin-top:8px;gap:24px}.home-header .button--nomination{min-width:0;width:auto;padding:10px;font-size:12px}}';
fs.mkdirSync('shared',{recursive:true}); fs.writeFileSync('shared/travel-awards.css',css);
const logo = '<img class="brand-graphic brand-graphic--logo" src="assets/key-visual/logo.svg" alt="Travel Awards 2026" width="1000" height="350">';
const header = `<header class="home-header home-header--survey"><div class="layout-container home-header-inner"><div class="home-header-brand-row"><a class="home-header-logo" href="https://vnexpress.net/du-lich/travel-awards" aria-label="Travel Awards — Trang chủ">${logo}</a></div></div></header>`;
// Survey header verified against https://khao-sat-travel-awards.vercel.app/.
fs.appendFileSync('shared/travel-awards.css', '\n.home-header--survey{position:static;border-bottom:1px solid #91d5d8;background:#fff}.home-header--survey .home-header-inner{width:min(calc(100% - 2 * var(--spacing-gutter)),1100px);height:65px;min-height:65px;padding-block:0;flex-wrap:nowrap;gap:0}.home-header--survey .home-header-brand-row{width:140px;height:65px;display:flex;align-items:center;gap:0}.home-header--survey .home-header-logo{display:block;width:140px}.home-header--survey .brand-graphic--logo{display:block;width:140px;height:auto}\n');
const chrome = html => `<template shadowrootmode="open"><link rel="stylesheet" href="shared/travel-awards.css"><div class="home">${html}</div></template>`;
let html = fs.readFileSync(root+'/tool cham diem bgk.html','utf8');
html = html.replace(/<script src="https:\/\/cdn.tailwindcss.com\/3.4.17"><\/script>/,'<link rel="stylesheet" href="shared/utilities.css">').replace(/  <link[^>]+(?:fonts.googleapis.com|fonts.gstatic.com)[^>]*>\r?\n/g,'');
html = html.replace(/<header class="sticky[^]*?<\/header>/, `<div id="main">${chrome(header)}</div>\n<section aria-label="Tiến trình chấm điểm" class="border-b border-slate-200 bg-white/95"><div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3"><span class="text-sm font-semibold text-teal-700">Chấm điểm Ban Giám khảo</span><div id="stepIndicatorBar" class="flex items-center gap-1 sm:gap-1.5"></div></div></section>`);
html = html.replace('</head>', '<link rel="stylesheet" href="shared/editor-workspace.css">\n</head>');
html = html.replace('</body>', '<script src="shared/scoring-model.js"></script>\n<script src="shared/editor-workspace.js"></script>\n</body>');
fs.writeFileSync('index.html', html);
console.log('Created index.html with shared Travel Awards branding; scoring script preserved.');
