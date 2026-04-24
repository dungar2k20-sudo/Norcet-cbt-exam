// ============================================
// TELEGRAM WEB APP INITIALIZATION
// ============================================
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();
// ============================================
// MINI-APP ENFORCEMENT (ANTI-BROWSER)
// ============================================
function enforceMiniApp() {
    // Check if we are inside the Telegram environment
    if (!tg.initData || tg.initData === "") {
        document.body.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#0a0d14; color:white; text-align:center; padding:20px; font-family:sans-serif;">
                <h1 style="font-size:50px;">🔐</h1>
                <h2>Access Restricted</h2>
                <p style="color:#94a3b8; line-height:1.6;">This CBT platform is only accessible via the <b>Official Telegram Mini App</b> for security and leaderboard tracking.</p>
                <br>
                <button onclick="window.location.href='https://t.me/norcettestseriesBot'" 
                    style="background:#0088cc; color:white; border:none; padding:15px 30px; border-radius:10px; font-weight:bold; cursor:pointer;">
                    Open in Telegram
                </button>
            </div>
        `;
        return false;
    }
    return true;
}

// Run the check immediately
if (enforceMiniApp()) {
    console.log("Verified: Running inside Telegram.");
}
// ============================================
// DATABASE CONNECTION (GOOGLE SHEETS)
// ============================================
const DATABASE_URL = "https://script.google.com/macros/s/AKfycbzFi966bwfgEy8Chw77Rqd_AiqcPY6i9dsS7ywkgO8UFFjQzKTveKzou1yDwvkXzCsR0A/exec";

/**
 * Checks if the user has access to a specific nursing vault.
 * Triggered by the "OMEGA Vault" button.
 */
async function checkVaultAccess(vaultName) {
    const user = tg.initDataUnsafe.user;

    // Second layer of protection: If no user object, stop immediately
    if (!user || !user.id) {
        tg.showAlert("Unauthorized: Please launch this app from the bot.");
        return;
    }

    tg.MainButton.setText("Verifying OMEGA Access...").show();
    const userId = user.id;

    try {
        const response = await fetch(`${DATABASE_URL}?id=${userId}&vault=${vaultName}`);
        const result = await response.json();

        tg.MainButton.hide();

        if (result.allowed === true) {
            showTestList(); 
        } else {
            showLockedPopup();
        }
    } catch (error) {
        tg.MainButton.hide();
        tg.showAlert("Connection Error. Please check your network.");
    }
}
function showLockedPopup() {
    tg.showPopup({
        title: "OMEGA Vault Locked 🔐",
        message: "Your subscription has expired or hasn't been activated. Contact our Sales Bot with your User ID to get access.",
        buttons: [
            {id: 'buy', type: 'default', text: 'Open Sales Bot'},
            {id: 'cancel', type: 'destructive', text: 'Close'}
        ]
    }, (buttonId) => {
        // ... inside showLockedPopup button logic
if (buttonId === 'buy') {
    // This forces Telegram to handle the link internally
    tg.openTelegramLink('https://t.me/norcettestseriesBot');
}
    });
}

// ============================================
// SECURITY CHECK (Commented for Local Testing)
// ============================================
if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
    console.warn("Unauthorized access detected - Bypassed for local testing");
}

// ============================================
// GLOBAL VARIABLES & APP LOGIC
// ============================================
let QUESTIONS = [];
let TOTAL_Q = 0;
let TOTAL_TIME = 0;
let idx=0, uName='', ans=[], mrk=[], done=false;
let tmr=null, tLeft=TOTAL_TIME, tabN=0, qTimes=[], palOpen=false;

// ... [Rest of your code for startTest, loadQ, etc. continues here]

// Rest of your code continues...

// ============================================
// INITIALIZE QUESTIONS ARRAY & VAULT SYSTEM
// ============================================



/**
 * Boot the vault system on page load
 */
async function initVaultSystem() {
  console.log('🚀 Initializing vault system...');
  
  // Scan for available vaults
  await scanVaultFolder('./OMEGA/');
  
  // Show vault selector in login screen
 const selectorContainer = document.getElementById('vaultList');
if (selectorContainer) {
  selectorContainer.innerHTML = buildVaultSelector();
}
  
  // Load the current vault (from localStorage or first available)
  if (availableVaults.length > 0) {
    const vaultToLoad = currentVault || availableVaults.id;
    await loadVault(vaultToLoad);
  } else {
    console.warn('⚠️ No vaults found!');
    document.getElementById('loginMeta').innerHTML = 
      '<span style="color:var(--red)">⚠️ No question vaults found in ./OMEGA/ folder</span>';
    document.getElementById('startBtn').disabled = true;
  }
}

// Auto-initialize when DOM is ready

// Get current vault from localStorage or default to OMEGA
// Find the vault




let swipe={sx:0, sy:0, active:false};
let clipboardPermissionGranted = false;

// ============================================
// SCREEN NAVIGATION
// ============================================

function showTestList() {
  console.log('📂 Showing test list...');
  document.getElementById('mainMenu').style.display = 'none';
  document.getElementById('testList').style.display = 'flex';
}

function backToMenu() {
  console.log('🏠 Going back to main menu...');
  document.getElementById('mainMenu').style.display = 'flex';
  document.getElementById('testList').style.display = 'none';
  document.getElementById('login').style.display = 'none';
  document.getElementById('test').style.display = 'none';
  document.getElementById('result').style.display = 'none';
  document.getElementById('review').style.display = 'none';
  document.getElementById('bottomNav').classList.remove('visible');
  document.getElementById('rightPanel').classList.remove('visible');
}

async function selectVaultAndLogin(vaultId) {
  console.log('📂 Selected vault:', vaultId);
  const vault = availableVaults.find(v => v.id === vaultId);
  
  if (!vault) {
    console.error('❌ Vault not found');
    return;
  }
  
  console.log('📥 Loading vault:', vault.name);
  currentVault = vaultId;
  
  // Load the vault
  const success = await loadVault(vaultId);
  
  if (success) {
    console.log('✅ Vault loaded, showing login screen');
    
    // ✅ NEW: Auto-detect subject from questions
    const detectedSubject = detectSubject();
    CONFIG.SUBJECT = detectedSubject;
    
    // Hide all screens
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('testList').style.display = 'none';
    document.getElementById('test').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    document.getElementById('review').style.display = 'none';
    
    // Show login screen
    document.getElementById('login').style.display = 'flex';
    
    // Update vault name
    document.getElementById('selectedVaultName').textContent = vault.name;
    document.getElementById('loginSubject').textContent = CONFIG.SUBJECT; // ✅ Shows detected subject
    document.getElementById('loginTitle').textContent = CONFIG.BRAND;
    
    // Update meta
    updateLoginMeta();
    
    console.log('✅ Login screen ready');
  } else {
    console.error('❌ Failed to load vault');
    showToast('❌ Failed to load vault', 'error', 2000);
  }
}
function bootApp(){
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('mainMenu').style.display='flex';
  
  // Connect the Result Screen Telegram button
  const tgUrl = `https://t.me/${CONFIG.TG_CHANNEL}`;
  document.getElementById('resultTgBtn').onclick = () => tg.openTelegramLink(tgUrl);
}

function updateLoginMeta(){
  if(!TOTAL_Q){
    document.getElementById('loginMeta').innerHTML =
      '<span style="color:var(--red)">⚠️ No questions found</span>';
    document.getElementById('startBtn').disabled = true;
  } else {
    // Questions loaded, enable button
    document.getElementById('startBtn').disabled = false;
    
    const sata = QUESTIONS.filter(q=>q.sata).length;
    document.getElementById('loginMeta').innerHTML =
      `<span>${TOTAL_Q} Questions</span> <span>${Math.floor(TOTAL_TIME/60)} Minutes</span> <span>−${CONFIG.MARKING} Marking</span><br>`+
      (sata ? `<span style="color:var(--yellow)">⚡ ${sata} SATA Questions</span> ` : '');
    
    // ✅ Update subject name on login page
    document.getElementById('loginSubject').textContent = CONFIG.SUBJECT;
  }
}

function saveS(){
  try{ localStorage.setItem(CONFIG.SK, JSON.stringify({uName,ans,mrk,tLeft,idx,tabN,qTimes})); }catch(e){}
}
function loadS(){
  try{
    const s=JSON.parse(localStorage.getItem(CONFIG.SK)||'null');
    if(!s||!s.uName) return false;
    uName=s.uName; ans=s.ans; mrk=s.mrk||Array(TOTAL_Q).fill(false);
    tLeft=s.tLeft||TOTAL_TIME; idx=s.idx||0; tabN=s.tabN||0;
    qTimes=s.qTimes||Array(TOTAL_Q).fill(0);
    return true;
  }catch(e){ return false; }
}
function clearS(){ try{ localStorage.removeItem(CONFIG.SK); }catch(e){} }
function initA(){ ans=QUESTIONS.map(()=>null); mrk=Array(TOTAL_Q).fill(false); qTimes=Array(TOTAL_Q).fill(0); }

function getTopic(i){
  return QUESTIONS[i].topic ||
    CONFIG.TOPICS[Math.min(Math.floor(i/(Math.ceil(TOTAL_Q/CONFIG.TOPICS.length))), CONFIG.TOPICS.length-1)] ||
    'General';
}

function startTest(){
  if(!TOTAL_Q){ 
    showToast('❌ No questions loaded. Select a vault first.', 'error', 2000);
    return; 
  }
  uName = document.getElementById('usernameInput').value.trim();
  if(!uName){ 
    showToast('⚠️ Please enter your name', 'info', 1500);
    return; 
  }
  initClipboardAccess();
  initA();
  goFS();
  showTestUI();
  saveS();
}

function showTestUI(){
  document.body.classList.add('test-active');
  done = false;
  document.getElementById('login').style.display   = 'none';
  document.getElementById('test').style.display    = 'block';
  document.getElementById('result').style.display  = 'none';
  document.getElementById('review').style.display  = 'none';
  document.getElementById('bottomNav').classList.add('visible');
  document.getElementById('rightPanel').classList.add('visible');
  setupClipboardListener();
  buildPalette();
  loadQ();
  startTimer();
  setupSwipe();
  updateTabUI();
}

function goFS(){
  const el=document.documentElement;
  (el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen||
   el.msRequestFullscreen||function(){}).call(el).catch(()=>{});
}

function startTimer(){
  if(tmr) clearInterval(tmr);
  renderTimer();
  tmr = setInterval(()=>{
    if(tLeft<=0){ submitTest(); return; }
    tLeft--;
    if(qTimes[idx]!==undefined) qTimes[idx]++;
    renderTimer();
    if(tLeft%10===0) saveS();
  },1000);
}
function renderTimer(){
  const m=Math.floor(tLeft/60), s=tLeft%60;
  const el=document.getElementById('timerDisp');
  el.textContent = m+':'+(s<10?'0'+s:s);
  el.className   = tLeft<=300 ? 'timer-warn' : '';
  const pct=tLeft/TOTAL_TIME*100;
  const col=tLeft>TOTAL_TIME*0.5?'#22c55e':tLeft>TOTAL_TIME*0.2?'#f59e0b':'#ef4444';
  document.getElementById('timerBar').style.cssText =
    `width:${pct}%;background:${col};height:3px;transition:width 0.9s linear,background 0.5s;`;
  document.getElementById('progressFill').style.width = ((idx+1)/TOTAL_Q*100)+'%';
}

function loadQ(){
  const q   = QUESTIONS[idx];
  const sec = Math.floor(idx/(Math.ceil(TOTAL_Q/4)))+1;
  const atmpt = ans.filter(x=>x!==null).length;
  document.getElementById('qmetaLeft').textContent  = `Q${idx+1}/${TOTAL_Q}  |  Sec ${sec}`;
  document.getElementById('qmetaRight').textContent = `Ans: ${atmpt} | Skip: ${TOTAL_Q-atmpt}`;

  const sataBadge = document.getElementById('sataBadge');
  sataBadge.className = q.sata ? 'visible' : '';

  const imgBox = document.getElementById('imgBox');
  if(q.image){ document.getElementById('qimg').src=q.image; imgBox.className='visible'; }
  else { imgBox.className=''; }

  const qtEl = document.getElementById('qtext');
  qtEl.textContent = q.q;
  qtEl.scrollTop   = 0;

  const a = ans[idx];
  let html = '';
  q.options.forEach((o,i)=>{
    let sel='';
    if(q.sata){ if(Array.isArray(a)&&a.includes(i)) sel=' selected'; }
    else       { if(a===i) sel=' selected'; }
    html += `<div class="opt${sel}" onclick="pickOpt(${i})">
      <span class="opt-label">${String.fromCharCode(65+i)}.</span>
      <span class="opt-text">${escHtml(o)}</span>
    </div>`;
  });
  document.getElementById('options').innerHTML = html;
  document.getElementById('markBtn').style.background = mrk[idx] ? 'var(--yellow-dim)' : '';
  document.getElementById('reportBtn').textContent  = '🚩 Report an error in this question';
  document.getElementById('reportBtn').style.color  = '';
  updatePalette();
}

function escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function pickOpt(i){
  const q=QUESTIONS[idx];
  if(q.sata){
    if(!Array.isArray(ans[idx])) ans[idx]=[];
    const p=ans[idx].indexOf(i);
    if(p>=0) ans[idx].splice(p,1); else ans[idx].push(i);
    if(ans[idx].length===0) ans[idx]=null;
  } else {
    ans[idx]=i;
  }
  saveS(); loadQ();
}

function next(){ if(idx<TOTAL_Q-1){ idx++; loadQ(); closePalette(); } }
function prev(){ if(idx>0)        { idx--; loadQ(); closePalette(); } }
function jump(i){ idx=i; loadQ(); closePalette(); }
function markQ(){
  mrk[idx]=!mrk[idx];
  document.getElementById('markBtn').style.background = mrk[idx] ? 'var(--yellow-dim)' : '';
  updatePalette(); saveS();
}

function setupSwipe(){
  document.addEventListener('touchstart',e=>{
    if(palOpen) return;
    const tag=e.target.tagName;
    if(tag==='BUTTON'||tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA') return;
    swipe.sx=e.touches[0].clientX;
    swipe.sy=e.touches[0].clientY;
    swipe.active=true;
  },{passive:true});

  document.addEventListener('touchmove',e=>{
    if(!swipe.active) return;
    const dx=e.touches[0].clientX-swipe.sx;
    const dy=e.touches[0].clientY-swipe.sy;
    if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10) swipe.active=false;
  },{passive:true});

  document.addEventListener('touchend',e=>{
    if(!swipe.active) return;
    swipe.active=false;
    if(done||document.getElementById('test').style.display==='none') return;
    if(palOpen) return;
    const dx=e.changedTouches[0].clientX-swipe.sx;
    const dy=e.changedTouches[0].clientY-swipe.sy;
    if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>50){ dx<0?next():prev(); }
  },{passive:true});
}

