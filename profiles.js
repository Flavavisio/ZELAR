/* Zelar profiles v0.1 — DEMONSTRATION ONLY.
   Client-side UI is not an authorization boundary. Never use this to protect personal data. */
"use strict";
const role=document.body.dataset.role;
const roleConfig={
 super:{title:"Superadministrador",menu:[["overview","▦","Visão geral"],["companies","▣","Empresas"],["users","♙","Utilizadores"],["plans","◈","Planos e licenças"],["hardware","◎","Catálogo Aqara"],["health","◉","Estado técnico"],["audit","≡","Auditoria"]]},
 empresa:{title:"Empresa cuidadora",menu:[["overview","▦","Visão geral"],["residents","♡","Idosos"],["homes","⌂","Habitações"],["floor","▤","Plantas 2D"],["sensors","◎","Equipamentos"],["alerts","♧","Alertas"],["team","♙","Cuidadores e familiares"],["reports","≡","Relatórios"]]},
 familiar:{title:"Área familiar",menu:[["overview","▦","O meu familiar"],["floor","▤","Planta 2D"],["activity","◉","Atividade"],["alerts","♧","Alertas"],["daily","≡","Resumo diário"],["prefs","⚙","Preferências"]]}
};
const DEMO_SESSION_KEY="zelar-demo-session";
const DEMO_ROLE_KEY="zelar-demo-role";
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const demo={
 companies:[{name:"Apoio Domiciliário Exemplo",status:"Demonstração",homes:1}],
 homes:[{id:1,name:"Casa da Maria",resident:"Maria",company:"Apoio Domiciliário Exemplo",rooms:[{id:1,name:"Sala",state:"presence"},{id:2,name:"Cozinha",state:"empty"},{id:3,name:"Quarto",state:"empty"},{id:4,name:"Casa de banho",state:"empty"}]}],
 devices:[{name:"FP2 — Sala",model:"Aqara FP2",room:"Sala"},{name:"FP2 — Quarto",model:"Aqara FP2",room:"Quarto"},{name:"Sensor magnético — Porta",model:"Aqara Door P2",room:"Entrada"}],
 events:["Presença simulada na sala","Verificação demonstrativa de sensor","Habitação de demonstração carregada"],
 alerts:[{name:"Integração física ainda não ativa",status:"Informativo"}]
};
/* Registo demonstrativo de permanências. Mantido apenas nesta sessão do navegador. */
const TRACK_KEY="zelar-demo-room-tracking-v1";
function loadTracking(){
 try{
  const saved=JSON.parse(sessionStorage.getItem(TRACK_KEY)||"null");
  if(saved&&Number.isFinite(saved.enteredAt)&&Array.isArray(saved.visits)&&saved.activeRoomId)return saved;
 }catch(_){}
 return {activeRoomId:1,enteredAt:Date.now(),visits:[]};
}
let tracking=loadTracking();
function persistTracking(){sessionStorage.setItem(TRACK_KEY,JSON.stringify(tracking));}
function formatDuration(ms){
 const seconds=Math.max(0,Math.floor(ms/1000));
 const hh=Math.floor(seconds/3600),mm=Math.floor(seconds%3600/60),ss=seconds%60;
 return (hh?String(hh).padStart(2,"0")+":":"")+String(mm).padStart(2,"0")+":"+String(ss).padStart(2,"0");
}
function formatClock(timestamp){return new Date(timestamp).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit",second:"2-digit"});}
function currentRoom(){return demo.homes[0].rooms.find(r=>r.id===tracking.activeRoomId);}
function syncPresence(){demo.homes[0].rooms.forEach(r=>r.state=r.id===tracking.activeRoomId?"presence":"empty");}
function moveToRoom(roomId){
 const next=demo.homes[0].rooms.find(r=>r.id===roomId);
 if(!next||roomId===tracking.activeRoomId)return;
 const now=Date.now();
 const previous=currentRoom();
 if(previous&&now>=tracking.enteredAt)tracking.visits.unshift({
  roomId:previous.id,roomName:previous.name,enteredAt:tracking.enteredAt,exitedAt:now,durationMs:now-tracking.enteredAt
 });
 tracking.visits=tracking.visits.slice(0,100);
 tracking.activeRoomId=next.id;
 tracking.enteredAt=now;
 persistTracking();
 syncPresence();
}
function trackingRows(limit=8){
 const history=tracking.visits.slice(0,limit);
 if(!history.length)return '<p class="profile-hint">Ainda não existem deslocações concluídas. Usa «Simular deslocação» para testar.</p>';
 return rows(history.map(v=>[v.roomName,formatClock(v.enteredAt)+" → "+formatClock(v.exitedAt),formatDuration(v.durationMs)]));
}
function timeByRoomRows(){
 return rows(demo.homes[0].rooms.map(room=>{
  const completed=tracking.visits.filter(v=>v.roomId===room.id).reduce((n,v)=>n+v.durationMs,0);
  const ongoing=tracking.activeRoomId===room.id?Math.max(0,Date.now()-tracking.enteredAt):0;
  const count=tracking.visits.filter(v=>v.roomId===room.id).length+(tracking.activeRoomId===room.id?1:0);
  return [room.name,count+" passagem(ns) registada(s)",formatDuration(completed+ongoing)];
 }));
}
syncPresence();
const titles=Object.fromEntries(Object.values(roleConfig).flatMap(c=>c.menu.map(m=>[m[0],m[2]])));
function tile(label,value,detail){return '<article class="profile-tile"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><p>'+esc(detail)+'</p></article>';}
function panel(title,inner,desc=""){return '<section class="profile-panel"><h2>'+esc(title)+'</h2>'+(desc?'<p>'+esc(desc)+'</p>':'')+inner+'</section>';}
function rows(items){return '<div class="profile-rows">'+items.map(x=>'<div class="profile-entry"><div><strong>'+esc(x[0])+'</strong><small>'+esc(x[1]||"")+'</small></div><span class="status">'+esc(x[2]||"Demonstração")+'</span></div>').join("")+'</div>';}
function floor(){
 const h=demo.homes[0];
 return panel("Planta 2D — "+h.name,
 '<div class="room-grid" id="demoFloor">'+h.rooms.map(r=>'<button class="room-cell '+(r.state==="presence"?"occupied":"")+'" data-room="'+r.id+'"><span>⌂</span><span>'+esc(r.name)+'</span><small>'+(r.state==="presence"?'● Presença · <span data-active-duration>'+formatDuration(Date.now()-tracking.enteredAt)+'</span>':"Sem atividade")+'</small></button>').join("")+'</div>'+
 '<div class="room-current" id="roomInfo">Presença atual: <strong>'+esc(currentRoom()?.name||"Desconhecida")+'</strong> desde '+formatClock(tracking.enteredAt)+' · <strong data-active-duration>'+formatDuration(Date.now()-tracking.enteredAt)+'</strong></div>'+
 '<div class="profile-actions"><button class="btn btn-outline" type="button" id="nextRoom">Simular deslocação →</button></div>'+
 '<div class="profile-duration-title">Tempo acumulado por divisão</div><div data-duration-totals>'+timeByRoomRows()+'</div>',
 'Cada passagem regista entrada, saída e duração. Demonstração no navegador: não confirma a localização física do idoso.');
}
function historyPanel(){
 return panel("Histórico de permanências",'<div data-visit-history>'+trackingRows(10)+'</div>',
 "Cada deslocação concluída gera um registo com hora de entrada, hora de saída e duração.");
}
function render(section){
 const el=document.getElementById("roleContent");
 const head=document.getElementById("roleHeading");
 head.textContent=titles[section]||roleConfig[role].title;
 document.getElementById("roleBreadcrumb").textContent=roleConfig[role].title+" / "+head.textContent;
 const h=demo.homes[0];
 let html="";
 if(role==="super"){
  if(section==="overview")html='<div class="profile-grid">'+tile("Empresas","1","Organização fictícia")+tile("Habitações","1","Registo de demonstração")+tile("Sensores","3","Todos simulados")+'</div>'+panel("Estado da plataforma",rows([["Interface web","Páginas HTML, CSS e JavaScript","Criada"],["Hub Aqara M3","Ligação real ainda por desenvolver","Pendente"],["Autenticação","Ainda sem servidor de identidade","Pendente"]]));
  else if(section==="companies")html=panel("Empresas",rows(demo.companies.map(x=>[x.name,x.homes+" habitação de demonstração",x.status])));
  else if(section==="users")html=panel("Utilizadores e permissões",rows([["Superadministrador","Gestão global e métricas"],["Empresa","Acesso apenas à sua organização"],["Familiar","Acesso à habitação autorizada"]]),"Os limites de acesso são uma especificação. Precisam de ser impostos no backend.");
  else if(section==="plans")html=panel("Planos e licenças",rows([["Gestão de subscrições","Estrutura prevista, sem faturação ativa"]]));
  else if(section==="hardware")html=panel("Catálogo Aqara",rows([["Hub M3","Matter Bridge"],["Presence Sensor FP2","Presença por zonas via interface compatível"],["Door and Window P2","Abertura e fecho"],["Motion Sensor P1","Movimento"]]));
  else if(section==="health")html=panel("Estado técnico",rows([["Interface web","Demonstração local","Ativa"],["Hub M3","Sem ligação física","Pendente"],["Alertas para familiares","Não entregues","Pendente"]]));
  else html=panel("Auditoria",'<p class="profile-hint">Registos de auditoria reais serão implementados com autenticação e backend.</p>');
 }
 if(role==="empresa"){
  if(section==="overview")html='<div class="profile-grid">'+tile("Idosos","1","Fictício")+tile("Equipamentos","3","Aqara simulados")+tile("Alertas","1","Evento demonstrativo")+'</div><div class="profile-cols">'+floor()+historyPanel()+'</div>';
  else if(section==="residents")html=panel("Idosos acompanhados",rows([["Maria","Casa da Maria · Exemplo fictício"]]));
  else if(section==="homes")html=panel("Habitações",rows([[h.name,h.rooms.length+" divisões"]]));
  else if(section==="floor")html=floor();
  else if(section==="sensors")html=panel("Equipamentos Aqara",rows(demo.devices.map(x=>[x.name,x.model+" · "+x.room])));
  else if(section==="alerts")html=panel("Alertas",rows(demo.alerts.map(a=>[a.name,"Sem notificações físicas",a.status])));
  else if(section==="team")html=panel("Cuidadores e familiares",rows([["Cuidador de demonstração","Acesso futuro apenas aos idosos atribuídos"],["Familiar de demonstração","Acesso futuro limitado à habitação autorizada"]]));
  else html=panel("Relatório de permanências — demonstração",timeByRoomRows())+historyPanel();
 }
 if(role==="familiar"){
  if(section==="overview")html='<div class="profile-grid">'+tile("Acompanhamento","Maria","Pessoa fictícia")+tile("Presença atual",currentRoom()?.name||"—","Estado simulado")+tile("Alertas","0","Sem alertas reais")+'</div><div class="profile-cols">'+floor()+historyPanel()+'</div>';
  else if(section==="floor")html=floor();
  else if(section==="activity")html=historyPanel()+panel("Totais por divisão",timeByRoomRows());
  else if(section==="alerts")html=panel("Alertas para a família",rows([["Não existem alertas reais","As notificações estão por implementar","Demo"]]));
  else if(section==="daily")html=panel("Tempo por divisão nesta sessão",timeByRoomRows())+historyPanel();
  else html=panel("Preferências",rows([["Notificações","Ainda não disponíveis"],["Partilha de informação","Será gerida por autorizações individuais"]]));
 }
 el.innerHTML=html;
 document.querySelectorAll("[data-room]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("[data-room]").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");const room=h.rooms.find(r=>r.id===Number(btn.dataset.room));document.getElementById("roomInfo").textContent=room.name+": "+(room.state==="presence"?"presença simulada.":"sem atividade simulada.");}));
 const advance=document.getElementById("nextRoom");
 if(advance)advance.addEventListener("click",()=>{const idx=h.rooms.findIndex(r=>r.id===tracking.activeRoomId);moveToRoom(h.rooms[(idx+1)%h.rooms.length].id);render(section);});
 document.querySelectorAll("[data-section]").forEach(b=>b.classList.toggle("active",b.dataset.section===section));
}
function init(){
 if(!roleConfig[role])return;
 if(sessionStorage.getItem(DEMO_SESSION_KEY)!=="demo"||sessionStorage.getItem(DEMO_ROLE_KEY)!==role){location.replace("login.html");return;}
 const nav=document.getElementById("roleNav");
 nav.innerHTML=roleConfig[role].menu.map(m=>'<button class="nav-item" data-section="'+m[0]+'">'+m[1]+' <span>'+esc(m[2])+'</span></button>').join("");
 nav.addEventListener("click",e=>{const b=e.target.closest("[data-section]");if(b){render(b.dataset.section);document.querySelector(".sidebar").classList.remove("open");}});
 document.getElementById("roleLogout").addEventListener("click",()=>{sessionStorage.removeItem(DEMO_SESSION_KEY);sessionStorage.removeItem(DEMO_ROLE_KEY);location.href="login.html";});
 document.getElementById("roleMenu").addEventListener("click",()=>document.querySelector(".sidebar").classList.toggle("open"));
 render("overview");
 setInterval(()=>{
  document.querySelectorAll("[data-active-duration]").forEach(el=>el.textContent=formatDuration(Date.now()-tracking.enteredAt));
  const totals=document.querySelector("[data-duration-totals]");if(totals)totals.innerHTML=timeByRoomRows();
  const daily=document.querySelector("#roleContent");
  if(daily&&document.querySelector(".nav-item.active")?.dataset.section==="daily")render("daily");
 },1000);
}
init();