/* ===== KẾT NỐI SUPABASE =====
   Điền 2 giá trị lấy ở Supabase → Project Settings → API.
   Project URL và Publishable key (hoặc anon key) được phép để công khai.
   TUYỆT ĐỐI KHÔNG dán secret key / service_role key vào đây. */
const SUPABASE_URL='https://odyiqvstagtynvbdcxvn.supabase.co';
const SUPABASE_KEY='sb_publishable_JNXaQa2vdN12IwLCYuraDg_TgOVtpWB';
const EMAIL_SUFFIX='@mathnova.vn'; // phải trùng đuôi email khi tạo user trong Supabase
const sb=(window.supabase&&SUPABASE_URL.startsWith('https://')&&!SUPABASE_URL.includes('YOUR-PROJECT'))
  ?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null;
// Thêm tài liệu mới: {t:'Tên', type:'PDF', topic:'Chủ đề', file:'assets/ten-file.pdf', img:'assets/anh-bia.png'}
// (không có img thì tự dùng ảnh bìa mặc định)
const DOCS = [
  {t:'Tài liệu tổng ôn Toán 5: Lý thuyết & Bài tập (Bài 1–11)', type:'PDF', grade:5, topic:'Tổng ôn · Số thập phân', file:'assets/Lý-thuyết-tổng-ôn-toan-5.pdf'},
  {t:'Rational Numbers – Lý thuyết & Ví dụ mẫu (song ngữ Anh–Việt)', type:'PDF', grade:7, topic:'Số hữu tỉ · Rational Numbers', file:'assets/toan-7/Ly-thuyet-toan-7-so-huu-ti.pdf'}
];
const $ = id => document.getElementById(id);
let user = null, uid = null;

/* ---- Âm thanh: tự tổng hợp bằng Web Audio, không cần file ---- */
const SFX=(()=>{let ac=null;
  const muted=()=>{try{return localStorage.getItem('mute')==='1'}catch(_){return false}};
  const ctx=()=>{try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac}catch(_){return null}};
  const tone=(f,d,s=0,ty='sine',v=.1,f2)=>{const a=ctx();if(!a)return;const t=a.currentTime+s,o=a.createOscillator(),g=a.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.05)};
  const noise=(d,f1,f2,v)=>{const a=ctx();if(!a)return;const n=Math.floor(a.sampleRate*d),b=a.createBuffer(1,n,a.sampleRate),c=b.getChannelData(0);for(let i=0;i<n;i++)c[i]=Math.random()*2-1;const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain(),t=a.currentTime;s.buffer=b;f.type='bandpass';f.Q.value=.8;f.frequency.setValueAtTime(f1,t);f.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+d*.45);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(a.destination);s.start(t)};
  const P={
    tap:()=>tone(540,.07,0,'triangle',.08),
    tab:()=>{tone(440,.08,0,'triangle',.09);tone(660,.1,.06,'triangle',.09)},
    tick:n=>{tone(400+n*120,.12,0,'square',.045);tone(800+n*240,.1,.05,'triangle',.05)},
    launch:()=>{noise(1.4,250,5200,.28);tone(120,1.3,0,'sawtooth',.07,900);tone(60,1.2,0,'sine',.12,200)},
    pop:()=>tone(880,.12,0,'sine',.08,1320),
    win:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.28,i*.12,'triangle',.12))
  };
  return{play(k,a){if(muted())return;try{P[k]&&P[k](a)}catch(_){}},unlock(){ctx();document.body.classList.add('sfx-on')},muted,
    toggle(){const m=!muted();try{localStorage.setItem('mute',m?'1':'0')}catch(_){}try{dtMuted=m}catch(_){}document.getElementById('sfxBtn').textContent=m?'🔇':'🔊';if(!m){this.unlock();this.play('pop')}}}
})();
document.addEventListener('DOMContentLoaded',()=>{const b=$('sfxBtn');b.textContent=SFX.muted()?'🔇':'🔊';b.onclick=()=>SFX.toggle()});
document.addEventListener('pointerdown',e=>{SFX.unlock();const t=e.target.closest&&e.target.closest('button,a,.btn,[onclick]');
  if(!t||t.id==='sfxBtn'||t.closest('#dt'))return;SFX.play(t.closest('.tabs,.gswitch,.nav,.filters')?'tab':'tap')},true);
new MutationObserver(m=>m.forEach(r=>r.addedNodes.forEach(n=>{if(n.id==='rankup')SFX.play('win')}))).observe(document.body,{childList:true});

const stk=(n,c='')=>`<img class="${c}" src="assets/stk/${n}.webp" alt="">`;
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');SFX.play('pop');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2400)}
function show(id){['login','app'].forEach(s=>$(s).classList.toggle('hidden',s!==id))}
function view(id){['levels','grade','stats'].forEach(v=>$(v).classList.toggle('hidden',v!==id));window.scrollTo(0,0);if(id==='levels'&&user)renderBoard();if(id==='stats')renderStats()}

/* ---- Màn hình chờ ---- */
(function splash(){
  const boot=restoreSession(); // kiểm tra phiên đăng nhập ngay trong lúc chờ
  const STK=['op-plus','op-minus','op-times','op-div','num-1','num-2','num-3','pi','sqrt','star-sm'];
  for(let i=0;i<16;i++){
    const s=document.createElement('img');s.className='sym';s.alt='';s.src='assets/stk/'+STK[i%STK.length]+'.webp';
    s.style.left=Math.random()*100+'%';s.style.width=(30+Math.random()*34)+'px';
    s.style.animationDuration=(7+Math.random()*7)+'s';s.style.animationDelay=(-Math.random()*8)+'s';
    $('syms').appendChild(s);
  }
  const msgs=['Đang khởi động tên lửa Nova…','Đang xếp hàng các con số…','Đang mài bút chì thần kỳ…','Sắp xong rồi, chuẩn bị nhé!'];
  let p=0;
  const timer=setInterval(()=>{
    p+=25;SFX.play('tick',p/25);$('loadfill').style.width=p+'%';$('loadmsg').textContent=msgs[Math.min(p/25-1,3)];
    if(p>=100){clearInterval(timer);setTimeout(done,500)}
  },750);
  async function done(){
    const p=await boot;
    $('loadmsg').textContent='Phóng tên lửa Nova!';$('splash').classList.add('launch');SFX.play('launch');
    await new Promise(r=>setTimeout(r,1300));
    $('splash').classList.add('out');
    if(p)enter(p);else show('login');
    setTimeout(()=>$('splash').classList.add('hidden'),650);
  }
})();

/* ---- Đăng nhập (tài khoản do thầy cô cấp, không có đăng ký) ---- */
async function fetchProfile(id){
  const {data,error}=await sb.from('profiles').select('*').eq('id',id).single();
  if(error)throw error;
  return data;
}
async function restoreSession(){
  if(!sb)return null;
  try{const {data}=await sb.auth.getSession();return data.session?await fetchProfile(data.session.user.id):null}
  catch(_){return null}
}
$('loginForm').onsubmit=async e=>{
  e.preventDefault();
  const name=$('u').value.trim().toLowerCase(),btn=$('loginBtn'),err=$('err');
  if(!sb){err.textContent='Hệ thống chưa được kết nối. Hãy báo thầy cô nhé.';return}
  if(!/^[a-z0-9._-]{2,40}$/.test(name)){err.textContent='Tên đăng nhập chỉ gồm chữ không dấu và số. Hãy kiểm tra lại.';return}
  btn.disabled=true;btn.textContent='Đang đăng nhập…';err.textContent='';
  try{
    const {data,error}=await sb.auth.signInWithPassword({email:name+EMAIL_SUFFIX,password:$('p').value});
    if(error){
      err.textContent=/invalid|credentials/i.test(error.message||'')
        ?'Tên đăng nhập hoặc mật khẩu chưa đúng. Hãy kiểm tra lại hoặc hỏi thầy cô.'
        :'Chưa đăng nhập được. Hãy thử lại sau ít phút hoặc hỏi thầy cô.';
      return;
    }
    let p;
    try{p=await fetchProfile(data.user.id)}
    catch(_){await sb.auth.signOut();err.textContent='Tài khoản này chưa có hồ sơ học sinh. Hãy báo thầy cô nhé.';return}
    $('p').value='';enter(p);
  }catch(_){err.textContent='Không kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại.'}
  finally{btn.disabled=false;btn.textContent='Vào học'}
};
function enter(p){
  uid=p.id;
  user={id:p.id,username:p.username,name:p.name,grade:p.grade||5,xp:Number(p.xp)||0,
    done:p.done&&typeof p.done==='object'?p.done:{},doc:p.doc&&typeof p.doc==='object'?p.doc:{},gd:p.gd||null,av:avNum(p.avatar)||avLocalGet(p.id)};
  show('app');view('levels');refreshMe();renderEx();
  $('navTeacher').classList.add('hidden');
  if(sb)sb.from('teachers').select('user_id').eq('user_id',uid).maybeSingle().then(({data})=>{if(data&&user)$('navTeacher').classList.remove('hidden')},()=>{});
  loadTeachers().then(()=>{renderEx();renderAssign()});
  loadSubs().then(()=>{renderEx();renderAssign();checkNotif(true)});startPoll();
  loadAtt().then(async()=>{renderEx();if(!$('stats').classList.contains('hidden'))renderStats();await loadAssign();renderAssign();renderEx();showRemind()});
  document.querySelector('.tabs button').click();
  toast('Xin chào '+user.name+'! 👋');
}
$('logout').onclick=async()=>{
  const btn=$('logout');btn.disabled=true;
  stopGame();$('arena').classList.add('hidden');
  await saveQ.catch(()=>{}); // chờ lưu xong tiến độ rồi mới thoát
  try{if(sb)await sb.auth.signOut()}catch(_){}
  user=null;uid=null;boardRows=null;ATT=[];ASG=[];SUBS=[];stopPoll();NSEEN=null;NANN=new Set();TCH=[];hwTeacher=null;closeNotif();drawBell();closeHw();renderAssign();closeRemind();$('navTeacher').classList.add('hidden');$('u').value='';$('p').value='';$('err').textContent='';
  btn.disabled=false;show('login');
};
$('goHome').onclick=e=>{e.preventDefault();view('levels')};
$('open5').onclick=()=>$('levelsPick').scrollIntoView({behavior:'smooth'});
document.querySelectorAll('[data-go]').forEach(a=>a.onclick=e=>{e.preventDefault();view('levels');const t=a.dataset.go;setTimeout(()=>t==='top'?window.scrollTo(0,0):$(t).scrollIntoView({behavior:'smooth'}),60)});
$('backLevels').onclick=()=>view('levels');

/* ---- Toán 5 ---- */
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));
  ['docs','ex','test','games'].forEach(id=>$(id).classList.toggle('hidden',id!==b.dataset.tab));
});
const COV={doc:'formula',ex:'al-pencil',test:'board',game:'rk-blue'}; // ảnh bìa mặc định theo loại thẻ
const cov=(s,k='doc')=>`<div class="cover${s?'':' stk-cover'}"><img src="${s||'assets/stk/'+COV[k]+'.webp'}" alt="" loading="lazy"></div>`;
let curG=5;
const LEVELS=[
 {n:'Tiểu học',r:'Lớp 1 – Lớp 5',ic:'al-idea',c:'#2F8F83',g:[1,2,3,4,5]},
 {n:'Trung học cơ sở',r:'Lớp 6 – Lớp 9',ic:'protractor',c:'#DC6F2A',g:[6,7,8,9]},
 {n:'Trung học phổ thông',r:'Lớp 10 – Lớp 12',ic:'pi',c:'#7D69B0',g:[10,11,12]}];
$('levelGrid').innerHTML=LEVELS.map(L=>`<article class="lv" style="--c:${L.c}"><div class="lvic">${stk(L.ic)}</div><h3>${L.n}</h3><p>${L.r}</p><div class="gchips">${L.g.map(g=>`<button type="button" onclick="openGrade(${g})">Lớp ${g}</button>`).join('')}</div></article>`).join('');
function openGrade(g){
  curG=g;stopGame();$('arena').classList.add('hidden');
  $('crumb').textContent=LEVELS.find(x=>x.g.includes(g)).n;$('gTitle').textContent='Toán lớp '+g;
  $('gswitch').innerHTML=LEVELS.flatMap(x=>x.g).map(n=>`<button type="button" class="${n===g?'on':''}" onclick="openGrade(${n})">${n}</button>`).join('');
  renderEx();view('grade');document.querySelector('.tabs button').click();
}
const docsHtml=()=>DOCS.filter(d=>d.grade===curG).map(d=>
  `<article class="card">${cov(d.img)}<div class="cbody"><span class="tag ${d.type==='Video'?'v':d.type==='Sơ đồ'?'m':''}">${d.type}</span><h3>${d.t}</h3><small>${d.topic}</small><button class="btn ghost" onclick="openDoc(${DOCS.indexOf(d)})">Xem tài liệu</button></div></article>`).join('');
const gameCard=()=>`<article class="card">${cov(null,'game')}<div class="cbody"><span class="tag m">Chơi được ngay</span><h3>Nhẩm nhanh 30 giây</h3><small>Trả lời càng nhiều phép tính càng tốt</small><button class="btn go" style="width:auto" onclick="startGame()">${stk('ic-play','bi')} Bắt đầu chơi</button></div></article>`;
const emp=h=>h.trim()?h:`<p class="empty">Nội dung lớp ${curG} đang được thầy cô biên soạn và sẽ sớm có tại đây.</p>`;

/* ---- Game nhẩm nhanh ---- */
let g=null,gTimer=null;
const vn=n=>String(n).replace('.',','); // số thập phân kiểu Việt Nam: 5,5
function stopGame(){clearInterval(gTimer);gTimer=null;g=null}
function startGame(){
  clearInterval(gTimer); // dọn đồng hồ cũ, tránh chạy 2 đồng hồ và nhận XP 2 lần
  const me=g={score:0,tot:0,time:30,ans:0,end:Date.now()+30000};
  $('arena').classList.remove('hidden');$('score').textContent=0;$('time').textContent=30;$('gmsg').textContent='';
  $('ga').disabled=false;$('gok').disabled=false;$('ga').value='';$('ga').focus();next();
  gTimer=setInterval(()=>{
    if(g!==me){clearInterval(gTimer);return}
    g.time=Math.max(0,Math.ceil((g.end-Date.now())/1000));$('time').textContent=g.time;
    if(g.time<=0){
      clearInterval(gTimer);gTimer=null;$('ga').disabled=true;$('gok').disabled=true;
      const xp=gameXp(g.score);
      if(g.tot>0)logAttempt({k:'game',id:'game-nham',t:'Nhẩm nhanh 30 giây',g:curG,ok:g.score,n:g.tot,s:30,xp,tp:{'Cộng trừ số thập phân':[g.score,g.tot]}});
      $('gq').textContent='Hết giờ!';
      $('gmsg').textContent=xp>0?`Bạn đúng ${g.score} câu và nhận +${xp} XP 🎉`
        :g.score>0?`Bạn đúng ${g.score} câu. Hôm nay bạn đã nhận đủ 30 XP từ trò chơi, mai chơi tiếp nhé!`
        :'Bạn chưa đúng câu nào, thử lại nhé! 💪';
    }
  },250);
}
function next(){
  const a=Math.round((Math.random()*20+1)*10)/10,b=Math.round((Math.random()*9+1)*10)/10,op=Math.random()<.5?'+':'−';
  const r=op==='+'?a+b:a-b;
  if(r<0){g.ans=Math.round((b-a)*10)/10;$('gq').textContent=`${vn(b)} − ${vn(a)} = ?`}
  else{g.ans=Math.round(r*10)/10;$('gq').textContent=`${vn(a)} ${op} ${vn(b)} = ?`}
}
function submitAns(){
  if(!g||g.time<=0)return;
  const raw=$('ga').value.trim().replace(',','.');
  if(raw===''||isNaN(Number(raw))){$('gmsg').textContent='Hãy nhập một số nhé!';return}
  g.tot++;
  if(Math.abs(Number(raw)-g.ans)<0.001){g.score++;$('score').textContent=g.score;$('gmsg').textContent='Đúng rồi! ✔'}
  else $('gmsg').textContent='Chưa đúng, đáp án là '+vn(g.ans);
  $('ga').value='';next();$('ga').focus();
}
$('ga').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();submitAns()}};
$('gok').onclick=submitAns;

/* ===== HỆ THỐNG XP & HẠNG ===== */
// Ngưỡng hạng cao dần: Thách đấu cần 24.000 XP (~150 bài kiểm tra làm tốt lần đầu)
const RANKS=[
 {n:'Đồng',k:'dong',min:0,c:'#E0A56B',i:'🥉'},{n:'Bạc',k:'bac',min:600,c:'#C5CEDC',i:'🥈'},
 {n:'Vàng',k:'vang',min:1800,c:'#FFC93C',i:'🥇'},{n:'Bạch kim',k:'bachkim',min:4000,c:'#7FD6FF',i:'💠'},
 {n:'Kim cương',k:'kimcuong',min:8000,c:'#6FA8FF',i:'💎'},{n:'Tinh anh',k:'tinhanh',min:14000,c:'#C99BFF',i:'🔮'},
 {n:'Thách đấu',k:'thachdau',min:24000,c:'#FF7B7B',i:'👑'}];
// Hệ số XP theo lớp: lớp càng cao, bài càng khó, XP càng nhiều
const GRADE_MULT={1:.5,2:.6,3:.75,4:.9,5:1,6:1.1,7:1.2,8:1.3,9:1.4,10:1.5,11:1.6,12:1.7};
const LEVEL_XP={easy:4,mid:8,hard:14}, LV_NAME={easy:'Nhận biết',mid:'Thông hiểu',hard:'Vận dụng'};
const REPLAY=.2; // làm lại chỉ nhận 20% XP để chống cày
const rkImg=(r,c='rk')=>`<img class="${c}" src="assets/rank/${r.k}.webp" alt="Hạng ${r.n}">`;
function rankOf(xp){let r=RANKS[0];RANKS.forEach(x=>{if(xp>=x.min)r=x});return r}
let saveQ=Promise.resolve();
function save(){ // ghi tiến độ lên Supabase, xếp hàng để không bị ghi chồng
  if(!sb||!user)return;
  const id=uid,row={xp:user.xp,done:{...user.done},doc:{...user.doc},gd:user.gd?{...user.gd}:null};
  saveQ=saveQ.then(async()=>{
    try{const {error}=await sb.from('profiles').update(row).eq('id',id);if(error)throw error}
    catch(_){toast('⚠️ Chưa lưu được tiến độ. Hãy kiểm tra mạng nhé.')}
  });
}