function buildPalette(){
  let h='';
  for(let i=0;i<TOTAL_Q;i++)
    h+=`<button class="pal-btn" onclick="jump(${i})">${i+1}</button>`;
  document.getElementById('palGrid').innerHTML=h;
}
function updatePalette(){
  document.querySelectorAll('.pal-btn').forEach((b,i)=>{
    b.style.cssText='';
    if(ans[i]!==null&&ans[i]!==undefined){ b.style.background='var(--green-dim)'; b.style.color='var(--green)'; }
    if(mrk[i]){ b.style.background='var(--yellow-bg)'; b.style.color='var(--yellow)'; }
    if(i===idx){ b.style.background='var(--accent)'; b.style.color='#fff'; b.style.fontWeight='800'; b.style.outline='2px solid var(--accent2)'; }
  });
}
function togglePalette(){
  palOpen=!palOpen;
  document.getElementById('paletteBox').classList.toggle('open',palOpen);
  if(palOpen) setTimeout(()=>{
    const btns=document.querySelectorAll('.pal-btn');
    if(btns[idx]) btns[idx].scrollIntoView({block:'center',behavior:'smooth'});
  },320);
}
function closePalette(){
  palOpen=false;
  document.getElementById('paletteBox').classList.remove('open');
}

function calcScore(){
  let c=0, w=0, sk=0;
  QUESTIONS.forEach((q,i)=>{
    const a=ans[i];
    if(a===null||a===undefined){ sk++; return; }
    const cs=q.answer.slice().sort().join(',');
    const gs=q.sata?(Array.isArray(a)?[...a].sort():[]).join(','):[a].join(',');
    if(gs===cs) c++; else w++;
  });
  return{c, w, sk, score: Math.max(0, c - w*CONFIG.MARKING).toFixed(2)};
}
function calcTopics(){
  const map={};
  QUESTIONS.forEach((q,i)=>{
    const t=getTopic(i);
    if(!map[t]) map[t]={c:0,w:0,sk:0};
    const a=ans[i];
    if(a===null||a===undefined){ map[t].sk++; return; }
    const cs=q.answer.slice().sort().join(',');
    const gs=q.sata?(Array.isArray(a)?[...a].sort():[]).join(','):[a].join(',');
    if(gs===cs) map[t].c++; else map[t].w++;
  });
  return map;
}

