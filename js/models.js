(function (root) {
  'use strict';
  const clamp=(v,lo=0,hi=100)=>Math.min(hi,Math.max(lo,v));
  function finite(v,name) { if(!Number.isFinite(v)) throw new RangeError(`${name} must be finite`); return v; }
  function cvAt(travelPct, characteristic='equal', cvMax=80, rangeability=50) {
    finite(travelPct,'Travel'); finite(cvMax,'Rated Cv'); finite(rangeability,'Rangeability');
    if(cvMax<0||rangeability<=1) throw new RangeError('Cv must be nonnegative; R must exceed 1');
    if(!['linear','equal','quick'].includes(characteristic)) throw new RangeError('Unknown characteristic');
    const x=clamp(travelPct)/100;
    if(x===0) return 0;
    if(characteristic==='linear') return cvMax*x;
    if(characteristic==='quick') return cvMax*(1-Math.exp(-4*x))/(1-Math.exp(-4));
    // Ideal equal-percentage law above 5% travel; illustrative linear seating transition below.
    return cvMax*(x<.05 ? (x/.05)*Math.pow(rangeability,-.95) : Math.pow(rangeability,x-1));
  }
  function liquidFlow(cv, dp, sg=1, resistance=0) {
    [cv,dp,sg,resistance].forEach((v,i)=>finite(v,['Cv','Differential pressure','SG','Resistance'][i]));
    if(cv<0||dp<0||sg<=0||resistance<0) throw new RangeError('Invalid liquid flow inputs');
    if(cv===0||dp===0) return {flow:0,valveDp:dp,pipeDp:0,authority:dp>0?1:0};
    const flow=Math.sqrt(dp/(sg/(cv*cv)+resistance));
    const pipeDp=resistance*flow*flow, valveDp=Math.max(0,dp-pipeDp);
    return {flow,valveDp,pipeDp,authority:dp>0?valveDp/dp:0};
  }
  function motionStep(state, command, options={}, dt=.05) {
    finite(command,'Command'); finite(dt,'Time step'); if(dt<0) throw new RangeError('Negative time step');
    const c=clamp(command), old=clamp(state.position??50), mode=options.mode??'ideal';
    let position=old, stuck=false;
    if(mode==='ideal') position=c;
    else if(mode==='stiction') {
      const fs=Math.max(0,options.staticFriction??5), fk=clamp(options.slidingFriction??1.5,0,fs);
      if(Math.abs(c-old)>fs) position=c-Math.sign(c-old)*fk;
      else stuck=true;
    } else if(mode==='backlash'||mode==='hysteresis') {
      const half=Math.max(0,mode==='backlash'?(options.backlash??6)/2:(options.hysteresis??4)/2);
      position=clamp(old,c-half,c+half); stuck=Math.abs(position-old)<1e-8;
    } else if(mode==='lag') {
      const tau=Math.max(.01,options.tau??2); position=old+(c-old)*(-Math.expm1(-dt/tau));
    } else throw new RangeError('Unknown motion mode');
    position=clamp(position);
    return {position,stuck,pressure:3+.12*c,springPressure:3+.12*position,forceEquivalent:c-position};
  }
  function positionerStep(state, command, options={}, dt=.02) {
    finite(command,'Command'); finite(dt,'Time step'); if(dt<0) throw new RangeError('Negative time step');
    const type=options.type??'dvc'; if(!['ip','conventional','dvc'].includes(type)) throw new RangeError('Unknown positioner type');
    const supply=clamp(finite(options.supply??22,'Supply'),0,35), load=finite(options.load??0,'Load');
    const c=clamp(command), feedback=type!=='ip', aggressive=feedback&&Boolean(options.aggressive);
    let position=clamp(state.position??40), pressure=clamp(state.pressure??7.8,0,supply), velocity=state.velocity??0, integral=state.integral??0;
    const n=Math.max(1,Math.ceil(dt/.005)), h=dt/n;
    for(let i=0;i<n;i++) {
      const error=c-position;
      const base=3+.12*c, kp=aggressive?.6:.12;
      const raw=base+(feedback?kp*error+integral:0);
      // Conditional integration prevents windup when a saturated output cannot correct error.
      if(feedback&&!((raw>=supply&&error>0)||(raw<=0&&error<0))) integral=clamp(integral+.08*error*h,-20,20);
      const demand=clamp(base+(feedback?kp*error+integral:0),0,supply);
      const tau=options.restricted?2:(aggressive?.08:.18);
      pressure+=(demand-pressure)*(-Math.expm1(-h/tau));
      const springEquilibrium=(pressure-3-load)/.12;
      let force=springEquilibrium-position;
      if(Math.abs(velocity)<.15&&Math.abs(force)<.6) velocity=0;
      else {
        force-=.35*Math.sign(Math.abs(velocity)>.15?velocity:force);
        velocity+=(80*force-(aggressive?3:20)*velocity)*h;
        position+=velocity*h;
      }
      if(position<=0) {position=0;velocity=Math.max(0,velocity);} if(position>=100) {position=100;velocity=Math.min(0,velocity);}
    }
    return {position,pressure,velocity,integral,error:c-position};
  }
  function caseData(id) {
    if(!['packing','backlash','air','oversized','tuning','process'].includes(id)) throw new RangeError('Unknown case');
    const rows=[]; let state={position:50}, ps={position:50,pressure:9,integral:0,velocity:0};
    for(let i=0;i<=600;i++) {
      const t=i*.1; let command=50+7*Math.sin(t*.35), travel, pressure, flow;
      if(id==='packing'||id==='backlash') {
        state=motionStep(state,command,{mode:id==='packing'?'stiction':'backlash',staticFriction:5,slidingFriction:1,backlash:7},.1);
        travel=state.position; pressure=state.pressure;
      } else if(id==='air'||id==='tuning') {
        command=t<10?35:70;
        ps=positionerStep(ps,command,{type:'dvc',supply:id==='air'?10:22,restricted:id==='air',aggressive:id==='tuning'},.1);
        travel=ps.position; pressure=ps.pressure;
      } else if(id==='oversized') { command=8+2*Math.sin(t*.35);travel=command;pressure=3+.12*travel; }
      else { command=50;travel=50;pressure=9; }
      const dp=id==='process'?20+8*Math.sin(t*.35):20;
      flow=liquidFlow(cvAt(travel,'linear',id==='oversized'?400:80,50),dp,1,.003).flow;
      rows.push({t,command,travel,pressure,flow});
    }
    return rows;
  }
  const api={clamp,cvAt,liquidFlow,motionStep,positionerStep,caseData};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  root.ValveModels=api;
})(typeof globalThis!=='undefined'?globalThis:this);
