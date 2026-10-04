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

function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2400)}
function show(id){['splash','login','app'].forEach(s=>$(s).classList.toggle('hidden',s!==id&&s!=='splash'))}
function view(id){['levels','grade'].forEach(v=>$(v).classList.toggle('hidden',v!==id));window.scrollTo(0,0);if(id==='levels'&&user)renderBoard()}

/* ---- Màn hình chờ ---- */
(function splash(){
  const boot=restoreSession(); // kiểm tra phiên đăng nhập ngay trong lúc chờ
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
  async function done(){
    const p=await boot;
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
    done:p.done&&typeof p.done==='object'?p.done:{},doc:p.doc&&typeof p.doc==='object'?p.doc:{},gd:p.gd||null};
  show('app');view('levels');refreshMe();renderEx();
  document.querySelector('.tabs button').click();
  toast('Xin chào '+user.name+'! 👋');
}
$('logout').onclick=async()=>{
  const btn=$('logout');btn.disabled=true;
  stopGame();$('arena').classList.add('hidden');
  await saveQ.catch(()=>{}); // chờ lưu xong tiến độ rồi mới thoát
  try{if(sb)await sb.auth.signOut()}catch(_){}
  user=null;uid=null;boardRows=null;$('u').value='';$('p').value='';$('err').textContent='';
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
const COVER='assets/cover.png';
const cov=s=>`<div class="cover"><img src="${s||COVER}" alt="" loading="lazy"></div>`;
let curG=5;
const LEVELS=[
 {n:'Tiểu học',r:'Lớp 1 – Lớp 5',ic:'🎒',c:'#2F8F83',g:[1,2,3,4,5]},
 {n:'Trung học cơ sở',r:'Lớp 6 – Lớp 9',ic:'📐',c:'#DC6F2A',g:[6,7,8,9]},
 {n:'Trung học phổ thông',r:'Lớp 10 – Lớp 12',ic:'🎓',c:'#7D69B0',g:[10,11,12]}];
$('levelGrid').innerHTML=LEVELS.map(L=>`<article class="lv" style="--c:${L.c}"><div class="lvic">${L.ic}</div><h3>${L.n}</h3><p>${L.r}</p><div class="gchips">${L.g.map(g=>`<button type="button" onclick="openGrade(${g})">Lớp ${g}</button>`).join('')}</div></article>`).join('');
function openGrade(g){
  curG=g;stopGame();$('arena').classList.add('hidden');
  $('crumb').textContent=LEVELS.find(x=>x.g.includes(g)).n;$('gTitle').textContent='Toán lớp '+g;
  $('gswitch').innerHTML=LEVELS.flatMap(x=>x.g).map(n=>`<button type="button" class="${n===g?'on':''}" onclick="openGrade(${n})">${n}</button>`).join('');
  renderEx();view('grade');document.querySelector('.tabs button').click();
}
const docsHtml=()=>DOCS.filter(d=>d.grade===curG).map(d=>
  `<article class="card">${cov(d.img)}<div class="cbody"><span class="tag ${d.type==='Video'?'v':d.type==='Sơ đồ'?'m':''}">${d.type}</span><h3>${d.t}</h3><small>${d.topic}</small><button class="btn ghost" onclick="openDoc(${DOCS.indexOf(d)})">Xem tài liệu</button></div></article>`).join('');
const gameCard=()=>`<article class="card">${cov()}<div class="cbody"><span class="tag m">Chơi được ngay</span><h3>Nhẩm nhanh 30 giây</h3><small>Trả lời càng nhiều phép tính càng tốt</small><button class="btn go" style="width:auto" onclick="startGame()">Bắt đầu chơi</button></div></article>`;
const emp=h=>h.trim()?h:`<p class="empty">Nội dung lớp ${curG} đang được thầy cô biên soạn và sẽ sớm có tại đây.</p>`;

/* ---- Game nhẩm nhanh ---- */
let g=null,gTimer=null;
const vn=n=>String(n).replace('.',','); // số thập phân kiểu Việt Nam: 5,5
function stopGame(){clearInterval(gTimer);gTimer=null;g=null}
function startGame(){
  clearInterval(gTimer); // dọn đồng hồ cũ, tránh chạy 2 đồng hồ và nhận XP 2 lần
  const me=g={score:0,time:30,ans:0,end:Date.now()+30000};
  $('arena').classList.remove('hidden');$('score').textContent=0;$('time').textContent=30;$('gmsg').textContent='';
  $('ga').disabled=false;$('gok').disabled=false;$('ga').value='';$('ga').focus();next();
  gTimer=setInterval(()=>{
    if(g!==me){clearInterval(gTimer);return}
    g.time=Math.max(0,Math.ceil((g.end-Date.now())/1000));$('time').textContent=g.time;
    if(g.time<=0){
      clearInterval(gTimer);gTimer=null;$('ga').disabled=true;$('gok').disabled=true;
      const xp=gameXp(g.score);
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
  if(Math.abs(Number(raw)-g.ans)<0.001){g.score++;$('score').textContent=g.score;$('gmsg').textContent='Đúng rồi! ✔'}
  else $('gmsg').textContent='Chưa đúng, đáp án là '+vn(g.ans);
  $('ga').value='';next();$('ga').focus();
}
$('ga').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();submitAns()}};
$('gok').onclick=submitAns;

/* ===== HỆ THỐNG XP & HẠNG ===== */
// Ngưỡng hạng cao dần: Thách đấu cần 24.000 XP (~150 bài kiểm tra làm tốt lần đầu)
const RANKS=[
 {n:'Đồng',min:0,c:'#E0A56B',i:'🥉'},{n:'Bạc',min:600,c:'#C5CEDC',i:'🥈'},
 {n:'Vàng',min:1800,c:'#FFC93C',i:'🥇'},{n:'Bạch kim',min:4000,c:'#5FE0D2',i:'💠'},
 {n:'Kim cương',min:8000,c:'#8FB2FF',i:'💎'},{n:'Tinh anh',min:14000,c:'#C99BFF',i:'🔮'},
 {n:'Thách đấu',min:24000,c:'#FF7B7B',i:'👑'}];
// Hệ số XP theo lớp: lớp càng cao, bài càng khó, XP càng nhiều
const GRADE_MULT={1:.5,2:.6,3:.75,4:.9,5:1};
const LEVEL_XP={easy:4,mid:8,hard:14}, LV_NAME={easy:'Nhận biết',mid:'Thông hiểu',hard:'Vận dụng'};
const REPLAY=.2; // làm lại chỉ nhận 20% XP để chống cày
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
function refreshMe(){
  const r=rankOf(user.xp),nx=RANKS[RANKS.indexOf(r)+1];
  $('meName').textContent='👤 '+user.name;$('meXp').textContent=user.xp+' XP';
  $('meRank').textContent=r.i+' '+r.n;$('meRank').style.background=r.c;
  $('rankFill').style.width=(nx?(user.xp-r.min)/(nx.min-r.min)*100:100)+'%';
  $('rankFill').style.background=r.c;
  $('rankTxt').textContent=nx?`Còn ${nx.min-user.xp} XP để lên ${nx.n}`:'Bạn đã đạt hạng cao nhất!';
}
function addXp(n){
  const b=rankOf(user.xp);user.xp+=n;save();refreshMe();
  const a=rankOf(user.xp);if(a.n!==b.n)setTimeout(()=>toast('🎉 Chúc mừng! Bạn lên hạng '+a.n+' '+a.i),600);
}
function gameXp(s){ // trò chơi: 2 XP/câu, tối đa 30 XP mỗi ngày
  const d=new Date().toDateString();if(!user.gd||user.gd.d!==d)user.gd={d,x:0};
  const x=Math.max(0,Math.min(s*2,30-user.gd.x));user.gd.x+=x;addXp(x);return x;
}
function openDoc(i){
  const d=DOCS[i];
  if(!d.file){toast('Tài liệu sẽ được gắn file ở bước sau');return}
  window.open(d.file,'_blank');
  if(!user.doc[d.file]){user.doc[d.file]=1;addXp(5);toast('+5 XP vì mở tài liệu mới')}
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
  return `<article class="card">${cov()}<div class="cbody"><span class="tag m">Bài tập · Không giới hạn thời gian</span><h3>${Z.title}</h3>
  <small>${Z.q.length} câu trắc nghiệm · tối đa ${quizMax(Z)} XP lần đầu</small>
  <small>${best===undefined?'Chưa làm':'Điểm cao nhất: '+best+'/'+Z.q.length+' · làm lại nhận 20% XP'}</small>
  <button class="btn go" style="width:auto" onclick="startQuiz(${k})">${best===undefined?'Làm bài':'Làm lại'}</button></div></article>`;
}).join('');
function quizMax(Z){return Math.round((Z.q.reduce((s,q)=>s+LEVEL_XP[q.l],0)+40)*GRADE_MULT[Z.grade])}
function renderEx(){
  $('docList').innerHTML=emp(docsHtml());$('exList').innerHTML=emp(EXERCISES_LIVE());
  $('testList').innerHTML=emp(curG===5?dtCard():'');$('gameList').innerHTML=emp(curG===5?gameCard():'');
}
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
let qz=null;
function startQuiz(k){
  if(k!==undefined)cur=QUIZZES[k];
  qz={i:0,sel:[],t:cur.min*60,end:Date.now()+cur.min*60000,qs:cur.q.map(q=>({...q,opts:sh(q.o)}))};
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
  const first=!(cur.id in user.done),gain=Math.round(raw*GRADE_MULT[cur.grade]*(first?1:REPLAY));
  user.done[cur.id]=Math.max(user.done[cur.id]||0,ok);addXp(gain);
  const wrong=qz.qs.map((q,i)=>({q,i})).filter(x=>qz.sel[x.i]!==x.q.o[0]);
  $('qmain').classList.add('hidden');$('qres').classList.remove('hidden');$('quiz').scrollTop=0;
  $('qres').innerHTML=`<h2>${ok}/${n} câu đúng ${ok===n?'🏆':ok>=n*.6?'👍':'💪'}</h2>
  <p class="gain">+${gain} XP</p><p class="muted">${first?'Lần đầu nhận đủ XP.':'Làm lại chỉ nhận 20% XP.'} Tổng: ${user.xp} XP · Hạng ${rankOf(user.xp).n}</p>
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
  if(!boardRows)$('rankBoard').innerHTML='<h2>🏆 Bảng vinh danh</h2><p class="muted">Đang tải bảng xếp hạng…</p>';
  try{
    const {data,error}=await sb.from('profiles').select('id,name,grade,xp,done').order('xp',{ascending:false}).limit(500);
    if(error)throw error;
    if(seq!==boardSeq||!user)return;
    boardRows=data||[];
  }catch(_){
    if(seq!==boardSeq||!user)return;
    if(!boardRows){$('rankBoard').innerHTML='<h2>🏆 Bảng vinh danh</h2><p class="muted">Chưa tải được bảng xếp hạng. Hãy kiểm tra mạng rồi thử lại.</p><button class="btn ghost sm" onclick="renderBoard()">↻ Thử lại</button>';return}
  }
  drawBoard();
}
function drawBoard(){
  if(!user||!boardRows)return;
  const all=boardRows.filter(r=>r.id!==uid).map(r=>({id:r.id,name:r.name,g:Number(r.grade)||5,xp:Number(r.xp)||0,n:countDone(r.done)}));
  all.push({id:uid,name:user.name,g:user.grade||5,xp:user.xp,n:countDone(user.done)}); // dòng của mình luôn dùng số liệu mới nhất
  all.sort((a,b)=>b.xp-a.xp||String(a.name).localeCompare(String(b.name),'vi'));
  const gs=[...new Set(all.map(x=>x.g))].sort((a,b)=>a-b);
  if(boardF!=='all'&&!gs.includes(+boardF))boardF='all';
  const list=boardF==='all'?all:all.filter(x=>String(x.g)===boardF);
  const medals=['🥇','🥈','🥉'],me=all.findIndex(x=>x.id===uid),mr=rankOf(user.xp);
  $('rankBoard').innerHTML=`<h2>🏆 Bảng vinh danh</h2>
  <p class="muted">Xếp theo tổng XP của tất cả các khối. Làm bài kiểm tra và chơi trò chơi để leo hạng!</p>
  <p class="mine">Vị trí của bạn: <b>#${me+1}</b>/${all.length} · ${mr.i} ${mr.n} · ${user.xp} XP</p>
  <div class="filters"><button class="${boardF==='all'?'on':''}" onclick="setBoard('all')">Tất cả</button>${gs.map(g=>`<button class="${String(g)===boardF?'on':''}" onclick="setBoard('${g}')">Lớp ${g}</button>`).join('')}<button class="btn ghost sm refresh" onclick="renderBoard()">↻ Làm mới</button></div>
  <ol class="hlist">${list.map((x,i)=>{const r=rankOf(x.xp);return `<li class="${x.id===uid?'me':''}"><span class="pos">${medals[i]||i+1}</span><span class="hn">${esc(x.name)}<small>Lớp ${x.g} · ${x.n} bài đã làm</small></span><span class="hr" style="background:${r.c}">${r.i} ${r.n}</span><b>${x.xp} XP</b></li>`}).join('')}</ol>
  <h3>Các hạng</h3><div class="ladder">${RANKS.map(r=>`<span class="${r.n===mr.n?'on':''}" style="--c:${r.c}">${r.i} ${r.n}<small>${r.min} XP</small></span>`).join('')}</div>`;
}

/* ===== HÀNH TRÌNH ĐẠI THÁNH: đề test Bài 1–9 (15 câu, chuỗi đúng +2 sao) ===== */
const DT_ID='dt-b1-9',DT_N=DT_Q.length;
let dt=null,dtMuted=false,dtAC=null;
try{dtMuted=localStorage.getItem('mute')==='1'}catch(_){}
function dtTone(f,d,s,ty,v){const t=dtAC.currentTime+s,o=dtAC.createOscillator(),g=dtAC.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(dtAC.destination);o.start(t);o.stop(t+d+.05)}
function dtSfx(k){if(dtMuted)return;try{dtAC=dtAC||new(window.AudioContext||window.webkitAudioContext)();if(dtAC.state==='suspended')dtAC.resume();
  const S={ok:[[660,0],[880,.1]],no:[[220,0],[165,.14]],win:[[523,0],[659,.14],[784,.28],[1047,.42]],lose:[[392,0],[349,.16],[330,.32],[262,.48]]};
  (S[k]||[]).forEach(([f,s])=>dtTone(f,.25,s,k==='no'?'sawtooth':'triangle',.16))}catch(_){}}
const dtMax=()=>DT_N*6+(DT_N-2)*2+40;
function dtCard(){const b=user.done[DT_ID];
  return `<article class="card">${cov()}<div class="cbody"><span class="tag m">Mới · Trò chơi trắc nghiệm</span><h3>🐵 Hành trình Đại Thánh – Đề test Bài 1–9</h3>
  <small>${DT_N} câu · giữ chuỗi đúng để nhận thêm sao · tối đa ${dtMax()} XP lần đầu</small>
  <small>${b===undefined?'Chưa làm':'Điểm cao nhất: '+b+'/'+DT_N+' · làm lại nhận 20% XP'}</small>
  <button class="btn go" style="width:auto" onclick="dtStart()">${b===undefined?'Bắt đầu hành trình':'Chơi lại'}</button></div></article>`}
function dtStart(){
  dt={i:0,xp:0,st:0,best:0,ans:[],t0:Date.now()};
  $('dt').classList.remove('hidden');document.body.style.overflow='hidden';$('dt').scrollTop=0;dtSfx('ok');dtShow();
}
function dtClose(){$('dt').classList.add('hidden');document.body.style.overflow='';renderEx()}
function dtShow(){
  const q=DT_Q[dt.i];dt.cur=sh(q[3].map((t,k)=>({t,c:k===q[4]})));
  $('dtbox').innerHTML=`<div class="qtop"><b>🐵 Hành trình Đại Thánh</b><span><button type="button" class="btn ghost sm" id="dtmute">${dtMuted?'🔇':'🔊'}</button> <button type="button" class="btn ghost sm" id="dtquit">Thoát</button></span></div>
  <div class="qprog"><i style="width:${dt.i/DT_N*100}%"></i></div>
  <p class="qlv">Câu ${dt.i+1}/${DT_N} · ⭐ ${dt.xp} · 🔥 ${dt.st} · ${DT_Q[dt.i][1]} · ${DT_T[q[0]]}</p>
  <h2 class="dtq">${fmt(q[2])}</h2>
  <div class="qopts" id="dtopts">${dt.cur.map((o,k)=>`<button type="button" data-k="${k}">${'ABCD'[k]}. ${fmt(o.t)}</button>`).join('')}</div><div id="dtfb"></div>`;
  document.querySelectorAll('#dtopts button').forEach(b=>b.onclick=()=>dtPick(+b.dataset.k));
  $('dtmute').onclick=()=>{dtMuted=!dtMuted;try{localStorage.setItem('mute',dtMuted?'1':'0')}catch(_){}$('dtmute').textContent=dtMuted?'🔇':'🔊'};
  $('dtquit').onclick=()=>{if(confirm('Thoát bây giờ sẽ không được tính điểm. Bạn chắc chứ?'))dtClose()};
}
function dtPick(k){
  const q=DT_Q[dt.i],ok=dt.cur[k].c;
  document.querySelectorAll('#dtopts button').forEach((b,j)=>{b.disabled=true;if(dt.cur[j].c)b.classList.add('ok');else if(j===k)b.classList.add('no')});
  if(ok){dt.st++;dt.best=Math.max(dt.best,dt.st);dt.xp+=6+(dt.st>=3?2:0)}else dt.st=0;
  dt.ans.push({q,ok,pick:dt.cur[k].t});dtSfx(ok?'ok':'no');
  $('dtfb').innerHTML=`<div class="dtfb ${ok?'ok':'no'}">${ok?(dt.st>=3?`🔥 Chuỗi ${dt.st} câu đúng! `:'✅ Chính xác! '):'❌ Chưa đúng rồi. '}${fmt(q[5])}</div>
  <button type="button" class="btn go" style="width:auto;margin-top:14px" id="dtnx">${dt.i<DT_N-1?'Câu tiếp theo →':'Xem kết quả 🏆'}</button>`;
  $('dtnx').onclick=()=>{dt.i++;dt.i<DT_N?dtShow():dtEnd()};
}
function dtEnd(){
  const n=dt.ans.filter(a=>a.ok).length,sec=Math.round((Date.now()-dt.t0)/1000);
  let raw=dt.xp;if(n>=Math.ceil(DT_N*.6))raw+=10;if(n===DT_N)raw+=30;
  const first=!(DT_ID in user.done),gain=Math.round(raw*(first?1:REPLAY));
  user.done[DT_ID]=Math.max(user.done[DT_ID]||0,n);addXp(gain);
  const lv=n>=13?['🏆','Đại Thánh Toán học']:n>=10?['🥇','Chiến binh Giỏi']:n>=7?['🥈','Thám hiểm Khá']:['🌱','Mầm non Cố gắng'];
  const gr={};dt.ans.forEach(a=>{const k=a.q[0];gr[k]=gr[k]||[0,0];gr[k][1]++;if(a.ok)gr[k][0]++});
  const rows=Object.keys(gr).map(k=>{const r=gr[k][0]/gr[k][1],c=r>=1?'#16B364':r>=.5?'#FFC93C':'#D12F35';return `<div class="dtrow"><span>${DT_T[k]}</span><div class="rbar"><i style="width:${r*100}%;background:${c}"></i></div><b>${gr[k][0]}/${gr[k][1]}</b></div>`}).join('');
  const weak=Object.keys(gr).filter(k=>gr[k][0]<gr[k][1]).map(k=>DT_T[k]);
  const wrong=dt.ans.filter(a=>!a.ok);
  $('dtbox').innerHTML=`<div style="text-align:center"><div style="font-size:3.5rem">${lv[0]}</div><h2>${lv[1]}</h2><h2>${n}/${DT_N} câu đúng</h2>
  <p class="gain">+${gain} XP</p><p class="muted">${first?'Lần đầu nhận đủ XP.':'Làm lại chỉ nhận 20% XP.'} ⭐ ${dt.xp} sao · 🔥 chuỗi dài nhất ${dt.best} · ⏱ ${Math.floor(sec/60)} phút ${sec%60} giây<br>Tổng: ${user.xp} XP · Hạng ${rankOf(user.xp).n}</p></div>
  <h3>Bản đồ năng lực</h3>${rows}<p class="muted">${weak.length?'Cần ôn thêm: <b>'+weak.join(', ')+'</b>.':'Bạn đúng ở mọi nội dung. Tuyệt vời!'}</p>
  ${wrong.length?'<h3>Các câu cần xem lại</h3>'+wrong.map(a=>`<div class="rv"><b>${a.q[1]}:</b> ${fmt(a.q[2])}<br><span class="bad">Bạn chọn: ${fmt(a.pick)}</span><br><span class="good">Đáp án: ${fmt(a.q[3][a.q[4]])}</span><br><em>${fmt(a.q[5])}</em></div>`).join(''):''}
  <div class="qnav"><button type="button" class="btn ghost" onclick="dtClose()">Đóng</button><button type="button" class="btn ghost" onclick="dtClose();view('levels')">🏆 Xem vinh danh</button><button type="button" class="btn go" style="width:auto" onclick="dtStart()">Chơi lại</button></div>`;
  $('dt').scrollTop=0;dtSfx(n>=7?'win':'lose');
}