function confirmSubmit(){
  const{sk}=calcScore();
  if(sk>0&&!confirm(`You have ${sk} unanswered question(s).\nSubmit anyway?`)) return;
  submitTest();
}
function submitTest(){
  if(done) return; done=true;
  clearInterval(tmr);
  const{c,w,sk,score}=calcScore();
  const acc     = c+w>0 ? (c/(c+w)*100).toFixed(1) : '0.0';
  const overall = (c/TOTAL_Q*100).toFixed(1);
  const used    = TOTAL_TIME-tLeft;
  const timeStr = `${Math.floor(used/60)}m ${used%60}s`;
  const pct     = parseFloat(score)/TOTAL_Q*100;
  const grade   = pct>=80?'A — Excellent':pct>=65?'B — Good':pct>=50?'C — Pass':'D — Needs Work';
  const gcol    = pct>=80?'var(--green)':pct>=65?'var(--accent2)':pct>=50?'var(--yellow)':'var(--red)';

  ['bottomNav','rightPanel'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.classList.remove('visible');
  });
  document.body.classList.remove('test-active');
  document.getElementById('test').style.display   = 'none';
  document.getElementById('result').style.display = 'block';

  document.getElementById('r-subject').textContent = CONFIG.SUBJECT;
  document.getElementById('r-name').textContent    = uName;
  document.getElementById('r-score').textContent   = score;
  document.getElementById('r-total').textContent   = `out of ${TOTAL_Q}  (−${CONFIG.MARKING} marking)`;
  document.getElementById('r-acc').textContent     = acc+'%';
  document.getElementById('r-analysis').innerHTML  =
    `<div class="stat"><span>✅ Correct</span><span style="color:var(--green)">${c}</span></div>
     <div class="stat"><span>❌ Wrong <small>(−${(w*CONFIG.MARKING).toFixed(2)})</small></span><span style="color:var(--red)">${w}</span></div>
     <div class="stat"><span>⬜ Skipped</span><span style="color:var(--text-dim)">${sk}</span></div>
     <div class="stat"><span>🎯 Accuracy (attempted)</span><span style="color:var(--green);font-weight:700">${acc}%</span></div>
     <div class="stat"><span>📈 Overall %</span><span style="color:var(--accent2)">${overall}%</span></div>
     <div class="stat"><span>🏆 Grade</span><span style="color:${gcol};font-weight:700">${grade}</span></div>
     <div class="stat"><span>⏱ Time Used</span><span style="color:var(--text-dim)">${timeStr}</span></div>
     <div class="stat"><span>⚠️ Tab Switches</span><span style="color:var(--yellow)">${tabN}</span></div>`;

  const tm=calcTopics();
  const entries=Object.entries(tm).filter(([,v])=>v.c+v.w>0).sort(([,a],[,b])=>(a.c/(a.c+a.w))-(b.c/(b.c+b.w)));
  let th=`<div style="font-weight:700;color:var(--accent2);margin-bottom:12px;font-size:13px;">📊 Topic-wise Accuracy <span style="font-size:10px;color:var(--text-faint)">(weakest first)</span></div>`;
  if(!entries.length) th+='<p style="color:var(--text-dim);font-size:12px;">No questions attempted</p>';
  entries.forEach(([t,v])=>{
    const tot=v.c+v.w, pct2=Math.round(v.c/tot*100);
    const col=pct2>=70?'var(--green)':pct2>=50?'var(--yellow)':'var(--red)';
    th+=`<div class="topic-row">
      <span class="topic-name">${escHtml(t)}</span>
      <div class="topic-bar-wrap"><div class="topic-bar" style="width:${pct2}%;background:${col};"></div></div>
      <span class="topic-pct">${v.c}/${tot} <span style="color:${col}">${pct2}%</span></span>
    </div>`;
  });
  document.getElementById('r-topics').innerHTML=th;
  showGradeBadge(pct);
  window.scrollTo(0,0);
  clearS();
}

