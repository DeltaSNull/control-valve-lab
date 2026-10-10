(function (root) {
  'use strict';
  const M = typeof module === 'object' && module.exports ? require('./models.js') : root.ValveModels;
  const clamp = M.clamp;
  function terms(sp, pv, cfg) {
    const sign = cfg.action === 'direct' ? -1 : 1;
    return {error:sign*(sp-pv), p:sign*((cfg.equation==='C'?0:sp)-pv), d:sign*((cfg.equation==='A'?sp:0)-pv)};
  }
  function trackController(s, sp, pv, cfg) {
    const t=terms(sp,pv,cfg);
    return {...s, bias:s.op-cfg.kc*t.p, integral:0, derivative:0, prevD:t.d};
  }
  function controllerStep(s, sp, pv, cfg, dt) {
    if (![sp,pv,cfg.kc,cfg.ti,cfg.td,dt].every(Number.isFinite) || cfg.kc<0 || cfg.ti<0 || cfg.td<0 || dt<0) throw new RangeError('Invalid PID input');
    const t=terms(sp,pv,cfg), td=cfg.td*60, ti=cfg.ti*60;
    // Backward-Euler damped derivative. Td/16 is an explicitly declared teaching filter.
    const derivative=td>0&&dt>0 ? ((td/16)*(s.derivative||0)+td*(t.d-(s.prevD??t.d)))/(td/16+dt) : (td>0?s.derivative||0:0);
    const increment=ti>0?cfg.kc*t.error*dt/ti:0;
    let integral=s.integral||0;
    const base=(s.bias??50)+cfg.kc*(t.p+derivative);
    const proposed=base+integral+increment;
    if(!((proposed>100&&increment>0)||(proposed<0&&increment<0)))integral+=increment;
    return {op:clamp(base+integral),bias:s.bias??50,integral,derivative,prevD:t.d};
  }
  function initial() {return {t:0,pv:50,measured:50,travel:50,motion:{position:50},queue:[{t:0,travel:50}],delayed:50};}
  function plantStep(s, op, cfg, dt) {
    if (![op,cfg.gain,cfg.tau,cfg.delay,cfg.load,dt].every(Number.isFinite)||cfg.tau<=0||cfg.delay<0||dt<=0)throw new RangeError('Invalid process input');
    const mode={stiction:'stiction',backlash:'backlash',slow:'lag'}[cfg.defect]||'lag';
    const request=cfg.defect==='limited'?Math.min(55,op):op;
    const motion=M.motionStep(s.motion,request,{mode,staticFriction:4,slidingFriction:1.2,backlash:6,tau:cfg.defect==='slow'?6:.4},dt);
    const t=s.t+dt, queue=s.queue.slice();queue.push({t,travel:motion.position});
    let delayed=s.delayed;
    while(queue.length>1&&queue[1].t<=t-cfg.delay+1e-8)delayed=queue.shift().travel;
    if(queue[0].t<=t-cfg.delay+1e-8)delayed=queue[0].travel;
    const target=50+cfg.gain*(delayed-50)+cfg.load;
    const pv=target+(s.pv-target)*Math.exp(-dt/cfg.tau);
    const noise=cfg.defect==='noise'? .65*Math.sin(t*5.1)+.35*Math.sin(t*11.7):0;
    return {t,pv,measured:pv+noise,travel:motion.position,motion,queue,delayed};
  }
  const mean=rows=>rows.reduce((sum,r)=>sum+r.pv,0)/rows.length;
  function identifyStep(rows, stepTime, beforeOP, afterOP) {
    const fail=reason=>({ok:false,reason});
    if(!rows.length||Math.abs(afterOP-beforeOP)<.5)return fail('Use a distinct OP step of at least 0.5 pp.');
    const pre=rows.filter(r=>r.t>=stepTime-5&&r.t<stepTime),post=rows.filter(r=>r.t>=stepTime);
    if(pre.length<5||post.length<30)return fail('Record a steady baseline and a complete response.');
    if(post.some(r=>Math.abs(r.op-afterOP)>.1))return fail('Multiple OP changes: restart a single-step recording.');
    const baseline=mean(pre), end=post.at(-1).t;
    const tail=post.filter(r=>r.t>end-5),prior=post.filter(r=>r.t>end-10&&r.t<=end-5);
    if(!tail.length||!prior.length)return fail('Keep recording until the response settles.');
    const final=mean(tail),delta=final-baseline;
    const half=Math.floor(pre.length/2);
    if(Math.abs(mean(pre.slice(0,half))-mean(pre.slice(half)))>Math.max(.2,Math.abs(delta)*.02))return fail('Baseline is drifting. Begin from a settled operating point.');
    const travelRows=tail.filter(r=>Number.isFinite(r.travel));
    if(travelRows.length&&Math.abs(travelRows.reduce((sum,r)=>sum+r.travel,0)/travelRows.length-afterOP)>Math.max(2,Math.abs(afterOP-beforeOP)*.4))return fail('Travel is not following the OP step. Resolve the travel limit or large lost motion before fitting tuning.');
    if(Math.abs(delta)<.3)return fail('No resolvable PV response. Check for stiction, travel limits or a step too small.');
    const fractions=[.283,.632];
    const crossing=f=>{
      const target=baseline+f*delta;
      for(let i=1;i<post.length;i++){
        const a=post[i-1],b=post[i];
        if((b.pv-target)*Math.sign(delta)>=0&&(a.pv-target)*Math.sign(delta)<0)return a.t+(b.t-a.t)*(target-a.pv)/(b.pv-a.pv)-stepTime;
      }
      return NaN;
    };
    const t28=crossing(fractions[0]),t63=crossing(fractions[1]),tau=1.5*(t63-t28),delay=Math.max(0,t28-tau/3);
    if(!Number.isFinite(tau)||tau<=0)return fail('The response does not provide ordered 28.3% and 63.2% crossings.');
    if(Math.abs(final-mean(prior))>Math.abs(delta)*.012 || end-stepTime<delay+4*tau)return fail('Response is still settling. Continue recording before estimating tuning.');
    return {ok:true,gain:delta/(afterOP-beforeOP),tau,delay,baseline,final,t28,t63};
  }
  function suggestPI(model, lambda) {
    if(![model.gain,model.tau,model.delay,lambda].every(Number.isFinite)||Math.abs(model.gain)<.001||model.tau<=0||model.delay<0||lambda<=0)throw new RangeError('Invalid tuning estimate');
    const target=Math.max(lambda,model.delay,.1);
    return {kc:model.tau/(Math.abs(model.gain)*(target+model.delay)),ti:Math.min(model.tau,4*(target+model.delay))/60,td:0,action:model.gain>0?'reverse':'direct',lambda:target};
  }
  const api={controllerStep,trackController,initial,plantStep,identifyStep,suggestPI};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ValvePID=api;
})(typeof globalThis==='object'?globalThis:this);
