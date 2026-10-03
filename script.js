// Tài khoản thử nghiệm – Giai đoạn 2 sẽ thay bằng database, giáo viên cấp tài khoản trong trang quản trị
const ACCOUNTS = {
  hs5001: {pass:'nova123', name:'Bảo An', grade:5, xp:120},
  hs5002: {pass:'nova123', name:'Gia Hân', grade:5, xp:340}
};
const DOCS = [
  {t:'Tài liệu tổng ôn Toán 5: Lý thuyết & Bài tập (Bài 1–11)', type:'PDF', topic:'Tổng ôn · Số thập phân', file:'assets/docs/toan5-tong-on.pdf'},
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
let user = null, uid = null;

function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
function show(id){['splash','login','app'].forEach(s=>$(s).classList.toggle('hidden',s!==id&&s!=='splash'))}
function view(id){['levels','grade5'].forEach(v=>$(v).classList.toggle('hidden',v!==id));window.scrollTo(0,0);if(id==='levels'&&user)renderBoard()}

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
  uid=id;user=ACCOUNTS[id];load();show('app');view('levels');refreshMe();
  toast('Xin chào '+user.name+'! 👋');
}
function refreshMe(){}
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
    `<article class="card"><span class="tag ${d.type==='Video'?'v':d.type==='Sơ đồ'?'m':''}">${d.type}</span><h3>${d.t}</h3><small>${d.topic}</small><button class="btn ghost" onclick="openDoc(${DOCS.indexOf(d)})">Xem tài liệu</button></article>`).join('');
}

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
    if(g.time<=0){clearInterval(g.t);$('ga').disabled=true;const xp=gameXp(g.score);
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
function save(){try{localStorage.setItem('nova_p_'+uid,JSON.stringify({xp:user.xp,done:user.done,doc:user.doc,gd:user.gd}))}catch(_){}}
function load(){
  try{const s=JSON.parse(localStorage.getItem('nova_p_'+uid));if(s){user.xp=s.xp;user.done=s.done;user.doc=s.doc;user.gd=s.gd}}catch(_){}
  user.done=user.done||{};user.doc=user.doc||{};
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

/* ===== BÀI KIỂM TRA 15 PHÚT: ÔN TẬP BÀI 1–9 (đáp án đúng luôn ở vị trí đầu, được xáo khi làm) ===== */
const QUIZ={id:'t15-b1-9',title:'Kiểm tra 15 phút: Ôn tập Bài 1–9',min:15,grade:5,q:[
 {l:'easy',q:'Chữ số 6 trong số 863 749 thuộc hàng nào?',o:['Chục nghìn','Trăm nghìn','Nghìn','Trăm']},
 {l:'easy',q:'Làm tròn số 2 545 000 đến hàng trăm nghìn được số nào?',o:['2 500 000','2 600 000','2 550 000','3 000 000']},
 {l:'easy',q:'Phép chia 47 : 5 có số dư là bao nhiêu?',o:['2','1','3','9']},
 {l:'easy',q:'Phân số nào sau đây là phân số thập phân?',o:['57/100','9/20','3/7','5/8']},
 {l:'easy',q:'Điền số thích hợp: 3/4 = ?/8',o:['6','5','7','8']},
 {l:'easy',q:'1 tạ bằng bao nhiêu ki-lô-gam?',o:['100 kg','10 kg','1 000 kg','50 kg']},
 {l:'mid',q:'Giá trị của biểu thức 36 − 4 × 5 + 8 : 2 là:',o:['20','16','36','4']},
 {l:'mid',q:'Phân số nào lớn nhất trong ba phân số 2/3; 3/4; 5/6?',o:['5/6','2/3','3/4','Cả ba bằng nhau']},
 {l:'mid',q:'1/2 + 1/3 bằng:',o:['5/6','2/5','2/6','1/5']},
 {l:'mid',q:'2/3 : 4/5 bằng:',o:['5/6','8/15','6/5','10/3']},
 {l:'mid',q:'Hỗn số 2 3/4 viết thành phân số là:',o:['11/4','6/4','9/4','5/4']},
 {l:'mid',q:'Phân số 17/5 viết thành hỗn số là:',o:['3 2/5','2 3/5','3 1/5','4 2/5']},
 {l:'hard',q:'Hình chữ nhật dài 12 cm, rộng 7 cm. Chu vi và diện tích lần lượt là:',o:['38 cm và 84 cm²','19 cm và 84 cm²','38 cm và 19 cm²','84 cm và 38 cm²']},
 {l:'hard',q:'Hình thoi có hai đường chéo dài 12 cm và 8 cm. Diện tích hình thoi là:',o:['48 cm²','96 cm²','40 cm²','20 cm²']},
 {l:'hard',q:'Mai có sợi dây dài 3/4 m, cắt đi 1/6 m. Sợi dây còn lại dài:',o:['7/12 m','2/10 m','5/12 m','4/10 m']}
]};
const EXERCISES_LIVE=()=>{
  const best=user.done[QUIZ.id];
  return `<article class="card"><span class="tag m">Mới · ${QUIZ.min} phút</span><h3>${QUIZ.title}</h3>
  <small>${QUIZ.q.length} câu trắc nghiệm · tối đa ${quizMax()} XP lần đầu</small>
  <small>${best===undefined?'Chưa làm':'Điểm cao nhất: '+best+'/'+QUIZ.q.length+' · làm lại nhận 20% XP'}</small>
  <button class="btn go" style="width:auto" onclick="startQuiz()">${best===undefined?'Làm bài':'Làm lại'}</button></article>`;
};
function quizMax(){return Math.round((QUIZ.q.reduce((s,q)=>s+LEVEL_XP[q.l],0)+40)*GRADE_MULT[QUIZ.grade])}
function renderEx(){
  $('exList').innerHTML=EXERCISES_LIVE()+dtCard()+EXERCISES.map(x=>
  `<article class="card soon"><h3>${x.t}</h3><small>${x.n} câu · ${x.m} phút</small><span class="tag">Sắp ra mắt</span></article>`).join('');
}
const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
let qz=null;
function startQuiz(){
  qz={i:0,sel:[],t:QUIZ.min*60,qs:QUIZ.q.map(q=>({...q,opts:sh(q.o)}))};
  $('quiz').classList.remove('hidden');$('qres').classList.add('hidden');$('qmain').classList.remove('hidden');
  $('qtitle').textContent=QUIZ.title;document.body.style.overflow='hidden';$('quiz').scrollTop=0;
  qz.timer=setInterval(()=>{qz.t--;tick();if(qz.t<=0){toast('Hết giờ! Bài đã được nộp.');finishQuiz()}},1000);
  tick();showQ();
}
function tick(){$('qtime').textContent=Math.floor(qz.t/60)+':'+String(qz.t%60).padStart(2,'0')}
function showQ(){
  const q=qz.qs[qz.i],n=qz.qs.length;
  $('qbar').style.width=(qz.i/n*100)+'%';
  $('qlv').textContent=`Câu ${qz.i+1}/${n} · ${LV_NAME[q.l]}`;
  $('qtext').textContent=q.q;$('qopts').innerHTML='';
  q.opts.forEach((o,k)=>{
    const b=document.createElement('button');b.type='button';b.textContent=String.fromCharCode(65+k)+'. '+o;
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
  const first=!(QUIZ.id in user.done),gain=Math.round(raw*GRADE_MULT[QUIZ.grade]*(first?1:REPLAY));
  user.done[QUIZ.id]=Math.max(user.done[QUIZ.id]||0,ok);addXp(gain);
  const wrong=qz.qs.map((q,i)=>({q,i})).filter(x=>qz.sel[x.i]!==x.q.o[0]);
  $('qmain').classList.add('hidden');$('qres').classList.remove('hidden');$('quiz').scrollTop=0;
  $('qres').innerHTML=`<h2>${ok}/${n} câu đúng ${ok===n?'🏆':ok>=n*.6?'👍':'💪'}</h2>
  <p class="gain">+${gain} XP</p><p class="muted">${first?'Lần đầu nhận đủ XP.':'Làm lại chỉ nhận 20% XP.'} Tổng: ${user.xp} XP · Hạng ${rankOf(user.xp).n}</p>
  ${wrong.length?'<h3>Các câu cần xem lại</h3>'+wrong.map(x=>`<div class="rv"><b>Câu ${x.i+1}.</b> ${x.q.q}<br><span class="bad">Bạn chọn: ${qz.sel[x.i]??'(bỏ trống)'}</span><br><span class="good">Đáp án: ${x.q.o[0]}</span></div>`).join(''):'<p>Bạn trả lời đúng tất cả!</p>'}
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

/* ===== BẢNG VINH DANH (xếp theo XP; hiện tính trên thiết bị này, Giai đoạn 2 sẽ đồng bộ qua database) ===== */
function saved(id){try{return JSON.parse(localStorage.getItem('nova_p_'+id))}catch(_){return null}}
function xpOf(id){if(id===uid)return user.xp;const s=saved(id);return s&&typeof s.xp==='number'?s.xp:ACCOUNTS[id].xp}
function doneOf(id){if(id===uid)return Object.keys(user.done).length;const s=saved(id);return s&&s.done?Object.keys(s.done).length:0}
let boardF='all';
function setBoard(f){boardF=f;renderBoard()}
function renderBoard(){
  const all=Object.keys(ACCOUNTS).map(id=>({id,name:ACCOUNTS[id].name,g:ACCOUNTS[id].grade||5,xp:xpOf(id),n:doneOf(id)})).sort((a,b)=>b.xp-a.xp);
  const gs=[...new Set(all.map(x=>x.g))].sort((a,b)=>a-b);
  if(boardF!=='all'&&!gs.includes(+boardF))boardF='all';
  const list=boardF==='all'?all:all.filter(x=>String(x.g)===boardF);
  const medals=['🥇','🥈','🥉'],me=all.findIndex(x=>x.id===uid),mr=rankOf(user.xp);
  $('rankBoard').innerHTML=`<h2>🏆 Bảng vinh danh</h2>
  <p class="muted">Xếp theo tổng XP của tất cả các khối. Làm bài kiểm tra và chơi trò chơi để leo hạng!</p>
  <p class="mine">Vị trí của bạn: <b>#${me+1}</b>/${all.length} · ${mr.i} ${mr.n} · ${user.xp} XP</p>
  <div class="filters"><button class="${boardF==='all'?'on':''}" onclick="setBoard('all')">Tất cả</button>${gs.map(g=>`<button class="${String(g)===boardF?'on':''}" onclick="setBoard('${g}')">Lớp ${g}</button>`).join('')}</div>
  <ol class="hlist">${list.map((x,i)=>{const r=rankOf(x.xp);return `<li class="${x.id===uid?'me':''}"><span class="pos">${medals[i]||i+1}</span><span class="hn">${x.name}<small>Lớp ${x.g} · ${x.n} bài đã làm</small></span><span class="hr" style="background:${r.c}">${r.i} ${r.n}</span><b>${x.xp} XP</b></li>`}).join('')}</ol>
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
  return `<article class="card"><span class="tag m">Mới · Trò chơi trắc nghiệm</span><h3>🐵 Hành trình Đại Thánh – Đề test Bài 1–9</h3>
  <small>${DT_N} câu · giữ chuỗi đúng để nhận thêm sao · tối đa ${dtMax()} XP lần đầu</small>
  <small>${b===undefined?'Chưa làm':'Điểm cao nhất: '+b+'/'+DT_N+' · làm lại nhận 20% XP'}</small>
  <button class="btn go" style="width:auto" onclick="dtStart()">${b===undefined?'Bắt đầu hành trình':'Chơi lại'}</button></article>`}
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
  <h2 class="dtq">${q[2]}</h2>
  <div class="qopts" id="dtopts">${dt.cur.map((o,k)=>`<button type="button" data-k="${k}">${'ABCD'[k]}. ${o.t}</button>`).join('')}</div><div id="dtfb"></div>`;
  document.querySelectorAll('#dtopts button').forEach(b=>b.onclick=()=>dtPick(+b.dataset.k));
  $('dtmute').onclick=()=>{dtMuted=!dtMuted;try{localStorage.setItem('mute',dtMuted?'1':'0')}catch(_){}$('dtmute').textContent=dtMuted?'🔇':'🔊'};
  $('dtquit').onclick=()=>{if(confirm('Thoát bây giờ sẽ không được tính điểm. Bạn chắc chứ?'))dtClose()};
}
function dtPick(k){
  const q=DT_Q[dt.i],ok=dt.cur[k].c;
  document.querySelectorAll('#dtopts button').forEach((b,j)=>{b.disabled=true;if(dt.cur[j].c)b.classList.add('ok');else if(j===k)b.classList.add('no')});
  if(ok){dt.st++;dt.best=Math.max(dt.best,dt.st);dt.xp+=6+(dt.st>=3?2:0)}else dt.st=0;
  dt.ans.push({q,ok,pick:dt.cur[k].t});dtSfx(ok?'ok':'no');
  $('dtfb').innerHTML=`<div class="dtfb ${ok?'ok':'no'}">${ok?(dt.st>=3?`🔥 Chuỗi ${dt.st} câu đúng! `:'✅ Chính xác! '):'❌ Chưa đúng rồi. '}${q[5]}</div>
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
  ${wrong.length?'<h3>Các câu cần xem lại</h3>'+wrong.map(a=>`<div class="rv"><b>${a.q[1]}:</b> ${a.q[2]}<br><span class="bad">Bạn chọn: ${a.pick}</span><br><span class="good">Đáp án: ${a.q[3][a.q[4]]}</span><br><i>${a.q[5]}</i></div>`).join(''):''}
  <div class="qnav"><button type="button" class="btn ghost" onclick="dtClose()">Đóng</button><button type="button" class="btn ghost" onclick="dtClose();view('levels')">🏆 Xem vinh danh</button><button type="button" class="btn go" style="width:auto" onclick="dtStart()">Chơi lại</button></div>`;
  $('dt').scrollTop=0;dtSfx(n>=7?'win':'lose');
}
renderEx();
  $('dt').scrollTop=0;dtSfx(n>=7?'win':'lose');
}
renderEx();
