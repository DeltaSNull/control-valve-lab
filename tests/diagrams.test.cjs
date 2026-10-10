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
test('compact phone plots keep a usable plot area with fewer, separated y labels',()=>{
  const d=new JSDOM(D.plot([{points:[{x:0,y:0},{x:100,y:100}]}],{width:330,height:140})),doc=d.window.document;
  const yLabels=[...doc.querySelectorAll('text[text-anchor="end"]')].map(t=>Number(t.getAttribute('y')));
  assert.equal(yLabels.length,3);
  assert.ok(Math.min(...yLabels.slice(1).map((y,i)=>Math.abs(y-yLabels[i])))>=30,'y labels need at least 30 px separation');
  const axis=doc.querySelector('path[stroke="#a9b7a1"]').getAttribute('d').match(/M\d+ (\d+)V(\d+)/);
  assert.ok(Number(axis[2])-Number(axis[1])>=70,'plot area height');
  const full=new JSDOM(D.plot([{points:[{x:0,y:0}]}],{width:600,height:270}));
  assert.equal(full.window.document.querySelectorAll('text[text-anchor="end"]').length,5);d.window.close();full.window.close();
});
test('plots carry a numeric text alternative with axes, series endpoints and markers',()=>{
  const d=new JSDOM(D.plot([{name:'Installed',points:[{x:0,y:0},{x:50,y:48.1},{x:100,y:89}]}],{xLabel:'Actual travel (%)',yLabel:'Liquid flow (US gpm)',title:'Flow',markers:[{x:50,y:48.1}]}));
  const desc=d.window.document.querySelector('svg > desc').textContent;
  assert.match(desc,/Horizontal axis: Actual travel \(%\), 0 to 100/);assert.match(desc,/Vertical axis: Liquid flow \(US gpm\)/);
  assert.match(desc,/Installed: 0 at 0 to 89 at 100; range 0 to 89/);assert.match(desc,/Marker at 50, 48.1/);d.window.close();
});
