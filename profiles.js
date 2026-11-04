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
const titles=Object.fromEntries(Object.values(roleConfig).flatMap(c=>c.menu.map(m=>[m[0],m[2]])));
function tile(label,value,detail){return '<article class="profile-tile"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><p>'+esc(detail)+'</p></article>';}
function panel(title,inner,desc=""){return '<section class="profile-panel"><h2>'+esc(title)+'</h2>'+(desc?'<p>'+esc(desc)+'</p>':'')+inner+'</section>';}
function rows(items){return '<div class="profile-rows">'+items.map(x=>'<div class="profile-entry"><div><strong>'+esc(x[0])+'</strong><small>'+esc(x[1]||"")+'</small></div><span class="status">'+esc(x[2]||"Demonstração")+'</span></div>').join("")+'</div>';}
function floor(){
 const h=demo.homes[0];
 return panel("Planta 2D — "+h.name,
 '<div class="room-grid" id="demoFloor">'+h.rooms.map(r=>'<button class="room-cell '+(r.state==="presence"?"occupied":"")+'" data-room="'+r.id+'"><span>⌂</span><span>'+esc(r.name)+'</span><small>'+(r.state==="presence"?"● Presença simulada":"Sem atividade")+'</small></button>').join("")+'</div><div class="room-current" id="roomInfo">Seleciona uma divisão para consultar o estado.</div><div class="profile-actions"><button class="btn btn-outline" type="button" id="nextRoom">Simular deslocação</button></div>',
 'Os estados apresentados são fictícios. O ponto representa presença detetada numa divisão, não a localização confirmada da pessoa.');
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
  if(section==="overview")html='<div class="profile-grid">'+tile("Idosos","1","Fictício")+tile("Equipamentos","3","Aqara simulados")+tile("Alertas","1","Evento demonstrativo")+'</div><div class="profile-cols">'+floor()+panel("Atividade recente",rows(demo.events.map(x=>[x,"Simulação","Demo"])))+'</div>';
  else if(section==="residents")html=panel("Idosos acompanhados",rows([["Maria","Casa da Maria · Exemplo fictício"]]));
  else if(section==="homes")html=panel("Habitações",rows([[h.name,h.rooms.length+" divisões"]]));
  else if(section==="floor")html=floor();
  else if(section==="sensors")html=panel("Equipamentos Aqara",rows(demo.devices.map(x=>[x.name,x.model+" · "+x.room])));
  else if(section==="alerts")html=panel("Alertas",rows(demo.alerts.map(a=>[a.name,"Sem notificações físicas",a.status])));
  else if(section==="team")html=panel("Cuidadores e familiares",rows([["Cuidador de demonstração","Acesso futuro apenas aos idosos atribuídos"],["Familiar de demonstração","Acesso futuro limitado à habitação autorizada"]]));
  else html=panel("Relatórios",'<p class="profile-hint">Relatórios de atividade previstos para a próxima fase.</p>');
 }
 if(role==="familiar"){
  if(section==="overview")html='<div class="profile-grid">'+tile("Acompanhamento","Maria","Pessoa fictícia")+tile("Última presença","Sala","Estado simulado")+tile("Alertas","0","Sem alertas reais")+'</div><div class="profile-cols">'+floor()+panel("Informação para a família",rows([["Atividade","Presença simulada na sala","Demo"],["Comunicação Aqara","Ainda não ligada","Pendente"]]))+'</div>';
  else if(section==="floor")html=floor();
  else if(section==="activity")html=panel("Atividade recente",rows(demo.events.map(x=>[x,"Evento fictício","Demo"])));
  else if(section==="alerts")html=panel("Alertas para a família",rows([["Não existem alertas reais","As notificações estão por implementar","Demo"]]));
  else if(section==="daily")html=panel("Resumo diário",rows([["Atividade diurna","Resumo apenas ilustrativo"],["Presença por divisão","Carece de sensores ligados"]]));
  else html=panel("Preferências",rows([["Notificações","Ainda não disponíveis"],["Partilha de informação","Será gerida por autorizações individuais"]]));
 }
 el.innerHTML=html;
 document.querySelectorAll("[data-room]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("[data-room]").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");const room=h.rooms.find(r=>r.id===Number(btn.dataset.room));document.getElementById("roomInfo").textContent=room.name+": "+(room.state==="presence"?"presença simulada.":"sem atividade simulada.");}));
 const advance=document.getElementById("nextRoom");
 if(advance)advance.addEventListener("click",()=>{const idx=h.rooms.findIndex(r=>r.state==="presence");h.rooms.forEach(r=>r.state="empty");h.rooms[(idx+1)%h.rooms.length].state="presence";render(section);});
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
}
init();