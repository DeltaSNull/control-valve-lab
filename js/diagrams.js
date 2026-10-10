(function (root) {
  'use strict';
  const esc = s =>
    String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const colors = { command: '#2d62be', travel: '#158069', pressure: '#b77915', flow: '#bb4b2a', muted: '#93a28b' };
  function plot(lines, opts = {}) {
    // Compact phone plots use tighter margins and fewer y ticks so labels stay legible.
    const w = Math.max(280, Math.min(900, opts.width ?? 600)),
      h = Math.max(140, opts.height ?? 270),
      compact = h < 220,
      l = 64,
      r = 18,
      t = compact ? 24 : 30,
      b = compact ? 42 : 58,
      pw = w - l - r,
      ph = h - t - b;
    const xd = opts.xDomain ?? [0, 100],
      yd = opts.yDomain ?? [0, 100];
    const sx = x => l + ((x - xd[0]) / (xd[1] - xd[0])) * pw,
      sy = y => t + ph - ((y - yd[0]) / (yd[1] - yd[0])) * ph;
    const fmt = v => (Math.abs(v) >= 100 ? Math.round(v) : Number(v.toFixed(1)));
    const yTicks = ph < 100 ? 2 : 4;
    let grid = '';
    for (let i = 0; i <= yTicks; i++) {
      const y = yd[0] + ((yd[1] - yd[0]) * i) / yTicks;
      grid += `<path d="M${l} ${sy(y)}H${w - r}" stroke="#e3e8de"/><text x="${l - 10}" y="${sy(y) + 5}" text-anchor="end" font-size="14">${fmt(y)}</text>`;
    }
    for (let i = 0; i <= 4; i++) {
      const x = xd[0] + ((xd[1] - xd[0]) * i) / 4;
      grid += `<text x="${sx(x)}" y="${h - b + (compact ? 18 : 23)}" text-anchor="middle" font-size="14">${fmt(x)}</text>`;
    }
    const paths = lines
      .map((line, i) => {
        const pts = line.points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
        return `<path d="${pts.map((p, j) => `${j ? 'L' : 'M'}${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(' ')}" fill="none" stroke="${line.color ?? colors.travel}" stroke-width="${line.width ?? 2.8}" ${line.dash ? `stroke-dasharray="${line.dash}"` : ''} stroke-linejoin="round"/><title>${esc(line.name ?? `Series ${i + 1}`)}</title>`;
      })
      .join('');
    // Numeric text alternative: screen readers get each series' endpoints and range without reading color.
    const summary = [
      `Horizontal axis: ${opts.xLabel ?? 'Input (%)'}, ${fmt(xd[0])} to ${fmt(xd[1])}. Vertical axis: ${opts.yLabel ?? 'Output (%)'}.`,
      ...lines.map((line, i) => {
        const ys = line.points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
        if (!ys.length) return '';
        const lo = ys.reduce((m, p) => Math.min(m, p.y), Infinity),
          hi = ys.reduce((m, p) => Math.max(m, p.y), -Infinity),
          a = ys[0],
          z = ys.at(-1);
        return `${line.name ?? `Series ${i + 1}`}: ${fmt(a.y)} at ${fmt(a.x)} to ${fmt(z.y)} at ${fmt(z.x)}; range ${fmt(lo)} to ${fmt(hi)}.`;
      }),
      ...(opts.markers ?? []).map(m => `Marker at ${fmt(m.x)}, ${fmt(m.y)}.`)
    ]
      .filter(Boolean)
      .join(' ');
    const markers = (opts.markers ?? [])
      .map(
        m =>
          `<circle cx="${sx(m.x)}" cy="${sy(m.y)}" r="5.5" fill="${m.color ?? colors.travel}" stroke="white" stroke-width="2"/>`
      )
      .join('');
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opts.title ?? 'Engineering plot')}"><title>${esc(opts.title ?? 'Engineering plot')}</title><desc>${esc(summary)}</desc><text x="${l}" y="17" font-size="14" font-weight="650">${esc(opts.yLabel ?? 'Output (%)')}</text>${grid}<path d="M${l} ${t}V${h - b}H${w - r}" stroke="#a9b7a1" fill="none"/>${paths}${markers}<text x="${l + pw / 2}" y="${compact ? h - 4 : h - 10}" text-anchor="middle" font-size="14">${esc(opts.xLabel ?? 'Input (%)')}</text></svg>`;
  }
  function valve(travel = 40, selected = 'packing') {
    const x = Math.max(0, Math.min(100, travel)),
      lift = x * 0.55,
      d = 196 - lift,
      plug = 478 - lift;
    const part = (name, content) =>
      `<g class="svg-part ${selected === name ? 'selected' : ''}" data-component="${name}" role="button" tabindex="0" aria-label="Inspect ${name}">${content}</g>`;
    const springPath = Array.from(
      { length: 15 },
      (_, i) =>
        `${i ? 'L' : 'M'}${i === 0 || i === 14 ? 260 : i % 2 ? 245 : 275} ${(87 + ((d - 104) * i) / 14).toFixed(1)}`
    ).join(' ');
    return `<svg viewBox="0 0 520 610" role="img" aria-label="Air-to-open spring-to-close globe valve at ${x.toFixed(1)} percent travel" class="${x === 0 ? 'no-flow' : ''}"><title>Representative globe valve cutaway at ${x.toFixed(1)}% travel</title><defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#399f99"/></marker><pattern id="metal-hatch" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#e1e7da"/><path d="M0 7L7 0" stroke="#b4c0b1" stroke-width=".6"/></pattern></defs>
      ${part('diaphragm', `<path d="M157 184V130Q162 58 260 58Q358 58 363 130V211H157Z" fill="#679765" stroke="#365f3e" stroke-width="3"/><path d="M172 185V132Q182 78 260 78Q338 78 348 132V201H172Z" fill="#edf2e7"/><path d="M172 ${d}Q215 ${d + 8} 260 ${d}Q303 ${d + 8} 348 ${d}" stroke="#3a5545" stroke-width="6" fill="none"/><rect x="160" y="211" width="200" height="14" rx="5" fill="#59824f" stroke="#365f3e" stroke-width="2"/>`)}
      ${part('air', `<path d="M173 ${d + 5}H347V207H173Z" fill="#bee1db" opacity=".7"/><path d="M330 198H388V315H374" fill="none" stroke="#399f99" stroke-width="4"/><text x="181" y="${d + 22}" font-size="10" fill="#2e7167">AIR</text>`)}
      ${part('spring', `<path d="${springPath}" stroke="#67725f" fill="none" stroke-width="5" stroke-linejoin="round"/><path d="M235 84H285M237 ${d - 15}H283" stroke="#65775d" stroke-width="5"/>`)}
      ${part('yoke', `<path d="M180 225V363H221V351H194V225M340 225V363H299V351H326V225" fill="#8c9d87" stroke="#5d7056" stroke-width="2"/>`)}
      ${part('positioner', `<rect x="330" y="277" width="64" height="71" rx="10" fill="#659461" stroke="#3a6240" stroke-width="2"/><rect x="343" y="290" width="37" height="19" rx="4" fill="#f0f3e8"/><text x="361" y="303" text-anchor="middle" font-size="10" fill="#365b3d">DVC</text><circle cx="353" cy="327" r="7" fill="#dce6d5"/><path d="M330 312H274" stroke="#8b9c85" stroke-width="2" stroke-dasharray="5 4"/>`)}
      ${part('bonnet', `<path d="M225 358H295V407L316 425H204L225 407Z" fill="#bac6b6" stroke="#7e9277" stroke-width="2"/><rect x="244" y="358" width="32" height="55" fill="#edf2e6"/><path d="M216 425H304" stroke="#778e70" stroke-width="8"/>`)}
      ${part('packing', `<rect x="244" y="365" width="10" height="34" fill="#b39264"/><rect x="266" y="365" width="10" height="34" fill="#b39264"/><path d="M244 372H254M244 382H254M244 392H254M266 372H276M266 382H276M266 392H276" stroke="#756447" stroke-width="2"/><rect x="238" y="358" width="44" height="7" fill="#8d9e85"/>`)}
      ${part('body', `<path d="M47 479H180Q187 427 220 426H301Q335 426 345 453H463V519H343Q325 565 260 565Q195 565 177 546H47Z" fill="url(#metal-hatch)" stroke="#7c9274" stroke-width="5"/><path d="M55 490H189Q199 438 225 438H294Q318 438 334 465H455V507H332Q316 550 260 550Q212 550 185 534H55Z" fill="#dceeee"/><rect x="40" y="472" width="18" height="83" fill="#b0c0a7" stroke="#7c9274" stroke-width="2"/><rect x="454" y="445" width="18" height="83" fill="#b0c0a7" stroke="#7c9274" stroke-width="2"/>`)}
      ${part('cage', `<path d="M231 433V500H243V441H277V500H289V433Z" fill="#a3b99f" stroke="#6a8265" stroke-width="2"/><path d="M235 449H243M235 462H243M235 475H243M277 449H285M277 462H285M277 475H285" stroke="#3c6653" stroke-width="3"/>`)}
      ${part('seat', `<path data-body-partition="inlet" d="M188 490L223 496H245V505H223L188 500Z" fill="url(#metal-hatch)" stroke="#7c9274" stroke-width="2"/><path data-body-partition="outlet" d="M275 496H297L335 507L331 518L294 505H275Z" fill="url(#metal-hatch)" stroke="#7c9274" stroke-width="2"/><path d="M223 496H245V504H223M275 496H297V504H275" fill="#8b9e82" stroke="#5c7957" stroke-width="2"/>`)}
      ${part('stem', `<rect x="254" y="${d + 2}" width="12" height="${plug - d}" rx="3" fill="#9eaaa0" stroke="#53665a" stroke-width="1.5"/><rect x="247" y="291" width="26" height="18" rx="3" fill="#6d8470"/>`)}
      ${part('plug', `<rect x="254" y="425" width="12" height="${plug - 425 + 2}" fill="#9eaaa0" stroke="#53665a" stroke-width="1"/><path d="M244 ${plug}H276L275 ${plug + 18}H245Z" fill="#819d79" stroke="#426847" stroke-width="2"/>`)}
      <path class="flow-path" d="M67 520H204Q225 520 234 511L241 507M279 487Q309 471 339 479H440" fill="none" stroke="#399f99" stroke-width="3" marker-end="url(#flow-arrow)" opacity="${x === 0 ? 0.1 : 0.9}"/>
      <g fill="none" stroke="#a6b69b" stroke-width="1"><path d="M183 115H85M189 250H90M240 383H100M233 455H125M225 500H102M294 438H421M345 308H423"/></g>
      <g class="svg-label"><text x="48" y="108">Actuator</text><text x="48" y="244">Yoke</text><text x="48" y="376">Packing</text><text x="49" y="448">Cage</text><text x="49" y="493">Seat</text><text x="378" y="432">Plug / stem</text><text x="403" y="298">Positioner</text><text x="54" y="581">INLET</text><text x="412" y="550">OUTLET</text></g>
      <text x="260" y="602" text-anchor="middle" font-size="11" fill="#6d8164">Lifted plug = more open flow path</text>
    </svg>`;
  }
  function styleIcon(type, travel = 50, large = false) {
    const x = Math.max(0, Math.min(100, travel)) / 100,
      angle = x * 90;
    let shape = '';
    if (type === 'globe')
      shape = `<path d="M85 45H115V94H85Z" fill="#dce9d0" stroke="#72916c" stroke-width="2"/><path d="M50 104H89V110H50M111 104H150V110H111" stroke="#577951" fill="#9aaf8e"/><path d="M100 18V${99 - 45 * x}" stroke="#647b61" stroke-width="7"/><path d="M88 ${92 - 45 * x}H112V${104 - 45 * x}H88Z" fill="#5f8f61"/>`;
    if (type === 'ball')
      shape = `<circle cx="100" cy="85" r="40" fill="#75a472" stroke="#396941" stroke-width="3"/><g transform="rotate(${angle} 100 85)"><path d="M72 48L123 86L72 123Z" fill="#e5eee0"/><path d="M100 25V45" stroke="#526c50" stroke-width="7"/></g>`;
    if (type === 'butterfly')
      shape = `<circle cx="100" cy="85" r="42" fill="#e7efdf" stroke="#55794d" stroke-width="3"/><ellipse cx="100" cy="85" rx="${Math.max(4, 37 * (1 - x))}" ry="39" fill="#82a479" stroke="#50784a" stroke-width="3"/><path d="M100 20V125" stroke="#6e8865" stroke-width="5"/>`;
    if (type === 'eccentric')
      shape = `<circle cx="100" cy="85" r="42" fill="#e7efdf" stroke="#55794d" stroke-width="3"/><g transform="rotate(${-angle} 90 51)"><path d="M90 25V78L109 85" stroke="#6c8563" stroke-width="7" fill="none"/><ellipse cx="115" cy="87" rx="10" ry="32" fill="#749c6b" stroke="#456d40" stroke-width="3"/></g><path d="M125 48V122" stroke="#9bb58a" stroke-width="4"/>`;
    return `<svg viewBox="0 0 200 160" role="img" aria-label="${esc(type)} schematic at ${Math.round(x * 100)} percent travel"><path d="M15 50H52M15 120H52M148 50H185M148 120H185" stroke="#a2b399" stroke-width="8"/><path d="M52 50Q100 15 148 50V120Q100 155 52 120Z" fill="#edf3e6" stroke="#a2b399" stroke-width="5"/>${shape}${large ? '<text x="100" y="153" text-anchor="middle" font-size="9" fill="#62785a">Conceptual geometry; not a vendor drawing</text>' : ''}</svg>`;
  }
  function trimSketch(type) {
    const windows =
      type === 'noise' || type === 'cavitation'
        ? Array.from(
            { length: 24 },
            (_, i) => `<circle cx="${90 + (i % 4) * 16}" cy="${55 + Math.floor(i / 4) * 14}" r="3" fill="#3d6f4f"/>`
          ).join('')
        : `<path d="M88 57L105 57L105 124L88 107ZM126 57L143 57L143 107L126 124Z" fill="#527e54"/>`;
    return `<svg viewBox="0 0 240 170" role="img" aria-label="${esc(type)} trim concept"><rect x="72" y="40" width="96" height="104" rx="8" fill="#c7d8b6" stroke="#749466" stroke-width="3"/>${windows}<path d="M120 14V88" stroke="#61795c" stroke-width="8"/><rect x="82" y="25" width="76" height="25" rx="3" fill="#789c67"/><path d="M67 149H173" stroke="#708e5b" stroke-width="7"/><text x="120" y="168" text-anchor="middle" font-size="9" fill="#708365">Illustrative cage / port geometry</text></svg>`;
  }
  root.ValveDiagrams = { esc, colors, plot, valve, styleIcon, trimSketch };
})(typeof globalThis !== 'undefined' ? globalThis : this);