/* ===== ẢNH ĐẠI DIỆN (35 nhân vật, chọn trong hộp thoại) ===== */
const AV_NAMES=['Bác nông dân','Bé nghe nhạc','Cầu thủ','Nhà khoa học','Thủy thủ','Đầu bếp','Kỹ sư','Cô bé mũ nồi','Chú bộ đội','Cô gái nón lá','Mèo game thủ','Cô gái kimono','Bé ba lô xanh','Cô bé tết tóc','Cậu bé kính tròn','Phi hành gia','Cô bé áo mưa','Nhà thám hiểm','Cô bé thỏ bông','Cầu thủ bóng rổ','Chim cánh cụt','Cáo nhỏ','Voi xanh','Vịt con','Khủng long','Cánh cụt mũ len','Thỏ trắng','Ếch xanh','Gấu nâu','Gấu trúc','Husky','Sư tử','Hươu nhỏ','Mèo trắng','Corgi'];
const AV_N=AV_NAMES.length;
const avNum=v=>{v=Number(v);return v>=1&&v<=AV_N?v:0};
function avDefault(id){let h=0;for(const c of String(id||''))h=(h*31+c.charCodeAt(0))>>>0;return h%AV_N+1}
const avOf=(num,id)=>avNum(num)||avDefault(id);
const avImg=(num,id,c='av-img')=>`<img class="${c}" src="assets/avatar/a${String(avOf(num,id)).padStart(2,'0')}.webp" alt="" draggable="false">`;
function avLocalGet(id){try{return avNum(localStorage.getItem('avatar:'+id))}catch(_){return 0}}
function avLocalSet(id,n){try{localStorage.setItem('avatar:'+id,String(n))}catch(_){}}
async function saveAvatar(n){
  user.av=n;avLocalSet(uid,n);refreshMe();
  if(typeof boardRows!=='undefined'&&boardRows){const r=boardRows.find(x=>x.id===uid);if(r)r.avatar=n}
  if(typeof drawBoard==='function')drawBoard();
  if(!sb)return;
  try{
    const {data,error}=await sb.from('profiles').update({avatar:n}).eq('id',uid).select('id');
    if(error){console.error('avatar',error);
      toast(/column|schema|avatar/i.test(error.message||'')?'⚠️ Supabase chưa có cột "avatar". Hãy chạy lệnh SQL tạo cột rồi thử lại.':'⚠️ Chưa lưu được ảnh lên hệ thống: '+(error.message||'lỗi không rõ'));return}
    if(!data||!data.length){toast('⚠️ Supabase từ chối ghi ảnh (thiếu quyền cập nhật). Hãy kiểm tra chính sách RLS của bảng profiles.');return}
    toast('Đã lưu ảnh đại diện lên hệ thống! ✨');
  }catch(e){console.error(e);toast('⚠️ Không kết nối được máy chủ. Ảnh mới chỉ lưu trên máy này.')}
}
function openAvatarPicker(){
  const old=$('avpick');if(old)old.remove();
  const r=rankOf(user.xp);let sel=avOf(user.av,uid);
  const d=document.createElement('div');d.id='avpick';d.className='quiz';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.style.setProperty('--c',r.c);
  d.innerHTML=`<div class="qbox avbox"><h2>Chọn ảnh đại diện</h2>
  <div class="av-prev"><span class="av-frame">${avImg(sel,uid,'av-img')}</span><div><b id="avName"></b><small>Khung đổi màu theo hạng <b>${r.n}</b> của bạn</small></div></div>
  <div class="av-grid" role="radiogroup" aria-label="Danh sách ảnh đại diện">${AV_NAMES.map((n,i)=>`<button type="button" role="radio" data-n="${i+1}" aria-label="${n}" class="av-opt">${avImg(i+1,uid,'av-img')}</button>`).join('')}</div>
  <div class="qnav"><button type="button" class="btn ghost" data-act="x">Hủy</button><button type="button" class="btn go" data-act="ok" style="width:auto">Lưu ảnh</button></div></div>`;
  const paint=()=>{d.querySelectorAll('.av-opt').forEach(b=>{const on=+b.dataset.n===sel;b.classList.toggle('on',on);b.setAttribute('aria-checked',on)});
    d.querySelector('.av-prev .av-img').src=`assets/avatar/a${String(sel).padStart(2,'0')}.webp`;$('avName').textContent=AV_NAMES[sel-1]};
  d.onclick=e=>{
    if(e.target===d||e.target.dataset.act==='x'){d.remove();return}
    const o=e.target.closest('.av-opt');if(o){sel=+o.dataset.n;paint();return}
    if(e.target.dataset.act==='ok'){d.remove();if(sel!==avOf(user.av,uid)||!user.av)saveAvatar(sel)}
  };
  document.body.appendChild(d);paint();
}
function refreshMe(){
  const r=rankOf(user.xp),nx=RANKS[RANKS.indexOf(r)+1];
  $('meName').innerHTML='<button type="button" class="me-av" id="meAv" title="Đổi ảnh đại diện" aria-label="Đổi ảnh đại diện" style="--c:'+rankOf(user.xp).c+'">'+avImg(user.av,uid)+'<i>✎</i></button> '+esc(user.name);
  $('meAv').onclick=openAvatarPicker;$('meXp').textContent=user.xp+' XP';
  $('meRank').innerHTML=rkImg(r)+' '+esc(r.n);$('meRank').style.background=r.c;
  $('rankFill').style.width=(nx?(user.xp-r.min)/(nx.min-r.min)*100:100)+'%';
  $('rankFill').style.background=r.c;
  $('rankTxt').textContent=nx?`Còn ${nx.min-user.xp} XP để lên ${nx.n}`:'Bạn đã đạt hạng cao nhất!';
}
function addXp(n){
  const b=rankOf(user.xp);user.xp+=n;save();refreshMe();
  const a=rankOf(user.xp);if(a.n!==b.n)setTimeout(()=>showRankUp(a),700);
}
function showRankUp(r){ // màn chúc mừng lên hạng với huy hiệu lớn
  const old=$('rankup');if(old)old.remove();
  const d=document.createElement('div');d.id='rankup';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.style.setProperty('--c',r.c);
  d.innerHTML=`<div class="ru"><small>LÊN HẠNG!</small>${rkImg(r,'ru-img')}<h2>${r.n}</h2><p>Chúc mừng ${esc(user.name)}! Bạn đã đạt hạng <b>${r.n}</b> với ${user.xp} XP.</p><button type="button" class="btn go" style="width:auto">Tiếp tục</button></div>`;
  d.onclick=e=>{if(e.target===d||e.target.tagName==='BUTTON')d.remove()};
  document.body.appendChild(d);dtSfx('win');d.querySelector('button').focus({preventScroll:true});
}
function gameXp(s){ // trò chơi: 2 XP/câu, tối đa 30 XP mỗi ngày
  const d=new Date().toDateString();if(!user.gd||user.gd.d!==d)user.gd={d,x:0};
  const x=Math.max(0,Math.min(s*2,30-user.gd.x));user.gd.x+=x;addXp(x);return x;
}
function openDoc(i){
  const d=DOCS[i];
  if(!d.file){toast('Tài liệu sẽ được gắn file ở bước sau');return}
  window.open(d.file,'_blank');
  if(!user.doc[d.file]){user.doc[d.file]=1;addXp(5);logAttempt({k:'doc',id:d.file,t:d.t,g:d.grade,xp:5});toast('+5 XP vì mở tài liệu mới')}
}

/* ===== TOÁN 5 – BÀI 10 (đáp án đúng luôn ở vị trí đầu, được xáo khi làm) ===== */
const Q10_BASIC={id:'t5-b10-cb',title:'TOÁN 5 - BÀI 10 - CƠ BẢN',min:0,grade:5,q:[
 {l:'easy',q:'Bài 1a. Điền số thích hợp: 2/10 = …',o:['0,2','0,02','2,10','0,12']},
 {l:'easy',q:'Bài 1b. Điền số thích hợp: 53/100 = …',o:['0,53','5,3','0,053','53,100']},
 {l:'easy',q:'Bài 1c. Điền số thích hợp: 7/1000 = …',o:['0,007','0,07','0,7','7,000']},
 {l:'easy',q:'Bài 1d. Điền số thích hợp: 5 9/100 = …',o:['5,09','5,9','5,009','59,100']},
 {l:'easy',q:'Bài 1e. Điền số thích hợp: 12 3/1000 = …',o:['12,003','12,03','12,3','12,0003']},
 {l:'easy',q:'Bài 2. Số thập phân 0,07 đọc là:',o:['không phẩy không bảy','không phẩy bảy','không phẩy bảy mươi','không phẩy không không bảy']},
 {l:'easy',q:'Bài 2. Số thập phân 14,125 đọc là:',o:['mười bốn phẩy một trăm hai mươi lăm','mười bốn phẩy một trăm hai mươi','mười bốn phẩy hai mươi lăm','bốn mươi mốt phẩy một trăm hai mươi lăm']},
 {l:'easy',q:'Bài 3a. Viết số thập phân: Hai phẩy năm.',o:['2,5','2,05','25','0,25']},
 {l:'easy',q:'Bài 3b. Viết số thập phân: Không phẩy không chín.',o:['0,09','0,9','0,009','0,19']},
 {l:'easy',q:'Bài 3c. Viết số thập phân: Mười sáu phẩy tám mươi lăm.',o:['16,85','16,085','16,805','60,85']},
 {l:'easy',q:'Bài 4. Chữ số 5 trong số 5,17 thuộc hàng nào?',o:['Hàng đơn vị (phần nguyên)','Hàng phần mười (phần thập phân)','Hàng phần trăm (phần thập phân)','Hàng chục (phần nguyên)']},
 {l:'easy',q:'Bài 4. Chữ số 5 trong số 0,853 thuộc hàng nào?',o:['Hàng phần trăm','Hàng phần mười','Hàng phần nghìn','Hàng đơn vị']},
 {l:'easy',q:'Bài 4. Chữ số 5 trong số 136,005 thuộc hàng nào?',o:['Hàng phần nghìn','Hàng phần trăm','Hàng đơn vị','Hàng trăm']},
 {l:'easy',q:'Bài 5. Trong số 9,305, chữ số 3 thuộc hàng nào?',o:['Hàng phần mười','Hàng phần trăm','Hàng phần nghìn','Hàng đơn vị']},
 {l:'easy',q:'Bài 5. Khẳng định nào sau đây đúng?',o:['4/5 = 8/10 = 0,8','0,25 = 25/10','Số 12,07 có phần thập phân là 7','0,5 = 5/100']}
]};
const Q10_ADV={id:'t5-b10-thvd',title:'TOÁN 5 - BÀI 10 - THÔNG HIỂU/VẬN DỤNG',min:0,grade:5,q:[
 {l:'mid',q:'Bài 6a. Số thập phân gồm 8 đơn vị, 4 phần mười, 6 phần trăm là:',o:['8,46','8,64','8,046','84,6']},
 {l:'mid',q:'Bài 6b. Số thập phân gồm 2 chục, 0 đơn vị, 5 phần mười, 9 phần nghìn là:',o:['20,509','20,59','2,509','20,905']},
 {l:'mid',q:'Bài 6c. Số thập phân gồm 0 đơn vị, 3 phần trăm, 5 phần nghìn là:',o:['0,035','0,35','0,053','0,0035']},
 {l:'mid',q:'Bài 7a. Viết 3/5 thành số thập phân (đưa về phân số thập phân trước):',o:['0,6','0,35','0,3','0,5']},
 {l:'mid',q:'Bài 7b. Viết 1/4 thành số thập phân:',o:['0,25','0,14','0,4','0,1']},
 {l:'mid',q:'Bài 7c. Viết 9/20 thành số thập phân:',o:['0,45','0,9','0,2','0,18']},
 {l:'mid',q:'Bài 7d. Viết 13/25 thành số thập phân:',o:['0,52','0,13','1,325','0,25']},
 {l:'hard',q:'Bài 7e. Viết 3/8 thành số thập phân (gợi ý: đưa về mẫu số 1 000):',o:['0,375','0,38','0,35','0,125']},
 {l:'mid',q:'Bài 8a. Điền số thích hợp: 3 dm = … m',o:['0,3','0,03','30','3']},
 {l:'mid',q:'Bài 8b. Điền số thích hợp: 47 cm = … m',o:['0,47','4,7','0,047','470']},
 {l:'mid',q:'Bài 8c. Điền số thích hợp: 8 g = … kg',o:['0,008','0,08','0,8','8000']},
 {l:'mid',q:'Bài 8d. Điền số thích hợp: 920 m = … km',o:['0,92','9,2','0,092','92']},
 {l:'mid',q:'Bài 8e. Điền số thích hợp: 6 ml = … l',o:['0,006','0,06','0,6','6000']},
 {l:'hard',q:'Bài 9. Chai nước chứa 1 lít. Mẹ rót ra 250 ml. Mẹ đã rót ra bao nhiêu lít nước?',o:['0,25 lít','2,5 lít','0,025 lít','25 lít']},
 {l:'hard',q:'Bài 9 (mở rộng). Chai chứa 1 lít, mẹ rót ra 250 ml. Trong chai còn lại bao nhiêu lít?',o:['0,75 lít','0,25 lít','0,65 lít','1,25 lít']},
 {l:'hard',q:'Bài 10. Từ ba thẻ 2, 5, 0 và dấu phẩy, lập số thập phân có phần nguyên một chữ số, phần thập phân hai chữ số (dùng cả 3 thẻ). Lập được tất cả bao nhiêu số?',o:['6 số','4 số','3 số','9 số']},
 {l:'hard',q:'Bài 10. Trong các số thập phân lập được từ ba thẻ 2, 5, 0, số lớn nhất là:',o:['5,20','5,02','2,50','0,52']},
 {l:'hard',q:'Bài 10. Số nào sau đây lập được từ ba thẻ 2, 5, 0 (mỗi thẻ dùng một lần)?',o:['5,02','5,22','0,05','2,02']}
]};
/* ===== TOÁN 5 – ÔN NHANH TRƯỚC BÀI 12–13 (đáp án đúng luôn ở vị trí đầu) ===== */
const QON_12_13={id:'t5-on-b12-13',title:'TOÁN 5 - ÔN NHANH TRƯỚC BÀI 12–13',min:0,grade:5,q:[
 {l:'easy',q:'Bài 8 (ôn). 1 m = … cm',o:['100','10','1 000','1']},
 {l:'easy',q:'Bài 8 (ôn). 1 km = … m',o:['1 000','100','10','10 000']},
 {l:'easy',q:'Bài 8 (ôn). 1 kg = … g',o:['1 000','100','10','10 000']},
 {l:'easy',q:'Bài 8 (ôn). 1 m² = … dm²',o:['100','10','1 000','1']},
 {l:'mid',q:'Bài 8 (ôn). Hai đơn vị đo diện tích liền nhau (ví dụ m² và dm²) hơn kém nhau bao nhiêu lần?',o:['100 lần','10 lần','1 000 lần','2 lần']},
 {l:'easy',q:'Bài 10 (ôn). Phân số 7/100 viết thành số thập phân là:',o:['0,07','0,7','0,007','7,100']},
 {l:'easy',q:'Bài 10 (ôn). Hỗn số 3 4/10 viết thành số thập phân là:',o:['3,4','3,04','34,10','0,34']},
 {l:'mid',q:'Bài 10 (ôn). Phân số 6/1000 viết thành số thập phân là:',o:['0,006','0,06','0,6','6,000']},
 {l:'mid',q:'Bài 10 (ôn). Trong số 8,364, chữ số 6 thuộc hàng nào?',o:['Hàng phần trăm','Hàng phần mười','Hàng phần nghìn','Hàng đơn vị']},
 {l:'mid',q:'Bài 11 (ôn). So sánh 5,06 và 5,6, kết quả đúng là:',o:['5,06 < 5,6','5,06 > 5,6','5,06 = 5,6','Không so sánh được']},
 {l:'mid',q:'Bài 11 (ôn). Số lớn nhất trong các số 3,09; 3,9; 3,19; 3,091 là:',o:['3,9','3,19','3,09','3,091']}
]};

