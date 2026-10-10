// Synthetic full-app acceptance only. Requires the loopback rehearsal harness.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import crypto from 'node:crypto';
const state = JSON.parse(await readFile(new URL('../.rehearsal/state.json',import.meta.url),'utf8'));
assert.equal(new URL(state.baseUrl).hostname,'localhost');
const origin=state.baseUrl; const evidence=[];
async function control(action,fixture,method='GET') {
  const path=fixture ? `/control/${action}?fixture=${encodeURIComponent(fixture)}` : `/control/${action}`;
  const r=await fetch(new URL(path,state.proxyOrigin),{method,headers:{'x-rehearsal-control-token':state.controlToken}}); assert.ok(r.ok);return r.json();
}
async function request(path,cookie,method='GET',body,extra={}) {
  return fetch(origin+path,{method,redirect:'manual',headers:{...(cookie?{cookie}:{}),...(method!=='GET'?{origin}:{}),...(body?{'content-type':'application/json'}:{}),...extra},body:body?JSON.stringify(body):undefined});
}
const download='/api/materials?class=acp-second-brain&key=second-brain-kit';
assert.equal((await request(download)).status,401);
evidence.push('anonymous download rejected401');
for(const fixture of ['active-starter','active-unlimited','active-insider','nov4-buyer','nov11-buyer','expired-member','revoked-member','memberless','unrelated-buyer','refunded-class']) {
 const {cookie}=await control('session',fixture,'POST');
 const page=await request('/members/second-brain',cookie);const html=await page.text();
 const allowed=['active-starter','active-unlimited','active-insider','nov4-buyer','nov11-buyer'].includes(fixture);
 assert.equal(html.includes('Download course kit ZIP'),allowed,fixture);
 const folder=fixture==='nov4-buyer'?'wed-2026-11-04-creative-ai-masterclass-1':fixture==='nov11-buyer'?'wed-2026-11-11-creative-ai-masterclass-2':'acp-second-brain';
 const r=await request(`/api/materials?class=${folder}&key=second-brain-kit`,cookie);
 assert.equal(r.status,allowed?307:403,fixture);
 assert.match(r.headers.get('cache-control'),/no-store/);
 if(allowed) {const file=await fetch(r.headers.get('location'));assert.equal(file.status,200);assert.equal(crypto.createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex'),'463199e8ae302f3c1588c7dac19049d287955e6e7a6a0e0280f88f58e334272a');}
 evidence.push(`${fixture}: access${allowed?'granted, ZIPhashverified':'denied'}`);
}
const {cookie}=await control('session','nov4-buyer','POST');
const endpoint='/api/second-brain/feedback';const version='2026-10-10.v1';
await request(endpoint,cookie,'DELETE');
const payload={submissionId:crypto.randomUUID(),attemptId:crypto.randomUUID(),eventType:'workflow_outcome',workflowId:'JOB-01',stepId:'restart',outcome:'independent',assistance:'none'};
const submit={action:'submit',consentVersion:version,payload};
assert.equal((await request(endpoint,cookie,'POST',submit)).status,409);
assert.equal((await request(endpoint,cookie,'POST',{action:'consent',enabled:true,consentVersion:version})).status,200);
assert.equal((await request(endpoint,cookie,'POST',submit)).status,201);
assert.equal((await request(endpoint,cookie,'POST',submit)).status,200);
assert.equal((await request(endpoint,cookie,'POST',{...submit,payload:{...payload,outcome:'blocked'}})).status,409);
assert.equal((await request(endpoint,cookie,'POST',{...submit,payload:{...payload,privatePrompt:'forbidden'}})).status,400);
assert.equal((await request(endpoint,cookie,'POST',submit,{origin:'https://untrusted.invalid'})).status,403);
let own=await (await request(endpoint,cookie)).json();assert.equal(own.feedback.length,1);assert.ok(Date.parse(own.feedback[0].recordedAt)>Date.parse('2026-01-01'),'timestamp must be actualrecording time');assert.ok(!JSON.stringify(own).includes('rehearsal.invalid'));
const separate=await control('session','separate-participant','POST');const other=await (await request(endpoint,separate.cookie)).json();assert.equal(other.feedback.length,0);
await control('expire-feedback','nov4-buyer','POST');
assert.equal((await request('/api/cron/second-brain-feedback-retention')).status,401);
const prune=await request('/api/cron/second-brain-feedback-retention',undefined,'GET',undefined,{authorization:'Bearer rehearsal-cron-secret'});assert.equal(prune.status,200);const purged=await prune.json();assert.ok(purged.feedbackDeleted>=1);
own=await (await request(endpoint,cookie)).json();assert.equal(own.feedback.length,0);
assert.equal((await request(endpoint,cookie,'DELETE')).status,200);
own=await (await request(endpoint,cookie)).json();assert.equal(own.consent.enabled,false);assert.equal(own.feedback.length,0);
evidence.push('buyer consentoff gate, consenton, submit, identicalretry, changedretry409, unknownfield400, crossorigin403, selfonlyexport, actualtimestamp, scheduledretention, withdrawal');
await writeFile(new URL('../.rehearsal/full-app-evidence.json',import.meta.url),JSON.stringify({passed:true,evidence,retention:purged},null,2));
console.log(JSON.stringify({passed:true,checks:evidence.length},null,2));