function shareTestTG(tName){
  const text = `🔥 Try the ${tName} test on NORCET CBT!`;
  const tgUrl = `https://t.me/share/url?url=https://t.me/${CONFIG.TG_CHANNEL}&text=${encodeURIComponent(text)}`;
  tg.openTelegramLink(tgUrl);
}
function shareTG(){
  const {c,w,sk,score} = calcScore();
  const msg = `📊 NORCET Result\n✅ ${c} ❌ ${w} ⏭ ${sk}\n🏆 Score: ${score.toFixed(2)}`;
  
  // Tries to copy to clipboard first
  if(navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).catch(()=>console.log("Copy failed"));
  }
  // Opens the Telegram Channel
  tg.openTelegramLink(`https://t.me/${CONFIG.TG_CHANNEL}`);
}

function reviewMode(){
  document.body.classList.remove('test-active');
  document.getElementById('result').style.display = 'none';
  document.getElementById('review').style.display = 'block';
  let h='';
  QUESTIONS.forEach((q,i)=>{
    const a=ans[i];
    const cs=new Set(q.answer);
    const gs=new Set();
    if(a!==null&&a!==undefined){ q.sata&&Array.isArray(a)?a.forEach(x=>gs.add(x)):gs.add(a); }
    const ok=([...cs].every(x=>gs.has(x))&&gs.size===cs.size);
    const skipped=(a===null||a===undefined);
    const status=skipped?'⬜ Skipped':ok?'✅ Correct':'❌ Wrong';
    const scol=skipped?'var(--text-dim)':ok?'var(--green)':'var(--red)';
    const t=qTimes[i]||0, tStr=t>0?`${Math.floor(t/60)}m ${t%60}s`:'--';
    const badge=q.sata?'<span class="sata-badge">SATA</span>':'';
    const cardStatus=skipped?"skip":ok?"correct":"wrong";

    h+=`<div class="rev-card" data-status="${cardStatus}">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:11px;color:var(--text-faint);">Q${i+1} · ${escHtml(getTopic(i))}</span>
        <span style="font-size:11px;color:${scol};font-weight:700;">${status}</span>
      </div>
      <div class="rev-qt">${escHtml(q.q)}${badge}</div>`;

    q.options.forEach((o,j)=>{
      let cl='rv-n';
      if(cs.has(j)) cl='rv-c';
      if(gs.has(j)&&!cs.has(j)) cl='rv-w';
      const mk=cs.has(j)?'✓ ':gs.has(j)?'✗ ':'  ';
      h+=`<div class="rev-opt ${cl}">${mk}${String.fromCharCode(65+j)}. ${escHtml(String(o))}</div>`;
    });

    h+=`<div class="rev-exp">💡 ${q.explanation}</div>`;
    if(q.blueprint) h+=`<div class="rev-meta">📋 ${escHtml(q.blueprint)}</div>`;
    h+=`<button class="btn btn-ai" style="max-width:100%;padding:10px;font-size:13px;font-weight:700;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:7px;" onclick="discussOnTG(${i})">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.28 13.6l-2.95-.924c-.641-.2-.657-.641.136-.951l11.57-4.461c.537-.194 1.006.131.858.957z"/></svg>
        📤 SHARE QUESTION TO TELEGRAM
    </button>`;
    h+=`<div class="rev-meta">⏱ Time on this question: ${tStr}</div></div>`;
  });

  const{c,w,sk,score}=calcScore();
  const acc=c+w>0?(c/(c+w)*100).toFixed(1):'0.0';
  h+=`<div style="margin:12px 0;padding:16px;border:2px solid var(--green-dim);border-radius:12px;background:var(--surface);">
    <h3 style="color:var(--green);margin-bottom:12px;">📋 Final Summary</h3>
    <div class="stat"><span>🎯 Score</span><span style="color:var(--accent2);font-size:1.3em;font-weight:800;">${score}/${TOTAL_Q}</span></div>
    <div class="stat"><span>✅ Correct</span><span>${c}</span></div>
    <div class="stat"><span>❌ Wrong</span><span>${w}</span></div>
    <div class="stat"><span>⬜ Skipped</span><span>${sk}</span></div>
    <div class="stat"><span>🔥 Accuracy</span><span style="color:var(--green);font-weight:700">${acc}%</span></div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">
      <button class="btn btn-green" style="max-width:100%" onclick="shareTG()">📢 Share Scorecard</button>
      <button class="btn btn-gray"  style="max-width:100%" onclick="resetTest()">🔄 Restart</button>
    </div>
  </div>`;

  const{c:tc,w:tw,sk:tsk}=calcScore();
  const tray=`<div class="rev-filter-tray" id="revFilterTray">
    <button class="rev-filter-btn active-all" id="rfAll"     onclick="setRevFilter('all')"    >📋 All<br><span style="font-size:13px;font-weight:900">${TOTAL_Q}</span></button>
    <button class="rev-filter-btn"            id="rfCorrect" onclick="setRevFilter('correct')" >✅ Correct<br><span style="font-size:13px;font-weight:900;color:var(--green)">${tc}</span></button>
    <button class="rev-filter-btn"            id="rfWrong"   onclick="setRevFilter('wrong')"   >❌ Wrong<br><span style="font-size:13px;font-weight:900;color:var(--red)">${tw}</span></button>
    <button class="rev-filter-btn"            id="rfSkip"    onclick="setRevFilter('skip')"    >⬜ Skip<br><span style="font-size:13px;font-weight:900;color:var(--text-dim)">${tsk}</span></button>
  </div>`;
  document.getElementById('reviewContent').innerHTML = tray+h;
  window.scrollTo(0,0);
}