/* ===== TOÁN 5 – BÀI 12: VIẾT SỐ ĐO ĐẠI LƯỢNG DƯỚI DẠNG SỐ THẬP PHÂN (SGK trang 42–46) ===== */
const Q12_BASIC={id:'t5-b12-cb',title:'TOÁN 5 - BÀI 12 - CƠ BẢN',min:0,grade:5,q:[
 {l:'easy',q:'Bài 12a. Điền số thích hợp: 2 m 15 cm = … m',o:['2,15','2,015','21,5','215']},
 {l:'easy',q:'Bài 12b. Điền số thích hợp: 1 kg 250 g = … kg',o:['1,25','1,025','12,5','1 250']},
 {l:'easy',q:'Bài 12c. Điền số thích hợp: 275 g = … kg',o:['0,275','2,75','0,0275','27,5']},
 {l:'easy',q:'Bài 12d. Điền số thích hợp: 125 m = … km',o:['0,125','1,25','12,5','0,0125']},
 {l:'easy',q:'Bài 12e. Điền số thích hợp: 2 m 5 dm = … m',o:['2,5','2,05','25','0,25']},
 {l:'easy',q:'Bài 12g. Điền số thích hợp: 6 m 75 cm = … m',o:['6,75','6,075','67,5','6,705']},
 {l:'mid',q:'Bài 12h. Điền số thích hợp: 3 m 8 cm = … m',o:['3,08','3,8','3,008','38']},
 {l:'mid',q:'Bài 12i. Điền số thích hợp: 4 km 500 m = … km',o:['4,5','4,05','4,005','45']},
 {l:'mid',q:'Bài 12k. Điền số thích hợp: 7 km 80 m = … km',o:['7,08','7,8','7,008','78']},
 {l:'mid',q:'Bài 12l. Điền số thích hợp: 456 m = … km',o:['0,456','4,56','45,6','0,0456']},
 {l:'easy',q:'Bài 12m. Điền số thích hợp: 3 kg 725 g = … kg',o:['3,725','3,0725','372,5','3,25']},
 {l:'mid',q:'Bài 12n. Điền số thích hợp: 8 kg 75 g = … kg',o:['8,075','8,75','8,0075','80,75']},
 {l:'mid',q:'Bài 12o. Điền số thích hợp: 76 mm = … cm',o:['7,6','0,76','76','0,076']}
]};
const Q12_ADV={id:'t5-b12-thvd',title:'TOÁN 5 - BÀI 12 - THÔNG HIỂU/VẬN DỤNG',min:0,grade:5,q:[
 {l:'mid',q:'Bài 12p. Điền số thích hợp: 560 g = … kg',o:['0,56','5,6','0,056','56']},
 {l:'mid',q:'Bài 12q. Điền số thích hợp: 1 tấn 5 tạ = … tấn',o:['1,5','1,05','1,005','15']},
 {l:'mid',q:'Bài 12r. Điền số thích hợp: 2 tấn 325 kg = … tấn',o:['2,325','2,0325','23,25','2,25']},
 {l:'mid',q:'Bài 12s. Điền số thích hợp: 1 450 kg = … tấn',o:['1,45','14,5','0,145','1,045']},
 {l:'mid',q:'Bài 12t. Điền số thích hợp: 1 m² 60 dm² = … m²',o:['1,6','1,06','16','0,16']},
 {l:'mid',q:'Bài 12u. Điền số thích hợp: 56 dm² = … m²',o:['0,56','5,6','0,056','56']},
 {l:'mid',q:'Bài 12v. Điền số thích hợp: 8 m² 75 dm² = … m²',o:['8,75','8,075','87,5','0,875']},
 {l:'mid',q:'Bài 12w. Điền số thích hợp: 3 m² 6 dm² = … m²',o:['3,06','3,6','3,006','36']},
 {l:'mid',q:'Bài 12x. Điền số thích hợp: 120 dm² = … m²',o:['1,2','12','0,12','1,02']},
 {l:'mid',q:'Bài 12y. Điền số thích hợp: 4 dm² 25 cm² = … dm²',o:['4,25','4,025','42,5','4,5']},
 {l:'mid',q:'Bài 12z. Điền số thích hợp: 85 cm² = … dm²',o:['0,85','8,5','0,085','85']},
 {l:'mid',q:'Bài 12 (dung tích). Điền số thích hợp: 6 l 260 ml = … l',o:['6,26','6,026','62,6','6,2']},
 {l:'mid',q:'Bài 12 (dung tích). Điền số thích hợp: 5 l 75 ml = … l',o:['5,075','5,75','5,0075','50,75']},
 {l:'hard',q:'Bài 12. Hình A có diện tích 4 cm² 15 mm², hình B có diện tích 3,95 cm². Hình nào có diện tích lớn hơn?',o:['Hình A','Hình B','Hai hình bằng nhau','Không so sánh được']},
 {l:'hard',q:'Bài 12. Đoạn đường AB dài 1,2 km, đoạn đường AC dài 1 km 75 m. Đoạn đường nào dài hơn?',o:['Đoạn AB','Đoạn AC','Hai đoạn bằng nhau','Không so sánh được']},
 {l:'hard',q:'Bài 12. Thỏ nặng 6 kg 75 g, ngỗng nặng 6 100 g, mèo nặng 6,095 kg. Con vật nào nặng nhất?',o:['Ngỗng','Thỏ','Mèo','Ba con nặng bằng nhau']},
 {l:'hard',q:'Bài 12. Bức tranh bảo vệ môi trường rộng 5,3 m²; bức an toàn giao thông rộng 5 m² 8 dm²; bức phòng chống dịch Covid rộng 5 m² 9 dm². Bức tranh nào có diện tích bé nhất?',o:['Bức an toàn giao thông','Bức bảo vệ môi trường','Bức phòng chống dịch Covid','Ba bức bằng nhau']},
 {l:'hard',q:'Bài 12. Nhảy xa: An nhảy được 2 m 5 dm, Bình nhảy được 2,45 m, Chi nhảy được 2 m 40 cm. Bạn nào nhảy xa nhất?',o:['An','Bình','Chi','An và Bình bằng nhau']},
 {l:'hard',q:'Bài 12. Sợi dây dài 1 m 20 cm, Nam cắt đi 45 cm. Đoạn dây còn lại dài bao nhiêu mét?',o:['0,75 m','0,85 m','0,65 m','7,5 m']}
]};

/* ===== TOÁN 5 – BÀI 13: LÀM TRÒN SỐ THẬP PHÂN (SGK trang 47–50) ===== */
const Q13_BASIC={id:'t5-b13-cb',title:'TOÁN 5 - BÀI 13 - CƠ BẢN',min:0,grade:5,q:[
 {l:'easy',q:'Bài 13a. Khi làm tròn số thập phân đến số tự nhiên gần nhất, ta so sánh chữ số ở hàng nào với 5?',o:['Hàng phần mười','Hàng đơn vị','Hàng phần trăm','Hàng chục']},
 {l:'easy',q:'Bài 13b. Làm tròn 31,2 đến số tự nhiên gần nhất được:',o:['31','32','30','33']},
 {l:'easy',q:'Bài 13c. Làm tròn 31,75 đến số tự nhiên gần nhất được:',o:['32','31','30','33']},
 {l:'easy',q:'Bài 13d. Làm tròn 9,15 đến số tự nhiên gần nhất được:',o:['9','10','8','9,2']},
 {l:'easy',q:'Bài 13e. Làm tròn 9,82 đến số tự nhiên gần nhất được:',o:['10','9','11','8']},
 {l:'easy',q:'Bài 13g. Làm tròn 42,305 đến số tự nhiên gần nhất được:',o:['42','43','41','42,3']},
 {l:'easy',q:'Bài 13h. Khi làm tròn số thập phân đến hàng phần mười, ta so sánh chữ số ở hàng nào với 5?',o:['Hàng phần trăm','Hàng phần mười','Hàng phần nghìn','Hàng đơn vị']},
 {l:'easy',q:'Bài 13i. Làm tròn 2,52 đến hàng phần mười được:',o:['2,5','2,6','2,52','3']},
 {l:'easy',q:'Bài 13k. Làm tròn 3,25 đến hàng phần mười được:',o:['3,3','3,2','3,25','3']},
 {l:'easy',q:'Bài 13l. Làm tròn 1,57 đến hàng phần mười được:',o:['1,6','1,5','1,57','2']},
 {l:'easy',q:'Bài 13m. Khi làm tròn số thập phân đến hàng phần trăm, ta so sánh chữ số ở hàng nào với 5?',o:['Hàng phần nghìn','Hàng phần trăm','Hàng phần mười','Hàng đơn vị']},
 {l:'easy',q:'Bài 13n. Làm tròn 6,324 đến hàng phần trăm được:',o:['6,32','6,33','6,3','6,324']}
]};
const Q13_ADV={id:'t5-b13-thvd',title:'TOÁN 5 - BÀI 13 - THÔNG HIỂU/VẬN DỤNG',min:0,grade:5,q:[
 {l:'mid',q:'Bài 13o. Làm tròn 513,59 đến số tự nhiên gần nhất được:',o:['514','513','515','513,6']},
 {l:'mid',q:'Bài 13p. Làm tròn 0,806 đến số tự nhiên gần nhất được:',o:['1','0','0,8','2']},
 {l:'mid',q:'Bài 13q. Chiều cao chuẩn của bé gái 10 tuổi là 138,6 cm. Làm tròn đến số tự nhiên gần nhất được:',o:['139 cm','138 cm','140 cm','138,6 cm']},
 {l:'mid',q:'Bài 13r. Làm tròn 6,325 đến hàng phần trăm được:',o:['6,33','6,32','6,3','6,4']},
 {l:'mid',q:'Bài 13s. Làm tròn 6,2758 đến hàng phần mười được:',o:['6,3','6,2','6,28','6,27']},
 {l:'mid',q:'Bài 13t. Làm tròn 6,2758 đến hàng phần trăm được:',o:['6,28','6,27','6,3','6,2758']},
 {l:'mid',q:'Bài 13u. Làm tròn 1,624 đến hàng phần trăm được:',o:['1,62','1,63','1,6','1,7']},
 {l:'hard',q:'Bài 13v. Làm tròn 9,345 đến hàng phần mười được (chỉ xét chữ số ngay sau hàng phần mười):',o:['9,3','9,4','9,35','9,5']},
 {l:'mid',q:'Bài 13w. Làm tròn 9,345 đến hàng phần trăm được:',o:['9,35','9,34','9,3','9,4']},
 {l:'mid',q:'Bài 13x. Làm tròn 21,663 đến hàng phần mười được:',o:['21,7','21,6','21,66','22']},
 {l:'mid',q:'Bài 13y. Làm tròn 0,4571 đến hàng phần trăm được:',o:['0,46','0,45','0,5','0,457']},
 {l:'mid',q:'Bài 13z. Quả dưa cân nặng chính xác 2,52 kg. Cô bán hàng làm tròn đến hàng phần mười, quả dưa nặng khoảng:',o:['2,5 kg','2,6 kg','3 kg','2,52 kg']},
 {l:'hard',q:'Bài 13. Đường chéo màn hình ti vi dài 139,7 cm. Làm tròn đến số tự nhiên gần nhất, đường chéo dài khoảng:',o:['140 cm','139 cm','139,7 cm','150 cm']},
 {l:'mid',q:'Bài 13. Số Pi bằng 3,141592… Làm tròn đến hàng phần mười được:',o:['3,1','3,2','3,14','3']},
 {l:'mid',q:'Bài 13. Số Pi bằng 3,141592… Làm tròn đến hàng phần trăm được:',o:['3,14','3,15','3,1','3,142']},
 {l:'hard',q:'Bài 13. Làm tròn 9,95 đến hàng phần mười được:',o:['10,0','9,9','10,5','9,0']},
 {l:'hard',q:'Bài 13. Số nào sau đây khi làm tròn đến số tự nhiên gần nhất được 8?',o:['7,5','8,5','7,4','9,0']},
 {l:'hard',q:'Bài 13. Mai nặng 31,2 kg, Việt nặng 31,75 kg. Bác sĩ làm tròn cân nặng của hai bạn đến số tự nhiên gần nhất. Việt nặng hơn Mai (theo số đã làm tròn) bao nhiêu ki-lô-gam?',o:['1 kg','0,55 kg','0 kg','2 kg']},
 {l:'hard',q:'Bài 13. Có bao nhiêu chữ số thay được cho □ để số 6,□5 làm tròn đến số tự nhiên gần nhất được 7?',o:['5 chữ số','4 chữ số','6 chữ số','10 chữ số']}
]};
const QUIZZES=[Q10_BASIC,Q10_ADV,QON_12_13,Q12_BASIC,Q12_ADV,Q13_BASIC,Q13_ADV];
let cur=Q10_BASIC;
const EXERCISES_LIVE=()=>QUIZZES.map((Z,k)=>{
  if(Z.grade!==curG)return '';
  const best=user.done[Z.id];
  return `<article class="card">${cov(null,'ex')}<div class="cbody"><span class="tag m">Bài tập · Không giới hạn thời gian</span>${asgTag(Z.id)}<h3>${Z.title}</h3>
  <small>${Z.q.length} câu trắc nghiệm · tối đa ${quizMax(Z)} XP lần đầu</small>
  <small>${best===undefined?'Chưa làm':'Điểm cao nhất: '+best+'/'+Z.q.length+' · làm lại nhận 20% XP'}</small>
  <button class="btn go" style="width:auto" onclick="startQuiz(${k})">${best===undefined?'Làm bài':'Làm lại'}</button></div></article>`;
}).join('');
function quizMax(Z){return Math.round((Z.q.reduce((s,q)=>s+LEVEL_XP[q.l],0)+40)*GRADE_MULT[Z.grade])}
function renderEx(){
  $('docList').innerHTML=emp(docsHtml());$('exList').innerHTML=reviewCard()+emp(EXERCISES_LIVE()+hwCards());
  $('testList').innerHTML=emp(dtCards());$('gameList').innerHTML=emp(curG===5?gameCard():'');renderAssign();
}
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
let qz=null;
function startQuiz(k){
  if(k!==undefined)cur=QUIZZES[k];
  qz={i:0,sel:[],t0:Date.now(),t:cur.min*60,end:Date.now()+cur.min*60000,qs:cur.q.map(q=>({...q,opts:sh(q.o)}))};
  $('quiz').classList.remove('hidden');$('qres').classList.add('hidden');$('qmain').classList.remove('hidden');
  $('qtitle').textContent=cur.title;document.body.style.overflow='hidden';$('quiz').scrollTop=0;
  $('qtime').parentElement.style.display=cur.min?'':'none'; // không giới hạn thời gian thì ẩn đồng hồ
  if(cur.min){
    qz.timer=setInterval(()=>{qz.t=Math.max(0,Math.ceil((qz.end-Date.now())/1000));tick();if(qz.t<=0){toast('Hết giờ! Bài đã được nộp.');finishQuiz()}},500);
    tick();
  }
  showQ();
}
function tick(){$('qtime').textContent=Math.floor(qz.t/60)+':'+String(qz.t%60).padStart(2,'0')}
function showQ(){
  const q=qz.qs[qz.i],n=qz.qs.length;
  $('qbar').style.width=(qz.i/n*100)+'%';
  $('qlv').textContent=`Câu ${qz.i+1}/${n} · ${LV_NAME[q.l]}`;
  $('qtext').innerHTML=fmt(q.q);$('qopts').innerHTML='';
  q.opts.forEach((o,k)=>{
    const b=document.createElement('button');b.type='button';b.innerHTML=String.fromCharCode(65+k)+'. '+fmt(o);
    b.className=qz.sel[qz.i]===o?'on':'';
    b.onclick=()=>{qz.sel[qz.i]=o;[...$('qopts').children].forEach(x=>x.classList.toggle('on',x===b));$('qnext').disabled=false};
    $('qopts').appendChild(b);
  });
  $('qnext').disabled=qz.sel[qz.i]===undefined;
  $('qnext').textContent=qz.i===n-1?'Nộp bài':'Câu tiếp';
}
$('qnext').onclick=()=>{qz.i<qz.qs.length-1?(qz.i++,showQ()):finishQuiz()};
$('qquit').onclick=()=>{if(confirm('Thoát bây giờ sẽ không được tính điểm. Bạn chắc chứ?'))closeQuiz()};
function closeQuiz(){clearInterval(qz.timer);$('quiz').classList.add('hidden');document.body.style.overflow='';renderEx()}
function finishQuiz(){
  clearInterval(qz.timer);
  let ok=0,raw=0;
  qz.qs.forEach((q,i)=>{if(qz.sel[i]===q.o[0]){ok++;raw+=LEVEL_XP[q.l]}});
  const n=qz.qs.length;if(ok>=Math.ceil(n*.6))raw+=10;if(ok===n)raw+=30;
  const rv=!!cur.review,first=!rv&&!(cur.id in user.done),gain=rv?0:Math.round(raw*GRADE_MULT[cur.grade]*(first?1:REPLAY));
  if(!rv)user.done[cur.id]=Math.max(user.done[cur.id]||0,ok);if(gain)addXp(gain);
  {const tp={},w=[],r=[];qz.qs.forEach((q,i)=>{const t=topicOf(q.q),c=qz.sel[i]===q.o[0];(tp[t]=tp[t]||[0,0])[1]++;if(c){tp[t][0]++;r.push(q.q)}else w.push({q:q.q,o:q.o,t})});
   logAttempt({k:rv?'review':'quiz',id:cur.id,t:cur.title,g:cur.grade,ok,n,s:Math.round((Date.now()-qz.t0)/1000),xp:gain,tp,w,r})}
  const wrong=qz.qs.map((q,i)=>({q,i})).filter(x=>qz.sel[x.i]!==x.q.o[0]);
  $('qmain').classList.add('hidden');$('qres').classList.remove('hidden');$('quiz').scrollTop=0;
  $('qres').innerHTML=`<h2>${ok}/${n} câu đúng ${stk(ok===n?'star-gold':ok>=n*.6?'al-idea':'al-pencil','res-ic')}</h2>
  <p class="gain">+${gain} XP</p><p class="muted">${rv?'Bài ôn tập không tính XP.':first?'Lần đầu nhận đủ XP.':'Làm lại chỉ nhận 20% XP.'} Tổng: ${user.xp} XP · Hạng ${rankOf(user.xp).n}</p>
  ${wrong.length?'<h3>Các câu cần xem lại</h3>'+wrong.map(x=>`<div class="rv"><b>Câu ${x.i+1}.</b> ${fmt(x.q.q)}<br><span class="bad">Bạn chọn: ${fmt(qz.sel[x.i]??'(bỏ trống)')}</span><br><span class="good">Đáp án: ${fmt(x.q.o[0])}</span></div>`).join(''):'<p>Bạn trả lời đúng tất cả!</p>'}
  <div class="qnav"><button class="btn ghost" onclick="closeQuiz()">Đóng</button><button class="btn go" style="width:auto" onclick="startQuiz()">Làm lại</button></div>`;
}
const DT_T={tn:"Số tự nhiên",pt:"Phép tính",ps:"Phân số",tp:"Phân số thập phân",pp:"Phép tính phân số",hs:"Hỗn số",hh:"Hình học & đo lường"};
const DT_Q=[
["tn","Bài 1","Số 863 749 đọc là:",["tám trăm sáu mươi ba nghìn bảy trăm bốn mươi chín","tám trăm sáu mươi nghìn ba trăm bảy mươi bốn","tám mươi sáu nghìn ba trăm bảy mươi bốn","tám trăm ba mươi sáu nghìn bảy trăm bốn mươi chín"],0,"Đọc từng lớp: lớp nghìn (863) rồi lớp đơn vị (749)."],
["tn","Bài 1","Trong số 863 749, chữ số 6 thuộc hàng nào?",["Hàng chục nghìn (60 000)","Hàng nghìn (6 000)","Hàng trăm nghìn (600 000)","Hàng chục (60)"],0,"863 749 = 800 000 + 60 000 + 3 000 + 700 + 40 + 9."],
["tn","Bài 1","Làm tròn số 2 545 000 đến hàng chục nghìn được:",["2 550 000","2 500 000","2 540 000","2 600 000"],0,"Chữ số hàng nghìn là 5 nên tăng chữ số hàng chục nghìn thêm 1: 4 → 5."],
["pt","Bài 2","Giá trị của biểu thức 36 − 4 × 5 + 8 : 2 là:",["20","164","16","24"],0,"Nhân, chia trước: 36 − 20 + 4 = 16 + 4 = 20."],
["pt","Bài 2","Phép chia 58 : 7 có thương và số dư là:",["thương 8, dư 2","thương 7, dư 9","thương 8, dư 1","thương 9, dư 2"],0,"58 = 7 × 8 + 2 và số dư 2 bé hơn số chia 7."],
["ps","Bài 3","Phân số nào bằng phân số 3/4?",["6/8","6/7","4/3","9/16"],0,"Nhân cả tử và mẫu với 2: 3×2 / 4×2 = 6/8."],
["ps","Bài 3","Trong các phân số 2/3; 3/4; 5/6, phân số nào lớn nhất?",["5/6","3/4","2/3","Bằng nhau"],0,"Quy đồng mẫu 12: 8/12; 9/12; 10/12 → 5/6 lớn nhất."],
["tp","Bài 4","Phân số nào sau đây là phân số thập phân?",["57/100","9/20","3/8","7/25"],0,"Phân số thập phân có mẫu số là 10; 100; 1 000; …"],
["tp","Bài 4","Viết 9/20 thành phân số thập phân ta được:",["45/100","18/100","9/100","90/100"],0,"Nhân cả tử và mẫu với 5: 9×5 / 20×5 = 45/100."],
["pp","Bài 5","Kết quả của 2/3 : 4/5 là:",["5/6","8/15","6/5","4/3"],0,"Chia phân số: nhân với phân số đảo ngược. 2/3 × 5/4 = 10/12 = 5/6."],
["pp","Bài 6","Kết quả của 3/4 − 1/6 là:",["7/12","2/10","5/12","3/2"],0,"Quy đồng mẫu 12: 9/12 − 2/12 = 7/12."],
["hs","Bài 7","Hỗn số 2 3/4 viết thành phân số là:",["11/4","9/4","6/4","5/4"],0,"(2 × 4 + 3) / 4 = 11/4."],
["tp","Bài 9","Phân số 1/2 bằng phân số thập phân nào?",["5/10","1/10","2/10","12/100"],0,"Nhân cả tử và mẫu với 5: 1×5 / 2×5 = 5/10."],
["hh","Bài 8","1 tạ 5 yến bằng bao nhiêu ki-lô-gam?",["150 kg","105 kg","1 050 kg","15 kg"],0,"1 tạ = 100 kg; 5 yến = 50 kg; 100 + 50 = 150 kg."],
["hh","Bài 8","Hình thoi có hai đường chéo 10 cm và 6 cm. Diện tích là:",["30 cm²","60 cm²","16 cm²","32 cm²"],0,"S = m × n : 2 = 10 × 6 : 2 = 30 (cm²)."]
];

