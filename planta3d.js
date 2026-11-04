/* Zelar — demonstração 3D. Sem localização real nem hardware associado. */
"use strict";
const SESSION="zelar-demo-session",ROLE_KEY="zelar-demo-role",TRACK_KEY="zelar-demo-room-tracking-v1";
const role=sessionStorage.getItem(ROLE_KEY);
if(sessionStorage.getItem(SESSION)!=="demo"||!["empresa","familiar","super"].includes(role))location.replace("login.html");
const $=id=>document.getElementById(id);
const rooms=[{id:1,name:"Sala",icon:"▣",center:[-4.3,-0.7],label:[-4.6,-1.7],color:0xeee6d9},
 {id:2,name:"Cozinha",icon:"▤",center:[3.5,-2.5],label:[3.3,-2.5],color:0xe7ddd0},
 {id:3,name:"Quarto",icon:"▰",center:[3.5,2.5],label:[4.2,2.4],color:0xe4e0d8},
 {id:4,name:"Casa de banho",icon:"◉",center:[-1,3.4],label:[-1.5,3.5],color:0xd9e6e4}];
const getTime=()=>Date.now();
function readTrack(){
 try{let x=JSON.parse(sessionStorage.getItem(TRACK_KEY)||"null");
  if(x&&rooms.some(r=>r.id===x.activeRoomId)&&Number.isFinite(x.enteredAt)&&x.enteredAt<=Date.now()&&Array.isArray(x.visits)){
   x.visits=x.visits.filter(v=>rooms.some(r=>r.id===v.roomId)&&Number.isFinite(v.durationMs)&&Number.isFinite(v.enteredAt)&&Number.isFinite(v.exitedAt)).slice(0,100);
   return x;
  }}catch(_){}
 return {activeRoomId:1,enteredAt:getTime(),visits:[]};
}
let tracking=readTrack();
function persist(){sessionStorage.setItem(TRACK_KEY,JSON.stringify(tracking));}
const current=()=>rooms.find(r=>r.id===tracking.activeRoomId)||rooms[0];
const fmt=ms=>{let t=Math.max(0,Math.floor(ms/1000)),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return [h,m,s].map(n=>String(n).padStart(2,"0")).join(":");};
const clock=t=>new Date(t).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
const duration=id=>tracking.visits.filter(v=>v.roomId===id).reduce((a,v)=>a+v.durationMs,0)+(tracking.activeRoomId===id?Math.max(0,getTime()-tracking.enteredAt):0);
const total=()=>rooms.reduce((a,r)=>a+duration(r.id),0);
function enterRoom(id){
 if(id===tracking.activeRoomId||!rooms.some(r=>r.id===id))return;
 const now=getTime(),old=current();
 tracking.visits.unshift({roomId:old.id,roomName:old.name,enteredAt:tracking.enteredAt,exitedAt:now,durationMs:Math.max(0,now-tracking.enteredAt)});
 tracking.visits=tracking.visits.slice(0,100);
 tracking.activeRoomId=id;tracking.enteredAt=now;persist();
 updateUI();setMarker();
}
const navByRole={
 empresa:[["▦","Visão geral","empresa.html"],["♡","Idosos","empresa.html"],["⌂","Habitações","empresa.html"],["⬡","Plantas 2D / 3D","planta3d.html"],["◎","Equipamentos","empresa.html"],["♧","Alertas","empresa.html"],["♙","Cuidadores e familiares","empresa.html"],["≡","Relatórios","empresa.html"]],
 familiar:[["▦","O meu familiar","familiar.html"],["⬡","Plantas 2D / 3D","planta3d.html"],["◉","Atividade","familiar.html"],["♧","Alertas","familiar.html"],["≡","Resumo diário","familiar.html"]],
 super:[["▦","Administração","superadmin.html"],["⬡","Vista 3D de teste","planta3d.html"]]
};
$("sideNav").innerHTML=navByRole[role].map(([icon,label,url])=>'<a href="'+url+'" class="'+(url==="planta3d.html"?"active":"")+'"><span>'+icon+'</span>'+label+'</a>').join("");
$("roleLabel").textContent=role==="empresa"?"EMPRESA CUIDADORA":role==="familiar"?"ÁREA FAMILIAR":"SUPERADMINISTRADOR";
$("roleCrumb").textContent=role==="empresa"?"Empresa cuidadora":role==="familiar"?"O meu familiar":"Superadministrador";
$("avatar").textContent=role==="empresa"?"EM":role==="familiar"?"FA":"SA";
$("view2d").href=(role==="empresa"?"empresa.html":role==="familiar"?"familiar.html":"superadmin.html")+"#floor";
$("todayLabel").textContent=new Date().toLocaleDateString("pt-PT",{day:"numeric",month:"short",year:"numeric"});
$("menuBtn").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
$("logoutBtn").onclick=()=>{sessionStorage.removeItem(SESSION);sessionStorage.removeItem(ROLE_KEY);location.href="login.html";};
$("simulateBtn").onclick=()=>enterRoom(rooms[(rooms.findIndex(r=>r.id===tracking.activeRoomId)+1)%rooms.length].id);
$("historyBtn").onclick=()=>$("historyCard").scrollIntoView({behavior:"smooth",block:"start"});
$("totalsBtn").onclick=()=>$("totalsCard").scrollIntoView({behavior:"smooth",block:"start"});
const labels=new Map();
rooms.forEach(r=>{const button=document.createElement("button");button.className="floating-room";button.type="button";button.addEventListener("click",()=>enterRoom(r.id));$("roomLabels").appendChild(button);labels.set(r.id,button);});
function updateUI(){
 $("currentRoom").textContent=current().name;
 $("currentElapsed").textContent=fmt(Date.now()-tracking.enteredAt);
 const all=total();
 $("roomTotals").innerHTML=rooms.map(r=>{
 const ms=duration(r.id),pct=all?Math.round(ms/all*100):0;
 return '<div class="room-total"><span class="total-icon">'+r.icon+'</span><span class="total-name">'+r.name+'</span><span class="total-time">'+fmt(ms)+' <small>('+pct+'%)</small></span><div class="bar-track"><div class="bar-fill" style="width:'+pct+'%"></div></div></div>';
 }).join("");
 const visits=[{roomId:tracking.activeRoomId,roomName:current().name,enteredAt:tracking.enteredAt,exitedAt:null,durationMs:Math.max(0,Date.now()-tracking.enteredAt)},...tracking.visits];
 $("historyTable").innerHTML=visits.map((v,i)=>'<tr class="'+(i===0?"current-row":"")+'"><td><strong>'+v.roomName+'</strong></td><td>'+clock(v.enteredAt)+'</td><td>'+(v.exitedAt?clock(v.exitedAt):'—')+'</td><td>'+fmt(v.durationMs)+'</td><td>'+(i===0?'<span class="ongoing">● Em curso</span>':'Concluída')+'</td></tr>').join("");
 $("totalMonitored").textContent=fmt(all);
 $("movesCount").textContent=tracking.visits.length;
 $("visitedCount").textContent=new Set(visits.map(v=>v.roomId)).size;
 for(const r of rooms){
  const b=labels.get(r.id);
  b.className="floating-room"+(r.id===tracking.activeRoomId?" active":"");
  b.innerHTML='<strong>'+r.name+'</strong><small>'+(r.id===tracking.activeRoomId?'● '+fmt(Date.now()-tracking.enteredAt):fmt(duration(r.id))+' acumulado')+'</small>';
 }
}
updateUI();setInterval(updateUI,1000);
let scene,camera,renderer,controls,THREE,marker,raycaster,clickable=[],roomRoot;
let placementReady=false;
function setMarker(){
 if(!marker)return;
 const r=current(),start=new THREE.Vector3(marker.position.x,marker.position.y,marker.position.z);
 const target=new THREE.Vector3(r.center[0],0.45,r.center[1]);
 marker.position.copy(target);
}
function fallback(){
 const root=$("scene");
 $("sceneFallback").innerHTML='<strong>Visualização 3D indisponível</strong><small>O modelo requer acesso aos módulos gráficos. Os tempos e o histórico continuam disponíveis.</small>';
 const svg='<svg viewBox="0 0 620 390" style="width:100%;height:100%;position:absolute;inset:0" aria-label="Planta isométrica alternativa"><path d="M80 130 L325 35 L560 125 L320 235Z" fill="#e7d4bd" stroke="#bca18b" stroke-width="9"/><path d="M80 130 L320 235 L320 325 L80 225Z" fill="#d1b8a0"/><path d="M320 235 L560 125 L560 225 L320 325Z" fill="#c8aa8e"/><path d="M90 130 L327 42 L315 210 L90 165Z" fill="#d6e6d8"/><path d="M332 51 L548 130 L322 225Z" fill="#f3e5d5"/><path d="M320 90 L322 235" stroke="#ad947d" stroke-width="11"/><path d="M412 82 L410 172" stroke="#ad947d" stroke-width="9"/><rect x="135" y="136" width="102" height="41" rx="7" fill="#a7bfc0"/><rect x="382" y="143" width="86" height="40" rx="7" fill="#c7b3a4"/><circle cx="219" cy="166" r="15" fill="#1fc88a" opacity=".5"/><circle cx="219" cy="166" r="7" fill="#0ea46f"/></svg>';
 root.insertAdjacentHTML("beforeend",svg);
 document.querySelectorAll(".floating-room").forEach((b,i)=>{b.style.left=["26%","69%","76%","53%"][i];b.style.top=["50%","37%","65%","72%"][i];});
}
async function init3D(){
 try{
  const result=await Promise.all([import("https://esm.sh/three@0.160.1"),import("https://esm.sh/three@0.160.1/examples/jsm/controls/OrbitControls.js")]);
  THREE=result[0];const OrbitControls=result[1].OrbitControls;
  const root=$("scene"),w=root.clientWidth,h=root.clientHeight;
  scene=new THREE.Scene();scene.background=new THREE.Color(0xf6f9f7);
  camera=new THREE.PerspectiveCamera(38,w/h,.1,150);camera.position.set(15,18,22);camera.lookAt(0,0,0);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(w,h);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  root.appendChild(renderer.domElement);$("sceneFallback").remove();
  controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0.5,0);controls.minDistance=13;controls.maxDistance=44;controls.maxPolarAngle=Math.PI/2.15;controls.enableDamping=true;controls.dampingFactor=.08;controls.update();
  scene.add(new THREE.HemisphereLight(0xffffff,0xb9c7ba,2.35));
  const sun=new THREE.DirectionalLight(0xffffff,2.6);sun.position.set(-7,18,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;scene.add(sun);
  const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,...extra});
  const floorMat=mat(0xcaa980),wallMat=mat(0xf3f2ee),trimMat=mat(0xb5a18d),sofa=mat(0xb2c8c0),wood=mat(0xa68161),dark=mat(0x3d524e),glass=mat(0xa8d8db,{transparent:true,opacity:.45}),white=mat(0xfafaf7),green=mat(0x399c66);
  function box(x,y,z,w,h,d,m,shadow=true){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=shadow;mesh.receiveShadow=true;scene.add(mesh);return mesh;}
  function ball(x,y,z,r,m){const o=new THREE.Mesh(new THREE.SphereGeometry(r,18,12),m);o.position.set(x,y,z);o.castShadow=true;scene.add(o);return o;}
  // Foundation, parquet and separate room tints.
  box(0,-.17,0,14.6,.33,10.6,trimMat);
  box(0,.025,0,14,.07,10,floorMat,false);
  for(const r of rooms){let ext=r.id===1?[-3.5,0,7,10]:r.id===2?[3.5,-2.5,7,5]:r.id===3?[3.5,2.5,7,5]:[-1,3.5,2,3];box(ext[0],.065,ext[1],ext[2],.035,ext[3],mat(r.color),false);}
  // Cutaway walls, openings and internal partitions.
  box(0,.78,-5,14,1.55,.17,wallMat);box(7,.78,0,.17,1.55,10,wallMat);box(0,.78,5,14,1.55,.17,wallMat);box(-7,.42,0,.17,.85,10,wallMat);
  box(0,.65,-2.8,.15,1.3,4.4,wallMat);box(0,.65,3.1,.15,1.3,3.8,wallMat);
  box(3.6,.65,0,6.8,1.3,.14,wallMat);
  box(-2,.65,3.5,.14,1.3,3,wallMat);box(-1.0,.65,2,.95,1.3,.14,wallMat);
  // Living room: large sofa, cushions, coffee table, dining.
  box(-5.2,.34,-2.7,2.45,.57,.95,sofa);box(-6.2,.6,-2.7,.32,.5,.95,sofa);box(-4.2,.6,-2.7,.30,.5,.95,sofa);box(-5.2,.59,-3.1,2.2,.55,.22,sofa);
  box(-5.3,.26,-.9,1.7,.18,.9,wood);box(-5.3,.15,-.9,1.3,.12,.6,dark);
  box(-3.0,.5,-4.55,1.3,.78,.27,dark);box(-3.0,.62,-4.48,1.1,.61,.06,mat(0x1d2f2b));
  box(-4.6,.38,2,1.65,.15,1.3,wood);for(const [x,z] of [[-5.8,2],[-3.4,2],[-4.6,1],[-4.6,3]]){box(x,.32,z,.47,.15,.5,wood);box(x,.53,z+.18,.45,.42,.08,wood);}
  // Kitchen island, counters, sink, cooker.
  box(3.5,.53,-3.3,3,.96,.92,white);box(3.5,1.06,-3.3,3.13,.12,1.05,wood);
  box(5.65,.6,-4.35,2.1,1.1,.75,white);box(5.65,1.2,-4.35,2.2,.08,.81,wood);
  for(let x of [2.8,3.3]){const hob=new THREE.Mesh(new THREE.TorusGeometry(.21,.035,8,24),dark);hob.rotation.x=Math.PI/2;hob.position.set(x,1.133,-3.3);scene.add(hob);}
  box(1,.96,-4.5,.9,1.85,.8,white);
  // Bedroom bed, pillows and wardrobes.
  box(4.5,.34,2.65,3.2,.48,2.35,wood);box(4.5,.64,2.65,3.05,.25,2.2,mat(0xf3f0e8));box(4.5,.85,3.52,3.1,.5,.17,mat(0xd1b7a1));
  box(3.65,.80,3.12,.86,.18,.55,white);box(5.3,.80,3.12,.86,.18,.55,white);
  box(1.15,.93,4.1,.85,1.7,1.25,wood);
  // Bathroom shower and sink.
  box(-1.13,.12,4.25,1.4,.15,1.25,white);box(-1.13,.75,4.78,1.4,1.15,.04,glass);box(-.55,.65,4.15,.04,1,.04,dark);
  box(-.55,.50,2.45,.65,.75,.5,white);box(-.55,.92,2.45,.45,.11,.39,white);
  // Plants
  for(const [x,z] of [[-6.45,-4.4],[-6.2,4.35],[.7,-.45],[6.4,4.4]]){box(x,.26,z,.36,.43,.36,wood);ball(x,.76,z,.42,green);ball(x-.18,.91,z,.26,mat(0x327c50));}
  // Presence marker
  const person=mat(0x02c47f,{emissive:0x00a858,emissiveIntensity:.5});
  marker=new THREE.Group();
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(.72,.72,.028,40),mat(0x14c98a,{transparent:true,opacity:.23}));disc.position.y=-.36;marker.add(disc);
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.54,5,10),person);body.position.y=.15;marker.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.17,20,20),person);head.position.y=.66;marker.add(head);
  for(const x of [-.12,.12]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.062,.35,3,8),person);leg.position.set(x,-.22,0);marker.add(leg);}
  scene.add(marker);setMarker();
  // A very soft ground to anchor the house
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(90,90),mat(0xf0f4f0));ground.rotation.x=-Math.PI/2;ground.position.y=-.36;ground.receiveShadow=true;scene.add(ground);
  const resize=new ResizeObserver(()=>{const w=root.clientWidth,h=root.clientHeight;if(w>0&&h>0){camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}});resize.observe(root);
  $("zoomIn").onclick=()=>{camera.position.multiplyScalar(.83);controls.update();};
  $("zoomOut").onclick=()=>{camera.position.multiplyScalar(1.18);controls.update();};
  $("rotateBtn").onclick=()=>{camera.position.set(15,18,22);controls.target.set(0,.5,0);controls.update();};
  function drawLabels(){
   const width=root.clientWidth,height=root.clientHeight;
   for(const r of rooms){
    const vec=new THREE.Vector3(r.label[0],1.35,r.label[1]).project(camera);
    const b=labels.get(r.id);
    b.style.left=((vec.x+1)/2*width)+"px";
    b.style.top=((-vec.y+1)/2*height)+"px";
    b.style.display=vec.z<=1?"block":"none";
   }
  }
  const sceneTop=()=>{};
  function frame(){
   requestAnimationFrame(frame);controls.update();if(marker){const disc=marker.children[0];disc.scale.setScalar(1+Math.sin(Date.now()/380)*.14);}
   drawLabels();renderer.render(scene,camera);
  }
  frame();
 }catch(error){console.warn("Zelar: renderer 3D indisponível",error);fallback();}
}
init3D();