function setRevFilter(type){
  document.querySelectorAll('.rev-card').forEach(c=>{
    c.style.display = (type==='all'||c.dataset.status===type) ? '' : 'none';
  });
  const map={all:'active-all',correct:'active-correct',wrong:'active-wrong',skip:'active-skip'};
  ['rfAll','rfCorrect','rfWrong','rfSkip'].forEach(id=>{
    const btn=document.getElementById(id); if(!btn) return; btn.className='rev-filter-btn';
  });
  const activeId={all:'rfAll',correct:'rfCorrect',wrong:'rfWrong',skip:'rfSkip'}[type];
  const ab=document.getElementById(activeId);
  if(ab) ab.classList.add(map[type]);
  const first=[...document.querySelectorAll('.rev-card')].find(c=>c.style.display!=='none');
  if(first) first.scrollIntoView({behavior:'smooth',block:'start'});
}

function openReport(){
  document.getElementById('reportQNum').textContent = idx+1;
  document.getElementById('reportModal').classList.add('show');
}
function closeReport(){ document.getElementById('reportModal').classList.remove('show'); }
function submitReport(reason){
  closeReport();
  const btn=document.getElementById('reportBtn');
  btn.textContent='✓ Reported — Thank you!';
  btn.style.color='var(--green)';
  setTimeout(()=>{ btn.textContent='🚩 Report an error in this question'; btn.style.color=''; },2800);
}

