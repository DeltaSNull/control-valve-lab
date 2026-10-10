const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const context={};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../js/diagrams.js'),'utf8'),context);
const D=context.ValveDiagrams;
test('stem is drawn above the opaque bonnet and body so it remains visible in the packing bore',()=>{
  const d=new JSDOM(D.valve(40));const parts=Array.from(d.window.document.querySelectorAll('[data-component]')).map(p=>p.dataset.component);
  assert.ok(parts.indexOf('stem')>parts.indexOf('bonnet'));assert.ok(parts.indexOf('stem')>parts.indexOf('body'));d.window.close();
});
test('plots honor the measured container width to retain readable font size on phones',()=>{
  const d=new JSDOM(D.plot([{points:[{x:0,y:0},{x:100,y:100}]}],{width:310}));
  assert.equal(d.window.document.querySelector('svg').getAttribute('viewBox').split(' ')[2],'310');
  assert.ok(Number(d.window.document.querySelector('text').getAttribute('font-size'))>=14);d.window.close();
});
test('closed cutaway has solid body partitions connecting both sides of the seat throat to the body wall',()=>{
  const d=new JSDOM(D.valve(0));const partitions=d.window.document.querySelectorAll('[data-body-partition]');
  assert.equal(partitions.length,2);
  const left=partitions[0].getAttribute('d'),right=partitions[1].getAttribute('d');
  assert.match(left,/188/);assert.match(left,/245/);assert.match(right,/275/);assert.match(right,/335/);d.window.close();
});
