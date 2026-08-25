const PIPE_LENGTHS=[3.0,2.5,2.0,1.5,1.2,1.0,0.6];
const PIPE_NAMES=['3.0m単管','2.5m単管','2.0m単管','1.5m単管','1.2m単管','1.0m単管','0.6m単管'];
function ceil(v){return Math.ceil(v-1e-9)}
function val(id){return Number(document.getElementById(id).value)||0}
function esc(n){return Math.round(n*10)/10}
function fmt1(n){return (Math.round(n*10)/10).toFixed(1)}
function makeLayerIntervals(height){
  if(height<=0) return [];
  if(height<=2.0) return [esc(height)];
  const arr=[2.0];
  let remain=esc(height-2.0);
  while(remain>1.5+1e-9){arr.push(1.5);remain=esc(remain-1.5)}
  if(remain>1e-9) arr.push(esc(remain));
  if(arr.length>1 && arr[arr.length-1]<=1.0+1e-9){
    const n=arr.length;
    const totalTenths=Math.round(height*10);
    for(let firstTenths=18; firstTenths<=20; firstTenths++){
      const rest=totalTenths-firstTenths;
      if(rest<=0) continue;
      const count=n-1;
      const base=Math.floor(rest/count);
      const extra=rest-base*count;
      const eq=[firstTenths/10];
      for(let i=0;i<count;i++) eq.push((base+(i<extra?1:0))/10);
      const valid=eq.slice(1).every(x=>x>0 && x<=1.5+1e-9);
      if(valid) return eq;
    }
  }
  return arr;
}
function cumulative(intervals){let s=0;return intervals.map(x=>esc(s+=x));}
function bestPipeMix(target){
  const targetU=Math.round(target*10);const lens=PIPE_LENGTHS.map(x=>Math.round(x*10));const maxU=targetU+30;const dp=Array(maxU+1).fill(null);dp[0]={pieces:0,counts:Array(lens.length).fill(0)};
  for(let u=0;u<=maxU;u++){if(!dp[u]) continue;lens.forEach((add,j)=>{const nu=u+add;if(nu>maxU) return;const cand={pieces:dp[u].pieces+1,counts:[...dp[u].counts]};cand.counts[j]++;if(!dp[nu]||cand.pieces<dp[nu].pieces)dp[nu]=cand;});}
  const candidates=[];for(let u=targetU;u<=maxU;u++){if(!dp[u])continue;const hasLongFirst=dp[u].counts[0]+dp[u].counts[1]+dp[u].counts[2]>0;if(!hasLongFirst)continue;candidates.push({used:u/10,excess:(u-targetU)/10,pieces:dp[u].pieces,counts:dp[u].counts});}
  candidates.sort((a,b)=>a.pieces-b.pieces||a.excess-b.excess);return candidates[0]||null;
}
function longRunCandidates(length){
  const target=Math.round(length*10);const lens=PIPE_LENGTHS.map(x=>Math.round(x*10));const out=[];
  function rec(i,remain,counts){if(i===lens.length){if(remain===0){const pieces=counts.reduce((a,b)=>a+b,0);const short06=counts[6];const longScore=counts.reduce((a,b,j)=>a+b*lens[j]*lens[j],0);out.push({counts:[...counts],pieces,short06,longScore});}return;}const len=lens[i];const max=Math.floor(remain/len);for(let n=max;n>=0;n--){counts[i]=n;rec(i+1,remain-n*len,counts);}counts[i]=0;}
  rec(0,target,Array(lens.length).fill(0));out.sort((a,b)=>a.pieces-b.pieces||a.short06-b.short06||b.longScore-a.longScore);return out;
}
function expandCounts(counts,reverse=false){const a=[];counts.forEach((n,i)=>{for(let k=0;k<n;k++)a.push(PIPE_LENGTHS[i]);});return reverse?a.reverse():a;}
function jointsOf(seq){let s=0;const j=[];for(let i=0;i<seq.length-1;i++){s=esc(s+seq[i]);j.push(s);}return j;}
function jointOverlap(a,b){const A=jointsOf(a),B=jointsOf(b);return B.filter(x=>A.some(y=>Math.abs(x-y)<1e-9)).length;}
function seqText(seq){return seq.map(x=>x.toFixed(1)+'m').join(' ＋ ')}
function chooseStaggeredLongRuns(length){
  if(Math.abs(length-4.0)<1e-9){const a=[3.0,1.0],b=[2.0,2.0];const aCounts=Array(PIPE_LENGTHS.length).fill(0),bCounts=Array(PIPE_LENGTHS.length).fill(0);a.forEach(len=>{const i=PIPE_LENGTHS.findIndex(x=>Math.abs(x-len)<1e-9);if(i>=0)aCounts[i]++;});b.forEach(len=>{const i=PIPE_LENGTHS.findIndex(x=>Math.abs(x-len)<1e-9);if(i>=0)bCounts[i]++;});return{aSeq:a,aCounts,bSeq:b,bCounts,overlap:jointOverlap(a,b)};}
  const cands=longRunCandidates(length);if(!cands.length)return null;const aCount=cands[0].counts;const a=expandCounts(aCount,false);let best=null;
  for(const c of cands.slice(0,80)){for(const rev of [false,true]){const seq=expandCounts(c.counts,rev);const ov=jointOverlap(a,seq);const same=seq.length===a.length&&seq.every((x,i)=>Math.abs(x-a[i])<1e-9);const score=[ov,same?1:0,c.pieces,c.short06,-c.longScore];if(!best||score.some((v,i)=>v<best.score[i]&&score.slice(0,i).every((z,k)=>z===best.score[k])))best={seq,counts:c.counts,score};}}
  return{aSeq:a,aCounts:aCount,bSeq:best.seq,bCounts:best.counts,overlap:jointOverlap(a,best.seq)};
}
function armPipeLength(width){const minNeed=width>1.5?Math.max(2.0,width):width;const asc=[0.6,1.0,1.2,1.5,2.0,2.5,3.0];return asc.find(x=>x+1e-9>=minNeed)||null;}
function addRow(parts,name,qty,unit){if(typeof qty==='number'&&Math.abs(qty)<1e-9)return;if(typeof qty==='string'&&/^0(?:\.0+)?$/.test(qty.trim()))return;parts.push(`<div class="row"><span>${name}</span><strong>${qty}</strong><span>${unit}</span></div>`);}
function section(parts,title){parts.push(`<div class="section-title">${title}</div><div class="row head"><span>部材・項目</span><span>数量</span><span>単位</span></div>`)}
function bestToeBoardMix(target){
  const lengths=[3.0,2.0,1.5,1.0],names=['3.0m幅木','2.0m幅木','1.5m幅木','1.0m幅木'];if(target<=0)return{lengths,names,counts:[0,0,0,0],used:0,excess:0,pieces:0};let best=null;const maxPieces=Math.ceil(target/1.0)+4;
  for(let a=0;a<=Math.ceil(target/3.0)+2;a++)for(let b=0;b<=Math.ceil(target/2.0)+2;b++)for(let c=0;c<=Math.ceil(target/1.5)+2;c++)for(let d=0;d<=Math.ceil(target/1.0)+2;d++){const counts=[a,b,c,d];const used=counts.reduce((sum,n,i)=>sum+n*lengths[i],0);if(used+1e-9<target)continue;const pieces=a+b+c+d;if(pieces>maxPieces)continue;const excess=Math.round((used-target)*10)/10;const score=[excess,pieces,-a,-b,-c,-d];if(!best||score.some((v,i)=>v<best.score[i]&&score.slice(0,i).every((z,k)=>z===best.score[k])))best={lengths,names,counts,used:Math.round(used*10)/10,excess,pieces,score};}return best;
}
function bestPipeCover(target){
  if(target<=1e-9)return{counts:Array(PIPE_LENGTHS.length).fill(0),used:0,excess:0,pieces:0};const target10=Math.round(target*10);const lens10=PIPE_LENGTHS.map(x=>Math.round(x*10));const max10=target10+30;const dp=Array(max10+1).fill(null);dp[0]={pieces:0,short06:0,longScore:0,counts:Array(PIPE_LENGTHS.length).fill(0)};
  for(let x=0;x<=max10;x++){const cur=dp[x];if(!cur)continue;lens10.forEach((add,i)=>{const nx=x+add;if(nx>max10)return;const cand={pieces:cur.pieces+1,short06:cur.short06+(PIPE_LENGTHS[i]===0.6?1:0),longScore:cur.longScore+PIPE_LENGTHS[i],counts:[...cur.counts]};cand.counts[i]++;const old=dp[nx];const score=[cand.pieces,cand.short06,-cand.longScore];const oldScore=old?[old.pieces,old.short06,-old.longScore]:null;if(!old||score.some((v,j)=>v<oldScore[j]&&score.slice(0,j).every((z,k)=>z===oldScore[k])))dp[nx]=cand;});}
  for(let x=target10;x<=max10;x++)if(dp[x])return{...dp[x],used:x/10,excess:(x-target10)/10};return null;
}
function bestBracePipeCover(target){
  if(target<=1e-9)return{counts:Array(PIPE_LENGTHS.length).fill(0),used:0,excess:0,pieces:0};let best=null;const maxPieces=4;function rec(startIdx,pieces,counts,sum){if(pieces>0&&sum+1e-9>=target){const excess=esc(sum-target);const longScore=counts.reduce((acc,n,i)=>acc+n*PIPE_LENGTHS[i]*PIPE_LENGTHS[i],0);const cand={counts:[...counts],used:esc(sum),excess,pieces,longScore};if(!best||pieces<best.pieces||(pieces===best.pieces&&excess<best.excess-1e-9)||(pieces===best.pieces&&Math.abs(excess-best.excess)<1e-9&&longScore>best.longScore))best=cand;return;}if(pieces>=maxPieces)return;for(let i=startIdx;i<PIPE_LENGTHS.length;i++){counts[i]++;rec(i,pieces+1,counts,sum+PIPE_LENGTHS[i]);counts[i]--;}}rec(0,0,Array(PIPE_LENGTHS.length).fill(0),0);return best;
}
function bestLongBracePipePlan(target){
  if(target<=1e-9)return{counts:Array(PIPE_LENGTHS.length).fill(0),used:0,effective:0,excess:0,pieces:0,overlap:0};let best=null;const maxPieces=4;function rec(startIdx,pieces,counts,sum){if(pieces>0){const overlap=Math.max(0,pieces-1)*1.0;const effective=esc(sum-overlap);if(effective+1e-9>=target){const excess=effective-target;const longScore=counts.reduce((s,n,i)=>s+n*PIPE_LENGTHS[i]*PIPE_LENGTHS[i],0);const cand={counts:[...counts],used:esc(sum),effective,excess,pieces,overlap,longScore};if(!best||pieces<best.pieces||(pieces===best.pieces&&excess<best.excess-1e-9)||(pieces===best.pieces&&Math.abs(excess-best.excess)<1e-9&&longScore>best.longScore))best=cand;return;}}if(pieces>=maxPieces)return;for(let i=startIdx;i<PIPE_LENGTHS.length;i++){counts[i]++;rec(i,pieces+1,counts,sum+PIPE_LENGTHS[i]);counts[i]--;}}rec(0,0,Array(PIPE_LENGTHS.length).fill(0),0);return best;
}
function addCounts(dst,src,mult=1){if(!src)return;src.forEach((n,i)=>dst[i]+=n*mult);}
function planRepeatedFullLines(lineCount,longRunPlan){const counts=Array(PIPE_LENGTHS.length).fill(0);if(!longRunPlan||lineCount<=0)return counts;const a=Math.ceil(lineCount/2),b=Math.floor(lineCount/2);addCounts(counts,longRunPlan.aCounts,a);addCounts(counts,longRunPlan.bCounts,b);return counts;}
function bestBoardMix(target){const lens=[3.0,2.0,1.5,1.0],names=['3.0m足場板','2.0m足場板','1.5m足場板','1.0m足場板'];const target10=Math.round(target*10);const max=target10+30;const dp=Array(max+1).fill(null);dp[0]={pieces:0,counts:[0,0,0,0]};for(let x=0;x<=max;x++){if(!dp[x])continue;lens.forEach((l,i)=>{const nx=x+Math.round(l*10);if(nx>max)return;const cand={pieces:dp[x].pieces+1,counts:[...dp[x].counts]};cand.counts[i]++;if(!dp[nx]||cand.pieces<dp[nx].pieces)dp[nx]=cand;});}for(let x=target10;x<=max;x++)if(dp[x])return{names,lens,used:x/10,excess:(x-target10)/10,...dp[x]};return null;}
function chooseLadder(height,type){if(type==='3m')return{label:'3.0m アルミシングル梯子',count:Math.max(1,Math.ceil((height+0.6)/3.0))};if(type==='1.8m')return{label:'1.8m 垂直梯子',count:Math.max(1,Math.ceil(Math.max(0,height-0.5)/1.8))};if(type==='5m')return{label:'5.0m スライド梯子',count:Math.max(1,Math.ceil((height+0.6)/5.0))};if(height<=2.4)return{label:'3.0m アルミシングル梯子',count:1};if(height<=4.4)return{label:'5.0m スライド梯子',count:1};return{label:'1.8m 垂直梯子',count:Math.max(1,Math.ceil(Math.max(0,height-0.5)/1.8))};}
function distributeSpans01(totalLength,maxBay){const total10=Math.round(totalLength*10);let bays=Math.max(1,Math.ceil(totalLength/maxBay));while(Math.ceil(total10/bays)/10>maxBay+1e-9)bays++;const base=Math.floor(total10/bays);const rem=total10-base*bays;const spans=[];for(let i=0;i<bays;i++)spans.push((base+(i<rem?1:0))/10);return spans;}