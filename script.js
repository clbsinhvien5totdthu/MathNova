// Tài khoản thử nghiệm – Giai đoạn 2 sẽ thay bằng database, giáo viên cấp tài khoản trong trang quản trị
const ACCOUNTS = {
  hs5001: {pass:'nova123', name:'Bảo An', xp:120},
  hs5002: {pass:'nova123', name:'Gia Hân', xp:340}
};
const DOCS = [
  {t:'Số thập phân: đọc, viết, so sánh', type:'PDF', topic:'Số thập phân'},
  {t:'Bài giảng: Cộng trừ số thập phân', type:'Video', topic:'Số thập phân'},
  {t:'Sơ đồ tư duy: Nhân chia số thập phân', type:'Sơ đồ', topic:'Số thập phân'},
  {t:'Diện tích hình tam giác, hình thang', type:'PDF', topic:'Hình học'},
  {t:'Bài giảng: Chu vi và diện tích hình tròn', type:'Video', topic:'Hình học'},
  {t:'Thể tích hình hộp chữ nhật, hình lập phương', type:'PDF', topic:'Hình học'},
  {t:'Tỉ số phần trăm và bài toán thường gặp', type:'PDF', topic:'Phần trăm'},
  {t:'Sơ đồ tư duy: Chuyển động đều', type:'Sơ đồ', topic:'Chuyển động'}
];
const EXERCISES = [
  {t:'Luyện tập số thập phân', n:15, m:15},
  {t:'Phép tính với số thập phân', n:20, m:20},
  {t:'Hình học: diện tích và thể tích', n:12, m:20},
  {t:'Đề kiểm tra giữa học kì 1', n:30, m:40},
  {t:'Tỉ số phần trăm', n:15, m:20},
  {t:'Chuyển động đều: vận tốc, quãng đường, thời gian', n:10, m:20}
];
const $ = id => document.getElementById(id);
let user = null;

function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
function show(id){['splash','login','app'].forEach(s=>$(s).classList.toggle('hidden',s!==id&&s!=='splash'))}
function view(id){['levels','grade5'].forEach(v=>$(v).classList.toggle('hidden',v!==id));window.scrollTo(0,0)}

/* ---- Màn hình chờ ---- */
(function splash(){
  const title=$('splash-title');
  [...'MATH NOVA'].forEach((c,i)=>{const s=document.createElement('span');s.textContent=c===' '?'\u00A0':c;s.style.animationDelay=(i*.1)+'s';title.appendChild(s)});
  const syms=['+','−','×','÷','=','π','√','∑','%','²','7','3','9'];
  for(let i=0;i<22;i++){
    const s=document.createElement('span');s.className='sym';s.textContent=syms[i%syms.length];
    s.style.left=Math.random()*100+'%';s.style.fontSize=(1.4+Math.random()*2.4)+'rem';
    s.style.animationDuration=(6+Math.random()*7)+'s';s.style.animationDelay=(-Math.random()*8)+'s';
    $('syms').appendChild(s);
  }
  const msgs=['Đang khởi động tên lửa Nova…','Đang xếp hàng các con số…','Đang mài bút chì thần kỳ…','Sắp xong rồi, chuẩn bị nhé!'];
  let p=0;
  const timer=setInterval(()=>{
    p+=25;$('loadfill').style.width=p+'%';$('loadmsg').textContent=msgs[Math.min(p/25-1,3)];
    if(p>=100){clearInterval(timer);setTimeout(done,500)}
  },750);
  function done(){
    $('splash').classList.add('out');
    const saved=sessionStorage.getItem('nova_user');
    if(saved&&ACCOUNTS[saved])enter(saved);else show('login');
    setTimeout(()=>$('splash').classList.add('hidden'),650);
  }
})();