function setupTabMonitor(){
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&!done){ tabN++; saveS(); updateTabUI(); }
  });
}
function updateTabUI(){
  if(tabN>0){
    document.getElementById('tabCount').textContent=tabN;
    document.getElementById('tabBadge').classList.add('visible');
  }
}

function resetTest(){ clearS(); location.reload(); }

function showManualCopyModal(text) {
  const modal = document.createElement('div');
  modal.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;";
  modal.innerHTML = `
      <div style="background:var(--surface);padding:20px;border-radius:12px;width:100%;max-width:320px;">
          <h3 style="margin:0 0 10px 0;font-size:16px;">Copy Doubt Text</h3>
          <textarea readonly style="width:100%;height:100px;background:var(--bg);color:var(--text);border:1px solid var(--border);padding:10px;border-radius:8px;margin-bottom:15px;font-size:12px;">${text}</textarea>
          <button onclick="tg.openTelegramLink('https://t.me/${CONFIG.TG_DOUBTS}')" class="btn btn-tg" style="max-width:100%;padding:11px;font-size:13px;margin-bottom:10px;">✈️ Open Telegram Group</button>
          <button onclick="this.parentElement.parentElement.remove()" class="btn btn-gray" style="max-width:100%;padding:11px;font-size:13px;">Close</button>
      </div>
  `;
  document.body.appendChild(modal);
}

