/* Windows11 Lab — browser-only UEFI firmware setup simulator.
   Every device, reading, secure-boot key, and firmware action is simulated.
   No operating-system APIs, hardware drivers, real firmware, or disks are accessed. */
(() => {
  'use strict';
  const STORE_KEY = 'windows11-lab.uefi-nvram.v1';
  const TABS = ['Main', 'Advanced', 'Chipset', 'Security', 'Boot', 'Save & Exit'];
  const DEVICES = ['UEFI: Virtual SSD', 'UEFI: Virtual USB', 'UEFI: PXE IPv4'];
  const $ = id => document.getElementById(id);
  const el = (tag, css, content) => {
    const node = document.createElement(tag);
    if (css) node.className = css;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  const clone = x => JSON.parse(JSON.stringify(x));
  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  const DEFAULTS = Object.freeze({
    systemDate: `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,
    systemTime: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    fastBoot: false, quietBoot: true, bootTimeout: 3, bootNumLock: true,
    boot1: DEVICES[0], boot2: DEVICES[1], boot3: DEVICES[2],
    csm: false, secureBoot: true, secureBootMode: 'Standard', osType: 'Windows UEFI Mode',
    tpm: true, tpmType: 'Firmware TPM', tpmCounter: 0,
    virtualization: true, hyperThreading: true, turboBoost: true, activeCores: 'All',
    executeDisable: true, cpuPowerMode: 'Balanced', memoryProfile: 'Auto',
    sataController: true, sataMode: 'AHCI', nvmeController: true, smart: true,
    legacyUSB: true, xhci: true, usbBoot: true, massStorage: true,
    acpiState: 'S0 Modern Standby', restorePower: 'Power Off', wakeOnLAN: false, erp: false,
    networkStack: false, pxeIPv4: true, pxeIPv6: false,
    primaryDisplay: 'Auto', igpu: true, sharedMemory: '128 MB',
    above4G: true, resizeBAR: true, pcieASPM: 'Auto', pcieSpeed: 'Auto',
    wifi: true, bluetooth: true, audio: true, ethernet: true,
    fanProfile: 'Standard', cpuFanWarning: true, chassisIntrusion: false,
    secureKeyState: 'Factory keys installed',
    adminHash: '', userHash: ''
  });
  const ROWS = {};
  const inf = (label, value, help) => ({type:'info',label,value,help});
  const heading = label => ({type:'group',label});
  const action = (label, id, help, extra={}) => ({type:'action',label,id,help,...extra});
  const submenu = (label, id, help) => ({type:'sub',label,id,help});
  const setting = (label,id,opts,help,extra={}) => ({type:'setting',label,id,opts,help,...extra});
  const toggle = (label,id,help,extra={}) => setting(label,id,[false,true],help,extra);
  const view = (label,id,help) => ({type:'computed',label,id,help});
  const infoHelp = 'These hardware details are illustrative virtual-platform values, not information detected from your device.';
  ROWS.Main = [
    heading('BIOS Information'),
    inf('BIOS Vendor','Windows11 Lab Virtual Firmware',infoHelp),
    inf('BIOS Version','1.0.0 / UEFI 2.x simulation',infoHelp),
    inf('Build Date','2026-11-03',infoHelp),
    inf('Access Level','Administrator (simulated)',infoHelp),
    heading('System Information'),
    inf('Processor','Virtual x64 Processor',infoHelp),
    inf('CPU Frequency','3.20 GHz (simulated)',infoHelp),
    inf('Total Memory','8192 MB (simulated)',infoHelp),
    inf('Memory Speed','3200 MT/s (simulated)',infoHelp),
    inf('Platform','Windows11 Virtual Platform',infoHelp),
    heading('System Clock'),
    setting('System Date','systemDate',null,'Set the virtual firmware calendar. This does not change the device clock.',{input:'date'}),
    setting('System Time','systemTime',null,'Set the virtual firmware clock. This does not change the device clock.',{input:'time'}),
    heading('Firmware Environment'),
    inf('Boot Specification','UEFI (virtual)',infoHelp),
    inf('Physical Hardware Access','Not available','This browser application never reads or writes real motherboard firmware.')
  ];
  ROWS.Advanced = [
    heading('Advanced Configuration'),
    submenu('CPU Configuration','advanced.cpu','Processor execution, virtualization and simulated power settings.'),
    submenu('Memory Configuration','advanced.memory','Simulated memory profile information.'),
    submenu('Storage Configuration','advanced.storage','SATA, NVMe and SMART controller settings.'),
    submenu('USB Configuration','advanced.usb','USB legacy compatibility and boot support.'),
    submenu('ACPI / Power Management','advanced.power','Power restore, suspend states and wake settings.'),
    submenu('Trusted Computing','advanced.tpm','Virtual trusted platform module configuration.'),
    submenu('Network Stack Configuration','advanced.network','Network boot and PXE protocols.'),
    submenu('Hardware Monitor','advanced.monitor','Illustrative temperature, voltage and cooling controls.'),
  ];
  ROWS['advanced.cpu'] = [
    heading('CPU Features'),
    toggle('Intel VT-x / AMD-V','virtualization','Enable or disable virtual hardware virtualization extensions in the simulator.'),
    toggle('Hyper-Threading / SMT','hyperThreading','Controls simulated simultaneous multi-threading.'),
    toggle('Turbo Boost','turboBoost','Controls simulated boost behavior.'),
    setting('Active Processor Cores','activeCores',['All','1','2','4'],'Choose a simulated active core configuration.'),
    toggle('Execute Disable Bit / NX','executeDisable','Controls the simulated no-execute memory protection flag.'),
    setting('CPU Power Policy','cpuPowerMode',['Balanced','Performance','Power Saving'],'Simulated CPU energy/performance policy.'),
    inf('Current CPU','Virtual x64 Processor',infoHelp),
  ];
  ROWS['advanced.memory'] = [
    heading('Memory Information'),
    inf('Total Memory','8192 MB',infoHelp),
    inf('Channel Configuration','Dual Channel (simulated)',infoHelp),
    inf('DIMM_A1','4096 MB — Virtual DDR4',infoHelp),
    inf('DIMM_B1','4096 MB — Virtual DDR4',infoHelp),
    setting('Memory Profile','memoryProfile',['Auto','Standard','Performance'],'Set a simulated memory timing policy.'),
  ];
  ROWS['advanced.storage'] = [
    heading('Storage Controllers'),
    toggle('SATA Controller','sataController','Whether the simulated SATA controller is enabled.'),
    setting('SATA Mode Selection','sataMode',['AHCI','RAID'],'Virtual controller operation mode.',{depends:'sataController'}),
    toggle('NVMe Controller','nvmeController','Whether the simulated NVMe interface is enabled.'),
    toggle('SMART Self Test','smart','Enable simulated drive health checks.'),
    heading('Detected Devices (Virtual)'),
    inf('SATA Port 0','Not Present','There is no real SATA device connected to this simulation.'),
    inf('NVMe Slot 0','Virtual SSD — No OS','The virtual SSD is an illustrative boot target and does not contain Windows.'),
  ];
  ROWS['advanced.usb'] = [
    heading('USB Controller Configuration'),
    toggle('Legacy USB Support','legacyUSB','Allow simulated USB keyboard support in pre-boot environments.'),
    toggle('XHCI Hand-off','xhci','Enable simulated USB 3.x controller hand-off.'),
    toggle('USB Boot Support','usbBoot','Allow the virtual USB device in boot priority lists.'),
    toggle('USB Mass Storage Driver Support','massStorage','Allow simulated pre-boot USB storage detection.'),
    heading('Detected USB Devices'),
    inf('USB Storage Devices','None connected (virtual)','No real device discovery is performed.'),
  ];
  ROWS['advanced.power'] = [
    heading('ACPI Configuration'),
    setting('ACPI Sleep State','acpiState',['S0 Modern Standby','S3 Suspend to RAM'],'Choose a simulated sleep model.'),
    setting('Restore on AC Power Loss','restorePower',['Power Off','Power On','Last State'],'Virtual behavior after a power failure.'),
    toggle('Wake on LAN','wakeOnLAN','Allow simulated network wake events.'),
    toggle('ErP Ready','erp','Simulated low-power standby mode.'),
  ];
  ROWS['advanced.tpm'] = [
    heading('Trusted Computing 2.0'),
    toggle('Security Device Support','tpm','Enable the virtual TPM 2.0 feature flag.'),
    setting('TPM Device Selection','tpmType',['Firmware TPM','Discrete TPM','None'],'Choose the simulated TPM source.',{depends:'tpm'}),
    view('TPM State','tpmState','Shows the virtual Trusted Platform Module status; there is no actual hardware TPM.'),
    view('TPM Clear Count','tpmCounter','How many times simulated TPM clear has been confirmed.'),
    action('Clear TPM (Simulation)','clear-tpm','Increment the virtual TPM clear counter. No real keys or hardware will be touched.'),
  ];
  ROWS['advanced.network'] = [
    heading('Pre-boot Network'),
    toggle('Network Stack','networkStack','Enable simulated UEFI network boot drivers.'),
    toggle('IPv4 PXE Support','pxeIPv4','Allow the virtual IPv4 PXE boot device.',{depends:'networkStack'}),
    toggle('IPv6 PXE Support','pxeIPv6','Allow the virtual IPv6 network boot feature.',{depends:'networkStack'}),
    inf('Physical NIC','Not accessed','The simulator never sends network boot packets.'),
  ];
  ROWS['advanced.monitor'] = [
    heading('Hardware Status (Simulated)'),
    inf('CPU Temperature','38°C (sample)','A fixed illustration, not an actual thermal sensor reading.'),
    inf('Motherboard Temperature','31°C (sample)','A fixed illustration, not an actual thermal sensor reading.'),
    inf('CPU Fan Speed','1250 RPM (sample)','A fixed illustration, not an actual fan speed reading.'),
    inf('CPU Core Voltage','1.085 V (sample)','A fixed illustration, not an actual voltage measurement.'),
    inf('+12V Rail','12.096 V (sample)','A fixed illustration, not an actual voltage measurement.'),
    heading('Fan Control'),
    setting('CPU Fan Profile','fanProfile',['Silent','Standard','Turbo','Full Speed'],'Select a stored virtual fan profile.'),
    toggle('CPU Fan Warning','cpuFanWarning','Set a simulated fan warning flag.'),
  ];
  ROWS.Chipset = [
    heading('Chipset Configuration'),
    submenu('Graphics Configuration','chipset.graphics','Simulated graphics display and shared video memory.'),
    submenu('PCI Express Configuration','chipset.pcie','Simulated PCIe enumeration and compatibility.'),
    submenu('Onboard Device Configuration','chipset.onboard','Simulated integrated peripheral enable switches.'),
    submenu('Platform Security','chipset.platform','Platform status and protection flags.'),
  ];
  ROWS['chipset.graphics'] = [
    heading('Integrated Graphics'),
    setting('Primary Display','primaryDisplay',['Auto','Integrated GPU','PCIe Graphics'],'Choose the virtual preferred graphics adapter.'),
    toggle('Integrated Graphics','igpu','Enable the simulated integrated GPU.'),
    setting('DVMT Pre-Allocated','sharedMemory',['64 MB','128 MB','256 MB','512 MB'],'Virtual graphics shared memory allocation.',{depends:'igpu'}),
    inf('External GPU','Not detected','No real PCI device probing is supported.'),
  ];
  ROWS['chipset.pcie'] = [
    heading('PCIe Configuration'),
    toggle('Above 4G Decoding','above4G','Simulated 64-bit PCIe resource allocation.'),
    toggle('Re-Size BAR Support','resizeBAR','Simulated resizable PCIe memory aperture.',{depends:'above4G'}),
    setting('PCIe ASPM','pcieASPM',['Disabled','Auto','L0s','L1'],'Simulated power-management policy for PCI Express links.'),
    setting('PCIe Link Speed','pcieSpeed',['Auto','Gen1','Gen2','Gen3','Gen4'],'Virtual PCI Express negotiated maximum speed.'),
  ];
  ROWS['chipset.onboard'] = [
    heading('Integrated Devices'),
    toggle('HD Audio Controller','audio','Enable simulated integrated high-definition audio.'),
    toggle('Wi-Fi Controller','wifi','Enable simulated wireless networking hardware.'),
    toggle('Bluetooth Controller','bluetooth','Enable simulated Bluetooth adapter.'),
    toggle('LAN Controller','ethernet','Enable simulated Ethernet adapter.'),
    toggle('Chassis Intrusion Detection','chassisIntrusion','Simulated chassis tamper notification setting.'),
  ];
  ROWS['chipset.platform'] = [
    heading('Platform'),
    inf('Platform Controller Hub','Virtual Chipset',infoHelp),
    inf('SPI Flash','Browser Local Storage (simulated)','There is no SPI flash device. Saved values are stored in this browser only.'),
    inf('UEFI Specification','2.x (UI simulation)','This project is not an actual UEFI implementation.'),
    inf('SMBIOS','Illustrative data only',infoHelp),
  ];
  ROWS.Security = [
    heading('Password Configuration'),
    view('Administrator Password','adminPasswordStatus','Password protects entry to this simulated setup on its next visit. Do not use a real-life password.'),
    view('User Password','userPasswordStatus','An illustrative user password saved only in the virtual configuration.'),
    action('Set / Change Administrator Password','admin-password','Set, change, or clear a demo-only administrator password.'),
    action('Set / Change User Password','user-password','Set, change, or clear a demo-only user password.'),
    heading('Secure Boot'),
    setting('OS Type','osType',['Windows UEFI Mode','Other OS'],'Windows 11 typically uses UEFI with Secure Boot capability.'),
    toggle('Secure Boot','secureBoot','Controls the simulated Secure Boot flag. It requires CSM to be disabled and Windows UEFI Mode.'),
    setting('Secure Boot Mode','secureBootMode',['Standard','Custom'],'In real hardware, Custom mode permits managing Secure Boot keys; this simulator does not modify any actual keys.',{depends:'secureBoot'}),
    view('Secure Boot State','secureBootState','Effective virtual Secure Boot state calculated from UEFI/CSM and OS type.'),
    inf('Platform Key (PK)','Installed (virtual)','Illustrative factory key flag only. No cryptographic keys are created or stored.'),
    inf('Key Exchange Key (KEK)','Installed (virtual)','Illustrative factory key flag only.'),
    action('Restore Factory Secure Boot Keys','restore-keys','Restore the virtual factory-key status. No actual certificates are modified.'),
  ];
  ROWS.Boot = [
    heading('Boot Configuration'),
    toggle('Fast Boot','fastBoot','Simulated pre-boot initialization optimization.'),
    toggle('Quiet Boot','quietBoot','Show a simulated OEM logo rather than verbose POST.'),
    setting('Setup Prompt Timeout','bootTimeout',[0,1,2,3,5,10],'Virtual delay before a simulated boot attempt.'),
    toggle('Bootup NumLock State','bootNumLock','Initial simulated numeric keypad state.'),
    toggle('Launch CSM','csm','Enable Compatibility Support Module simulation. Secure Boot cannot be enabled while CSM is active.'),
    view('Boot Mode','bootMode','Legacy/UEFI mode computed from CSM state.'),
    heading('Boot Option Priorities'),
    setting('Boot Option #1','boot1',DEVICES,'Choose first virtual boot target. Selecting an occupied position swaps the two devices.',{boot:true}),
    setting('Boot Option #2','boot2',DEVICES,'Choose second virtual boot target. Selecting an occupied position swaps the two devices.',{boot:true}),
    setting('Boot Option #3','boot3',DEVICES,'Choose third virtual boot target. Selecting an occupied position swaps the two devices.',{boot:true}),
    heading('Boot Override'),
    action('UEFI: Virtual SSD','boot-ssd','Attempt a one-time virtual SSD boot. No operating system has been created.'),
    action('UEFI: Virtual USB','boot-usb','Attempt a one-time virtual USB boot. No virtual boot media is currently attached.'),
    action('UEFI: PXE IPv4','boot-pxe','Attempt a simulated PXE network boot. No network packets will be sent.'),
  ];
  ROWS['Save & Exit'] = [
    heading('Exit System Setup'),
    action('Save Changes and Exit','save-exit','Commit changed settings to browser storage and restart the simulated machine.'),
    action('Discard Changes and Exit','discard-exit','Return to the virtual boot screen without saving pending changes.'),
    action('Save Changes and Reset','save-reset','Save all modified settings and show the simulated POST screen.'),
    action('Discard Changes and Reset','discard-reset','Discard unsaved changes and show the simulated POST screen.'),
    heading('Save Options'),
    action('Save Changes','save','Commit the virtual NVRAM settings without leaving setup.'),
    action('Discard Changes','discard','Revert pending changes to the last saved settings.'),
    action('Restore Optimized Defaults','defaults','Load virtual factory defaults into the editor. Save to keep the defaults.'),
    action('Save as User Defaults','save-user','Store the current values as user-defined defaults in this browser.'),
    action('Restore User Defaults','restore-user','Load saved user-defined defaults if available.'),
    heading('Boot Override'),
    action('UEFI: Virtual SSD','boot-ssd','One-time boot from virtual SSD (no Windows is installed).'),
    action('UEFI: Virtual USB','boot-usb','One-time boot from virtual USB (no device connected).'),
    action('UEFI: PXE IPv4','boot-pxe','One-time virtual PXE attempt with no real network activity.'),
  ];
  const initialStore = () => ({version:1,values:clone(DEFAULTS),userDefaults:null,updatedAt:null});
  const loadSaved = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (data && data.version === 1 && data.values && typeof data.values === 'object') {
        const sanitized = {...DEFAULTS};
        for (const [id, value] of Object.entries(data.values)) {
          if (!(id in sanitized)) continue;
          if (typeof sanitized[id] === typeof value) sanitized[id] = value;
        }
        // Missing, duplicated, or corrupt boot priorities fall back to safe defaults.
        if (new Set([sanitized.boot1,sanitized.boot2,sanitized.boot3]).size !== 3 || ![sanitized.boot1,sanitized.boot2,sanitized.boot3].every(x=>DEVICES.includes(x))) {
          sanitized.boot1=DEVICES[0];sanitized.boot2=DEVICES[1];sanitized.boot3=DEVICES[2];
        }
        return {version:1,values:sanitized,userDefaults:data.userDefaults && typeof data.userDefaults==='object' ? data.userDefaults:null,updatedAt:data.updatedAt||null};
      }
    } catch (_) { /* Storage denied: keep session-only values. */ }
    return initialStore();
  };
  let saved = loadSaved();
  let draft = clone(saved.values);
  let tab = 'Main';
  let crumbs = [];
  let selected = 0;
  let screen = 'setup';
  let modalOpen = false;
  let previousFocus = null;
  let lastMessage = 'Use ↑/↓ or touch to select. Enter to edit.';
  const page = () => crumbs.length ? crumbs[crumbs.length - 1] : tab;
  const isDirty = () => JSON.stringify(draft) !== JSON.stringify(saved.values);
  const activeRows = () => ROWS[page()].filter(r=>r.type!=='group');
  const fmt = value => typeof value==='boolean' ? (value ? 'Enabled':'Disabled') : String(value);
  const entryDisabled = row => Boolean(row.depends && !draft[row.depends]);
  const secureBootOn = () => draft.secureBoot && !draft.csm && draft.osType === 'Windows UEFI Mode';
  const computed = id => {
    if(id==='adminPasswordStatus') return draft.adminHash ? 'Installed' : 'Not Installed';
    if(id==='userPasswordStatus') return draft.userHash ? 'Installed' : 'Not Installed';
    if(id==='secureBootState') return secureBootOn() ? 'Active (virtual)' : 'Disabled';
    if(id==='tpmState') return draft.tpm && draft.tpmType !== 'None' ? 'TPM 2.0 Available (virtual)' : 'No Security Device';
    if(id==='bootMode') return draft.csm ? 'UEFI + CSM (virtual)' : 'UEFI Only';
    if(id==='tpmCounter') return draft.tpmCounter;
    return '';
  };
  function status(message) {lastMessage=message; $('status-message').textContent=message;}
  function render() {
    if(screen !== 'setup') return;
    $('firmware').classList.remove('is-splash');
    $('tabs').replaceChildren();
    TABS.forEach(name=>{
      const b=el('button','',name); b.type='button';
      if(name===tab) b.setAttribute('aria-current','page');
      b.addEventListener('click',()=>{ tab=name; crumbs=[]; selected=0; render(); });
      $('tabs').append(b);
    });
    $('breadcrumb').textContent=[tab,...crumbs.map(n=>n.split('.').pop().replace(/^./,s=>s.toUpperCase()))].join('  ›  ');
    $('modified-pill').hidden=!isDirty();
    const area=$('settings-list'); area.replaceChildren();
    const rows=ROWS[page()];
    if(!rows) throw new Error('Missing UEFI page: '+page());
    const all=rows.filter(r=>r.type!=='group');
    selected=Math.max(0,Math.min(selected,all.length-1));
    const height=area.getBoundingClientRect().height || 380;
    const capacity=Math.max(4,Math.floor((height-20)/(Math.min(41,Math.max(25,innerHeight*(innerWidth<=700?.047:.0385))))));
    const section=Math.floor(selected/capacity);
    const shown=all.slice(section*capacity,(section+1)*capacity);
    let index=section*capacity;
    for(const row of shown){
      const id=index++;
      const disabled=entryDisabled(row);
      const b=el('button',`setting-row ${row.type==='info'?'info':''} ${row.type==='action'?'action':''} ${disabled?'disabled':''} ${id===selected?'selected':''}`);
      b.type='button'; b.setAttribute('role','option'); b.setAttribute('aria-selected',String(id===selected));
      if(disabled) b.setAttribute('aria-disabled','true');
      b.dataset.index=String(id);
      const label=el('span','setting-label',row.label);
      const value=el('span','setting-value',row.type==='info'?row.value:(row.type==='setting'?fmt(draft[row.id]):(row.type==='computed'?fmt(computed(row.id)):'')));
      const chevron=el('span','setting-chevron',row.type==='sub'?'›':(row.type==='setting'?'▾':''));
      b.append(label,value,chevron);
      b.addEventListener('click',()=>{
        const prev=selected;selected=id;
        if(prev!==id){ updateSelection(); }
        activate(row);
      });
      area.append(b);
    }
    if(all.length>capacity){const hint=el('div','page-hint',`${section+1}/${Math.ceil(all.length/capacity)}  •  ↑ ↓`);area.append(hint);}
    updateSelection(false);
    status(lastMessage);
  }
  function updateSelection(scroll=true) {
    const items=[...$('settings-list').querySelectorAll('.setting-row')];
    items.forEach((item,i)=>{
      const isSelected=Number(item.dataset.index)===selected;
      item.classList.toggle('selected',isSelected);
      item.setAttribute('aria-selected',String(isSelected));
    });
    if(scroll){const active=items.find(item=>Number(item.dataset.index)===selected);active?.focus({preventScroll:true});}
    const current=activeRows()[selected];
    const content=$('context-content');
    content.textContent=(current && current.help) || 'Select a setting to see more information.';
    if(current?.depends && !draft[current.depends]) content.textContent+='\n\nEnable the parent setting to edit this option.';
  }
  function focusList(){ if(screen==='setup') $('settings-list').focus({preventScroll:true}); }
  function selectTab(offset){ const i=TABS.indexOf(tab);tab=TABS[(i+offset+TABS.length)%TABS.length];crumbs=[];selected=0;render(); }
  function move(offset){const count=activeRows().length;if(!count)return;selected=(selected+offset+count)%count;render();}
  function goBack(){if(crumbs.length){crumbs.pop();selected=0;render();}else confirmExit();}
  function activate(row){
    if(!row || entryDisabled(row)) {status('This option is currently unavailable.');return;}
    if(row.type==='sub'){crumbs.push(row.id);selected=0;render();return;}
    if(row.type==='setting'){editSetting(row);return;}
    if(row.type==='action'){perform(row.id);return;}
    status('Read-only virtual firmware information.');
  }
  function updateValue(row,value){
    if(row.id==='secureBoot' && value && (draft.csm || draft.osType!=='Windows UEFI Mode')){
      showMessage('Secure Boot requires Launch CSM = Disabled and OS Type = Windows UEFI Mode. Change those options first.');return;
    }
    if(row.id==='csm' && value && draft.secureBoot){
      draft.secureBoot=false;
      status('CSM enabled. Secure Boot automatically disabled.');
    }
    if(row.id==='osType' && value!=='Windows UEFI Mode' && draft.secureBoot){draft.secureBoot=false;}
    if(row.boot){const other=['boot1','boot2','boot3'].find(id=>id!==row.id&&draft[id]===value);if(other)draft[other]=draft[row.id];}
    draft[row.id]=value;
    render();
    const cur=activeRows().findIndex(r=>r.id===row.id);
    if(cur>=0){selected=cur;updateSelection();}
    status(`${row.label}: ${fmt(value)}${isDirty()?' · Not saved':''}`);
  }
  function cycleSetting(row,step){
    if(!row || row.type!=='setting' || entryDisabled(row)) return;
    if(row.input){editSetting(row);return;}
    const opts=row.opts;const at=opts.indexOf(draft[row.id]);const next=opts[(at+step+opts.length)%opts.length];updateValue(row,next);
  }
  function editSetting(row){
    if(row.input){
      showPrompt(row.label,`Change ${row.label.toLowerCase()} (virtual firmware only).`,draft[row.id],row.input,value=>{
        if(row.input==='date'&&!/^\d{4}-\d{2}-\d{2}$/.test(value))return 'Enter a valid date.';
        if(row.input==='time'&&!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value))return 'Enter time as HH:MM or HH:MM:SS.';
        updateValue(row,row.input==='time'&&value.length===5 ? value+':00':value);
      });return;
    }
    const elements=[];
    row.opts.forEach(value=>{
      elements.push({text:`${fmt(value)}${draft[row.id]===value?'  ✓':''}`,primary:draft[row.id]===value,action:()=>updateValue(row,value)});
    });
    showDialog(row.label,`${row.help||''}\n\nChoose a value:`,elements,{select:true});
  }
  function showDialog(title,body,buttons,options={}){
    previousFocus=document.activeElement;
    modalOpen=true;
    $('dialog-title').textContent=title;
    $('dialog-body').replaceChildren(el('div','',body));
    $('dialog-actions').replaceChildren();
    buttons.forEach(item=>{
      const b=el('button',item.primary?'primary':'',item.text);b.type='button';
      b.onclick=()=>{closeDialog();item.action?.();};
      $('dialog-actions').append(b);
    });
    if(!buttons.some(b=>b.cancel) && options.select) {
      const c=el('button','', 'Cancel');c.onclick=closeDialog;$('dialog-actions').append(c);
    }
    $('overlay').hidden=false;
    const first=$('dialog-actions').querySelector('button.primary') || $('dialog-actions').querySelector('button');
    first?.focus();
  }
  function showMessage(message){showDialog('UEFI Setup Utility',message,[{text:'OK',primary:true}]);}
  function confirm(title,message,onYes,yesLabel='Yes'){
    showDialog(title,message,[{text:'No',cancel:true},{text:yesLabel,primary:true,action:onYes}]);
  }
  function closeDialog(){
    $('overlay').hidden=true;modalOpen=false;
    if(previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
    else focusList();
  }
  function showPrompt(title,description,value,type,onSave){
    previousFocus=document.activeElement;
    modalOpen=true;
    $('dialog-title').textContent=title;
    const body=$('dialog-body');body.replaceChildren();
    const desc=el('div','',description);body.append(desc);
    const label=el('label','',title);
    const input=el('input');input.type=type==='time'?'time':type==='date'?'date':'text';
    input.value=value||''; if(type==='time')input.step='1';
    label.append(input);body.append(label);
    const err=el('span','dialog-error','');body.append(err);
    const actions=$('dialog-actions');actions.replaceChildren();
    const cancel=el('button','','Cancel');cancel.onclick=closeDialog;
    const save=el('button','primary','Apply');
    const apply=()=>{const text=input.value.trim();const result=onSave(text);if(typeof result==='string') {err.textContent=result;return;}closeDialog();};
    save.onclick=apply; input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();apply();}};
    actions.append(cancel,save); $('overlay').hidden=false;input.focus();
  }
  function saveChanges(){
    const next={...saved,values:clone(draft),updatedAt:new Date().toISOString()};
    try {localStorage.setItem(STORE_KEY,JSON.stringify(next));saved=next;status('Virtual NVRAM settings saved in this browser.');render();return true;}
    catch(e){showMessage('Browser storage is unavailable. Changes remain in memory for this session but could not be saved.');return false;}
  }
  function discard(){draft=clone(saved.values);selected=0;render();status('Unsaved changes discarded.');}
  function defaults(){
    confirm('Load Optimized Defaults','Restore optimized virtual factory defaults? Changes will remain unsaved until Save Changes / F10 is used.',()=>{
      const credentials={adminHash:draft.adminHash,userHash:draft.userHash};
      draft={...clone(DEFAULTS),...credentials};selected=0;render();status('Optimized defaults loaded. F10 to save.');
    },'Load Defaults');
  }
  function bootDevice(device){
    if(device===DEVICES[0]){
      screen='boot';
      $('firmware').classList.add('is-splash');
      window.dispatchEvent(new CustomEvent('virtualpc:boot', {detail:{device}}));
      return;
    }
    const label=device===DEVICES[1]?'No USB boot media detected':'PXE-E53: No boot filename received';
    screen='boot';$('firmware').classList.add('is-splash');
    $('firmware-body').innerHTML='<div class="screen-splash"><div class="splash-symbol">Boot Failure</div><h1 id="boot-error-title"></h1><div class="splash-actions"><button data-screen-action="setup">Enter Setup</button><button data-screen-action="splash">Restart</button></div></div>';
    $('boot-error-title').textContent=label;
    bindScreenButtons();
  }
  function bootAttempt(choice){
    // A boot override does not change saved boot priorities.
    const target=choice||[draft.boot1,draft.boot2,draft.boot3].find(d=>d===DEVICES[0]||(d===DEVICES[1]&&draft.usbBoot)||(d===DEVICES[2]&&draft.networkStack))||draft.boot1;
    bootDevice(target);
  }
  function enterSetup(){
    if(saved.values.adminHash){
      requestUnlock(()=>{screen='setup';buildFirmwareShell();render();});
      return;
    }
    screen='setup';buildFirmwareShell();render();
  }
  function buildFirmwareShell(){
    // Restore the original firmware body markup after splash/boot screens.
    const body=$('firmware-body');body.className='firmware-body';body.replaceChildren();
    const col=el('div','settings-column');
    const loc=el('div','location-line');
    const path=el('span');path.id='breadcrumb';
    const pill=el('span','modified-pill','● UNSAVED');pill.id='modified-pill';pill.hidden=true;
    loc.append(path,pill);
    const list=el('div','settings-list');list.id='settings-list';list.setAttribute('role','listbox');list.setAttribute('aria-label','BIOS setup items');list.tabIndex=0;
    col.append(loc,list);
    const aside=el('aside','context-panel');aside.id='context-panel';aside.setAttribute('aria-live','polite');
    const help=el('div','help-heading','Item Specific Help');
    const ctxt=el('div','context-content');ctxt.id='context-content';
    const legend=el('div','key-legend');
    for(const [key,value] of [['← →','Select Screen'],['↑ ↓','Select Item'],['Enter','Select / Edit'],['+ / −','Change Option'],['F1','General Help'],['F9','Optimized Defaults'],['F10','Save & Exit'],['Esc','Go Back / Exit']]){
      const r=el('div');r.append(el('b','',key),document.createTextNode(' '+value));legend.append(r);
    }
    aside.append(help,ctxt,legend);body.append(col,aside);
    $('firmware').classList.remove('is-splash');
  }
  function showSplash(){
    screen='splash';$('firmware').classList.add('is-splash');
    const body=$('firmware-body');body.replaceChildren($('splash-template').content.cloneNode(true));
    const actions=body.querySelector('.splash-actions');
    const reset=el('button','','Reset Virtual NVRAM');reset.dataset.screenAction='reset-nvram';actions.append(reset);
    bindScreenButtons();
    setTimeout(()=>{if(screen==='splash'&&!modalOpen)bootAttempt();},saved.values.fastBoot?1400:3800);
  }
  function bindScreenButtons(){
    $('firmware-body').querySelectorAll('[data-screen-action]').forEach(b=>b.addEventListener('click',()=>screenAction(b.dataset.screenAction)));
  }
  function screenAction(actionId){
    if(actionId==='setup'){enterSetup();return;}
    if(actionId==='boot'){bootAttempt();return;}
    if(actionId==='splash'){showSplash();return;}
    if(actionId==='reset-nvram'){
      confirm('Reset Virtual NVRAM','Delete ALL simulated BIOS settings, user defaults and demo password hashes in this browser? Real firmware is never changed.',()=>{
        saved=initialStore();draft=clone(saved.values);
        try{localStorage.removeItem(STORE_KEY);}catch(_){}
        tab='Main';crumbs=[];selected=0;showSplash();
      },'Reset Simulator');
    }
  }
  async function hashPassword(password){
    if(!globalThis.crypto?.subtle) throw new Error('Secure hashing needs HTTPS/localhost or a secure browser context.');
    const bytes=new TextEncoder().encode('uefi-demo-v1\0'+password);
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function passwordDialog(kind,unlock=false,success=null){
    const isAdmin=kind==='admin'; const key=isAdmin?'adminHash':'userHash';
    const hasCurrent=Boolean(unlock?saved.values[key]:draft[key]);
    const name=isAdmin?'Administrator':'User';
    previousFocus=document.activeElement;modalOpen=true;
    $('dialog-title').textContent=unlock?'Unlock UEFI Setup':`${name} Password (Demo Only)`;
    const body=$('dialog-body');body.replaceChildren();
    const intro=el('div','',unlock?'Enter your simulated administrator password.':'Demo only. Never enter a password you use on a real account. This does not protect your actual computer.');body.append(intro);
    const inputs=[];
    const mk=(text,required=true)=>{
      const label=el('label','',text);const input=el('input');input.type='password';input.autocomplete='off';input.maxLength=80;input.required=required;label.append(input);body.append(label);inputs.push(input);return input;
    };
    const current=hasCurrent?mk('Current password'):null;
    const next=unlock?null:mk('New password (leave blank to clear)',false);
    const again=unlock?null:mk('Confirm new password',false);
    const err=el('div','dialog-error','');body.append(err);
    const actions=$('dialog-actions');actions.replaceChildren();
    const cancel=el('button','','Cancel');cancel.onclick=closeDialog;
    const ok=el('button','primary',unlock?'Unlock':'Apply');
    ok.onclick=async()=>{
      ok.disabled=true;err.textContent='';
      try{
        if(current){const good=await hashPassword(current.value);if(good!==(unlock?saved.values[key]:draft[key])){err.textContent='Incorrect demo password.';return;}}
        if(unlock){closeDialog();success?.();return;}
        if(next.value!==again.value){err.textContent='The two password entries do not match.';return;}
        if(next.value.length>0&&next.value.length<4){err.textContent='Use at least 4 characters for the demo password.';return;}
        draft[key]=next.value ? await hashPassword(next.value):'';
        closeDialog();render();status(`${name} demo password ${next.value?'set':'cleared'} — F10 to save.`);
      }catch(e){err.textContent=e.message||'Unable to hash demo password.';}
      finally{ok.disabled=false;}
    };
    inputs.forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ok.click();}}));
    actions.append(cancel,ok);$('overlay').hidden=false;inputs[0]?.focus();
  }
  function requestUnlock(onSuccess){passwordDialog('admin',true,onSuccess);}
  function confirmExit(){
    if(isDirty())confirm('Unsaved Configuration','Save changes before exiting UEFI Setup?',()=>{if(saveChanges())showSplash();},'Save & Exit');
    else showSplash();
  }
  function perform(id){
    const confirmAct=(title,msg,fn)=>confirm(title,msg,fn,'Continue');
    switch(id){
      case 'save-exit':case 'save-reset': if(saveChanges())bootAttempt();break;
      case 'discard-exit':case 'discard-reset': discard();showSplash();break;
      case 'save':saveChanges();break;
      case 'discard':confirmAct('Discard Changes','Discard every unsaved virtual firmware setting?',discard);break;
      case 'defaults':defaults();break;
      case 'save-user': {
        const values=clone(draft);
        confirmAct('Save User Defaults','Store current simulated BIOS values as user defaults?',()=>{
          try{localStorage.setItem(STORE_KEY,JSON.stringify({...saved,userDefaults:values}));saved.userDefaults=values;status('User defaults saved in this browser.');}
          catch(_){showMessage('Could not persist user defaults in this browser.');}
        });break;
      }
      case 'restore-user':{
        if(!saved.userDefaults){showMessage('No user defaults have been saved. Use Save as User Defaults first.');break;}
        confirmAct('Restore User Defaults','Load your user defaults into the editor? They will not be committed until Save / F10.',()=>{
          draft={...clone(DEFAULTS),...saved.userDefaults};render();status('User defaults loaded. F10 to save.');
        });break;
      }
      case 'boot-ssd':bootAttempt(DEVICES[0]);break;
      case 'boot-usb':bootAttempt(DEVICES[1]);break;
      case 'boot-pxe':bootAttempt(DEVICES[2]);break;
      case 'clear-tpm':confirmAct('Clear TPM (Simulation)','Increment the virtual TPM-clear counter? This does NOT erase any actual hardware TPM, encryption key, or Windows data.',()=>{draft.tpmCounter+=1;render();status('Simulated TPM clear recorded — F10 to save.');});break;
      case 'restore-keys':confirmAct('Restore Secure Boot Factory Keys','Reset simulated Secure Boot key status only? No real firmware keys are modified.',()=>{draft.secureKeyState='Factory keys installed';render();status('Virtual Secure Boot factory-key status restored.');});break;
      case 'admin-password':passwordDialog('admin');break;
      case 'user-password':passwordDialog('user');break;
    }
  }
  function generalHelp(){
    showDialog('General Help — UEFI Setup',
      'This is a browser-only firmware setup simulator. No Windows installation, motherboard flash, firmware keys, disks, or real sensors are accessed.\n\nArrow Left/Right: change top tab\nArrow Up/Down: move through entries\nEnter: choose, open submenu or edit\n+ / -: change current option\nEsc: return from submenu or exit\nF1: this help\nF9: load factory defaults (not saved until confirmed)\nF10: save and restart simulator\n\nSmartphone: tap tabs and options or use the touch-key controls.\n\nPasswords are a demo feature, not real security. You can reset all virtual NVRAM on the POST screen.',
      [{text:'Close',primary:true}]);
  }
  function handleKey(key){
    if(modalOpen){
      if(key==='Escape')closeDialog();
      else if(key==='Enter' && document.activeElement?.tagName!=='INPUT')$('dialog-actions').querySelector('.primary')?.click();
      return;
    }
    if(screen!=='setup'){
      if(['F2','Delete'].includes(key)){enterSetup();return;}
      if(key==='Enter'&&screen==='splash'){enterSetup();return;}
      if(key==='Escape'&&screen==='boot')showSplash();
      return;
    }
    if(key==='F1'){generalHelp();return;}
    if(key==='F9'){defaults();return;}
    if(key==='F10'){if(saveChanges())bootAttempt();return;}
    if(key==='Escape'){goBack();return;}
    if(key==='ArrowLeft'){selectTab(-1);return;}
    if(key==='ArrowRight'){selectTab(1);return;}
    if(key==='ArrowUp'){move(-1);return;}
    if(key==='ArrowDown'){move(1);return;}
    if(key==='Enter'){activate(activeRows()[selected]);return;}
    if(key==='+'||key==='='||key==='Add')cycleSetting(activeRows()[selected],1);
    if(key==='-'||key==='Subtract')cycleSetting(activeRows()[selected],-1);
  }
  window.addEventListener('virtualpc:setup',()=>{document.getElementById('os-root')?.remove();document.body.classList.remove('os-active');enterSetup();});
  window.addEventListener('virtualpc:restart',()=>{document.getElementById('os-root')?.remove();document.body.classList.remove('os-active');showSplash();});
  document.addEventListener('keydown',e=>{
    if(e.key==='Tab')return;
    const keys=['F1','F2','F9','F10','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Delete','+','=','-','Add','Subtract'];
    if(!keys.includes(e.key))return;
    if(modalOpen && document.activeElement?.tagName==='INPUT' && e.key!=='Escape')return;
    if(!modalOpen && ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
    e.preventDefault();handleKey(e.key);
  });
  document.querySelectorAll('[data-key]').forEach(b=>b.addEventListener('click',()=>handleKey(b.dataset.key)));
  $('btn-power').addEventListener('click',()=>{if(isDirty()&&screen==='setup')confirm('Restart Simulator','Discard pending changes and return to virtual POST?',()=>{draft=clone(saved.values);showSplash();},'Restart');else showSplash();});
  $('btn-help').addEventListener('click',generalHelp);
  $('btn-fullscreen').addEventListener('click',async()=>{
    try {if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else showMessage('Fullscreen is unavailable in this browser.');}
    catch(_){showMessage('Fullscreen mode was blocked by the browser.');}
  });
  document.addEventListener('fullscreenchange',()=>{$('btn-fullscreen').textContent=document.fullscreenElement?'⛶ Exit Fullscreen':'⛶ Fullscreen';});
  $('overlay').addEventListener('mousedown',e=>{if(e.target===$('overlay'))closeDialog();});
  showSplash();
})();