/* ===== ĐỀ TEST BÀI 10, 11, 12 (đáp án đúng luôn ở vị trí đầu, được xáo khi chơi) ===== */
const T10={ct:"Cấu tạo & hàng",dv:"Đọc – viết số",cd:"Phân số, hỗn số → số thập phân",sd:"Số đo",vd:"Vận dụng"};
const Q10=[
["ct","Bài 10","Số thập phân 63,28 có phần nguyên và phần thập phân lần lượt là:",["63 và 28","6 và 328","63,2 và 8","28 và 63"],0,"Bên trái dấu phẩy là phần nguyên (63), bên phải dấu phẩy là phần thập phân (28)."],
["ct","Bài 10","Trong số 63,28, chữ số 2 thuộc hàng nào?",["Hàng phần mười","Hàng phần trăm","Hàng chục","Hàng đơn vị"],0,"Chữ số đứng ngay sau dấu phẩy là hàng phần mười (giá trị 2/10); chữ số 8 là hàng phần trăm."],
["ct","Bài 10","Chữ số 7 trong số 9,257 thuộc hàng nào?",["Hàng phần nghìn","Hàng phần trăm","Hàng phần mười","Hàng đơn vị"],0,"Sau dấu phẩy: 2 là hàng phần mười, 5 là hàng phần trăm, 7 là hàng phần nghìn."],
["dv","Bài 10","Số thập phân 4,05 đọc là:",["bốn phẩy không năm","bốn phẩy năm","bốn phẩy năm mươi","bốn không phẩy năm"],0,"Chữ số 0 ngay sau dấu phẩy phải đọc là “không”: 4,05 đọc là bốn phẩy không năm."],
["dv","Bài 10","Số thập phân 6,015 đọc là:",["sáu phẩy không mười lăm","sáu phẩy mười lăm","sáu phẩy một trăm năm mươi","sáu phẩy không một năm"],0,"Phần thập phân bắt đầu bằng chữ số 0 nên đọc “không”, rồi đọc phần còn lại: sáu phẩy không mười lăm."],
["dv","Bài 10","Viết số thập phân: không phẩy không bốn mươi ba.",["0,043","0,43","0,0043","0,403"],0,"“Không” là chữ số 0 ở hàng phần mười, rồi “bốn mươi ba” là 43: 0,043."],
["dv","Bài 10","Số thập phân gồm 4 chục, 6 đơn vị, 2 phần mười, 5 phần trăm là:",["46,25","46,52","4,625","64,25"],0,"Phần nguyên: 4 chục 6 đơn vị = 46. Phần thập phân: 2 phần mười 5 phần trăm = 25. Vậy 46,25."],
["cd","Bài 10","Viết 25/1000 thành số thập phân:",["0,025","0,25","2,5","0,0025"],0,"Mẫu số 1000 nên có 3 chữ số thập phân. Tử số 25 chỉ có 2 chữ số, thêm 0 vào đầu: 0,025."],
["cd","Bài 10","Viết hỗn số 4 57/100 thành số thập phân:",["4,57","45,7","4,057","457,100"],0,"Phần nguyên là 4, phần thập phân là 57/100 nên bằng 4,57."],
["cd","Bài 10","Viết 149/10 thành số thập phân:",["14,9","1,49","149,10","0,149"],0,"Tách thành hỗn số: 149/10 = 14 9/10 = 14,9 (vì 149 = 14 × 10 + 9)."],
["cd","Bài 10","Viết 7/125 thành số thập phân:",["0,056","0,56","0,175","0,07"],0,"Nhân cả tử và mẫu với 8: 7×8 / 125×8 = 56/1000 = 0,056."],
["sd","Bài 10","Điền số thích hợp: 564 m = … km",["0,564","5,64","56,4","0,0564"],0,"564 m = 564/1000 km = 0,564 km."],
["sd","Bài 10","Điền số thích hợp: 3,2 m = … mm",["3 200","320","32","3 020"],0,"3,2 m = 3 2/10 m = 3 m 2 dm = 3 200 mm."],
["vd","Bài 10","Phần cầu dẫn của cầu Nhật Tân dài 5,27 km. Đổi ra mét ta được:",["5 270 m","527 m","5 027 m","52 700 m"],0,"5,27 km = 5 27/100 km = 5 km 270 m = 5 270 m."],
["vd","Bài 10","Từ ba thẻ chữ số 1; 0; 4 và một thẻ dấu phẩy, lập số thập phân có phần nguyên một chữ số, phần thập phân hai chữ số (dùng đủ các thẻ). Lập được bao nhiêu số?",["6 số","3 số","4 số","9 số"],0,"Có 3 cách chọn phần nguyên, hai chữ số còn lại xếp theo 2 cách: 3 × 2 = 6 số (1,04; 1,40; 0,14; 0,41; 4,01; 4,10)."]
];
const T11={ss:"So sánh",bg:"Số thập phân bằng nhau",sx:"Sắp xếp",ch:"Tìm chữ số",vd:"Vận dụng"};
const Q11=[
["ss","Bài 11","So sánh 15,2 và 9,87. Kết quả đúng là:",["15,2 > 9,87","15,2 < 9,87","15,2 = 9,87","Không so sánh được"],0,"Phần nguyên khác nhau: 15 > 9 nên 15,2 > 9,87, không cần xét phần thập phân."],
["ss","Bài 11","Chọn kết quả đúng:",["7,28 < 7,3","7,28 > 7,3","7,28 = 7,3","7,3 < 7,28"],0,"Phần nguyên bằng nhau (7). Viết 7,3 = 7,30; hàng phần mười 2 < 3 nên 7,28 < 7,3."],
["bg","Bài 11","Số nào dưới đây bằng 0,6?",["0,60","0,06","6,0","0,606"],0,"Thêm chữ số 0 vào tận cùng bên phải phần thập phân thì giá trị không đổi: 0,6 = 0,60."],
["bg","Bài 11","Bỏ các chữ số 0 ở tận cùng phần thập phân, số 50,6030 viết gọn là:",["50,603","50,63","5,0603","56,03"],0,"Chỉ bỏ chữ số 0 nằm sát cuối: 50,6030 = 50,603. Chữ số 0 ở giữa phải giữ lại."],
["bg","Bài 11","Khẳng định nào sau đây đúng?",["8,3000 = 8,3","8,05 = 8,5","10,507 = 10,57","0,50 = 0,05"],0,"Chỉ được thêm hoặc bỏ chữ số 0 ở tận cùng bên phải phần thập phân. Chữ số 0 ở giữa hoặc ở đầu phần thập phân thì không được bỏ."],
["ss","Bài 11","Số có nhiều chữ số hơn chưa chắc đã lớn hơn. Chọn kết quả đúng:",["0,5 > 0,45","0,5 < 0,45","0,5 = 0,45","0,5 = 0,045"],0,"Viết 0,5 = 0,50; vì 50 > 45 nên 0,5 > 0,45."],
["ss","Bài 11","So sánh 3,405 và 3,45:",["3,405 < 3,45","3,405 > 3,45","3,405 = 3,45","Không so sánh được"],0,"Phần nguyên 3 = 3; hàng phần mười 4 = 4; hàng phần trăm 0 < 5. Vậy 3,405 < 3,45."],
["ss","Bài 11","So sánh 24,8 và 24,79:",["24,8 > 24,79","24,8 < 24,79","24,8 = 24,79","Không so sánh được"],0,"Viết 24,8 = 24,80; hàng phần mười 8 > 7 nên 24,8 > 24,79."],
["sx","Bài 11","Số lớn nhất trong các số 6,38; 6,8; 6,083; 6,83 là:",["6,83","6,8","6,38","6,083"],0,"Cả bốn số đều có phần nguyên 6. Hàng phần mười: 8 là lớn nhất (6,8 và 6,83). Viết 6,8 = 6,80, so hàng phần trăm: 3 > 0 nên 6,83 lớn nhất."],
["sx","Bài 11","Sắp xếp các số 2,35; 2,5; 2,05; 3,2; 2,305 theo thứ tự từ bé đến lớn:",["2,05; 2,305; 2,35; 2,5; 3,2","2,05; 2,35; 2,305; 2,5; 3,2","3,2; 2,5; 2,35; 2,305; 2,05","2,05; 2,305; 2,5; 2,35; 3,2"],0,"3,2 có phần nguyên lớn nhất. Với phần nguyên 2, hàng phần mười: 0 < 3 < 5. So 2,305 và 2,35: hàng phần trăm 0 < 5. Vậy 2,05 < 2,305 < 2,35 < 2,5 < 3,2."],
["sx","Bài 11","Sắp xếp các số 0,4; 0,44; 0,404; 0,04 theo thứ tự từ lớn đến bé:",["0,44; 0,404; 0,4; 0,04","0,404; 0,44; 0,4; 0,04","0,44; 0,4; 0,404; 0,04","0,04; 0,4; 0,404; 0,44"],0,"Viết 0,4 = 0,400; 0,44 = 0,440; 0,04 = 0,040. Vậy 0,44 > 0,404 > 0,4 > 0,04."],
["ch","Bài 11","Chữ số nào có thể thay cho □ để 2,7□ > 2,75?",["8","5","4","0"],0,"Phần nguyên và hàng phần mười đều bằng nhau (2 và 7). Hàng phần trăm phải có □ > 5, nên □ là 6; 7; 8 hoặc 9."],
["ch","Bài 11","Có bao nhiêu chữ số thay được cho □ để 4,□5 < 4,25?",["2 chữ số (0 và 1)","1 chữ số","3 chữ số","Nhiều hơn 3 chữ số"],0,"Hàng phần mười phải có □ < 2. Nếu □ = 2 thì hai số bằng nhau (không thỏa mãn). Vậy □ = 0 hoặc 1: có 2 chữ số."],
["vd","Bài 11","Nhảy xa: An 2,35 m; Bình 2,4 m; Chi 2,305 m. Bạn nào nhảy xa nhất?",["Bình","An","Chi","An và Chi bằng nhau"],0,"Viết 2,4 = 2,40. Ta có 2,40 > 2,35 > 2,305. Vậy Bình nhảy xa nhất."],
["vd","Bài 11","Chạy 50 m: Nam 9,8 giây; Hùng 9,75 giây; Tuấn 9,08 giây. Bạn nào chạy nhanh nhất?",["Tuấn","Hùng","Nam","Hùng và Nam"],0,"Chạy càng nhanh thì thời gian càng ít. Viết 9,8 = 9,80: ta có 9,08 < 9,75 < 9,80. Tuấn có thời gian ít nhất nên nhanh nhất."]
];
const T12={dd:"Độ dài",kl:"Khối lượng",dg:"Dung tích",ds:"Diện tích",vd:"Vận dụng"};
const Q12=[
["dd","Bài 12","Điền số thích hợp: 6 dm = … m",["0,6","0,06","6","60"],0,"1 dm = 1/10 m nên 6 dm = 6/10 m = 0,6 m."],
["dd","Bài 12","Điền số thích hợp: 245 cm = … m",["2,45","24,5","0,245","2 045"],0,"245 cm = 245/100 m = 2 45/100 m = 2,45 m."],
["dd","Bài 12","Điền số thích hợp: 35 mm = … cm",["3,5","0,35","35","350"],0,"1 mm = 1/10 cm nên 35 mm = 35/10 cm = 3,5 cm."],
["dd","Bài 12","Điền số thích hợp: 750 m = … km",["0,75","7,5","0,075","75"],0,"750 m = 750/1000 km = 0,750 km = 0,75 km."],
["dd","Bài 12","Điền số thích hợp: 3,2 m = … cm",["320","32","3 200","302"],0,"3,2 m = 3 m 2 dm = 300 cm + 20 cm = 320 cm."],
["dd","Bài 12","Viết 2 m 5 dm dưới dạng số đo có đơn vị là mét:",["2,5 m","2,05 m","25 m","0,25 m"],0,"5 dm = 5/10 m = 0,5 m nên 2 m 5 dm = 2,5 m."],
["dd","Bài 12","Viết 4 m 7 cm dưới dạng số đo có đơn vị là mét:",["4,07 m","4,7 m","47 m","4,007 m"],0,"7 cm = 7/100 m = 0,07 m nên 4 m 7 cm = 4,07 m. Nhớ giữ chữ số 0 ở hàng phần mười!"],
["kl","Bài 12","Viết 2 kg 50 g dưới dạng số đo có đơn vị là ki-lô-gam:",["2,05 kg","2,5 kg","2,005 kg","250 kg"],0,"50 g = 50/1000 kg = 0,05 kg nên 2 kg 50 g = 2,05 kg."],
["kl","Bài 12","Điền số thích hợp: 35 kg = … tấn",["0,035","0,35","3,5","0,0035"],0,"1 kg = 1/1000 tấn nên 35 kg = 35/1000 tấn = 0,035 tấn."],
["kl","Bài 12","Điền số thích hợp: 0,5 kg = … g",["500","50","5","5 000"],0,"0,5 kg = 5/10 kg = 500/1000 kg = 500 g."],
["dg","Bài 12","Điền số thích hợp: 148 ml = … l",["0,148","1,48","14,8","0,0148"],0,"1 ml = 1/1000 l nên 148 ml = 148/1000 l = 0,148 l."],
["dg","Bài 12","Điền số thích hợp: 2,5 l = … ml",["2 500","250","25","2 050"],0,"2,5 l = 2 5/10 l = 2 l 500 ml = 2 500 ml."],
["ds","Bài 12","Điền số thích hợp: 35 dm² = … m²",["0,35","3,5","0,035","35"],0,"1 m² = 100 dm² nên 1 dm² = 1/100 m². Vậy 35 dm² = 35/100 m² = 0,35 m²."],
["ds","Bài 12","Viết 5 m² 8 dm² dưới dạng số đo có đơn vị là mét vuông:",["5,08 m²","5,8 m²","58 m²","5,008 m²"],0,"8 dm² = 8/100 m² = 0,08 m² nên 5 m² 8 dm² = 5,08 m²."],
["vd","Bài 12","Bình có sợi dây dài 100 cm, cắt đi 35 cm. Đoạn dây còn lại dài bao nhiêu mét?",["0,65 m","0,35 m","6,5 m","65 m"],0,"Còn lại 100 − 35 = 65 (cm) = 65/100 m = 0,65 m."]
];

/* ===== BẢNG VINH DANH (xếp theo XP của tất cả học sinh, đọc từ database) ===== */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fr=(n,d)=>`<span class="fr"><i>${n}</i><i>${d}</i></span>`;
// Chuyển "2 3/4" thành hỗn số và "3/5" thành phân số xếp chồng (đã escape HTML)
const fx=s=>String(s)
  .replace(/(?<![\d,])(\d+) (\d+)\/(\d+)(?![\d])/g,(_,w,n,d)=>`<span class="mx">${w}${fr(n,d)}</span>`)
  .replace(/(?<![\d,])(\d+)\/(\d+)(?![\d])/g,(_,n,d)=>fr(n,d))
  .replace(/\^(\d+|□)/g,'<sup>$1</sup>'); // mũ: (−1/2)^4 → (−½)⁴
const fmt=s=>fx(esc(s));
const countDone=d=>d&&typeof d==='object'?Object.keys(d).length:0;
let boardF='all',boardRows=null,boardSeq=0;
function setBoard(f){boardF=f;drawBoard()}
async function renderBoard(){
  const seq=++boardSeq;
  if(!sb)return;
  if(!boardRows)$('rankBoard').innerHTML='<h2>'+stk('star-gold','h-ic')+' Bảng vinh danh</h2><p class="muted">Đang tải bảng xếp hạng…</p>';
  try{
    let {data,error}=await sb.from('profiles').select('id,name,grade,xp,done,avatar').order('xp',{ascending:false}).limit(500);
    if(error)({data,error}=await sb.from('profiles').select('id,name,grade,xp,done').order('xp',{ascending:false}).limit(500)); // cột avatar chưa tạo
    if(error)throw error;
    if(seq!==boardSeq||!user)return;
    boardRows=data||[];
  }catch(_){
    if(seq!==boardSeq||!user)return;
    if(!boardRows){$('rankBoard').innerHTML='<h2>'+stk('star-gold','h-ic')+' Bảng vinh danh</h2><p class="muted">Chưa tải được bảng xếp hạng. Hãy kiểm tra mạng rồi thử lại.</p><button class="btn ghost sm" onclick="renderBoard()">↻ Thử lại</button>';return}
  }
  drawBoard();
}
function drawBoard(){
  if(!user||!boardRows)return;
  const all=boardRows.filter(r=>r.id!==uid).map(r=>({id:r.id,name:r.name,av:r.avatar,g:Number(r.grade)||5,xp:Number(r.xp)||0,n:countDone(r.done)}));
  all.push({id:uid,name:user.name,av:user.av,g:user.grade||5,xp:user.xp,n:countDone(user.done)}); // dòng của mình luôn dùng số liệu mới nhất
  all.sort((a,b)=>b.xp-a.xp||String(a.name).localeCompare(String(b.name),'vi'));
  const gs=[...new Set(all.map(x=>x.g))].sort((a,b)=>a-b);
  if(boardF!=='all'&&!gs.includes(+boardF))boardF='all';
  const list=boardF==='all'?all:all.filter(x=>String(x.g)===boardF);
  const medals=['🥇','🥈','🥉'],me=all.findIndex(x=>x.id===uid),mr=rankOf(user.xp);
  $('rankBoard').innerHTML=`<h2>${stk('star-gold','h-ic')} Bảng vinh danh</h2>
  <p class="muted">Xếp theo tổng XP của tất cả các khối. Làm bài kiểm tra và chơi trò chơi để leo hạng!</p>
  <p class="mine">Vị trí của bạn: <b>#${me+1}</b>/${all.length} · ${rkImg(mr)} ${mr.n} · ${user.xp} XP</p>
  <div class="filters"><button class="${boardF==='all'?'on':''}" onclick="setBoard('all')">Tất cả</button>${gs.map(g=>`<button class="${String(g)===boardF?'on':''}" onclick="setBoard('${g}')">Lớp ${g}</button>`).join('')}<button class="btn ghost sm refresh" onclick="renderBoard()">↻ Làm mới</button></div>
  ${podiumHtml(list,medals)}<ol class="hlist" start="4">${list.slice(3).map((x,j)=>{const i=j+3;const r=rankOf(x.xp);return `<li class="${x.id===uid?'me':''}"><span class="pos">${medals[i]||i+1}</span><span class="av-frame sm" style="--c:${r.c}">${avImg(x.av,x.id)}</span><span class="hn">${esc(x.name)}<small>Lớp ${x.g} · ${x.n} bài đã làm</small></span><span class="hr" style="background:${r.c}">${rkImg(r)} ${r.n}</span><b>${x.xp} XP</b></li>`}).join('')}</ol>
  ${myRankHtml(mr)}<h3>Các hạng</h3><div class="ladder">${RANKS.map(r=>`<span class="${r.n===mr.n?'on':''}" style="--c:${r.c}">${rkImg(r)} ${r.n}<small>${r.min} XP</small></span>`).join('')}</div>`;
}

