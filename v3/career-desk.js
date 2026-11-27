import * as THREE from 'three';
export const careerDetails={
 overview:{title:'Engineer · Builder · Operator',summary:'A workspace for the projects and experiences behind the portfolio.',bullets:['Masters’ Union — PGP in Technology & Business Management','REVA University — Electrical & Electronics Engineering','Yokogawa India — Process Safety & Automation Engineering','Bharat Electronics Limited — Radar & Communication Systems internship','Explore the objects for project details or open the two existing résumé PDFs.']},
 engineering:{title:'Yokogawa · Engineering & operations',summary:'Process safety, automation, client requirements and cross-functional delivery.',bullets:['20% reduction in project handover cycle time.','Parallel delivery across two client projects.','First-pass FAT approval with zero rework.','Zero-defect commissioning across two international refinery deployments.','Graduate Engineer Trainee offer converted after six-month evaluation.']},
 commerce:{title:'7 Senses · E-commerce',summary:'Masters’ Union dropshipping challenge — co-founder and team lead.',bullets:['Coordinated 10+ suppliers and built a 30+ SKU catalogue.','Storefront launch reached 1,000+ users within three months.','Owned UX, listings and payment integration.','Optimized Meta Ads creatives and targeting.']},
 coffee:{title:'Coffee Koffee · D2C venture',summary:'Built a personalized campus coffee venture through sourcing, pricing and customer feedback.',bullets:['Scaled from 0 to 50 cups/day in the résumé project.','Managed sourcing, pricing and customer-specific recipes.','Used direct customer feedback to drive repeat demand.']},
 hardware:{title:'Hardware builds · Product discovery',summary:'The earbuds represent the product-building part of the portfolio, not an Apple product I designed.',bullets:['Wearable bio-tracker: led four people, tracked heart rate, SpO2 and fatigue; research with 15 athletes.','Therapeutic exercise exoskeleton: led five people, translated physiotherapist interviews into specifications.','Tesla turbine: built a working prototype and validated fluid dynamics calculations against predicted performance.']},
 education:{title:'Education & leadership',summary:'Engineering education, business school and campus involvement.',bullets:['Masters’ Union PGP-TBM YLC, two-year Cohort C7.','REVA University B.E. Electrical & Electronics Engineering.','Class representative and department club organizer.','REVA Model United Nations delegate, 2024.','Rotaract volunteer drive at Bannerghatta National Park.']},
 certifications:{title:'Technical certifications',summary:'Training listed on the current résumés.',bullets:['PROSAFE Safety System Configuration — Yokogawa.','CENTUM VP DCS Engineering — Yokogawa.','Field Instruments, Fieldbus and Plant Resource Manager — Yokogawa.','C++ Programming Fundamentals — Udemy.']}
};
const mat=(color,roughness=.58,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const graphite=mat(0x202326,.54,.18),silver=mat(0x999b9b,.37,.6),dark=mat(0x101316,.38),paper=mat(0xe4dfd2,.9),wood=mat(0x775037,.65),gold=mat(0x94733b,.34,.55);
function box(g,w,h,d,x,y,z,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function cylinder(g,r,h,x,y,z,m){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function screen(g,w,h,x,y,z,tex){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));o.position.set(x,y,z);g.add(o);return o}
function group(scene,name,key,x,y,z,yaw=Math.PI/2){const g=new THREE.Group();g.name=name;g.userData.career=key;g.position.set(x,y,z);g.rotation.y=yaw;scene.add(g);return g}
function printTexture(title,subtitle,rows){return canvasTex(600,780,(c,w,h)=>{c.fillStyle='#e7e0cc';c.fillRect(0,0,w,h);c.strokeStyle='#8e7040';c.lineWidth=8;c.strokeRect(19,19,w-38,h-38);c.fillStyle='#332c23';c.font='22px Arial';c.fillText('PORTFOLIO  /  SELECTED RECORD',45,78);c.font='bold 42px Georgia';c.fillText(title,45,151,510);c.font='25px Arial';c.fillText(subtitle,45,199,510);c.fillRect(45,226,510,3);c.font='24px Arial';rows.forEach((r,i)=>c.fillText(r,45,285+i*75,510));c.font='18px Arial';c.fillText('RESUME HIGHLIGHTS · NOT AN OFFICIAL CERTIFICATE',45,730,510)})}
export function buildCareerDesk(scene){
 // All shapes have real dimensions and depth. Screen art is placed on real display meshes.
 const monitor=group(scene,'Work desktop','overview',-1.30,.75,1.00);
 box(monitor,.58,.345,.038,0,.39,0,graphite);box(monitor,.56,.324,.004,0,.39,.022,dark);
 screen(monitor,.54,.305,0,.39,.025,canvasTex(1100,620,(c,w,h)=>{
  c.fillStyle='#1a2529';c.fillRect(0,0,w,h);c.fillStyle='#d9cba9';c.font='22px Arial';c.fillText('AVANEESH PRAMOD   /   PORTFOLIO',48,62);
  c.font='bold 61px Georgia';c.fillText('I build things that move.',48,159);
  c.fillStyle='#afc3bd';c.font='26px Arial';c.fillText('ENGINEER  ·  BUILDER  ·  OPERATOR',48,214);
  [['20%','Yokogawa'],['0 → 50','Coffee Koffee'],['1K+','7 Senses']].forEach(([v,n],i)=>{const x=48+i*343;c.fillStyle='#304044';c.fillRect(x,278,317,190);c.fillStyle='#e5d5af';c.font='bold 54px Georgia';c.fillText(v,x+20,354);c.font='25px Arial';c.fillText(n,x+20,425)});
  c.fillStyle='#e8d5aa';c.font='25px Arial';c.fillText('SELECTED WORK   /   CLICK TO EXPLORE RÉSUMÉ',48,550);
 }));
 box(monitor,.047,.20,.048,0,.108,-.025,silver);box(monitor,.24,.018,.17,0,.009,.020,graphite);
 const keyboard=group(scene,'Keyboard and mouse','overview',-.945,.752,1.00);
 box(keyboard,.37,.016,.125,0,.009,0,graphite);
 for(let r=0;r<5;r++)for(let i=0;i<14;i++){if(r===4&&i>3&&i<10)continue;box(keyboard,.022,.005,.019,(i-6.5)*.025,.019,(r-2)*.023,dark)}
 box(keyboard,.15,.005,.019,0,.019,.046,dark);
 const mouse=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),graphite);mouse.scale.set(.032,.018,.055);mouse.position.set(.24,.018,.005);keyboard.add(mouse);
 const tablet=group(scene,'iPad-style tablet','education',-1.25,.752,1.435,Math.PI/2-.14);
 // Portrait tablet, angled toward seated visitor, supported by a folded stand.
 const t=new THREE.Group();t.rotation.x=-.24;t.position.y=.144;tablet.add(t);
 box(t,.174,.247,.009,0,0,0,silver);box(t,.166,.239,.004,0,0,.006,dark);
 screen(t,.153,.226,0,0,.009,canvasTex(600,880,(c,w,h)=>{c.fillStyle='#eae4d7';c.fillRect(0,0,w,h);c.fillStyle='#26373b';c.font='25px Arial';c.fillText('FIELD NOTES',45,64);c.font='bold 47px Georgia';c.fillText('Education',45,146);c.fillText('& leadership',45,204);c.fillRect(45,235,510,3);c.font='32px Arial';['Masters’ Union','PGP · Technology & Business','Management','REVA University','Electrical & Electronics','Engineering','Campus leadership','MUN · Rotaract'].forEach((s,i)=>c.fillText(s,45,302+i*61,510));c.font='23px Arial';c.fillText('TAP TO EXPLORE',45,836)}));
 box(tablet,.12,.014,.15,0,.007,-.025,graphite);const support=box(tablet,.09,.13,.012,0,.068,-.055,graphite);support.rotation.x=.48;
 // Small symbolic desk objects, rather than invented trophies or original devices.
 const engineering=group(scene,'Automation control panel','engineering',-1.27,.752,.385);
 box(engineering,.19,.083,.105,0,.042,0,graphite);const panel=box(engineering,.17,.055,.008,0,.047,.057,dark);
 for(let i=0;i<4;i++){const light=mat([0x5aaf7c,0xb7a458,0x7ca6bb,0xc56652][i],.5);cylinder(engineering,.007,.008,-.06+i*.04,.06,.064,light).rotation.x=Math.PI/2}
 for(let i=0;i<3;i++)box(engineering,.025,.012,.01,-.05+i*.05,.029,.064,silver);
 const turbine=group(scene,'Tesla turbine study model','hardware',-1.29,.752,1.65);turbine.position.z=1.50;turbine.position.x=-1.385;
 cylinder(turbine,.042,.025,0,.014,0,graphite);for(let i=0;i<5;i++)cylinder(turbine,.035,.003,0,.03+i*.008,0,silver);cylinder(turbine,.007,.061,0,.05,0,gold);
 // Two summary plaques above the sideboard, clearly marked as portfolio summaries.
 [['CERTIFICATIONS','Training highlights',['PROSAFE','CENTUM VP DCS','Field Instruments & Fieldbus','Plant Resource Manager','C++ Programming Fundamentals'],'certifications',1.53,1.65],
 ['LEADERSHIP','Campus & community',['Masters’ Union · Cohort C7','REVA class representative','Model United Nations','Rotaract volunteer drive'],'education',1.53,2.03]].forEach(([title,sub,rows,key,z,y])=>{
 const g=group(scene,title+' summary plaque',key,-1.602,y,z);box(g,.25,.33,.026,0,0,0,wood);screen(g,.228,.305,0,0,.015,printTexture(title,sub,rows));
 });
}
export function careerTarget(ray,scene){
 const all=[];scene.traverse(o=>{if(o.userData.career&&o.visible)all.push(o)});
 const hit=ray.intersectObjects(all,true).find(h=>{let o=h.object;while(o){if(!o.visible)return false;if(o.userData.career)return true;o=o.parent}return false});
 let o=hit?.object;while(o){if(o.userData.career)return o.userData.career;o=o.parent}return null;
}
const panel=document.querySelector('#career-panel');
export function showCareer(key='overview'){
 const detail=careerDetails[key]||careerDetails.overview;
 document.querySelector('#career-title').textContent=detail.title;document.querySelector('#career-summary').textContent=detail.summary;
 const list=document.querySelector('#career-bullets');list.replaceChildren(...detail.bullets.map(s=>{const li=document.createElement('li');li.textContent=s;return li}));
 panel.hidden=false;window.dispatchEvent(new CustomEvent('portfolio:career-open'));
 [...document.querySelector('#career-tabs').children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.key===key)));
}
document.querySelector('#career-close').addEventListener('click',()=>panel.hidden=true);
document.querySelector('#career-open').addEventListener('click',()=>showCareer());
const tabs=document.querySelector('#career-tabs');for(const [key,label] of [['overview','Overview'],['engineering','Engineering'],['commerce','Commerce'],['coffee','Coffee'],['hardware','Hardware'],['education','Education'],['certifications','Certifications']]){const b=document.createElement('button');b.textContent=label;b.dataset.key=key;b.addEventListener('click',()=>showCareer(key));tabs.append(b)}
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;e.stopPropagation()}},true);
