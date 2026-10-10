(function(root){
  'use strict';
  const $=id=>document.getElementById(id);
  const observations={
    anatomy:[['valve-diagram','Valve cutaway']],
    friction:[['friction-time','Command & travel'],['friction-signature','Response signature']],
    flow:[['installed-chart','Installed flow'],['cv-chart','Inherent Cv']],
    trim:[['pressure-profile','Pressure profile'],['style-diagram','Closure member']],
    positioner:[['position-time','Travel response'],['position-pressure','Air pressure']],
    diagnosis:[['case-travel-chart','Command & travel'],['case-pressure-chart','Pressure'],['case-flow-chart','Flow']],
    pid:[['pid-trend','SP & measured PV'],['pid-valve-chart','OP & actual travel']]
  };
  const setupIds=new Set(['flow-cvmax','flow-rangeability','flow-dp','flow-sg','flow-resistance','position-supply','position-load','position-aggressive','position-restricted','friction-speed','pid-gain','pid-tau','pid-delay','pid-kc','pid-ti','pid-td','pid-action','pid-speed','pid-lambda']);
  function mount(module){
    const main=$('main'),head=main.querySelector('.page-head');
    const original=document.createElement('div');original.className='workspace-lessons';
    while(main.firstChild)original.append(main.firstChild);
    if(head){main.append(head);head.querySelector('.eyebrow')?.remove();head.querySelector('.page-number')?.remove();}
    const shell=document.createElement('div');shell.className='lab-shell';
    shell.innerHTML=`<div class="lab-toolbar"><button class="primary" data-action="demo">▶ Run demo</button><button data-action="custom" aria-pressed="true">Custom</button><span id="demo-status" role="status">Custom · change a control and watch the response.</span></div><div class="lab-observation" aria-label="Live observation"><label class="plot-picker" for="workspace-plot">Observe<select id="workspace-plot">${observations[module].map(([id,label],i)=>`<option value="${i}">${label}</option>`).join('')}</select></label><div class="observation-plots"></div><div class="observation-metrics"></div></div><div class="lab-controls"><div class="control-tabs" aria-label="Control panels"><button data-panel="operate" aria-pressed="true">Operate</button><button data-panel="setup" aria-pressed="false">Setup</button><button data-panel="learn" aria-pressed="false">Learn</button></div><section data-control-panel="operate" aria-label="Operate controls"></section><section data-control-panel="setup" aria-label="Setup controls" hidden></section><section data-control-panel="learn" aria-label="Explanations and references" hidden></section></div>`;
    main.append(shell);
    const plots=shell.querySelector('.observation-plots'),metrics=shell.querySelector('.observation-metrics');
    observations[module].forEach(([id,label],i)=>{
      const node=original.querySelector('#'+id),panel=document.createElement('div');panel.className='observation-panel';panel.dataset.observation=i;panel.hidden=i!==0;panel.setAttribute('aria-label',label);
      const next=node.nextElementSibling;panel.append(node);if(next?.matches('.legend'))panel.append(next);plots.append(panel);
    });
    original.querySelectorAll('.kpi-grid').forEach(node=>metrics.append(node));
    const operate=shell.querySelector('[data-control-panel="operate"]'),setup=shell.querySelector('[data-control-panel="setup"]');
    // Keep explanations in Learn while relocating the actual controls, preserving IDs and listeners.
    const signature=original.querySelector('#friction-view');if(signature){const label=document.createElement('label');label.className='control';label.textContent='Signature axes';label.append(signature);operate.append(label);}
    const nodes=[...original.querySelectorAll('#friction-controls,.control,.btn-row,.tabs,.pills,.component-grid,.style-list,.check-row,.case-options,#friction-status,#position-status,#case-feedback,#pid-status,#pid-stage-controls,#pid-results,#pid-equation-note,#component-detail')];
    for(const node of nodes){if(!original.contains(node))continue;if(node.closest('#friction-controls')&&node.id!=='friction-controls')continue;
      if(node.querySelector('[data-action="glossary"]')){setup.append(node);continue;}
      const isSetup=node.id==='friction-controls'||[...node.querySelectorAll('input,select')].some(el=>setupIds.has(el.id));
      (isSetup?setup:operate).append(node);
    }
    const sourceIntro=document.createElement('p');sourceIntro.className='workspace-intro';sourceIntro.textContent=head?.querySelector('p')?.textContent||'';
    shell.querySelector('[data-control-panel="learn"]').append(sourceIntro,original);
    setPanel('operate');syncSelections();
  }
  function setPanel(name){document.querySelectorAll('[data-control-panel]').forEach(el=>el.hidden=el.dataset.controlPanel!==name);document.querySelectorAll('[data-panel]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.panel===name)));}
  function setPlot(index){document.querySelectorAll('[data-observation]').forEach(el=>el.hidden=el.dataset.observation!==String(index));}
  function syncSelections(){document.querySelectorAll('button[data-component],button[data-friction],button[data-style],button[data-profile],button[data-positioner]').forEach(el=>el.setAttribute('aria-pressed',String(el.classList.contains('selected'))));}
  function mode(demo,text){const status=$('demo-status');if(status&&status.textContent!==text)status.textContent=text;document.querySelector('[data-action="custom"]')?.setAttribute('aria-pressed',String(!demo));document.querySelector('[data-action="demo"]')?.setAttribute('aria-pressed',String(demo));}
  root.ValveWorkspace={mount,setPanel,setPlot,syncSelections,mode};
})(window);