/* ===== HÀNH TRÌNH ĐẠI THÁNH v2: Tôn Ngộ Không đại chiến yêu quái (pixel) ===== */
const PXD='assets/px/';
const pimg=(n,c='')=>`<img class="${c}" src="${PXD}${n}.webp" alt="" draggable="false">`;
/* ===== TOÁN 7 – SỐ HỮU TỈ (Rational Numbers): 4 đề kiểm tra trắc nghiệm rèn phản xạ ===== */
const T7A={"voc": "Vocabulary", "read": "Reading maths aloud", "opp": "Opposite & reciprocal", "cls": "Rational numbers"};
const Q7A=[
["voc", "Q1", "What is the English for “số hữu tỉ”?", ["rational number", "reciprocal", "fraction", "exponent"], 0, "số hữu tỉ = rational number /ˈræʃənəl ˈnʌmbə(r)/."],
["voc", "Q2", "What is the English for “tử số”?", ["numerator", "denominator", "exponent", "reciprocal"], 0, "tử số = numerator; mẫu số = denominator."],
["voc", "Q3", "What is the English for “mẫu số chung”?", ["common denominator", "equivalent fraction", "opposite number", "order of operations"], 0, "mẫu số chung = common denominator: used to add, subtract and compare fractions."],
["voc", "Q4", "What is the English for “số nghịch đảo”?", ["reciprocal", "opposite number", "exponent", "numerator"], 0, "số nghịch đảo = reciprocal; số đối = opposite number."],
["voc", "Q5", "What is the English for “thứ tự giảm dần”?", ["decreasing order", "increasing order", "order of operations", "equation"], 0, "giảm dần = decreasing (large → small); tăng dần = increasing."],
["voc", "Q6", "In the fraction 7/9, the number 9 is the:", ["denominator", "numerator", "exponent", "reciprocal"], 0, "The bottom number is the denominator (mẫu số); the top is the numerator (tử số)."],
["voc", "Q7", "In 5^3, the number 3 is called the:", ["exponent", "numerator", "denominator", "opposite number"], 0, "In a power, the small raised number is the exponent (số mũ); 5 is the base (cơ số)."],
["read", "Q8", "How do we read −3/4 in English?", ["minus three over four", "three minus over four", "minus four over three", "three over minus four"], 0, "Say the sign first, then “three over four”."],
["read", "Q9", "Which sentence reads (−1/2)^4 correctly?", ["open parenthesis minus one over two close parenthesis raised to the fourth power", "minus one over two times four", "one over two raised to the minus fourth", "minus one over two raised to the second power"], 0, "“Raised to the fourth power” means exponent 4."],
["read", "Q10", "Which expression is read “two over five plus open parenthesis minus two over five close parenthesis equals zero”?", ["2/5 + (−2/5) = 0", "2/5 − (−2/5) = 0", "2/5 × (−2/5) = 0", "2/5 + (−5/2) = 0"], 0, "A number plus its opposite equals zero."],
["opp", "Q11", "The opposite number of 3/5 is:", ["−3/5", "5/3", "−5/3", "3/5"], 0, "Opposite of x is −x, so x + (−x) = 0 / số đối của 3/5 là −3/5."],
["opp", "Q12", "The reciprocal of −2/7 is:", ["−7/2", "7/2", "2/7", "−2/7"], 0, "Flip the fraction and keep the sign: reciprocal of a/b is b/a / số nghịch đảo giữ nguyên dấu."],
["opp", "Q13", "Which number has NO reciprocal?", ["0", "1", "−1", "1/2"], 0, "We cannot divide by 0, so 0 has no reciprocal / số 0 không có số nghịch đảo."],
["cls", "Q14", "0.6 can be written as the fraction:", ["3/5", "6/5", "1/6", "3/50"], 0, "0.6 = 6/10 = 3/5 / viết 0,6 = 6/10 rồi rút gọn."],
["cls", "Q15", "Which statement is TRUE?", ["Every integer is a rational number.", "Every rational number is an integer.", "The number 0 has a reciprocal.", "The opposite of x is 1/x."], 0, "For example −4 = −4/1, so every integer is rational (ℤ ⊂ ℚ)."]
];
const T7B={"eq": "Equivalent fractions", "cmp": "Comparing", "ord": "Ordering", "btw": "Numbers in between"};
const Q7B=[
["eq", "Q1", "Complete: 3/4 = ?/20", ["15", "19", "−15", "17"], 0, "20 ÷ 4 = 5, so multiply the top by 5 too: 3 × 5 = 15. / Nhân cả tử và mẫu với 5."],
["eq", "Q2", "Complete: −5/6 = ?/18", ["−15", "7", "15", "−13"], 0, "18 ÷ 6 = 3, so multiply the top by 3 too: -5 × 3 = -15. / Nhân cả tử và mẫu với 3."],
["eq", "Q3", "Complete: 2/7 = 8/?", ["28", "14", "21", "56"], 0, "2 × 4 = 8, so multiply the denominator by 4: 7 × 4 = 28. / Nhân tử và mẫu với 4."],
["eq", "Q4", "Which fraction is equivalent to 0.4?", ["2/5", "4/5", "1/4", "4/100"], 0, "0.4 = 4/10 = 2/5 / 0,4 = 4/10 = 2/5."],
["eq", "Q5", "Complete: −2 = ?/7", ["−14", "−9", "14", "−5"], 0, "−2 = −2/1 = (−2×7)/(1×7) = −14/7."],
["cmp", "Q6", "Choose the correct symbol: −2/3 □ −3/4", [">", "<", "=", "cannot be compared"], 0, "Convert to a common form: −2/3 = −0.666667, −3/4 = −0.75. Hence −2/3 > −3/4. / Đổi về cùng dạng rồi so sánh."],
["cmp", "Q7", "Choose the correct symbol: −0.6 □ −3/5", ["=", ">", "<", "cannot be compared"], 0, "Convert to a common form: −0.6 = −0.6, −3/5 = −0.6. Hence −0.6 = −3/5. / Đổi về cùng dạng rồi so sánh."],
["cmp", "Q8", "Choose the correct symbol: 5/8 □ 0.6", [">", "<", "=", "cannot be compared"], 0, "Convert to a common form: 5/8 = 0.625, 0.6 = 0.6. Hence 5/8 > 0.6. / Đổi về cùng dạng rồi so sánh."],
["cmp", "Q9", "Choose the correct symbol: −4/5 □ −0.75", ["<", ">", "=", "cannot be compared"], 0, "Convert to a common form: −4/5 = −0.8, −0.75 = −0.75. Hence −4/5 < −0.75. / Đổi về cùng dạng rồi so sánh."],
["cmp", "Q10", "Choose the correct symbol: 7/12 □ 5/8", ["<", ">", "=", "cannot be compared"], 0, "Convert to a common form: 7/12 = 0.583333, 5/8 = 0.625. Hence 7/12 < 5/8. / Đổi về cùng dạng rồi so sánh."],
["ord", "Q11", "Write in increasing order:  1/2; −3/4; 0.4; −1/3", ["−3/4; −1/3; 0.4; 1/2", "1/2; 0.4; −1/3; −3/4", "−3/4; 0.4; −1/3; 1/2", "−1/3; −3/4; 0.4; 1/2"], 0, "Compare as decimals: 1/2 = 0.5, −3/4 = −0.75, 0.4 = 0.4, −1/3 = −0.333333. Small → large."],
["ord", "Q12", "Write in decreasing order:  −0.6; 2/3; 0; −5/8", ["2/3; 0; −0.6; −5/8", "−5/8; −0.6; 0; 2/3", "2/3; −0.6; 0; −5/8", "0; 2/3; −0.6; −5/8"], 0, "Compare as decimals: −0.6 = −0.6, 2/3 = 0.666667, 0 = 0, −5/8 = −0.625. Large → small."],
["ord", "Q13", "Which is the smallest?", ["−5/6", "−3/4", "−0.7", "−2/3"], 0, "−5/6 ≈ −0.833 is farthest to the left on the number line, so it is the smallest. / Số càng xa về bên trái càng bé."],
["btw", "Q14", "Which number lies between −2/3 and −1/2?", ["−7/12", "−3/4", "−5/12", "−1/3"], 0, "Use denominator 12: −8/12 < x < −6/12, so x = −7/12. / Quy đồng mẫu 12."],
["btw", "Q15", "Which number lies between 1/4 and 1/3?", ["7/24", "3/8", "1/5", "1/2"], 0, "Use denominator 24: 6/24 < x < 8/24, so x = 7/24. / Quy đồng mẫu 24."]
];
const T7C={"addsub": "Add & subtract", "muldiv": "Multiply & divide", "order": "Order of operations", "err": "Find the mistake"};
const Q7C=[
["addsub", "Q1", "Calculate: −1/6 + 2/3", ["1/2", "1/9", "−5/6", "−1/2"], 0, "Common denominator 6: −1/6 + 4/6 = 3/6 = 1/2. / Quy đồng mẫu 6."],
["addsub", "Q2", "Calculate: 3/5 − 7/10", ["−1/10", "−4/15", "13/10", "1/10"], 0, "Common denominator 10: 6/10 − 7/10 = −1/10."],
["addsub", "Q3", "Calculate: −5/8 − 1/4", ["−7/8", "−1/2", "−3/8", "7/8"], 0, "Common denominator 8: −5/8 − 2/8 = −7/8."],
["addsub", "Q4", "Calculate: 4/9 − (−1/6)", ["11/18", "1/3", "5/18", "−11/18"], 0, "Subtracting a negative = adding: 4/9 + 1/6 = 8/18 + 3/18 = 11/18. / Trừ số âm = cộng số dương."],
["addsub", "Q5", "Calculate: −3/4 + 5/6", ["1/12", "1/5", "−19/12", "−1/12"], 0, "Common denominator 12: −9/12 + 10/12 = 1/12."],
["muldiv", "Q6", "Calculate: −3/5 × 10/9", ["−2/3", "2/3", "23/45", "−27/50"], 0, "−(3×10)/(5×9) = −30/45 = −2/3. Different signs → negative."],
["muldiv", "Q7", "Calculate: −7/12 × (−6/7)", ["1/2", "−1/2", "−121/84", "49/72"], 0, "Two negatives → positive: (7×6)/(12×7) = 42/84 = 1/2."],
["muldiv", "Q8", "Calculate: 4/15 × (−5/8)", ["−1/6", "1/6", "−43/120", "−32/75"], 0, "−(4×5)/(15×8) = −20/120 = −1/6."],
["muldiv", "Q9", "Calculate: −5/6 : 10/9", ["−3/4", "−25/27", "3/4", "−4/3"], 0, "Multiply by the reciprocal: −5/6 × 9/10 = −45/60 = −3/4. / Nhân với số nghịch đảo của số chia."],
["muldiv", "Q10", "Calculate: 3/8 : (−9/16)", ["−2/3", "−27/128", "2/3", "−3/2"], 0, "3/8 × (−16/9) = −48/72 = −2/3."],
["order", "Q11", "Calculate: 1/2 − 3/4 × 2/3", ["0", "−1/6", "1/6", "1/4"], 0, "Multiply first: 3/4 × 2/3 = 1/2. Then 1/2 − 1/2 = 0. / Nhân trước, trừ sau."],
["order", "Q12", "Calculate: (−1/3 + 5/6) : 3/2", ["1/3", "3/4", "−1/3", "1/2"], 0, "Brackets: −2/6 + 5/6 = 1/2. Then 1/2 : 3/2 = 1/2 × 2/3 = 1/3."],
["order", "Q13", "Calculate: 1 − [1/2 − (−1/4)]", ["1/4", "3/4", "5/4", "−1/4"], 0, "Inner bracket: 1/2 + 1/4 = 3/4. Then 1 − 3/4 = 1/4."],
["order", "Q14", "Calculate: (−1/2)^3 + 3/4 : 3", ["1/8", "−3/8", "−1/8", "3/8"], 0, "Power: (−1/2)^3 = −1/8. Division: 3/4 : 3 = 1/4. Sum: −1/8 + 2/8 = 1/8."],
["err", "Q15", "A learner writes 1/3 + 1/4 = 2/7. What is the mistake?", ["Added numerators and denominators separately", "Forgot to simplify", "Used the wrong common denominator 6", "There is no mistake"], 0, "Fractions must have a common denominator first: 1/3 + 1/4 = 4/12 + 3/12 = 7/12. / Phải quy đồng mẫu số rồi mới cộng tử."]
];
const T7D={"pow": "Powers", "eqn": "Equations", "prob": "Word problems"};
const Q7D=[
["pow", "Q1", "Calculate (−2/3)^3", ["−8/27", "8/27", "−8/9", "−2/9"], 0, "(−2)^3 / 3^3 = −8/27. Odd exponent → the result stays negative. / Số mũ lẻ → kết quả âm."],
["pow", "Q2", "Calculate (−1/2)^4", ["1/16", "−1/16", "1/8", "−1/8"], 0, "(−1)^4 / 2^4 = 1/16. Even exponent → positive. / Số mũ chẵn → kết quả dương."],
["pow", "Q3", "(3/4)^2 · (3/4)^3 = ?", ["(3/4)^5", "(3/4)^6", "(9/16)^3", "(3/4)^1"], 0, "Same base: add the exponents, 2 + 3 = 5. / Cùng cơ số: cộng số mũ."],
["pow", "Q4", "(−5/6)^7 : (−5/6)^4 = ?", ["(−5/6)^3", "(−5/6)^11", "(−5/6)^28", "(−5/6)^2"], 0, "Same base: subtract the exponents, 7 − 4 = 3. / Cùng cơ số: trừ số mũ."],
["pow", "Q5", "((2/5)^2)^3 = ?", ["(2/5)^6", "(2/5)^5", "(2/5)^8", "(2/5)^9"], 0, "Power of a power: multiply the exponents, 2 × 3 = 6. / Lũy thừa của lũy thừa: nhân số mũ."],
["eqn", "Q6", "Find x: x + 1/2 = 3/4", ["1/4", "5/4", "−1/4", "3/8"], 0, "x = 3/4 − 1/2 = 3/4 − 2/4 = 1/4. / Chuyển vế: đổi dấu."],
["eqn", "Q7", "Find x: x − 2/3 = −1/6", ["1/2", "−5/6", "5/6", "−1/2"], 0, "x = −1/6 + 2/3 = −1/6 + 4/6 = 3/6 = 1/2."],
["eqn", "Q8", "Find x: 2/5 · x = −4/15", ["−2/3", "2/3", "−8/75", "−3/2"], 0, "x = −4/15 : 2/5 = −4/15 × 5/2 = −20/30 = −2/3."],
["eqn", "Q9", "Find x: (−5/6) · x = 5/12", ["−1/2", "1/2", "−25/72", "−2"], 0, "x = 5/12 : (−5/6) = 5/12 × (−6/5) = −30/60 = −1/2."],
["eqn", "Q10", "Find x: x : 3/4 = 4/9", ["1/3", "16/27", "3/16", "−1/3"], 0, "x = 4/9 × 3/4 = 12/36 = 1/3. / Số bị chia = thương × số chia."],
["prob", "Q11", "At 6 a.m. the temperature is −4.2°C. It rises by 9.0°C by noon, then falls by 3.8°C in the evening. The evening temperature is:", ["1.0°C", "−1.0°C", "8.6°C", "4.8°C"], 0, "−4.2 + 9.0 = 4.8; then 4.8 − 3.8 = 1.0. Answer 1.0°C."],
["prob", "Q12", "A tank is 5/6 full. Then 1/3 of the tank’s total capacity is used. What fraction of the tank is still full?", ["1/2", "5/18", "7/6", "4/3"], 0, "5/6 − 1/3 = 5/6 − 2/6 = 3/6 = 1/2. / Cả hai phân số đều tính trên cả bể."],
["prob", "Q13", "A 4.5 m ribbon is cut into two pieces: 1 1/2 m and 2 1/4 m. How much ribbon is left?", ["0.75 m", "3.75 m", "2.25 m", "1.25 m"], 0, "1 1/2 + 2 1/4 = 3.75 m; 4.5 − 3.75 = 0.75 m (= 3/4 m)."],
["prob", "Q14", "A bottle holds 3.2 L of juice. 3/4 L is used at lunch and another 0.55 L later. How much juice remains?", ["1.9 L", "2.45 L", "2.31 L", "4.5 L"], 0, "3/4 L = 0.75 L. 3.2 − 0.75 − 0.55 = 1.9 L."],
["prob", "Q15", "Which statement is ALWAYS true?", ["The product of two negative rational numbers is positive.", "The sum of two rational numbers is positive.", "Every rational number has a reciprocal.", "A power of a negative number is negative."], 0, "(−a)·(−b) = a·b > 0. The other statements have counter-examples (−1 + 0, the number 0, (−1)^2). / Mỗi câu còn lại đều có phản ví dụ."]
];
// Mỗi đề test = một chặng đường. id cũ 'dt-b1-9' được giữ nguyên để không mất tiến độ.
const DT_SETS=[
 {id:'dt-b1-9',name:'Bài 1–9',desc:'Ôn tập & bổ sung',T:DT_T,Q:DT_Q,cover:'dm-1'},
 {id:'dt-b10',name:'Bài 10',desc:'Khái niệm số thập phân',T:T10,Q:Q10,cover:'dm-2'},
 {id:'dt-b11',name:'Bài 11',desc:'So sánh các số thập phân',T:T11,Q:Q11,cover:'dm-3'},
 {id:'dt-b12',name:'Bài 12',desc:'Viết số đo dưới dạng số thập phân',T:T12,Q:Q12,cover:'ds-2'},
 {id:'dt7-vocab',grade:7,name:'Rational Numbers · Test 1',desc:'Từ vựng, cách đọc, số đối & số nghịch đảo',T:T7A,Q:Q7A,cover:'dm-1'},
 {id:'dt7-compare',grade:7,name:'Rational Numbers · Test 2',desc:'Phân số bằng nhau, so sánh, sắp xếp',T:T7B,Q:Q7B,cover:'dm-2'},
 {id:'dt7-ops',grade:7,name:'Rational Numbers · Test 3',desc:'Cộng, trừ, nhân, chia, thứ tự phép tính',T:T7C,Q:Q7C,cover:'dm-3'},
 {id:'dt7-power',grade:7,name:'Rational Numbers · Test 4',desc:'Lũy thừa, phương trình, bài toán thực tế',T:T7D,Q:Q7D,cover:'ds-2'}
];
let dt=null,dtMuted=false,dtAC=null;
try{dtMuted=localStorage.getItem('mute')==='1'}catch(_){}
function dtTone(f,d,s,ty,v){const t=dtAC.currentTime+s,o=dtAC.createOscillator(),g=dtAC.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(dtAC.destination);o.start(t);o.stop(t+d+.05)}
function dtSfx(k){if(dtMuted)return;try{dtAC=dtAC||new(window.AudioContext||window.webkitAudioContext)();if(dtAC.state==='suspended')dtAC.resume();
  const S={ok:[[660,0],[880,.1]],no:[[220,0],[165,.14]],hit:[[330,0],[520,.06],[780,.12]],win:[[523,0],[659,.14],[784,.28],[1047,.42]],lose:[[392,0],[349,.16],[330,.32],[262,.48]]};
  (S[k]||[]).forEach(([f,s])=>dtTone(f,.25,s,k==='no'?'sawtooth':'triangle',.16))}catch(_){}}
