/* Virtual PC user-space shell. Not an NT kernel or actual Windows installation. */
const root=document.createElement('div'); root.id='os-root';
const $=(selector,scope=document)=>scope.querySelector(selector);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(name)=>({explorer:'📁',notepad:'📝',settings:'⚙️',about:'💻',recycle:'🗑️',browser:'🌐'}[name]||'📄');
const logonKey='win11-vpc.user.v1';
const defaultFS=[{id:'folder-docs',name:'Documents',type:'folder',parent:'root'},{id:'folder-pictures',name:'Pictures',type:'folder',parent:'root'},{id:'welcome',name:'Welcome.txt',type:'text',parent:'folder-docs',content:'Welcome to Virtual Windows 11!\n\nThis is a browser-based desktop shell.\nVirtual files are stored locally with IndexedDB.\n\nIt is not Microsoft Windows and cannot execute .exe applications.'}];
let db=null,memFS=new Map(),settings={},z=20,windows=new Map(),startOpen=false,currentFolder='root',booting=false;
const store={
 async open(){if(!('indexedDB' in window)){this.memory=true;defaultFS.forEach(v=>memFS.set(v.id,v));return;}
  try{db=await new Promise((resolve,reject)=>{const req=indexedDB.open('windows11-vpc-disk',1);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains('files'))d.createObjectStore('files',{keyPath:'id'});if(!d.objectStoreNames.contains('prefs'))d.createObjectStore('prefs',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    const files=await this.all();if(files.length===0)for(const f of defaultFS)await this.put(f);
  }catch(e){console.warn('IndexedDB failed; session-only fallback',e);db=null;this.memory=true;defaultFS.forEach(v=>memFS.set(v.id,v));}
 },
 async all(){if(!db)return Array.from(memFS.values());return new Promise((res,rej)=>{const r=db.transaction('files','readonly').objectStore('files').getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});},
 async put(v){if(!db){memFS.set(v.id,v);return;}return new Promise((res,rej)=>{const r=db.transaction('files','readwrite').objectStore('files').put(v);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});},
 async remove(id){if(!db){memFS.delete(id);return;}return new Promise((res,rej)=>{const r=db.transaction('files','readwrite').objectStore('files').delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
};
function logo(){return `<span class="win-logo" aria-label="Windows-style logo"><i></i><i></i><i></i><i></i></span>`}
async function loadManifest(){
 try{const response=await fetch('boot-manifest.json',{cache:'no-store'});if(!response.ok)throw Error(`Manifest HTTP ${response.status}`);const manifest=await response.json();if(!manifest.kernel||!manifest.bootDevice)throw Error('Invalid OS boot manifest');return manifest;}
 catch(e){if(location.protocol!=='file:')throw e;return {name:'Virtual Windows 11',version:'0.2.0',kernel:'shell.js',bootDevice:'UEFI: Virtual SSD'};}
}
function stage(message){const target=$('.boot-status',root);if(target)target.textContent=message;}
async function boot(){
 if(booting)return;booting=true;document.body.classList.add('os-active');document.body.append(root);
 root.innerHTML=`<section class="boot-stage" aria-label="OS starting"><div class="boot-logo">${logo()}</div><div class="dots" aria-label="Loading"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="boot-status" role="status">UEFI → Windows Boot Manager</div></section>`;
 try{
  stage('Boot Manager: reading virtual SSD manifest');const manifest=await loadManifest();
  stage('Loading '+manifest.name+' components');await Promise.resolve();
  stage('Mounting virtual filesystem');await store.open();
  stage('Loading user configuration');try{settings=JSON.parse(localStorage.getItem(logonKey)||'{}');}catch{settings={};}
  stage('Starting desktop shell');await renderDesktop();
 }catch(e){console.error(e);root.innerHTML=`<div class="boot-stage"><div class="boot-failed"><h2>Boot Manager</h2><p>Virtual OS could not start.</p><code>${escapeHTML(e.message)}</code><p><button id="retry-boot">Try again</button><button id="bios-boot">UEFI Setup</button></p></div></div>`;$('#retry-boot',root).onclick=()=>{booting=false;boot()};$('#bios-boot',root).onclick=()=>exitOS('virtualpc:setup');}
 finally{booting=false;}
}
function exitOS(event){root.remove();document.body.classList.remove('os-active');windows.clear();window.dispatchEvent(new Event(event));}
function persistSettings(){try{localStorage.setItem(logonKey,JSON.stringify(settings));}catch(e){toast('Settings cannot be saved in this browser.')}}
function toast(message){$('.os-toast',root)?.remove();const n=document.createElement('div');n.className='os-toast';n.textContent=message;root.append(n);setTimeout(()=>n.remove(),3200)}
function buildStart(){return `<section class="start-panel os-hidden" id="start-panel"><input class="start-search" type="search" placeholder="Search for apps" aria-label="Search apps"><div class="start-heading">Pinned</div><div class="start-grid">${['explorer','notepad','settings','browser','about','recycle'].map(n=>`<button class="start-app" data-open="${n}"><span class="app-icon">${icon(n)}</span>${{explorer:'File Explorer',notepad:'Notepad',settings:'Settings',browser:'Browser',about:'About',recycle:'Recycle Bin'}[n]}</button>`).join('')}</div><div class="start-bottom"><span>◉ &nbsp; Virtual User</span><button id="power-menu" title="Power" aria-label="Power">⏻</button></div></section>`}
async function renderDesktop(){root.innerHTML=`<main class="os-desktop"><div class="desktop-shortcuts"><button class="desktop-shortcut" data-open="explorer"><span class="app-icon">${icon('explorer')}</span>File Explorer</button><button class="desktop-shortcut" data-open="recycle"><span class="app-icon">${icon('recycle')}</span>Recycle Bin</button><button class="desktop-shortcut" data-open="notepad"><span class="app-icon">${icon('notepad')}</span>Notepad</button></div><div id="window-layer"></div>${buildStart()}<footer class="taskbar"><button id="start-button" aria-label="Start" title="Start">${logo()}</button><button data-open="explorer" title="File Explorer">${icon('explorer')}</button><button data-open="notepad" title="Notepad">${icon('notepad')}</button><button data-open="settings" title="Settings">${icon('settings')}</button><div class="tray"><button id="network" title="Network">◉ ▮</button><button id="clock-button" aria-label="Clock"><span class="tray-time" id="clock"></span></button></div></footer></main>`;
 const start=$('#start-panel',root);$('#start-button',root).onclick=()=>{startOpen=!startOpen;start.classList.toggle('os-hidden',!startOpen);$('#start-button',root).classList.toggle('active',startOpen)};
 root.addEventListener('click',async e=>{const b=e.target.closest('[data-open]');if(b){startOpen=false;start.classList.add('os-hidden');$('#start-button',root).classList.remove('active');openApp(b.dataset.open)}});
 $('.start-search',root).oninput=e=>{$$('.start-app',root).forEach(b=>{b.hidden=!b.textContent.toLowerCase().includes(e.target.value.toLowerCase())})};
 $('#power-menu',root).onclick=()=>{start.classList.add('os-hidden');if(confirm('Restart the virtual computer?'))exitOS('virtualpc:restart')};
 $('#network',root).onclick=()=>toast('Virtual network • Browser connection only');
 $('#clock-button',root).onclick=()=>toast(new Date().toLocaleString());
 function updateClock(){const d=new Date();const c=$('#clock',root);if(c)c.innerHTML=`<span>${d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</span><span>${d.toLocaleDateString()}</span>`;}updateClock();clearInterval(window.vpcClock);window.vpcClock=setInterval(updateClock,15000);
 if(settings.theme==='dark')root.classList.add('theme-dark');
}
function $$(s,el=document){return [...el.querySelectorAll(s)]}
function openApp(type,options={}){
 const id=options.id||type;if(windows.has(id)){const win=windows.get(id);win.classList.remove('os-hidden');win.style.zIndex=++z;return win;}
 const win=document.createElement('section');win.className='os-window';win.dataset.window=id;win.style.zIndex=++z;
 if(window.innerWidth>650){win.style.left=(17+(windows.size%5)*4)+'vw';win.style.top=(10+(windows.size%5)*5)+'vh';}
 win.innerHTML=`<header class="os-titlebar"><span class="app-icon">${icon(type)}</span><span class="os-title">${{explorer:'File Explorer',notepad:'Notepad',settings:'Settings',about:'About Virtual PC',recycle:'Recycle Bin',browser:'Browser'}[type]||'File'}</span><div class="win-controls"><button data-win="minimize" title="Minimize">─</button><button data-win="maximize" title="Maximize">□</button><button data-win="close" class="close" title="Close">✕</button></div></header><div class="os-content"></div>`;
 $('#window-layer',root).append(win);windows.set(id,win);
 win.addEventListener('pointerdown',()=>win.style.zIndex=++z);
 win.querySelectorAll('[data-win]').forEach(btn=>btn.onclick=()=>{const mode=btn.dataset.win;if(mode==='close'){win.remove();windows.delete(id);}if(mode==='minimize')win.classList.add('os-hidden');if(mode==='maximize')win.classList.toggle('maximized');});
 const bar=$('.os-titlebar',win);let drag=null;
 bar.addEventListener('pointerdown',e=>{if(e.target.closest('button')||win.classList.contains('maximized')||window.innerWidth<=650)return;drag={x:e.clientX,y:e.clientY,left:win.offsetLeft,top:win.offsetTop};bar.setPointerCapture(e.pointerId)});
 bar.addEventListener('pointermove',e=>{if(!drag)return;win.style.left=Math.max(0,Math.min(innerWidth-100,drag.left+e.clientX-drag.x))+'px';win.style.top=Math.max(0,Math.min(innerHeight-100,drag.top+e.clientY-drag.y))+'px';});
 bar.addEventListener('pointerup',()=>drag=null);bar.addEventListener('dblclick',e=>{if(!e.target.closest('button'))win.classList.toggle('maximized')});
 if(type==='explorer')showExplorer(win,options.folder||currentFolder);else if(type==='notepad')showNotepad(win,options.file);else if(type==='settings')showSettings(win);else if(type==='browser')showBrowser(win);else if(type==='about')showAbout(win);else if(type==='recycle')showRecycle(win);
 return win;
}
async function showExplorer(win,folder){currentFolder=folder;const list=await store.all();const folderItem=list.find(f=>f.id===folder);const path=folder==='root'?'This PC':folderItem?.name||'This PC';const content=$('.os-content',win);
 content.innerHTML=`<div class="explorer-toolbar"><button data-ex="up">↑</button><button data-ex="new">＋ New</button><span class="explorer-path">⌂ &nbsp; ${escapeHTML(path)}</span></div><div class="explorer-grid"></div>`;
 const grid=$('.explorer-grid',content);const children=list.filter(f=>f.parent===folder);grid.innerHTML=children.length?children.map(f=>`<button class="file-tile" data-id="${escapeHTML(f.id)}"><span class="app-icon">${f.type==='folder'?'📁':'📄'}</span>${escapeHTML(f.name)}</button>`).join(''):'<p style="color:#737d8b;padding:20px">This folder is empty.</p>';
 grid.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const f=list.find(v=>v.id===b.dataset.id);if(f.type==='folder')showExplorer(win,f.id);else openApp('notepad',{id:'notepad:'+f.id,file:f})});
 $('[data-ex="up"]',content).onclick=()=>{showExplorer(win,folderItem?.parent||'root')};
 $('[data-ex="new"]',content).onclick=async()=>{const name=prompt('New file name (add .txt for a text file):','New Text Document.txt');if(!name)return;const clean=name.trim().slice(0,90);if(!clean)return;if(list.some(f=>f.parent===folder&&f.name===clean)){toast('A file with that name already exists');return;}
 const file={id:crypto.randomUUID?.()||String(Date.now()),name:clean,type:clean.toLowerCase().endsWith('.txt')?'text':'folder',parent:folder,content:''};await store.put(file);showExplorer(win,folder);};
}
function showNotepad(win,file){const content=$('.os-content',win);const doc=file||{id:null,name:'Untitled.txt',content:''};$('.os-title',win).textContent=doc.name+' - Notepad';content.innerHTML=`<div class="note-bar"><span class="note-name"></span><button class="os-action" data-save>Save</button></div><textarea class="note-editor" spellcheck="false" aria-label="Text editor"></textarea>`;
 $('.note-name',content).textContent=doc.name;const area=$('textarea',content);area.value=doc.content||'';
 async function save(){let name=doc.name;if(!doc.id){name=prompt('Save as',name)?.trim();if(!name)return;}if(!name.toLowerCase().endsWith('.txt'))name+='.txt';const next={...doc,id:doc.id||crypto.randomUUID?.()||String(Date.now()),name,type:'text',parent:doc.parent||'folder-docs',content:area.value};await store.put(next);Object.assign(doc,next);$('.os-title',win).textContent=name+' - Notepad';$('.note-name',content).textContent=name;toast('Saved to virtual disk');}
 $('[data-save]',content).onclick=save;area.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save()}});
}
function showSettings(win){const content=$('.os-content',win);content.innerHTML=`<div class="settings-page"><h2>Settings</h2><p>System &gt; About</p><div class="settings-card"><strong>Virtual Windows 11</strong><div class="about-grid"><span>Edition</span><span>Browser desktop (prototype)</span><span>Version</span><span>0.2.0</span><span>Platform</span><span>UEFI simulator + JavaScript</span><span>Storage</span><span>IndexedDB (when available)</span></div></div><div class="settings-card"><strong>Personalization</strong><label>Desktop accent <select id="accent-select"><option value="blue">Blue</option><option value="purple">Purple</option></select></label></div><div class="settings-card"><strong>Firmware</strong><p>Re-enter UEFI to adjust virtual firmware settings.</p><button class="os-action" id="enter-bios">Restart into UEFI</button></div></div>`;
 $('#accent-select',content).value=settings.accent||'blue';$('#accent-select',content).onchange=e=>{settings.accent=e.target.value;persistSettings();$('.os-desktop',root).style.filter=e.target.value==='purple'?'hue-rotate(32deg)':''};
 $('#enter-bios',content).onclick=()=>{if(confirm('Return to UEFI Setup?'))exitOS('virtualpc:setup')};
}
function showBrowser(win){$('.os-content',win).innerHTML=`<div class="settings-page"><h2>Browser</h2><p>External websites cannot always be embedded in other webpages because of browser security restrictions.</p><form id="browser-form"><input type="url" required value="https://www.microsoft.com" style="width:80%;padding:10px;border:1px solid #cbd5df;border-radius:5px"> <button class="os-action">Open ↗</button></form></div>`;$('#browser-form',win).onsubmit=e=>{e.preventDefault();const url=$('input',e.currentTarget).value;window.open(url,'_blank','noopener,noreferrer')};}
function showAbout(win){$('.os-content',win).innerHTML=`<div class="settings-page"><h2>About this virtual PC</h2><p>This project reproduces a UEFI interface and an early Windows 11-style desktop in the browser.</p><p>The boot loader reads a manifest, mounts a virtual IndexedDB disk, loads preferences, and starts the web desktop. It does not boot Windows NT, run BIOS firmware, or execute Windows binaries.</p><p>Built for desktop and mobile browsers.</p></div>`;}
function showRecycle(win){$('.os-content',win).innerHTML='<div class="settings-page"><h2>Recycle Bin</h2><p>The recycle bin is empty. File deletion is not yet implemented.</p></div>';}
window.addEventListener('virtualpc:boot',boot);