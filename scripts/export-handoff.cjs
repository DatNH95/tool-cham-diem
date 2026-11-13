// Export rendered templates, not the empty JavaScript application shell.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'hand-off');
const write=(file,text)=>{fs.mkdirSync(path.dirname(path.join(out,file)),{recursive:true});fs.writeFileSync(path.join(out,file),text.replace(/[\t ]+$/gm,'').trimEnd()+'\n');};
let browser;
(async()=>{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'networkidle'});
  const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const cssSources=[...source.split('</head>')[0].matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>|<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]?fs.readFileSync(path.join(root,m[1]),'utf8'):m[2]);
  const css=await page.evaluate((cssSources)=>{
    const fonts=[];
    function flatten(rules,wrappers=[]){return [...rules].map(rule=>{
      if(rule.constructor.name==='CSSLayerStatementRule')return '';
      if(rule.constructor.name==='CSSLayerBlockRule')return flatten(rule.cssRules,wrappers);
      if(rule.cssRules&&!rule.selectorText){const prefix=rule.cssText.slice(0,rule.cssText.indexOf('{'));return `${prefix}{\n${flatten(rule.cssRules,[...wrappers,prefix])}\n}`;}
      if(rule.style&&rule.selectorText){
        const font=[];
        for(const property of [...rule.style])if(/^font(?:-|$)/.test(property)||/^--(?:font-|default-.*font)/.test(property))font.push(`${property}:${rule.style.getPropertyValue(property)}${rule.style.getPropertyPriority(property)?' !important':''};`);
        if(font.length)fonts.push(wrappers.reduceRight((text,prefix)=>`${prefix}{${text}}`,`${rule.selectorText}{${font.join('')}}`));
        const clone=document.createElement('span').style;clone.cssText=rule.style.cssText;
        for(const property of [...clone])if(/^font(?:-|$)/.test(property)||/^--(?:font-|default-.*font)/.test(property))clone.removeProperty(property);
        const nested=rule.cssRules?.length?flatten(rule.cssRules,[...wrappers,rule.selectorText]):'';
        return clone.cssText||nested?`${rule.selectorText}{${clone.cssText}${nested}}`:'';
      }
      return rule.cssText;
    }).join('\n');}
    const styles=cssSources.map(text=>{const sheet=new CSSStyleSheet();sheet.replaceSync(text);return flatten(sheet.cssRules);}).join('\n').replaceAll('.editor-evaluation main','.editor-evaluation .handoff-content').replaceAll('.editor-mobile-tabs button','.editor-mobile-tabs label');
    return {styles,fonts:fonts.join('\n')};
  },cssSources);
  write('css/font.css',css.fonts+'\n.home-header{font-family:Inter,Arial,sans-serif}');
  write('css/icons.css','/* No icon font: this tool uses inline SVG and Unicode symbols in HTML. */');
  write('css/layout.css',css.styles);
  // Header is isolated by its own class in the light DOM. Its desktop/mobile
  // dimensions are the same as the survey header in the interactive application.
  write('css/header.css',`.home-header{--spacing-gutter:clamp(1.25rem,4vw,4rem);background:#fff;border-bottom:1px solid #91d5d8;color:#263c53;flex-shrink:0}.home-header .home-header-inner{width:min(calc(100% - 2 * var(--spacing-gutter)),1100px);height:65px;min-height:65px;margin-inline:auto;display:flex;align-items:center}.home-header-brand-row{width:140px;height:65px;display:flex;align-items:center}.home-header-logo{display:block;width:140px}.home-header .brand-graphic--logo{display:block;width:140px;height:auto}`);
  const files=['index.html','ho-so.html','cham-diem.html','hoan-tat.html'];
  async function snapshot(file,step){
    const markup=await page.evaluate(({step,files})=>{
      const body=document.body.cloneNode(true),main=body.querySelector('main');
      main.outerHTML=`<section id="main" class="handoff-content ${main.className}">${main.innerHTML}</section>`;
      const originalHeader=document.querySelector('#main').shadowRoot.querySelector('header');
      body.querySelector('div#main').replaceWith(originalHeader.cloneNode(true));
      body.classList.add('home');body.querySelector('#toastBox')?.remove();
      for(const button of body.querySelectorAll('.editor-mobile-tabs button')){
        const scoring=button.textContent==='Phiếu chấm',label=document.createElement('label');
        label.innerHTML=`<input type="radio" class="editor-accessible-label" name="handoff-panel" value="${scoring?'scoring':'dossier'}" ${scoring?'checked':''}>${button.textContent}`;
        button.replaceWith(label);
      }
      const navTargets={'goToStep(1)':files[0],'goToStep(2)':files[1],'goToStep(3)':files[2],'goToStep(4)':files[3],'proceedFromStep1()':files[1],'proceedFromStep2()':files[2]};
      for(const e of [...body.querySelectorAll('*')]){
        const action=e.getAttribute('onclick')||'';
        const href=navTargets[action]||(/^openProfileForScoring\(/.test(action)?files[2]:null);
        if(e.tagName==='SCRIPT'||e.tagName==='TEMPLATE'){e.remove();continue;}
        for(const attr of [...e.attributes])if(/^on/i.test(attr.name))e.removeAttribute(attr.name);
        if(href){const a=document.createElement('a');a.className=e.className;a.innerHTML=e.innerHTML;a.href=href;a.style.cssText=e.style.cssText;e.replaceWith(a);}
        else if(action&&e.tagName==='BUTTON'){
          // No pretend save/submit behavior in a pure HTML/CSS integration template.
          e.setAttribute('data-integration-action',action);e.title='Gắn xử lý của hệ thống khi tích hợp';
        }
      }
      const note=document.createElement('nav');note.className='handoff-preview-nav';note.setAttribute('aria-label','Các mẫu giao diện bàn giao');
      note.innerHTML='<strong>Mẫu giao diện tĩnh</strong> · '+files.map((f,i)=>`<a href="${f}" ${i+1===step?'aria-current="page"':''}>${['Hạng mục','Hồ sơ','Phiếu chấm','Ví dụ hoàn tất'][i]}</a>`).join(' · ');
      body.append(note);
      return body.outerHTML;
    },{step,files});
    const embedded=markup.replace(/src="(assets\/[^\"]+)"/g,(_,asset)=>`src="data:image/svg+xml;base64,${fs.readFileSync(path.join(root,asset)).toString('base64')}"`);
    write(file,`<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>Travel Awards 2026 — ${['Hạng mục','Hồ sơ','Phiếu chấm','Ví dụ hoàn tất'][step-1]}</title>\n${['layout','header','font','icons','handoff'].map(n=>`<link rel="stylesheet" href="css/${n}.css">`).join('\n')}\n</head>\n${embedded}\n</html>`);
  }
  await page.evaluate(()=>selectCategory('tru-cot-3'));
  await snapshot(files[0],1);
  await page.evaluate(()=>{selectCategory('tru-cot-3');proceedFromStep1();});
  await snapshot(files[1],2);
  await page.evaluate(()=>{proceedFromStep2();const {criterion}=editorCurrent();selectCriterionScore(criterion.code,5);});
  await snapshot(files[2],3);
  await page.evaluate(()=>{const {category,record}=editorCurrent();category.criteria.forEach((c,i)=>{record.scores[c.code]=[4,5,4,3][i];if(record.scores[c.code]===5)record.notes[c.code]='Ví dụ giải trình minh họa cho template; không phải đánh giá hoặc minh chứng đã xác minh.';});record.status='completed';appState.currentStep=4;renderAll();});
  await snapshot(files[3],4);
  write('css/handoff.css',`.handoff-preview-nav{position:relative;margin:20px auto;padding:12px 16px;max-width:1100px;font-size:12px;color:#475569;line-height:2}.handoff-preview-nav a{color:#00719c;text-decoration:underline}.handoff-preview-nav [aria-current=page]{font-weight:700}.editor-criterion-controls a{display:inline-flex;align-items:center}.editor-evaluation .handoff-preview-nav{margin-bottom:80px}.editor-mobile-tabs label{text-align:center;cursor:pointer}.editor-mobile-tabs label:has(:checked){color:#00719c;background:#e8f5f3;font-weight:600}.editor-mobile-tabs label:focus-within{outline:2px solid #00719c;outline-offset:-2px}\n@media(max-width:1023px){body:has([name=handoff-panel][value=dossier]:checked) .judge-columns .judge-dossier{display:block}body:has([name=handoff-panel][value=dossier]:checked) .judge-columns .judge-scoring{display:none}}`);
  console.log('Exported 4 populated HTML templates + 5 plain CSS files to hand-off/.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
