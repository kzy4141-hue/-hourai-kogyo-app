function renderPonchiCanvas(p){
  const {L,H,W,spanStarts,floorHeights,layerIntervals,access,accessStart,accessEnd,floorMode,ladderType,ladder}=p;
  const wrap=document.getElementById('ponchiResult');
  if(!wrap) return;
  const cssW=Math.max(720, Math.min(980, window.innerWidth>0 ? window.innerWidth-40 : 900));
  const cssH=560;
  const dpr=Math.max(1, Math.min(2, window.devicePixelRatio||1));
  wrap.innerHTML=`<div class="ponchi-scroll"><canvas id="ponchiCanvas" style="display:block;width:${cssW}px;height:${cssH}px;background:#fff;border-radius:8px"></canvas></div>`;
  const canvas=document.getElementById('ponchiCanvas');
  if(!canvas) return;
  canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);
  const ctx=canvas.getContext('2d');
  if(!ctx){wrap.innerHTML='この端末ではポンチ絵を表示できません。';return;}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const boxW=cssW,boxH=cssH,ox=85,oy=440;
  const sx=Math.min(92,(boxW-250)/Math.max(L,1));
  const sy=Math.min(78,320/Math.max(H+1.0,1));
  const depth=Math.min(105,Math.max(48,W*55));const dzx=depth,dzy=-depth*0.48;const top=H+1.0;
  const P=(x,z,y)=>({x:ox+x*sx+(z/Math.max(W,0.001))*dzx,y:oy-y*sy+(z/Math.max(W,0.001))*dzy});
  function line(a,b,style={},dash=[]){ctx.save();ctx.globalAlpha=style.alpha??1;ctx.strokeStyle=style.stroke||'#333';ctx.lineWidth=style.width||2;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();}
  function polygon(pts,fill,stroke='#7b8791',alpha=.84){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);pts.slice(1).forEach(q=>ctx.lineTo(q.x,q.y));ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  function label(x,y,s,opts={}){ctx.save();ctx.fillStyle=opts.fill||'#444';ctx.font=opts.font||'700 14px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';ctx.textAlign=opts.align||'center';ctx.textBaseline='middle';ctx.fillText(String(s),x,y);ctx.restore();}
  function drawLadder(foot,topPt){const dx=topPt.x-foot.x,dy=topPt.y-foot.y;const len=Math.hypot(dx,dy)||1;const nx=-dy/len,ny=dx/len;const half=6;const f1={x:foot.x+nx*half,y:foot.y+ny*half};const f2={x:foot.x-nx*half,y:foot.y-ny*half};const t1={x:topPt.x+nx*half,y:topPt.y+ny*half};const t2={x:topPt.x-nx*half,y:topPt.y-ny*half};line(f1,t1,{stroke:'#345f84',width:3.2});line(f2,t2,{stroke:'#345f84',width:3.2});const rungCount=Math.max(6,Math.floor(len/20));for(let i=1;i<rungCount;i++){const r=i/rungCount;const cx=foot.x+dx*r,cy=foot.y+dy*r;line({x:cx+nx*half,y:cy+ny*half},{x:cx-nx*half,y:cy-ny*half},{stroke:'#547895',width:2.1});}}
  ctx.clearRect(0,0,boxW,boxH);ctx.fillStyle='#fff';ctx.fillRect(0,0,boxW,boxH);
  const workHeights=floorMode==='all'?floorHeights:[H];
  spanStarts.forEach(x=>{line(P(x,0,0),P(x,0,top),{stroke:'#222',width:4});line(P(x,W,0),P(x,W,top),{stroke:'#222',width:4,alpha:.28});});
  const clothHeights=[0.15,...floorHeights];clothHeights.forEach(y=>{line(P(0,0,y),P(L,0,y),{stroke:'#444',width:3});line(P(0,W,y),P(L,W,y),{stroke:'#444',width:3,alpha:.28});});
  spanStarts.forEach(x=>{clothHeights.forEach(y=>line(P(x,0,y),P(x,W,y),{stroke:'#555',width:2.5}));});
  workHeights.forEach(y=>{for(let i=0;i<spanStarts.length-1;i++){const a=spanStarts[i],b=spanStarts[i+1],gap=b-a;const pieces=Math.max(1,Math.ceil(gap/1.2));for(let k=1;k<pieces;k++){const x=a+gap*k/pieces;line(P(x,0,y),P(x,W,y),{stroke:'#555',width:2.2},[4,3]);}}});
  workHeights.forEach(y=>{const hand=Math.min(top,y+1.0),mid=Math.min(top,y+0.5);[hand,mid].forEach(yy=>{line(P(0,0,yy),P(L,0,yy),{stroke:'#666',width:2});line(P(0,W,yy),P(L,W,yy),{stroke:'#666',width:2,alpha:.28});line(P(0,0,yy),P(0,W,yy),{stroke:'#666',width:2});line(P(L,0,yy),P(L,W,yy),{stroke:'#666',width:2});});});
  for(let ls=0;ls<layerIntervals.length;ls+=2){if(ls+1>=layerIntervals.length)continue;const y0=ls===0?0:floorHeights[ls-1];const y1=floorHeights[Math.min(ls+1,floorHeights.length-1)];for(let g=0;g<Math.ceil((spanStarts.length-1)/2);g++){const i0=g*2,i1=Math.min(i0+2,spanStarts.length-1);if(i0>=spanStarts.length-1)continue;const x0=spanStarts[i0],x1=spanStarts[i1];const frontReverse=(g%2===1),backReverse=!frontReverse;const fa=frontReverse?P(x1,0,y0):P(x0,0,y0);const fb=frontReverse?P(x0,0,y1):P(x1,0,y1);const ba=backReverse?P(x1,W,y0):P(x0,W,y0);const bb=backReverse?P(x0,W,y1):P(x1,W,y1);line(fa,fb,{stroke:'#b43b35',width:3});line(ba,bb,{stroke:'#b43b35',width:3,alpha:.28});}}
  for(let li=0;li<layerIntervals.length;li+=2){const y0=li===0?0:floorHeights[li-1];const y1=floorHeights[li];spanStarts.forEach((x,idx)=>{const reverse=(idx%2===1);const a=reverse?P(x,W,y0):P(x,0,y0);const b=reverse?P(x,0,y1):P(x,W,y1);line(a,b,{stroke:'#8b5a2b',width:3});});}
  workHeights.forEach(fh=>{polygon([P(0,0,fh),P(L,0,fh),P(L,W,fh),P(0,W,fh)],'#dfe8ef','#7b8791',.84);});
  if(access){const center=(accessStart+accessEnd)/2;const isVertical=(ladderType==='1.8m')||(ladder&&ladder.label&&ladder.label.includes('垂直'));let a,b;if(isVertical){a=P(center,0,Math.max(0,H-1.8));b=P(center,0,Math.min(top,H+0.5));}else{const ladderTop=Math.min(top,H+0.6);const run=ladderTop/Math.tan(75*Math.PI/180);const endDir=center<=L/2?-1:1;const topX=center+endDir*(run/2);const footX=center-endDir*(run/2);a=P(footX,0,0);b=P(topX,0,ladderTop);}drawLadder(a,b);label((a.x+b.x)/2+12,(a.y+b.y)/2,'昇降梯子',{fill:'#2467a6'});}
  const l1=P(0,0,0),l2=P(L,0,0),ddy=42;line({x:l1.x,y:l1.y+ddy},{x:l2.x,y:l2.y+ddy},{stroke:'#777',width:1.4},[3,3]);label((l1.x+l2.x)/2,l1.y+ddy-8,`長さ ${L.toFixed(1)}m`);
  const h0=P(0,0,0),h1=P(0,0,H),ddx=-40;line({x:h0.x+ddx,y:h0.y},{x:h1.x+ddx,y:h1.y},{stroke:'#777',width:1.4},[3,3]);label(h0.x+ddx-10,(h0.y+h1.y)/2,`床高 ${H.toFixed(1)}m`,{align:'right'});
  const w0=P(L,0,0),w1=P(L,W,0);line({x:w0.x+18,y:w0.y+18},{x:w1.x+18,y:w1.y+18},{stroke:'#777',width:1.4},[3,3]);label((w0.x+w1.x)/2+30,(w0.y+w1.y)/2+28,`幅 ${W.toFixed(1)}m`);
}
function toggleDetail(btnId,panelId){const btn=document.getElementById(btnId);const panel=document.getElementById(panelId);if(!btn||!panel)return;const open=panel.classList.toggle('open');panel.style.display=open?'block':'none';btn.setAttribute('aria-expanded',open?'true':'false');btn.textContent=open?'詳細を閉じる':'詳細を見る';}