async function discussOnTG(){
  const q = QUESTIONS[idx];
  const text = `🤔 Doubt in Q: ${q.q}\n\nA) ${q.opts[0]}\nB) ${q.opts[1]}\nC) ${q.opts[2]}\nD) ${q.opts[3]}`;
  
  if(navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
          tg.openTelegramLink(`https://t.me/${CONFIG.TG_DOUBTS}`);
      }).catch(() => {
          showManualCopyModal(text);
      });
  } else {
      showManualCopyModal(text);
  }
}

async function initClipboardAccess(){
  try{
    if(!navigator.clipboard){ clipboardPermissionGranted=false; return false; }
    if(navigator.permissions&&navigator.permissions.query){
      const result=await navigator.permissions.query({name:'clipboard-write'});
      if(result.state==='granted'){ clipboardPermissionGranted=true; return true; }
      if(result.state==='denied') { clipboardPermissionGranted=false; return false; }
      if(result.state==='prompt') { showClipboardPermissionModal(); return true; }
    }
    return true;
  }catch(error){ return true; }
}
function setupClipboardListener(){
  try{
    if(navigator.permissions&&navigator.permissions.query){
      navigator.permissions.query({name:'clipboard-write'}).then(result=>{
        result.addEventListener('change',()=>{
          clipboardPermissionGranted=(result.state==='granted');
        });
      });
    }
  }catch(error){}
}
function showClipboardPermissionModal(){
  const modal=document.createElement('div');
  modal.id='permissionModal';
  modal.style.cssText=`position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:25000;padding:16px;animation:fadeIn 0.3s ease;`;
  modal.innerHTML=`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px;width:100%;max-width:380px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:slideUp 0.3s ease;">
      <div style="font-size:48px;margin-bottom:12px;">📋</div>
      <h2 style="color:var(--accent2);margin-bottom:12px;font-size:18px;font-weight:800;">Enable Clipboard Access?</h2>
      <p style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:20px;">Allow clipboard access to easily copy and share questions to your doubt group on Telegram.</p>
      <div style="background:var(--bg);border-left:4px solid var(--green);padding:12px;border-radius:6px;margin-bottom:20px;font-size:12px;color:var(--text-dim);text-align:left;">
        <div style="margin-bottom:6px;">✓ Copy questions with one click</div>
        <div style="margin-bottom:6px;">✓ Paste directly in Telegram</div>
        <div>✓ Ask doubts faster</div>
      </div>
      <div style="display:flex;gap:10px;flex-direction:column;">
        <button onclick="allowClipboard()" class="btn btn-green" style="max-width:100%;padding:12px;font-size:14px;">✓ Allow Access</button>
        <button onclick="skipClipboard()"  class="btn btn-gray"  style="max-width:100%;padding:12px;font-size:14px;">Skip for Now</button>
      </div>
      <p style="font-size:10px;color:var(--text-faint);margin-top:12px;">You can enable this anytime in browser settings</p>
    </div>`;
  document.body.appendChild(modal);
}
async function allowClipboard(){
  try{
    await navigator.clipboard.writeText('test');
    clipboardPermissionGranted=true;
    closePermissionModal();
    showToast('✅ Clipboard access enabled!','success',2000);
  }catch(err){
    clipboardPermissionGranted=false;
    closePermissionModal();
    showToast('⚠️ Clipboard permission denied. You can still copy manually.','error',3000);
  }
}
function skipClipboard(){ closePermissionModal(); showToast('⚠️ You can still copy questions manually','info',2000); }
function closePermissionModal(){
  const modal=document.getElementById('permissionModal');
  if(modal){ modal.style.animation='slideDown 0.3s ease'; setTimeout(()=>modal.remove(),300); }
}