const FOE_S=['ds-1','ds-2','ds-3','ds-4'],FOE_B=['dm-2','dm-3'];
function dtFoe(i,n){ // tiểu yêu → yêu tướng → yêu vương (câu cuối)
  if(i===n-1)return{s:'dm-1',k:'boss',nm:'Yêu vương'};
  if(i%3===2)return{s:FOE_B[Math.floor(i/3)%2],k:'big',nm:'Yêu tướng'};
  return{s:FOE_S[i%4],k:'sml',nm:'Tiểu yêu'};
}
const dtMax=S=>S.Q.length*6+(S.Q.length-2)*2+40;
function dtCards(){
  return DT_SETS.map((S,k)=>{if((S.grade||5)!==curG)return '';const b=user.done[S.id],n=S.Q.length;
  return `<article class="card arcade"><div class="cover px-cover dg-cover">${pimg('mk-act','c-hero')}<b>VS</b>${pimg(S.cover,'c-foe')}</div><div class="cbody"><span class="tag m">Trò chơi pixel</span>${asgTag(S.id)}<h3>${S.grade===7?'Kiểm tra · '+S.name:(S.id==='dt-b10'||S.id==='dt-b11')?'BÀI TẬP '+S.name.toUpperCase():'Đề test '+S.name}</h3>
  <small>${S.desc} · ${n} câu · giữ chuỗi đúng để nhận thêm điểm · tối đa ${dtMax(S)} XP lần đầu</small>
  <small>${b===undefined?'Chưa làm':'Điểm cao nhất: '+b+'/'+n+' · làm lại nhận 20% XP'}</small>
  <button class="btn go" style="width:auto" onclick="dtStart(${k})">${b===undefined?'Bắt đầu':'Chơi lại'}</button></div></article>`}).join('');
}
function dtStart(k){
  dt={k,S:DT_SETS[k],i:0,xp:0,st:0,best:0,ans:[],t0:Date.now()};
  $('dt').classList.remove('hidden');document.body.style.overflow='hidden';$('dt').scrollTop=0;dtSfx('ok');dtShow();
}
function dtClose(){$('dt').classList.add('hidden');document.body.style.overflow='';renderEx()}
function dtShow(){
  delete $('dtbox').dataset.r;
  const S=dt.S,N=S.Q.length,q=S.Q[dt.i],foe=dtFoe(dt.i,N);
  dt.cur=sh(q[3].map((t,k)=>({t,c:k===q[4]})));
  $('dtbox').innerHTML=`<div class="px-hud"><span class="px-t">LV ${String(dt.i+1).padStart(2,'0')}/${N}</span><span class="px-t gold" id="dtxp">${pimg('coin','hud-ic')} ${dt.xp}</span><span class="px-t fire" id="dtst">${pimg('qblock','hud-ic')} x${dt.st}</span><span class="px-ctl"><button type="button" class="btn ghost sm" id="dtmute">${dtMuted?'🔇':'🔊'}</button><button type="button" class="btn ghost sm" id="dtquit">Thoát</button></span></div>
  <div class="px-track" style="grid-template-columns:repeat(${N},1fr)">${Array.from({length:N},(_,k)=>`<i class="${k<dt.ans.length?(dt.ans[k].ok?'ok':'no'):k===dt.i?'now':''}"></i>`).join('')}</div>
  <div class="dg-stage">${pimg('cloud','dg-cloud dgc1')}${pimg('cloud','dg-cloud dgc2')}
    <div class="dg-hero">${pimg('mk-front')}</div>
    <div class="dg-foe ${foe.k}"><div class="dg-hp"><i></i></div>${pimg(foe.s)}</div>
    <span class="dg-spark ok"></span><span class="dg-spark no"></span><span class="dg-boom" id="dgpop"></span></div>
  <div class="dg-q">${pimg('scroll','dg-sc')}<div><p class="px-sub">${foe.nm} chặn đường · ${q[1]} · ${S.T[q[0]]}</p><h2 class="dtq">${fmt(q[2])}</h2></div></div>
  <div class="qopts" id="dtopts">${dt.cur.map((o,k)=>`<button type="button" data-k="${k}">${'ABCD'[k]}. ${fmt(o.t)}</button>`).join('')}</div><div id="dtfb"></div>`;
  document.querySelectorAll('#dtopts button').forEach(b=>b.onclick=()=>dtPick(+b.dataset.k));
  $('dtmute').onclick=()=>{dtMuted=!dtMuted;try{localStorage.setItem('mute',dtMuted?'1':'0')}catch(_){}$('dtmute').textContent=dtMuted?'🔇':'🔊'};
  $('dtquit').onclick=()=>{if(confirm('Thoát bây giờ sẽ không được tính điểm. Bạn chắc chứ?'))dtClose()};
}
function dtPick(k){
  if(!dt||$('dtbox').dataset.r)return; // chỉ chọn một lần mỗi câu
  const S=dt.S,N=S.Q.length,q=S.Q[dt.i],ok=dt.cur[k].c;
  document.querySelectorAll('#dtopts button').forEach((b,j)=>{b.disabled=true;if(dt.cur[j].c)b.classList.add('ok');else if(j===k)b.classList.add('no')});
  let gain=0;
  if(ok){dt.st++;dt.best=Math.max(dt.best,dt.st);gain=6+(dt.st>=3?2:0);dt.xp+=gain}else dt.st=0;
  dt.ans.push({q,ok,pick:dt.cur[k].t});dtSfx(ok?'hit':'no');
  $('dtxp').innerHTML=pimg('coin','hud-ic')+' '+dt.xp;$('dtst').innerHTML=pimg('qblock','hud-ic')+' x'+dt.st;
  document.querySelectorAll('.px-track i')[dt.i].className=ok?'ok':'no';
  const hero=document.querySelector('.dg-hero img'),pop=$('dgpop');
  if(ok&&hero)hero.src=PXD+'mk-act.webp'; // Ngộ Không lao lên vung gậy
  pop.textContent=ok?`+${gain}${dt.st>=3?' COMBO!':''}`:'Ái chà!';pop.className='dg-boom '+(ok?'ok':'no');
  $('dtbox').dataset.r=ok?'ok':'no';
  $('dtfb').innerHTML=`<div class="dtfb ${ok?'ok':'no'}">${ok?(dt.st>=3?`🔥 Chuỗi ${dt.st} câu đúng! `:'✅ Chính xác! '):'❌ Chưa đúng rồi. '}${fmt(q[5])}</div>
  <button type="button" class="btn go" style="width:auto;margin-top:14px" id="dtnx">${dt.i<N-1?'Câu tiếp theo →':'Xem kết quả 🏆'}</button>`;
  $('dtnx').onclick=()=>{dt.i++;dt.i<N?dtShow():dtEnd()};$('dtnx').focus({preventScroll:true});
}
// phím tắt: A–D hoặc 1–4 để chọn đáp án
document.addEventListener('keydown',e=>{
  if(!dt||$('dt').classList.contains('hidden')||e.ctrlKey||e.metaKey||e.altKey)return;
  const i='abcd'.indexOf(e.key.toLowerCase()),j='1234'.indexOf(e.key),k=i>=0?i:j;
  if(k>=0&&document.querySelector('#dtopts button:not(:disabled)')&&!(document.activeElement||{}).matches?.('input,textarea'))dtPick(k);
});
function dtEnd(){
  const S=dt.S,N=S.Q.length,n=dt.ans.filter(a=>a.ok).length,sec=Math.round((Date.now()-dt.t0)/1000),ratio=n/N;
  let raw=dt.xp;if(n>=Math.ceil(N*.6))raw+=10;if(n===N)raw+=30;
  const first=!(S.id in user.done),gain=Math.round(raw*(first?1:REPLAY));
  user.done[S.id]=Math.max(user.done[S.id]||0,n);addXp(gain);
  const lv=ratio>=.87?'Đại Thánh Toán học':ratio>=.67?'Chiến binh Giỏi':ratio>=.47?'Thám hiểm Khá':'Mầm non Cố gắng';
  const gr={};dt.ans.forEach(a=>{const k=a.q[0];gr[k]=gr[k]||[0,0];gr[k][1]++;if(a.ok)gr[k][0]++});
  const rows=Object.keys(gr).map(k=>{const r=gr[k][0]/gr[k][1],c=r>=1?'#16B364':r>=.5?'#FFC93C':'#D12F35';return `<div class="dtrow"><span>${S.T[k]}</span><div class="rbar"><i style="width:${r*100}%;background:${c}"></i></div><b>${gr[k][0]}/${gr[k][1]}</b></div>`}).join('');
  const weak=Object.keys(gr).filter(k=>gr[k][0]<gr[k][1]).map(k=>S.T[k]);
  const wrong=dt.ans.filter(a=>!a.ok),mr=rankOf(user.xp);
  {const tp={};dt.ans.forEach(a=>{const t=S.T[a.q[0]];(tp[t]=tp[t]||[0,0])[1]++;if(a.ok)tp[t][0]++});
   const co=a=>[a.q[3][a.q[4]],...a.q[3].filter((_,i)=>i!==a.q[4])];
   logAttempt({k:'test',id:S.id,t:'Đề test '+S.name,g:curG,ok:n,n:N,s:sec,xp:gain,tp,w:wrong.map(a=>({q:a.q[2],o:co(a),t:S.T[a.q[0]]})),r:dt.ans.filter(a=>a.ok).map(a=>a.q[2])})}
  $('dtbox').innerHTML=`<div style="text-align:center"><p class="px-t clear">${ratio>=.47?'GAME CLEAR!':'GAME OVER'}</p>
  <div class="px-res dg-res">${pimg('mk-pose')}${pimg('scroll')}${rkImg(mr,'res-rk')}</div><h2>${lv}</h2><h2>${n}/${N} câu đúng</h2>
  <p class="gain">+${gain} XP</p><p class="muted">${first?'Lần đầu nhận đủ XP.':'Làm lại chỉ nhận 20% XP.'} ${pimg('coin','hud-ic')} ${dt.xp} điểm · 🔥 chuỗi dài nhất ${dt.best} · ⏱ ${Math.floor(sec/60)} phút ${sec%60} giây<br>Tổng: ${user.xp} XP · Hạng ${mr.n}</p></div>
  <h3>Bản đồ năng lực</h3>${rows}<p class="muted">${weak.length?'Cần ôn thêm: <b>'+weak.join(', ')+'</b>.':'Bạn đúng ở mọi nội dung. Tuyệt vời!'}</p>
  ${wrong.length?'<h3>Các câu cần xem lại</h3>'+wrong.map(a=>`<div class="rv"><b>${a.q[1]}:</b> ${fmt(a.q[2])}<br><span class="bad">Bạn chọn: ${fmt(a.pick)}</span><br><span class="good">Đáp án: ${fmt(a.q[3][a.q[4]])}</span><br><em>${fmt(a.q[5])}</em></div>`).join(''):''}
  <div class="qnav"><button type="button" class="btn ghost" onclick="dtClose()">Đóng</button><button type="button" class="btn ghost" onclick="dtClose();view('levels')">🏆 Xem vinh danh</button><button type="button" class="btn go" style="width:auto" onclick="dtStart(${dt.k})">Chơi lại</button></div>`;
  $('dt').scrollTop=0;dtSfx(ratio>=.47?'win':'lose');
}

function myRankHtml(mr){
  const nx=RANKS[RANKS.indexOf(mr)+1],pct=nx?(user.xp-mr.min)/(nx.min-mr.min)*100:100;
  return `<div class="myrank" style="--c:${mr.c}">${rkImg(mr,'mr-img')}<div><small>Hạng hiện tại của bạn</small><h3>${mr.n}</h3><div class="rbar"><i style="width:${pct}%;background:${mr.c}"></i></div><small>${nx?`Còn ${nx.min-user.xp} XP để lên ${nx.n}`:'Bạn đã đạt hạng cao nhất!'}</small></div></div>`;
}
/* Bục vinh danh top 3 */
function podiumHtml(list,medals){
  const top=list.slice(0,3),crown=[stk('math-star','crown-img'),'',''];
  return '<div class="podium">'+[1,0,2].filter(i=>top[i]).map(i=>{const x=top[i],r=rankOf(x.xp);
    return `<div class="pd p${i+1} ${x.id===uid?'me':''}"><span class="crown">${crown[i]}</span><div class="av" style="--c:${r.c}">${avImg(x.av,x.id)}</div><b class="pn">${esc(x.name)}</b><small>${rkImg(r)} ${r.n}</small><div class="step"><em>${medals[i]}</em><strong>${x.xp} XP</strong></div></div>`}).join('')+'</div>';
}

/* ===== THỐNG KÊ HỌC TẬP (nhật ký từng lượt làm bài → Supabase bảng "attempts", có dự phòng localStorage) ===== */
const GOAL=20,KIND={quiz:'✏️',test:'🎮',game:'⚡',doc:'📖',review:'🔁',hw:'📝'};
let ATT=[],attErr=false,attBusy=false;
const attKey=()=>'att:'+uid;
const attSave=()=>{try{localStorage.setItem(attKey(),JSON.stringify(ATT.slice(0,300)))}catch(_){}};
const dayKey=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const topicOf=q=>(String(q).match(/^(Bài \d+)/)||[])[1]||'Khác';
const pc=(a,b)=>b?Math.round(a/b*100):0;
const clr=p=>p>=80?'#16B364':p>=50?'#FFC93C':'#D12F35';
const dur=s=>s>=3600?Math.floor(s/3600)+'g '+Math.round(s%3600/60)+'p':s>=60?Math.round(s/60)+' phút':s+' giây';
const fd=d=>d===dayKey(Date.now())?'Hôm nay':d===dayKey(Date.now()-864e5)?'Hôm qua':d.split('-').reverse().join('/');
const mastGet=()=>{try{return new Set(JSON.parse(localStorage.getItem('mast:'+uid)||'[]'))}catch(_){return new Set()}};
const mastSet=s=>{try{localStorage.setItem('mast:'+uid,JSON.stringify([...s].slice(-500)))}catch(_){}};
async function syncAtt(){
  if(!sb||!user||attBusy)return;attBusy=true;
  try{for(const a of ATT.filter(x=>x.p)){
    const {error}=await sb.from('attempts').insert({user_id:uid,kind:a.k,item_id:a.id,item_title:a.t,grade:a.g,correct:a.ok,total:a.n,secs:a.s,xp:a.xp,topics:a.tp,wrong:a.w,created_at:a.at});
    if(error)throw error;delete a.p}attErr=false}
  catch(_){attErr=true}
  attBusy=false;attSave();
}
function logAttempt(o){ // o: {k,id,t,g,ok,n,s,xp,tp,w:[câu sai],r:[câu đúng]}
  if(!user)return;
  const M=mastGet(),known=q=>ATT.some(a=>(a.w||[]).some(w=>w.q===q));
  (o.w||[]).forEach(w=>M.delete(w.q));(o.r||[]).filter(known).forEach(q=>M.add(q));mastSet(M);
  ATT.unshift({k:o.k,id:o.id,t:o.t,g:o.g||curG,ok:o.ok||0,n:o.n||0,s:o.s||0,xp:o.xp||0,tp:o.tp||{},w:(o.w||[]).slice(0,20),at:new Date().toISOString(),p:1});
  attSave();syncAtt();
}
async function loadAtt(){
  let loc=[];try{loc=JSON.parse(localStorage.getItem(attKey())||'[]')}catch(_){}
  ATT=loc;if(!sb)return;
  try{
    const {data,error}=await sb.from('attempts').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(300);
    if(error)throw error;
    ATT=[...loc.filter(a=>a.p),...data.map(r=>({k:r.kind,id:r.item_id,t:r.item_title,g:r.grade,ok:r.correct,n:r.total,s:r.secs,xp:r.xp,tp:r.topics||{},w:r.wrong||[],at:r.created_at}))]
      .sort((a,b)=>b.at.localeCompare(a.at));
    attErr=false;attSave();syncAtt();
  }catch(_){attErr=true}
}
function wrongBank(g){
  const M=mastGet(),seen=new Set(),out=[];
  ATT.forEach(a=>(a.w||[]).forEach(w=>{if((g&&a.g!==g)||seen.has(w.q)||M.has(w.q))return;seen.add(w.q);out.push(w)}));
  return out;
}
const reviewCard=()=>{const n=wrongBank(curG).length;
  return n?`<article class="card">${cov(null,'ex')}<div class="cbody"><span class="tag m">Ôn tập thông minh</span><h3>Ôn lại câu đã sai</h3><small>${n} câu bạn từng làm sai · không tính XP</small><button class="btn go" style="width:auto" onclick="startReview(curG)">Ôn ngay</button></div></article>`:''};
