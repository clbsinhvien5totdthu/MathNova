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
  {t:'Tài liệu tổng ôn Toán 5: Lý thuyết & Bài tập (Bài 1–11)', type:'PDF', grade:5, topic:'Tổng ôn · Số thập phân', file:'assets/Lý-thuyết-tổng-ôn-toan-5.pdf'}
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
  loadAtt().then(()=>{renderEx();if(!$('stats').classList.contains('hidden'))renderStats()});
  document.querySelector('.tabs button').click();
  toast('Xin chào '+user.name+'! 👋');
}
$('logout').onclick=async()=>{
  const btn=$('logout');btn.disabled=true;
  stopGame();$('arena').classList.add('hidden');
  await saveQ.catch(()=>{}); // chờ lưu xong tiến độ rồi mới thoát
  try{if(sb)await sb.auth.signOut()}catch(_){}
  user=null;uid=null;boardRows=null;ATT=[];$('navTeacher').classList.add('hidden');$('u').value='';$('p').value='';$('err').textContent='';
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
const GRADE_MULT={1:.5,2:.6,3:.75,4:.9,5:1};
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
const QUIZZES=[Q10_BASIC,Q10_ADV];
let cur=Q10_BASIC;
const EXERCISES_LIVE=()=>QUIZZES.map((Z,k)=>{
  if(Z.grade!==curG)return '';
  const best=user.done[Z.id];
  return `<article class="card">${cov(null,'ex')}<div class="cbody"><span class="tag m">Bài tập · Không giới hạn thời gian</span><h3>${Z.title}</h3>
  <small>${Z.q.length} câu trắc nghiệm · tối đa ${quizMax(Z)} XP lần đầu</small>
  <small>${best===undefined?'Chưa làm':'Điểm cao nhất: '+best+'/'+Z.q.length+' · làm lại nhận 20% XP'}</small>
  <button class="btn go" style="width:auto" onclick="startQuiz(${k})">${best===undefined?'Làm bài':'Làm lại'}</button></div></article>`;
}).join('');
function quizMax(Z){return Math.round((Z.q.reduce((s,q)=>s+LEVEL_XP[q.l],0)+40)*GRADE_MULT[Z.grade])}
function renderEx(){
  $('docList').innerHTML=emp(docsHtml());$('exList').innerHTML=reviewCard()+emp(EXERCISES_LIVE());
  $('testList').innerHTML=emp(curG===5?dtCards():'');$('gameList').innerHTML=emp(curG===5?gameCard():'');
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
const fmt=s=>esc(s)
  .replace(/(?<![\d,])(\d+) (\d+)\/(\d+)(?![\d])/g,(_,w,n,d)=>`<span class="mx">${w}${fr(n,d)}</span>`)
  .replace(/(?<![\d,])(\d+)\/(\d+)(?![\d])/g,(_,n,d)=>fr(n,d));
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
// Mỗi đề test = một chặng đường. id cũ 'dt-b1-9' được giữ nguyên để không mất tiến độ.
const DT_SETS=[
 {id:'dt-b1-9',name:'Bài 1–9',desc:'Ôn tập & bổ sung',T:DT_T,Q:DT_Q,cover:'dm-1'},
 {id:'dt-b10',name:'Bài 10',desc:'Khái niệm số thập phân',T:T10,Q:Q10,cover:'dm-2'},
 {id:'dt-b11',name:'Bài 11',desc:'So sánh các số thập phân',T:T11,Q:Q11,cover:'dm-3'},
 {id:'dt-b12',name:'Bài 12',desc:'Viết số đo dưới dạng số thập phân',T:T12,Q:Q12,cover:'ds-2'}
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
  return DT_SETS.map((S,k)=>{const b=user.done[S.id],n=S.Q.length;
  return `<article class="card arcade"><div class="cover px-cover dg-cover">${pimg('mk-act','c-hero')}<b>VS</b>${pimg(S.cover,'c-foe')}</div><div class="cbody"><span class="tag m">Trò chơi pixel</span><h3>${(S.id==='dt-b10'||S.id==='dt-b11')?'BÀI TẬP '+S.name.toUpperCase():'Đề test '+S.name}</h3>
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
const GOAL=20,KIND={quiz:'✏️',test:'🎮',game:'⚡',doc:'📖',review:'🔁'};
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
  const gp=Math.min(100,pc(td.n,GOAL));
  $('statsBody').innerHTML=`
  ${attErr||ATT.some(a=>a.p)?'<p class="st-tip warn">⚠️ Một số kết quả chưa đồng bộ lên hệ thống nên thầy cô chưa xem được. Dữ liệu vẫn được giữ trên máy này và tự gửi lại khi có mạng.</p>':''}
  <div class="kpis">
    <div class="kpi"><b>🔥 ${streak}</b><small>ngày học liên tiếp</small></div>
    <div class="kpi"><b>${pc(T.ok,T.n)}%</b><small>độ chính xác chung (${T.ok}/${T.n} câu)</small></div>
    <div class="kpi"><b>${dur(T.s)}</b><small>tổng thời gian làm bài</small></div>
    <div class="kpi"><b>${w1[1]?pc(...w1)+'%':'—'}</b><small>chính xác 7 ngày qua ${dl===null?'':`<em style="color:${dl>=0?'#0B7A43':'#D12F35'}">${dl>=0?'▲ +':'▼ '}${dl}%</em>`}</small></div>
  </div>
  <div class="st-box goal"><h3>🎯 Mục tiêu hôm nay: ${GOAL} câu</h3>
    <div class="rbar"><i style="width:${gp}%;background:${gp>=100?'#16B364':'#1E5EFF'}"></i></div>
    <small class="muted">${td.n>=GOAL?'Đã hoàn thành mục tiêu! 🎉':'Đã làm '+td.n+' câu, còn '+(GOAL-td.n)+' câu nữa.'} Hôm nay: ${td.ok}/${td.n} đúng · ${dur(td.s)} · +${td.xp} XP</small></div>
  <div class="st-box"><h3>📈 14 ngày gần đây <small class="muted">(số câu làm, màu = độ chính xác)</small></h3>
    <div class="sc">${bars.map(b=>`<div class="sc-col" title="${b.x?b.x.n+' câu · '+pc(b.x.ok,b.x.n)+'% đúng':'Không học'}"><i style="height:${b.x?Math.max(5,b.x.n/mx*100):2}%;background:${b.x?clr(pc(b.x.ok,b.x.n)):''}"></i><small>${b.l}</small></div>`).join('')}</div></div>
  <div class="st-box"><h3>🧭 Mức nắm vững theo nội dung</h3>
    ${tl.length?tl.map(([k,v])=>{const p=pc(...v);return `<div class="tprow"><span>${esc(k)}</span><div class="rbar"><i style="width:${p}%;background:${clr(p)}"></i></div><b>${v[0]}/${v[1]}</b></div>`}).join(''):'<p class="muted">Làm vài bài để xem bản đồ năng lực của bạn.</p>'}
    ${weak.length?`<p class="st-tip">💡 Gợi ý: nên ôn thêm <b>${weak.map(esc).join(', ')}</b>.</p>`:''}
    ${wb?`<button class="btn go" style="width:auto" onclick="startReview()">🔁 Ôn ${Math.min(wb,10)} câu đã sai</button>`:''}</div>
  <div class="st-box"><h3>🗓️ Lịch sử từng buổi học</h3>
    ${keys.length?keys.slice(0,10).map((d,i)=>{const x=days[d];return `<details class="dayc"${i===0?' open':''}><summary><b>${fd(d)}</b><span>${x.l.length} lượt · ${x.ok}/${x.n} đúng (${pc(x.ok,x.n)}%) · ${dur(x.s)} · +${x.xp} XP</span></summary>${x.l.map(a=>`<div class="att"><span>${new Date(a.at).toTimeString().slice(0,5)}</span><span>${KIND[a.k]||'•'} ${esc(a.t)}</span><b style="color:${a.n?clr(pc(a.ok,a.n)):'inherit'}">${a.n?a.ok+'/'+a.n:'—'}</b><small>${a.s?dur(a.s)+' · ':''}+${a.xp} XP</small></div>`).join('')}</details>`}).join(''):'<p class="muted">Chưa có buổi học nào. Hãy làm một bài tập nhé!</p>'}</div>`;
}
$('navStats').onclick=e=>{e.preventDefault();view('stats')};
$('backStats').onclick=()=>view('levels');
