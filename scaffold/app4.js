function getInputs(){
  return ['length','height','width','bay','floorMode','access','accessSpan','landingLength','ladderType'].reduce((o,id)=>(o[id]=document.getElementById(id).value,o),{});
}
function saveData(){
  localStorage.setItem('scaffoldInputsV23',JSON.stringify(getInputs()));
  document.getElementById('saved').textContent='入力内容をこの端末に保存しました。';
}
function loadData(){
  const x=JSON.parse(localStorage.getItem('scaffoldInputsV23')||localStorage.getItem('scaffoldInputsV14')||localStorage.getItem('scaffoldInputsV8')||localStorage.getItem('scaffoldInputsV5')||localStorage.getItem('scaffoldInputsV2')||'null');
  if(!x)return;
  Object.keys(x).forEach(k=>{if(document.getElementById(k))document.getElementById(k).value=x[k]});
  document.getElementById('saved').textContent='保存済みの入力内容を読み込みました。';
}
loadData();
calc();