let fontSize = 15;
function changeFont(delta){
  fontSize = Math.min(19, Math.max(13, fontSize + delta));
  document.documentElement.style.fontSize = fontSize + 'px';
  document.getElementById('fontLabel').textContent = fontSize + 'px';
  try{ localStorage.setItem('norcet_fs', fontSize); }catch(e){}
}

function toggleTheme(){
  const isLight = document.body.classList.toggle('light-mode');
  // Update ALL theme toggles
  document.getElementById('themeToggle').textContent = isLight ? '☀️' : '🌙';
  document.getElementById('themeToggle2').textContent = isLight ? '☀️' : '🌙';
  document.getElementById('themeToggle3').textContent = isLight ? '☀️' : '🌙';
  try{ localStorage.setItem('norcet_theme', isLight ? 'light' : 'dark'); }catch(e){}
}

function initPrefs(){
  try{
    const fs = parseInt(localStorage.getItem('norcet_fs'));
    if(fs >= 13 && fs <= 19){ fontSize = fs; document.documentElement.style.fontSize = fs + 'px'; document.getElementById('fontLabel').textContent = fs + 'px'; }
    const th = localStorage.getItem('norcet_theme');
    if(th === 'light'){ document.body.classList.add('light-mode'); document.getElementById('themeToggle').textContent = '☀️'; }
  }catch(e){}
}

function showGradeBadge(pct){
  const badge = document.getElementById('gradeBadge');
  let label, bg, color;
  if(pct >= 80){
    label = '🏆 EXCELLENT'; bg = 'linear-gradient(135deg,#14532d,#22c55e)'; color = '#fff';
    launchConfetti();
  } else if(pct >= 65){
    label = '👍 GOOD'; bg = 'linear-gradient(135deg,#1e3a8a,#3b82f6)'; color = '#fff';
  } else if(pct >= 50){
    label = '✅ PASS'; bg = 'linear-gradient(135deg,#78350f,#f59e0b)'; color = '#fff';
  } else {
    label = '📚 NEEDS WORK'; bg = 'linear-gradient(135deg,#7f1d1d,#ef4444)'; color = '#fff';
  }
  badge.textContent = label;
  badge.style.background = bg;
  badge.style.color = color;
  badge.classList.add('visible');
}

function launchConfetti(){
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const pieces = [];
  const colors = ['#22c55e','#3b82f6','#f59e0b','#ec4899','#a855f7','#06b6d4'];
  for(let i = 0; i < 120; i++){
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random()*colors.length)],
      speed: Math.random() * 3 + 2,
      angle: Math.random() * 360,
      spin: Math.random() * 6 - 3,
      drift: Math.random() * 2 - 1
    });
  }
  let frame = 0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      ctx.save();
      ctx.translate(p.x + p.w/2, p.y + p.h/2);
      ctx.rotate(p.angle * Math.PI/180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame/180);
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
      p.y += p.speed;
      p.x += p.drift;
      p.angle += p.spin;
    });
    frame++;
    if(frame < 200) requestAnimationFrame(draw);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  draw();
}

function showToast(message, type='success', duration=3000){
  const container=document.getElementById('notifications');
  const toast=document.createElement('div');
  toast.className=`toast ${type}`;
  let icon='✓';
  if(type==='error') icon='✕';
  if(type==='info')  icon='ℹ';
  toast.innerHTML=`<span class="icon">${icon}</span><span class="message">${message}</span><button class="close-btn" onclick="this.parentElement.remove()">×</button>`;
  container.appendChild(toast);
  setTimeout(()=>{ toast.classList.add('hide'); setTimeout(()=>toast.remove(),300); }, duration);
}