/* ---- Đăng nhập (không có đăng ký) ---- */
$('loginForm').onsubmit=e=>{
  e.preventDefault();
  const id=$('u').value.trim().toLowerCase(),a=ACCOUNTS[id];
  if(a&&a.pass===$('p').value){$('err').textContent='';try{sessionStorage.setItem('nova_user',id)}catch(_){}enter(id)}
  else $('err').textContent='Tên đăng nhập hoặc mật khẩu chưa đúng. Hãy kiểm tra lại hoặc hỏi thầy cô.';
};
function enter(id){
  user=ACCOUNTS[id];show('app');view('levels');refreshMe();
  toast('Xin chào '+user.name+'! 👋');
}
function refreshMe(){$('meName').textContent='👤 '+user.name;$('meXp').textContent=user.xp+' XP'}
$('logout').onclick=()=>{try{sessionStorage.removeItem('nova_user')}catch(_){}user=null;$('p').value='';show('login')};
$('goHome').onclick=e=>{e.preventDefault();view('levels')};
$('open5').onclick=()=>view('grade5');
$('backLevels').onclick=()=>view('levels');

/* ---- Toán 5 ---- */
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));
  ['docs','ex','games'].forEach(id=>$(id).classList.toggle('hidden',id!==b.dataset.tab));
});
const TYPES=['Tất cả','PDF','Video','Sơ đồ'];
function renderDocs(f='Tất cả'){
  $('filters').innerHTML='';
  TYPES.forEach(t=>{const b=document.createElement('button');b.textContent=t;b.className=t===f?'on':'';b.onclick=()=>renderDocs(t);$('filters').appendChild(b)});
  $('docList').innerHTML=DOCS.filter(d=>f==='Tất cả'||d.type===f).map(d=>
    `<article class="card"><span class="tag ${d.type==='Video'?'v':d.type==='Sơ đồ'?'m':''}">${d.type}</span><h3>${d.t}</h3><small>${d.topic}</small><button class="btn ghost" onclick="toast('Tài liệu sẽ được gắn file ở bước sau')">Xem tài liệu</button></article>`).join('');
}
$('exList').innerHTML=EXERCISES.map(x=>
  `<article class="card"><h3>${x.t}</h3><small>${x.n} câu · ${x.m} phút</small><button class="btn ghost" onclick="toast('Giao diện làm bài sẽ làm ở bước tiếp theo')">Làm bài</button></article>`).join('');
$('gameList').innerHTML=
  `<article class="card"><span class="tag m">Chơi được ngay</span><h3>Nhẩm nhanh 30 giây</h3><small>Trả lời càng nhiều phép tính càng tốt</small><button class="btn go" style="width:auto" id="startGame">Bắt đầu chơi</button></article>
   <article class="card soon"><h3>Lật thẻ công thức</h3><small>Ghép công thức với tên hình</small><span class="tag">Sắp ra mắt</span></article>
   <article class="card soon"><h3>Đua xe phép tính</h3><small>Giải đúng để xe chạy nhanh</small><span class="tag">Sắp ra mắt</span></article>`;
renderDocs();

/* ---- Game nhẩm nhanh ---- */
let g;
$('startGame').onclick=()=>{
  g={score:0,time:30,ans:0};$('arena').classList.remove('hidden');$('score').textContent=0;$('gmsg').textContent='';
  $('ga').disabled=false;$('ga').value='';$('ga').focus();next();
  clearInterval(g.t);g.t=setInterval(()=>{
    g.time--;$('time').textContent=g.time;
    if(g.time<=0){clearInterval(g.t);$('ga').disabled=true;const xp=g.score*5;user.xp+=xp;refreshMe();
      $('gq').textContent='Hết giờ!';$('gmsg').textContent=`Bạn đúng ${g.score} câu và nhận +${xp} XP 🎉`}
  },1000);$('time').textContent=30;
};
function next(){
  const a=Math.round((Math.random()*20+1)*10)/10,b=Math.round((Math.random()*9+1)*10)/10,op=Math.random()<.5?'+':'−';
  g.ans=op==='+'?a+b:a-b;g.ans=Math.round(g.ans*10)/10;
  if(g.ans<0){g.ans=Math.round((b-a)*10)/10;$('gq').textContent=`${b} − ${a} = ?`}else $('gq').textContent=`${a} ${op} ${b} = ?`;
}
$('ga').onkeydown=e=>{
  if(e.key!=='Enter'||!g||g.time<=0)return;
  const v=parseFloat($('ga').value.replace(',','.'));
  if(Math.abs(v-g.ans)<0.001){g.score++;$('score').textContent=g.score;$('gmsg').textContent='Đúng rồi! ✔'}
  else $('gmsg').textContent='Chưa đúng, đáp án là '+g.ans;
  $('ga').value='';next();
};
