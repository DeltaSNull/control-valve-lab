const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/models.js');
const near = (a,b,tol=1e-7) => assert.ok(Math.abs(a-b)<tol, `${a} differs from ${b}`);

test('liquid reference case: Cv 10, 4 psi, water gives 20 US gpm', () => {
  const r=M.liquidFlow(10,4,1,0); near(r.flow,20); near(r.valveDp,4);
});
test('installed model conserves total pressure drop', () => {
  const r=M.liquidFlow(35,25,.8,.008); near(r.valveDp+r.pipeDp,25); near(r.flow,35*Math.sqrt(r.valveDp/.8));
});
test('zero Cv and zero available pressure have finite zero flow', () => {
  assert.equal(M.liquidFlow(0,20,1,.01).flow,0);
  assert.equal(M.liquidFlow(10,0,1,.01).flow,0);
});
test('specific gravity scales constant-pressure flow by inverse square root', () => {
  near(M.liquidFlow(10,4,4,0).flow,10);
});
test('characteristics close at zero and reach rated Cv at full travel', () => {
  for(const type of ['linear','equal','quick']) { near(M.cvAt(0,type,80,50),0); near(M.cvAt(100,type,80,50),80); }
});
test('characteristics are continuous monotone over their declared range', () => {
  for(const type of ['linear','equal','quick']) {
    let last=0;
    for(let p=0;p<=100;p+=.2) { const v=M.cvAt(p,type,80,50); assert.ok(v>=last-1e-9); last=v; }
    assert.ok(Math.abs(M.cvAt(5.0001,type,80,50)-M.cvAt(4.9999,type,80,50))<.01);
  }
});
test('equal percentage has equal Cv ratios for equal increments above 5% travel', () => {
  near(M.cvAt(50,'equal',80,50)/M.cvAt(40,'equal',80,50), Math.pow(50,.1));
  near(M.cvAt(80,'equal',80,50)/M.cvAt(70,'equal',80,50), Math.pow(50,.1));
});
test('bad liquid and characteristic inputs are rejected', () => {
  for(const args of [[10,4,0,0],[10,-1,1,0],[NaN,1,1,0],[10,1,1,-1]]) assert.throws(()=>M.liquidFlow(...args));
  assert.throws(()=>M.cvAt(50,'unknown',80,50)); assert.throws(()=>M.cvAt(50,'equal',80,1));
});
test('stiction holds below breakaway then slips toward lower sliding friction', () => {
  let s={position:50}; s=M.motionStep(s,54,{mode:'stiction',staticFriction:5,slidingFriction:1.5},.1);
  near(s.position,50); assert.equal(s.stuck,true);
  s=M.motionStep(s,56,{mode:'stiction',staticFriction:5,slidingFriction:1.5},.1);
  near(s.position,54.5); assert.equal(s.stuck,false);
});
test('backlash holds after reversal until the reversal band is consumed', () => {
  let s=M.motionStep({position:40},60,{mode:'backlash',backlash:6},.1); near(s.position,57);
  s=M.motionStep(s,56,{mode:'backlash',backlash:6},.1); near(s.position,57);
  s=M.motionStep(s,52,{mode:'backlash',backlash:6},.1); near(s.position,55);
});
test('lag settles with time, and a slower lag travels less after the same step', () => {
  const fast=M.motionStep({position:0},60,{mode:'lag',tau:1},1);
  const slow=M.motionStep({position:0},60,{mode:'lag',tau:4},1); assert.ok(fast.position>slow.position);
  let s={position:0}; for(let i=0;i<200;i++) s=M.motionStep(s,60,{mode:'lag',tau:1},.1); near(s.position,60,1e-5);
});
test('all motion modes keep travel inside mechanical stops', () => {
  for(const mode of ['ideal','stiction','backlash','lag','hysteresis']) {
    let s={position:50}; for(const c of [-20,120,0,100]) { s=M.motionStep(s,c,{mode},.1); assert.ok(s.position>=0&&s.position<=100); }
  }
});
test('feedback positioner rejects steady load that an I/P alone cannot', () => {
  function run(type) { let s={position:40,pressure:7.8,integral:0,velocity:0}; for(let i=0;i<2400;i++) s=M.positionerStep(s,60,{type,supply:22,load:2,aggressive:false},.02); return s; }
  const ip=run('ip'), dvc=run('dvc'); assert.ok(Math.abs(ip.position-60)>10); assert.ok(Math.abs(dvc.position-60)<.5);
});
test('insufficient supply limits pressure and leaves travel deviation', () => {
  let s={position:0,pressure:3,integral:0,velocity:0}; for(let i=0;i<1000;i++) s=M.positionerStep(s,90,{type:'dvc',supply:9,load:0},.02);
  assert.ok(s.pressure<=9+1e-8); assert.ok(s.position<55);
});
test('case data provides finite command, travel, pressure, and flow traces', () => {
  for(const id of ['packing','backlash','air','oversized','tuning','process']) {
    const rows=M.caseData(id); assert.ok(rows.length>100); for(const r of rows) for(const k of ['t','command','travel','pressure','flow']) assert.ok(Number.isFinite(r[k]));
  }
});