function startReview(g){
  const b=sh(wrongBank(g)).slice(0,10);
  if(!b.length){toast('Bạn chưa có câu sai nào cần ôn 🎉');return}
  cur={id:'review',title:'ÔN CÂU ĐÃ SAI',min:0,grade:g||curG,review:true,q:b.map(w=>({l:'mid',q:w.q,o:w.o}))};
  startQuiz();
}
const I=(p,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC={flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',ok:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',up:'<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',file:'<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'};
const fdt=t=>{const d=new Date(t);return d.toLocaleDateString('vi-VN')+' '+d.toTimeString().slice(0,5)};
function renderStats(){
  if(!user)return;
  const days={};
  ATT.forEach(a=>{const d=dayKey(a.at),x=days[d]=days[d]||{l:[],ok:0,n:0,s:0,xp:0};x.l.push(a);x.ok+=a.ok;x.n+=a.n;x.s+=a.s;x.xp+=a.xp});
  const keys=Object.keys(days).sort().reverse(),T=ATT.reduce((t,a)=>(t.ok+=a.ok,t.n+=a.n,t.s+=a.s,t),{ok:0,n:0,s:0});
  const td=days[dayKey(Date.now())]||{n:0,ok:0,s:0,xp:0};
  let streak=0;for(let t=new Date();;t.setDate(t.getDate()-1)){if(days[dayKey(t)])streak++;else if(streak||dayKey(t)!==dayKey(Date.now()))break}
  const rng=(a,b)=>{let ok=0,n=0;for(let i=a;i<b;i++){const t=new Date();t.setDate(t.getDate()-i);const x=days[dayKey(t)];if(x){ok+=x.ok;n+=x.n}}return[ok,n]};
  const w1=rng(0,7),w0=rng(7,14),dl=w1[1]&&w0[1]?pc(...w1)-pc(...w0):null;
  const bars=Array.from({length:14},(_,i)=>{const t=new Date();t.setDate(t.getDate()-13+i);return{x:days[dayKey(t)],l:t.getDate()+'/'+(t.getMonth()+1)}});
  const mx=Math.max(GOAL,...bars.map(b=>b.x?b.x.n:0));
  const tp={};ATT.forEach(a=>Object.entries(a.tp||{}).forEach(([k,v])=>{const x=tp[k]=tp[k]||[0,0];x[0]+=v[0];x[1]+=v[1]}));
  const tl=Object.entries(tp).filter(([,v])=>v[1]>=2).sort((a,b)=>pc(...a[1])-pc(...b[1]));
  const weak=tl.filter(([,v])=>pc(...v)<70).slice(0,3).map(([k])=>k),wb=wrongBank().length;
  const gp=Math.min(100,pc(td.n,GOAL)),C=2*Math.PI*42;
  const bd=(t,c='')=>`<span class="ub ${c}">${t}</span>`;
  const kpi=(ic,t,v,d)=>`<div class="uc kp"><div class="uc-h"><span>${t}</span>${I(IC[ic])}</div><div class="kv">${v}</div><p class="ud">${d}</p></div>`;
  const hs=(SUBS||[]).slice(0,8),hg=(SUBS||[]).filter(s=>s.status==='graded'),hav=hg.length?hg.reduce((t,s)=>t+Number(s.score)/Number(s.max_score||10)*10,0)/hg.length:null;
  const stB=s=>s.status==='graded'?bd('Đã chấm','green'):s.status==='redo'?bd('Làm lại','red'):bd('Chờ chấm','amber');
  $('statsBody').innerHTML=`<div class="ui">
  ${attErr||ATT.some(a=>a.p)?'<div class="ualert">Một số kết quả chưa đồng bộ lên hệ thống nên thầy cô chưa xem được. Dữ liệu vẫn được giữ trên máy này và tự gửi lại khi có mạng.</div>':''}
  <div class="ugrid4">
    ${kpi('flame','Chuỗi ngày học',streak+' <small>ngày</small>',streak?'Học liên tiếp, giữ vững nhé!':'Hãy học hôm nay để bắt đầu chuỗi')}
    ${kpi('ok','Độ chính xác',pc(T.ok,T.n)+'%',`${T.ok}/${T.n} câu đúng`)}
    ${kpi('clock','Thời gian học',dur(T.s),'Tổng thời gian làm bài')}
    ${kpi('up','7 ngày qua',w1[1]?pc(...w1)+'%':'—',dl===null?'Chưa đủ dữ liệu để so sánh':bd((dl>=0?'+':'')+dl+'%',dl>=0?'green':'red')+' so với tuần trước')}
  </div>
  <div class="ugrid2">
    <div class="uc"><div class="uc-h col"><h3>Hoạt động 14 ngày gần đây</h3><p class="ud">Chiều cao = số câu đã làm · màu = độ chính xác · đường nét đứt = mục tiêu ${GOAL} câu</p></div>
      <div class="uchart"><i class="gl" style="bottom:${GOAL/mx*100}%"></i>${bars.map(b=>`<div class="uc-col" title="${b.x?b.x.n+' câu · '+pc(b.x.ok,b.x.n)+'% đúng':'Không học'}"><div class="bw"><i style="height:${b.x?Math.max(4,b.x.n/mx*100):0}%;background:${b.x?clr(pc(b.x.ok,b.x.n)):'transparent'}"></i></div><small>${b.l}</small></div>`).join('')}</div></div>
    <div class="uc"><div class="uc-h col"><h3>Mục tiêu hôm nay</h3><p class="ud">${td.n>=GOAL?'Đã hoàn thành mục tiêu!':'Còn '+(GOAL-td.n)+' câu nữa'}</p></div>
      <div class="ring"><svg viewBox="0 0 100 100" width="132" height="132"><circle cx="50" cy="50" r="42" fill="none" stroke="#f4f4f5" stroke-width="10"/><circle cx="50" cy="50" r="42" fill="none" stroke="${gp>=100?'#16B364':'#1E5EFF'}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C*gp/100} ${C}" transform="rotate(-90 50 50)"/></svg><div><b>${td.n}</b><small>/ ${GOAL} câu</small></div></div>
      <p class="ud ctr">${td.ok}/${td.n} đúng · ${dur(td.s)} · +${td.xp} XP</p></div>
  </div>
  <div class="uc"><div class="uc-h col"><h3>Bài tự luận đã nộp</h3><p class="ud">${hs.length?'Mỗi bài cho biết bạn đã nộp cho thầy/cô nào và kết quả chấm.'+(hav!==null?' Điểm trung bình: <b>'+fnum(hav)+'/10</b>.':''):'Bạn chưa nộp bài tự luận nào.'}</p></div>
    ${hs.length?`<div class="utw"><table class="ut"><thead><tr><th>Bài</th><th>Gửi cho</th><th>Nộp lúc</th><th>Trạng thái</th><th class="r">Điểm</th></tr></thead><tbody>${hs.map(s=>`<tr onclick="openHw('${esc(s.item_id)}')"><td class="w">${esc(s.item_title)}</td><td>${esc(tl(s.teacher_id||s.graded_by))}</td><td>${fdt(s.created_at)}</td><td>${stB(s)}</td><td class="r"><b>${s.status==='graded'?fnum(s.score)+'/'+fnum(s.max_score||10):'—'}</b></td></tr>`).join('')}</tbody></table></div>`:''}</div>
  <div class="uc"><div class="uc-h col"><h3>Mức nắm vững theo nội dung</h3><p class="ud">Phần nào còn yếu sẽ nằm ở đầu danh sách.</p></div>
    ${tl.length?tl.map(([k,v])=>{const p=pc(...v);return `<div class="utp"><span>${esc(k)}</span><div class="ubar"><i style="width:${p}%;background:${clr(p)}"></i></div><b>${p}%</b><small>${v[0]}/${v[1]}</small></div>`}).join(''):'<p class="ud">Làm vài bài để xem bản đồ năng lực của bạn.</p>'}
    ${weak.length?`<div class="ualert info">Gợi ý: nên ôn thêm <b>${weak.map(esc).join(', ')}</b>.</div>`:''}
    ${wb?`<button class="btn go" style="width:auto;margin-top:12px" onclick="startReview()">Ôn ${Math.min(wb,10)} câu đã sai</button>`:''}</div>
  <div class="uc"><div class="uc-h col"><h3>Lịch sử từng buổi học</h3><p class="ud">10 buổi gần nhất. Bấm vào để xem chi tiết.</p></div>
    ${keys.length?keys.slice(0,10).map((d,i)=>{const x=days[d];return `<details class="uday"${i===0?' open':''}><summary><b>${fd(d)}</b><span>${x.l.length} lượt · ${x.ok}/${x.n} đúng (${pc(x.ok,x.n)}%) · ${dur(x.s)} · +${x.xp} XP</span></summary>${x.l.map(a=>`<div class="uatt"><span>${new Date(a.at).toTimeString().slice(0,5)}</span><span class="w">${KIND[a.k]||'•'} ${esc(a.t)}</span><b style="color:${a.n?clr(pc(a.ok,a.n)):'inherit'}">${a.n?a.ok+'/'+a.n:'—'}</b><small>${a.s?dur(a.s)+' · ':''}+${a.xp} XP</small></div>`).join('')}</details>`}).join(''):'<p class="ud">Chưa có buổi học nào. Hãy làm một bài tập nhé!</p>'}</div>
  </div>`;
}
$('navStats').onclick=e=>{e.preventDefault();view('stats')};
$('backStats').onclick=()=>view('levels');

/* ===== BÀI THẦY CÔ GIAO & NHẮC ÔN TẬP (bảng "assignments"; hoàn thành = có lượt làm bài sau lúc giao) ===== */
let ASG=[];
const dueOf=a=>a.due_date?new Date(a.due_date+'T23:59:59'):null;
const fmtDue=a=>a.due_date?a.due_date.split('-').reverse().join('/'):'';
async function loadAssign(){
  if(!sb||!user){ASG=[];return}
  try{
    const {data,error}=await sb.from('assignments').select('*').order('created_at',{ascending:false}).limit(60);
    if(error)throw error;
    ASG=(data||[]).filter(a=>!a.user_ids||!a.user_ids.length||a.user_ids.includes(uid));
  }catch(_){ASG=[]} // chưa tạo bảng hoặc mất mạng: bỏ qua, không làm hỏng trang
}
function asgStatus(a){
  if(HW.some(h=>h.id===a.item_id)){const t0=+new Date(a.created_at),L=(SUBS||[]).filter(x=>x.item_id===a.item_id&&+new Date(x.created_at)>=t0),due=dueOf(a),now=Date.now(),done=L.length>0;
    return{done,best:0,n:0,hw:true,sub:L[0],late:!done&&!!due&&+due<now,soon:!done&&!!due&&+due>=now&&+due-now<2*864e5}}
  const t0=+new Date(a.created_at),at=ATT.filter(x=>x.id===a.item_id&&+new Date(x.at)>=t0),due=dueOf(a),now=Date.now(),done=at.length>0;
  return{done,best:Math.max(0,...at.map(x=>x.ok)),n:(at[0]||{}).n||0,
    late:!done&&!!due&&+due<now,soon:!done&&!!due&&+due>=now&&+due-now<2*864e5};
}
function asgList(){
  const L=ASG.map(a=>({a,s:asgStatus(a)}));
  return{open:L.filter(x=>!x.s.done).sort((x,y)=>(+(dueOf(x.a)||9e15))-(+(dueOf(y.a)||9e15))),done:L.filter(x=>x.s.done).slice(0,3)};
}
const asgTag=id=>{const a=ASG.find(x=>x.item_id===id&&!asgStatus(x).done);return a?`<span class="tag asg">📌 Thầy cô giao${a.due_date?' · hạn '+fmtDue(a).slice(0,5):''}</span>`:''};
function asgRow({a,s}){
  const c=s.done?['done','Đã làm']:s.late?['late','Quá hạn']:s.soon?['soon','Sắp đến hạn']:['new','Mới giao'];
  return `<div class="asg-row"><div><b>${esc(a.item_title)}</b> <span class="asg-chip ${c[0]}">${c[1]}</span></div>
  <small>${a.due_date?'Hạn: '+fmtDue(a)+' · ':''}${s.hw?(s.done?hwText(s.sub):'Chưa nộp'):s.done?'Điểm: '+s.best+'/'+s.n:'Chưa làm'}${a.note?' · 💬 '+esc(a.note):''}</small>
  <button type="button" class="btn go" onclick="asgStart('${a.id}')">${s.hw?(s.done?'Xem / nộp lại':'Nộp bài'):s.done?'Làm lại':'Làm ngay'}</button></div>`;
}
function renderAssign(){
  const box=$('assignBox');if(!box)return;
  const L=user?asgList():{open:[],done:[]};
  box.innerHTML=(L.open.length+L.done.length)?`<div class="st-box asg-box"><h3>📌 Bài thầy cô giao${L.open.length?` <span class="asg-chip new">${L.open.length} bài chưa làm</span>`:''}</h3>${[...L.open,...L.done].map(asgRow).join('')}</div>`:'';
}
function asgStart(id){
  const a=ASG.find(x=>x.id===id);if(!a)return;
  curG=+a.grade||curG;closeRemind();
  if(HW.some(h=>h.id===a.item_id)){openHw(a.item_id);return}
  const k=QUIZZES.findIndex(z=>z.id===a.item_id),j=DT_SETS.findIndex(s=>s.id===a.item_id);
  if(k>=0)startQuiz(k);else if(j>=0)dtStart(j);else toast('Bài này chưa có trong phần mềm. Hãy hỏi thầy cô nhé.');
}
// các bài đã làm nhưng đạt dưới 70% → gợi ý làm lại
function redoList(){
  const all=[...QUIZZES.map(z=>({id:z.id,t:z.title,n:z.q.length})),...DT_SETS.map(s=>({id:s.id,t:'Đề test '+s.name,n:s.Q.length}))];
  return all.filter(x=>user.done[x.id]!==undefined&&user.done[x.id]/x.n<.7).slice(0,3).map(x=>({...x,b:user.done[x.id]}));
}
function redoStart(id){
  const k=QUIZZES.findIndex(z=>z.id===id),j=DT_SETS.findIndex(s=>s.id===id);closeRemind();
  if(k>=0){curG=QUIZZES[k].grade;startQuiz(k)}else if(j>=0)dtStart(j);
}
function closeRemind(){$('remind').classList.add('hidden');document.body.style.overflow=''}
function reviewNow(){closeRemind();startReview()}
function showRemind(){ // hiện mỗi lần vào web, chỉ khi có việc cần nhắc
  if(!user)return;
  const L=asgList().open,wb=wrongBank(),redo=redoList();
  if(!L.length&&!wb.length&&!redo.length)return;
  const tc={};wb.forEach(w=>{const t=w.t||'Khác';tc[t]=(tc[t]||0)+1});
  const top=Object.entries(tc).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t,n])=>`${esc(t)} (${n} câu)`).join(', ');
  $('remindBox').innerHTML=`<img class="remind-poster" src="assets/remind.png" alt="" onerror="this.remove()"><h2>👋 Nhắc việc cho ${esc(user.name)}</h2>
  ${L.length?`<div class="st-box asg-box"><h3>📌 Bài thầy cô giao (${L.length})</h3>${L.map(asgRow).join('')}</div>`:''}
  ${(wb.length||redo.length)?`<div class="st-box asg-box"><h3>🔁 Cần ôn lại</h3>
    ${wb.length?`<div class="asg-row"><div><b>${wb.length} câu bạn từng làm sai</b></div><small>Nhiều nhất ở: ${top}</small><button type="button" class="btn go" onclick="reviewNow()">Ôn ${Math.min(wb.length,10)} câu</button></div>`:''}
    ${redo.map(x=>`<div class="asg-row"><div><b>${esc(x.t)}</b> <span class="asg-chip soon">Nên làm lại</span></div><small>Điểm cao nhất mới ${x.b}/${x.n} câu</small><button type="button" class="btn go" onclick="redoStart('${x.id}')">Làm lại</button></div>`).join('')}</div>`:''}
  <div class="qnav"><button type="button" class="btn ghost" onclick="closeRemind()">Để sau</button></div>`;
  $('remind').classList.remove('hidden');$('remind').scrollTop=0;document.body.style.overflow='hidden';
}

