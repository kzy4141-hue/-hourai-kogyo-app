const __calcB64=(window.__calcChunks||[]).join('');
const __calcBytes=Uint8Array.from(atob(__calcB64),c=>c.charCodeAt(0));
const __calcCode=new TextDecoder("utf-8").decode(__calcBytes);
(0,eval)(__calcCode);
delete window.__calcChunks;