/* ===== BÀI TẬP TỰ LUẬN VỀ NHÀ – TOÁN 7 (học sinh làm vào vở/phiếu, chụp ảnh nộp, giáo viên chấm) ===== */
const HW_PDF='assets/toan-7/Phieu-bai-tap-toan-7-so-huu-ti.pdf';
const HW=[
 {id:'t7-hw-ex',grade:7,title:'Rational Numbers – Exercises (Q1–Q16 + Bonus)',desc:'Phiếu bài tập số hữu tỉ · 16 câu + 2 câu Bonus · làm tự luận',max:10,q:[
  ['Q1','Copy and complete each set of equivalent fractions.<br>a) −3 = −3/1 = □/4 &nbsp; b) 5/8 = 10/□ = □/40 &nbsp; c) 0.6 = 6/10 = □/5 &nbsp; d) −7/9 = −14/□ = □/27'],
  ['Q2','Write the correct symbol &lt;, &gt;, = in each box.<br>a) −3/4 □ −2/3 &nbsp; b) −0.4 □ −2/5 &nbsp; c) 5/8 □ 0.6 &nbsp; d) −1.25 □ −5/4'],
  ['Q3','Put the numbers in increasing order: −5/6, −0.72, 2/3, 0, −3/4, 0.7.'],
  ['Q4','Match each description with the correct number.<br>A. The opposite of 3/5 &nbsp; B. The reciprocal of 3/4 &nbsp; C. A rational number equal to 0.75 &nbsp; D. A rational number equal to −1.2<br>Numbers: 1. 4/3 &nbsp; 2. −3/5 &nbsp; 3. 3/4 &nbsp; 4. −6/5'],
  ['Q5','Calculate. Show the main step in each calculation.<br>a) 5/8 − 7/12 &nbsp; b) −4/9 + 5/6 &nbsp; c) 7/10 − (−3/5) &nbsp; d) −11/15 − 2/5'],
  ['Q6','Complete the working: −7/15 : 14/25 = −7/15 × □/□ = −□/□. Then calculate 5/12 : (−25/18).'],
  ['Q7','Match each expression with its value.<br>A. (−3/4)^2 &nbsp; B. (−2/5)^3 &nbsp; C. (3/7)^5 : (3/7)^3 &nbsp; D. (−1/2)^4 · 2^3<br>Values: 1. −8/125 &nbsp; 2. 1/2 &nbsp; 3. 9/16 &nbsp; 4. 9/49'],
  ['Q8','Copy and complete the exponent laws.<br>a) (5/6)^3 · (5/6)^4 = (5/6)^□ &nbsp; b) (−7/9)^8 : (−7/9)^5 = (−7/9)^□<br>c) (−2/3)^4 · (−2/3)^3 : (−2/3)^5 = (−2/3)^□ = □/□'],
  ['Q9','Calculate using the correct order of operations.<br>a) 2/3 − 3/4 · 8/9 &nbsp; b) (−5/6 + 1/3) : 5/4 &nbsp; c) 1 − [2/5 − (−3/10)] &nbsp; d) (−1/2)^3 + 3/4 : (−3/2)'],
  ['Q10','Find the mistake. A learner writes −2/3 + 5/6 = −4/6 − 5/6 = −9/6. Explain the mistake and write the correct calculation.'],
  ['Q11','Choose the correct answer, then explain your choice. A = 3/7 · 11/5 + 3/7 · 4/5.<br>A. 33/35 &nbsp; B. 9/7 &nbsp; C. 3/5 &nbsp; D. 3'],
  ['Q12','Write three different rational numbers x such that −2/3 &lt; x &lt; −1/2. Explain briefly how you know that each answer is correct.'],
  ['Q13','Find x. Show all your working.<br>a) x − 5/6 = −1/4 &nbsp; b) 3/4 x = −9/10 &nbsp; c) (x + 1)/2 = 5/6 &nbsp; d) (x − 2)/3 + (x + 1)/6 = 1'],
  ['Q14','For each statement, write always true, sometimes true, or never true. Give a reason or an example.<br>a) The sum of two rational numbers is positive.<br>b) The product of two negative rational numbers is positive.<br>c) A rational number has a reciprocal.'],
  ['Q15','Solve the real-life problems.<br>a) At 6 a.m., the temperature is −3.5°C. By noon, it rises by 8.2°C. In the evening, it falls by 2.7°C. What is the temperature in the evening?<br>b) A water tank is 3/5 full. Then 1/4 of the tank’s total capacity is used. What fraction of the tank remains full?'],
  ['Q16','A 3.5 m ribbon is cut into two pieces. The first piece is 3/4 m long and the second piece is 1 1/4 m long. How much ribbon is left?'],
  ['Bonus 1','Find the value of (−3/5) · 25/9 · (−6/5). Answer: ……'],
  ['Bonus 2','Let n be an integer. If −3/4 &lt; n/12 &lt; −1/2, then all possible values of n are ……']
 ]},
 {id:'t7-hw-home',grade:7,title:'Rational Numbers – Homework (Bài 1–9)',desc:'Bài về nhà · 9 bài tự luận · ôn từ vựng, tính toán, bài toán thực tế',max:10,q:[
  ['1','Complete the sentences using the words in the box: <i>numerator, denominator, equivalent fractions, reciprocal, exponent, increasing order, decreasing order, equation</i>.<br>a) In 5/8, 5 is the … and 8 is the … &nbsp; b) 1/2 and 2/4 are … &nbsp; c) The … of 3/5 is 5/3.<br>d) In 2^5, the number 5 is the … &nbsp; e) −3/4 &lt; 0 &lt; 1/2 is written in … &nbsp; f) 4/5 &gt; 0 &gt; −2/3 is written in … &nbsp; g) x + 1/2 = 3/4 is an …'],
  ['2','Write how you would read each expression aloud in English. Use the forms from the Vocabulary table.<br>a) −3/4 &nbsp; b) 2/3 × 3/5 = 2/5 &nbsp; c) (−1/2)^4 &nbsp; d) −2/3 &lt; −1/2 &lt; 0'],
  ['3','Copy and complete.<br>a) 3/4 = □/20 &nbsp; b) −5/6 = −15/□ &nbsp; c) 0.4 = □/5 &nbsp; d) −2 = □/7'],
  ['4','Write &lt;, &gt;, = in each box, then write the four numbers in decreasing order.<br>−5/8 □ −0.6, &nbsp; 7/10 □ 0.7, &nbsp; −2/3 □ −3/4.<br>Numbers: −5/8, −0.6, 7/10, −2/3.'],
  ['5','Calculate. Show the main steps.<br>a) −7/12 + 5/8 &nbsp; b) 3/5 − (−7/10) &nbsp; c) −4/9 · 15/8 &nbsp; d) 5/6 : (−25/18)'],
  ['6','Calculate using powers and the correct order of operations.<br>a) (−2/3)^4 : (−2/3)^2 &nbsp; b) 1 − 3/4 · (−2/3)'],
  ['7','Find x. Show all your working.<br>a) x + 3/5 = −1/10 &nbsp; b) 2/3 x = −4/9'],
  ['8','A learner writes 1/2 − 3/4 = (1 − 3)/(2 − 4) = 1. Explain the mistake and give the correct answer.'],
  ['9','Real-life problem. A bottle contains 2.4 L of juice. During lunch, 3/4 L is used. Later, another 0.65 L is used. How much juice remains in the bottle?']
 ]}
];

let SUBS=[],hwFiles=[],hwCur=null,hwBusy=false;
async function loadSubs(){
  if(!sb||!user){SUBS=[];return}
  try{const {data,error}=await sb.from('submissions').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(100);
    if(error)throw error;SUBS=data||[]}
  catch(_){SUBS=[]} // chưa chạy file SQL tạo bảng submissions: bỏ qua
}
const subLast=id=>(SUBS||[]).find(x=>x.item_id===id);
const fnum=n=>String(Math.round(Number(n)*100)/100).replace('.',',');
function hwText(s){
  if(!s)return 'Chưa nộp';
  if(s.status==='graded')return '✅ '+tl(s.graded_by||s.teacher_id)+' đã chấm: '+fnum(s.score)+'/'+fnum(s.max_score||10);
  if(s.status==='redo')return '🔁 '+tl(s.graded_by||s.teacher_id)+' yêu cầu làm lại';
  return '⏳ Đã nộp cho '+tl(s.teacher_id)+' ngày '+new Date(s.created_at).toLocaleDateString('vi-VN')+' · chờ chấm';
}
const hwCards=()=>HW.map(h=>{
  if(h.grade!==curG)return '';
  const s=subLast(h.id);
  return `<article class="card">${cov(null,'ex')}<div class="cbody"><span class="tag m">Bài tập về nhà · Tự luận</span>${asgTag(h.id)}<h3>${esc(h.title)}</h3>
  <small>${esc(h.desc)} · làm xong chụp ảnh nộp, thầy cô chấm</small><small>${hwText(s)}</small>
  <button class="btn go" style="width:auto" onclick="openHw('${h.id}')">${!s||s.status==='redo'?'Làm bài & nộp ảnh':'Xem / nộp lại'}</button></div></article>`;
}).join('');
// Nén ảnh chụp từ điện thoại: cạnh dài tối đa 1600px, JPEG 82%
function imgToJpeg(file,max=1600,q=.82){return new Promise((res,rej)=>{
  const u=URL.createObjectURL(file),im=new Image();
  im.onload=()=>{let w=im.naturalWidth,h=im.naturalHeight;const k=Math.min(1,max/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);
    const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);
    c.toBlob(b=>{URL.revokeObjectURL(u);b?res(b):rej(new Error('blob'))},'image/jpeg',q)};
  im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('img'))};im.src=u})}
/* --- Giáo viên nhận bài & thông báo khi chấm xong --- */
let TCH=[],hwTeacher=null,NSEEN=null,NANN=new Set(),npoll=null;
const tn=id=>(TCH.find(t=>t.id===id)||{}).name;
const tl=id=>{const n=tn(id);return n?'thầy/cô '+n:'thầy cô'};
async function loadTeachers(){
  if(!sb)return;
  try{
    const {data:t,error}=await sb.from('teachers').select('user_id');if(error)throw error;
    const ids=(t||[]).map(r=>r.user_id).filter(id=>id!==uid);
    if(!ids.length){TCH=[];return}
    const {data:p}=await sb.from('profiles').select('id,name,username').in('id',ids);
    TCH=ids.map(id=>{const x=(p||[]).find(r=>r.id===id)||{};return{id,name:x.name||x.username||'Giáo viên'}});
  }catch(_){TCH=[]}
}
const nsKey=()=>'nseen:'+uid;
const nsGet=()=>{if(NSEEN)return NSEEN;try{NSEEN=new Set(JSON.parse(localStorage.getItem(nsKey())||'[]'))}catch(_){NSEEN=new Set()}return NSEEN};
const nsSave=()=>{try{localStorage.setItem(nsKey(),JSON.stringify([...nsGet()].slice(-200)))}catch(_){}};
const nKey=s=>s.id+':'+(s.graded_at||s.status);
const gradedSubs=()=>(SUBS||[]).filter(s=>s.status==='graded'||s.status==='redo');
const unseenSubs=()=>gradedSubs().filter(s=>!nsGet().has(nKey(s)));
function drawBell(){
  const n=user?unseenSubs().length:0,b=$('bellN');if(!b)return;
  b.textContent=n>9?'9+':n;b.classList.toggle('hidden',!n);$('bell').classList.toggle('ring',n>0);
}
function checkNotif(announce){
  drawBell();if(!announce)return;
  const fresh=unseenSubs().filter(s=>!NANN.has(nKey(s)));
  fresh.forEach(s=>NANN.add(nKey(s)));
  if(fresh.length){const s=fresh[0];
    toast('🔔 '+(tl(s.graded_by||s.teacher_id)[0].toUpperCase()+tl(s.graded_by||s.teacher_id).slice(1))+(s.status==='redo'?' yêu cầu bạn làm lại: ':' đã chấm xong: ')+s.item_title)}
}
function openNotif(){
  if(!user)return;
  const L=gradedSubs().sort((a,b)=>String(b.graded_at||'').localeCompare(String(a.graded_at||''))).slice(0,15),un=new Set(unseenSubs().map(nKey));
  $('notifBox').innerHTML=`<div class="qtop"><b>Thông báo</b></div>
  ${L.length?L.map(s=>`<div class="nt ${un.has(nKey(s))?'new':''}"><div class="nt-i ${s.status}">${s.status==='graded'?'✓':'↻'}</div><div class="nt-b">
    <b>${esc(s.item_title)}</b>
    <p>${esc(tl(s.graded_by||s.teacher_id)[0].toUpperCase()+tl(s.graded_by||s.teacher_id).slice(1))} ${s.status==='graded'?'đã chấm: <b>'+fnum(s.score)+'/'+fnum(s.max_score||10)+'</b>':'yêu cầu bạn làm lại'}</p>
    ${s.feedback?`<p class="nt-fb">“${esc(s.feedback)}”</p>`:''}
    <small>${s.graded_at?fdt(s.graded_at):''}</small></div>
    <button type="button" class="btn ghost sm" onclick="closeNotif();openHw('${esc(s.item_id)}')">Xem</button></div>`).join(''):'<p class="muted">Chưa có thông báo. Khi thầy cô chấm xong bài bạn nộp, thông báo sẽ hiện ở đây.</p>'}
  <div class="qnav"><button type="button" class="btn ghost" onclick="closeNotif()">Đóng</button></div>`;
  $('notif').classList.remove('hidden');$('notif').scrollTop=0;document.body.style.overflow='hidden';
  gradedSubs().forEach(s=>nsGet().add(nKey(s)));nsSave();drawBell();
}
function closeNotif(){$('notif').classList.add('hidden');document.body.style.overflow=''}
function startPoll(){
  stopPoll();
  npoll=setInterval(async()=>{if(!user||document.hidden)return;await loadSubs();checkNotif(true);renderEx();renderAssign();if(!$('stats').classList.contains('hidden'))renderStats()},45000);
}
function stopPoll(){if(npoll){clearInterval(npoll);npoll=null}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user)loadSubs().then(()=>{checkNotif(true);renderEx();renderAssign()})});
$('bell').onclick=openNotif;

function hwSteps(){
  const el=$('hwsteps');if(!el)return;
  const ok=[!!hwTeacher||!TCH.length,hwFiles.length>0,false];
  el.innerHTML=['Chọn thầy/cô','Thêm ảnh','Nộp bài'].map((t,i)=>`<div class="stp ${ok[i]?'done':(i===0||ok[i-1])?'cur':''}"><i>${ok[i]?'✓':i+1}</i><span>${t}</span></div>`).join('<hr>');
}
function openHw(id){
  const h=HW.find(x=>x.id===id);if(!h||!user)return;
  hwCur=h;hwFiles=[];hwBusy=false;
  const s=subLast(id);
  let last=null;try{last=localStorage.getItem('tch:'+uid)}catch(_){}
  hwTeacher=(s&&s.teacher_id)||last;
  if(!TCH.find(t=>t.id===hwTeacher))hwTeacher=TCH.length===1?TCH[0].id:null;
  const stx=s?(s.status==='graded'?['ok','Đã chấm xong']:s.status==='redo'?['redo','Cần làm lại']:['wait','Đang chờ chấm']):null;
  $('hwbox').innerHTML=`<div class="qtop"><b>${esc(h.title)}</b></div>
  <div id="hwsteps" class="steps"></div>
  ${s?`<div class="hw-status ${s.status}"><b>${stx[1]}</b><p>${esc(hwText(s))}</p>${s.feedback?`<p>💬 <b>Nhận xét của ${esc(tl(s.graded_by||s.teacher_id))}:</b> ${esc(s.feedback)}</p>`:''}</div>`:''}
  <details class="hw-q"><summary>Xem đề bài (${h.q.length} mục)</summary><div class="hw-links"><a class="btn ghost sm" href="${HW_PDF}" target="_blank" rel="noopener">Mở phiếu bài tập (PDF)</a></div>${h.q.map(q=>`<div class="hw-qi"><b>${q[0]}.</b> ${fx(q[1])}</div>`).join('')}</details>

  <h3 class="hw-h"><span>1</span>Nộp cho thầy/cô nào?</h3>
  ${TCH.length?`<div class="tch-list">${TCH.map(t=>`<button type="button" class="tch${t.id===hwTeacher?' on':''}" data-t="${t.id}"><i>${esc(t.name.trim().split(/\s+/).pop()[0]||'T').toUpperCase()}</i><span><b>${esc(t.name)}</b><small>Giáo viên</small></span><em>✓</em></button>`).join('')}</div>`:'<p class="muted"><small>Chưa tải được danh sách giáo viên. Bài sẽ gửi đến thầy cô phụ trách chung.</small></p>'}

  <h3 class="hw-h"><span>2</span>Thêm ảnh bài làm</h3>
  <label class="hw-pick"><input id="hwfile" type="file" accept="image/*" multiple><span class="btn ghost">Chụp / chọn ảnh</span></label>
  <p class="muted"><small>Tối đa 8 ảnh, mỗi trang một ảnh, chụp đủ sáng và thấy rõ chữ.</small></p>
  <div id="hwprev" class="hw-prev"></div>

  <h3 class="hw-h"><span>3</span>Lời nhắn <small class="muted">(không bắt buộc)</small></h3>
  <textarea id="hwnote" rows="2" maxlength="300" placeholder="Ví dụ: Em chưa làm được câu 13d ạ."></textarea>
  <p id="hwmsg" class="err" role="alert"></p>
  <div class="qnav"><button type="button" class="btn ghost" id="hwclose">Đóng</button><button type="button" class="btn go" id="hwgo" style="width:auto" disabled>Nộp bài</button></div>`;
  $('hw').classList.remove('hidden');$('hw').scrollTop=0;document.body.style.overflow='hidden';
  $('hwclose').onclick=closeHw;
  document.querySelectorAll('#hwbox .tch').forEach(b=>b.onclick=()=>{hwTeacher=b.dataset.t;document.querySelectorAll('#hwbox .tch').forEach(x=>x.classList.toggle('on',x===b));hwDraw()});
  $('hwfile').onchange=e=>{
    const add=[...e.target.files].filter(f=>/^image\//.test(f.type)||/\.(jpe?g|png|webp|heic)$/i.test(f.name));
    hwFiles=hwFiles.concat(add).slice(0,8);e.target.value='';hwDraw()};
  $('hwgo').onclick=hwSubmit;hwDraw();
}
function hwDraw(){
  const box=$('hwprev');if(!box)return;
  box.innerHTML=hwFiles.map((f,i)=>`<div class="hw-th"><img src="${URL.createObjectURL(f)}" alt="Ảnh ${i+1}"><button type="button" aria-label="Bỏ ảnh ${i+1}" data-i="${i}">×</button></div>`).join('');
  box.querySelectorAll('button').forEach(b=>b.onclick=()=>{hwFiles.splice(+b.dataset.i,1);hwDraw()});
  $('hwgo').disabled=!hwFiles.length||hwBusy||(TCH.length>0&&!hwTeacher);hwSteps();
}
function closeHw(){const d=$('hw');if(d){d.classList.add('hidden');document.body.style.overflow=''}hwFiles=[];hwCur=null}
async function hwSubmit(){
  const h=hwCur;if(!h||!hwFiles.length||hwBusy)return;
  if(!sb){$('hwmsg').textContent='Hệ thống chưa kết nối. Hãy báo thầy cô nhé.';return}
  hwBusy=true;const go=$('hwgo'),msg=$('hwmsg');go.disabled=true;msg.textContent='';
  const paths=[],stamp=Date.now();
  try{
    for(let i=0;i<hwFiles.length;i++){
      go.textContent=`Đang gửi ảnh ${i+1}/${hwFiles.length}…`;
      const blob=await imgToJpeg(hwFiles[i]),path=`${uid}/${h.id}/${stamp}-${i+1}.jpg`;
      const {error}=await sb.storage.from('homework').upload(path,blob,{contentType:'image/jpeg',upsert:false});
      if(error)throw error;paths.push(path);
    }
    go.textContent='Đang lưu bài nộp…';
    const row={user_id:uid,item_id:h.id,item_title:h.title,grade:h.grade,photos:paths,note:($('hwnote').value||'').trim()||null,status:'submitted',max_score:h.max,teacher_id:hwTeacher||null};
    try{if(hwTeacher)localStorage.setItem('tch:'+uid,hwTeacher)}catch(_){}
    let r=await sb.from('submissions').insert(row).select().single();
    if(r.error&&/teacher_id/i.test(r.error.message||'')){delete row.teacher_id;r=await sb.from('submissions').insert(row).select().single()} // chưa chạy SQL thêm cột teacher_id
    const {data,error}=r;
    if(error)throw error;
    SUBS.unshift(data);hwBusy=false;closeHw();renderEx();renderAssign();toast('Đã nộp bài cho '+tl(hwTeacher)+'! Khi chấm xong bạn sẽ nhận thông báo 🔔');
  }catch(e){
    console.error('hw',e);hwBusy=false;go.disabled=false;go.textContent='Nộp bài';
    const m=String(e&&e.message||'');
    msg.textContent=/bucket|not found|relation|submissions|schema/i.test(m)?'Hệ thống chưa sẵn sàng nhận bài (thiếu bảng hoặc kho ảnh). Hãy báo thầy cô nhé.'
      :/image|img|blob/i.test(m)?'Không đọc được một ảnh. Hãy chụp lại ảnh dạng JPG/PNG rồi chọn lại nhé.'
      :'Chưa gửi được. Hãy kiểm tra mạng rồi bấm Nộp bài lại.';
  }
}
