(function (root) {
  'use strict';
  const components = {
    packing: {
      name: 'Packing',
      role: 'Seals the gap around the moving stem so process fluid stays inside the bonnet.',
      cause:
        'Compression creates contact force on the stem. Excessive loading, unsuitable packing, deposits, or a scored stem can increase friction. Tightening a leak away can trade leakage for poor control.',
      evidence:
        'Command changes and actuator pressure changes, but travel holds and then jumps. A pressure–travel signature may show increased friction; compare with a baseline under similar loading.',
      takeaway: 'The same surface must seal and slide. That is why packing is a frequent place to investigate stiction.'
    },
    stem: {
      name: 'Stem',
      role: 'Transfers actuator motion to the plug. Packing and guides must allow it to move along the intended axis.',
      cause:
        'Bending, corrosion, scoring, misalignment, or deposits can make resistance depend on position. A local bind may repeat at one travel location.',
      evidence: 'Look for position-specific hesitation and inspect alignment and surfaces during an authorized outage.',
      takeaway:
        'A positioner reading at the actuator does not automatically prove every downstream mechanical connection is sound.'
    },
    plug: {
      name: 'Plug',
      role: 'The moving closure member changes the restriction. Its geometry, or the openings it uncovers in a cage, establishes the inherent capacity characteristic.',
      cause:
        'Erosion, deposits, guide contact, and thermal interference can affect movement or shutoff. Fluid force also changes with pressure and travel.',
      evidence:
        'A repeatable restriction at one travel or changed flow at the same actual position can point toward trim or process conditions.',
      takeaway: 'Plug movement sets a flow area. It does not set flow independently of pressure drop.'
    },
    seat: {
      name: 'Seat',
      role: 'The plug contacts the seat ring at shutoff. The contact geometry and materials affect leakage performance.',
      cause:
        'Damage, trapped debris, erosion, and inadequate seating force can allow leakage. High seating force and cutoffs change behavior close to closure.',
      evidence:
        'Distinguish leakage through a closed valve from external leakage at packing. Verify shutoff requirements and test conditions.',
      takeaway: 'Zero indicated travel is a position measurement, not a guarantee of zero leakage.'
    },
    cage: {
      name: 'Cage / guides',
      role: 'Guides the plug in many globe designs. Characterized windows can meter flow as the plug uncovers them.',
      cause:
        'Fouling, damage, tight clearances, thermal expansion, and plug-to-cage contact can create friction or binding.',
      evidence:
        'A bind that appears hot but disappears cold deserves investigation of temperature, clearances, and service loading.',
      takeaway: 'Not every globe valve is cage-guided. The exact internals depend on the valve and trim selection.'
    },
    bonnet: {
      name: 'Bonnet',
      role: 'Closes the body above the trim and houses the stem passage and packing assembly.',
      cause:
        'Assembly alignment and the condition of stem guidance can affect movement. Bonnet extensions isolate packing from extreme process temperatures.',
      evidence: 'Review the actual construction, temperature limits, assembly, and packing arrangement.',
      takeaway: 'The bonnet is part of the pressure boundary; its geometry also supports the moving stem.'
    },
    diaphragm: {
      name: 'Diaphragm',
      role: 'Converts air pressure acting over an effective area into actuator force. Here, air below the diaphragm lifts the plug.',
      cause:
        'A damaged diaphragm, leakage, inadequate air, or restricted tubing can reduce available force or slow response.',
      evidence:
        'Compare supply pressure, actuator pressure, and travel. Pressure reaching a limit while travel remains short indicates a force or load problem.',
      takeaway:
        'Air pressure × effective diaphragm area is a force. Required pressure depends on spring, process force, and friction.'
    },
    spring: {
      name: 'Spring',
      role: 'Opposes air force and returns this example toward closure when air is removed.',
      cause:
        'Spring rate and preload affect force throughout travel. The bench-set range is established under defined bench conditions; process loading changes the installed requirement.',
      evidence:
        'Use actuator documentation to establish action and loading; do not infer fail position from paint or an output percentage.',
      takeaway: 'This drawing is air-to-open and spring-to-close. Other assemblies reverse the action.'
    },
    body: {
      name: 'Body',
      role: 'Contains process pressure and routes fluid through the restriction. Flow direction and pressure recovery depend on construction.',
      cause:
        'Erosion, cavitation, flashing, corrosion, and vibration can damage the flow path. A large body may contain reduced-capacity trim.',
      evidence: 'Know fluid, pressures, temperature, actual trim, and flow direction before interpreting a symptom.',
      takeaway:
        'Body size and rated Cv are different specifications. A large pipe connection does not imply a large selected Cv.'
    },
    yoke: {
      name: 'Yoke',
      role: 'Supports and aligns the actuator above the valve, carrying reaction loads into the assembly.',
      cause: 'Misalignment or loose attachments can impair motion or feedback. Stem connectors also matter.',
      evidence: 'Inspect mounting and mechanical connections when safely accessible and permitted.',
      takeaway: 'An intact signal path is only useful if the mechanical path transmits the motion.'
    },
    positioner: {
      name: 'Positioner',
      role: 'Compares requested travel with feedback and changes actuator air pressure to reduce the difference.',
      cause:
        'Feedback problems, supply restrictions, poor tuning, calibration, or configuration can impair travel control.',
      evidence:
        'Trend command, actual travel, supply, and output pressure together. Confirm what the feedback sensor physically measures.',
      takeaway: 'It controls position. The process controller controls the process variable.'
    },
    air: {
      name: 'Air chamber',
      role: 'Pressure beneath the diaphragm produces upward force in this example. The positioner fills or exhausts this chamber.',
      cause:
        'Restrictions and leakage affect how quickly pressure can change. Supply pressure limits the force available.',
      evidence:
        'Healthy static supply does not guarantee adequate air delivery during a move; compare dynamic pressures.',
      takeaway: 'Supply pressure, output pressure, and a traditional 3–15 psi signal are not interchangeable.'
    }
  };
  const friction = {
    ideal: {
      title: 'Ideal tracking',
      explain:
        'Actual travel follows command exactly. This is the reference: every increment of command produces the same increment of travel.',
      observe: 'Try reversing direction. There is no lost motion or fixed offset.',
      model: 'No force dynamics or friction; ideal reference only.'
    },
    stiction: {
      title: 'Stiction / stick–slip',
      explain:
        'Static friction holds the stem until net drive force exceeds breakaway. Once it moves, sliding friction is lower, so the stem slips to a new position.',
      observe:
        'Sweep upward slowly. Pressure rises while travel is flat; then travel jumps. Reverse and watch the force build in the opposite direction.',
      model:
        'Quasi-static force balance with static and sliding thresholds. Thresholds are expressed as equivalent percentage points of spring-force span, not measured valve deadband.'
    },
    hysteresis: {
      title: 'Direction-dependent hysteresis',
      explain:
        'The same command can correspond to different travel depending on whether you approached it from above or below. Hysteresis describes the response, not a single mechanical defect.',
      observe:
        'Sweep up and down. The two branches form a loop. This simple model has continuous motion once the branch engages, without a stick–slip jump.',
      model:
        'Rate-independent play operator used to illustrate a hysteresis loop. Real friction, material effects, and mechanisms can produce different loop shapes.'
    },
    backlash: {
      title: 'Mechanical backlash',
      explain:
        'After a reversal, the input mechanism must take up clearance before it moves the output again. Linkage, couplings, and rotary connections can introduce lost motion.',
      observe: 'Move up, then step down 1%. The output can remain still until the reversal band has been consumed.',
      model:
        'Rate-independent play operator. Command is an upstream mechanical drive and travel is downstream closure-member motion; the pressure trace is only an illustrative upstream command-pressure proxy.'
    },
    lag: {
      title: 'Pneumatic / dynamic lag',
      explain:
        'Travel follows a command with a delay in time. A restricted air path or actuator dynamics can slow movement even without a static lost-motion band.',
      observe: 'Hold command steady. Travel keeps moving toward it. Slow the sweep and the dynamic loop shrinks.',
      model:
        'First-order lag with a time constant in seconds. This is a time-dependent response, not proof of mechanical hysteresis.'
    }
  };
  const styles = {
    globe: {
      name: 'Sliding-stem globe',
      tag: 'Axial plug motion',
      description:
        'A plug moves toward or away from a seat. Contoured plugs or cage windows can create different capacity characteristics. Often chosen for precise throttling and adaptable trim.',
      watch: 'Packing friction, stem alignment, plug/cage binding, process forces, and seating transitions.',
      examples: 'Fisher easy-e ED/ET families are familiar examples; selected trim and actuator details vary.',
      lesson:
        'A typical green Fisher assembly may be a globe valve, but the brand and color do not identify its exact internals.'
    },
    ball: {
      name: 'Segmented ball',
      tag: 'Rotary V-notch',
      description:
        'A ball segment rotates, progressively exposing an opening. A V-notch can provide useful throttling behavior, often with high capacity in a compact body.',
      watch:
        'Shaft packing, bearings, seal friction, coupling clearance, and torsional deflection. Actuator-side feedback may miss lost motion downstream.',
      examples:
        'Fisher Vee-Ball is one example. Use its selected characteristic and capacity tables rather than assuming every ball valve behaves alike.',
      lesson: 'Rotation reported by a positioner is not always identical to rotation of the closure member under load.'
    },
    butterfly: {
      name: 'Butterfly',
      tag: 'Rotary disk',
      description:
        'A disk rotates in the flow path. Compact construction can be useful in larger lines. Selected disk/seat geometry and installation influence capacity and pressure recovery.',
      watch:
        'Seat contact near closure, shaft packing, bearings, hydrodynamic torque, and use outside a suitable throttling range.',
      examples:
        'Concentric, eccentric, and high-performance constructions differ. Control-oriented designs are not interchangeable with every isolation butterfly valve.',
      lesson: 'Degrees of rotation, effective flow area, and flow are different quantities.'
    },
    eccentric: {
      name: 'Eccentric plug',
      tag: 'Cammed rotation',
      description:
        'An offset plug rotates and cams away from the seat. The mechanism can reduce seat contact during opening while retaining a robust throttling path.',
      watch: 'Shaft/actuator alignment, bearings, packing, seat engagement, and lost motion in the drive train.',
      examples: 'Fisher V500 is one example. Its cammed path is a construction-specific feature.',
      lesson: 'Rotary valves can still suffer stiction. Their friction and backlash sources differ from a sliding stem.'
    }
  };
  const trims = {
    characterized: {
      name: 'Characterized trim',
      purpose: 'Shape the capacity-versus-travel relationship.',
      how: 'A contoured plug changes annular opening geometry; a cage can meter flow by exposing shaped windows. Linear and equal-percentage are characteristic choices, not body styles.',
      tradeoff:
        'Installed behavior also depends on pressure drop, piping, and sizing. Input characterization in a DVC changes command-to-travel mapping; it does not reshape the physical trim.'
    },
    balanced: {
      name: 'Balanced / unbalanced',
      purpose: 'Manage pressure-induced plug forces.',
      how: 'An unbalanced plug can experience substantial force from differential pressure acting on its effective area. Balancing passages and seals reduce a pressure-force component.',
      tradeoff:
        'Balance adds sealing and construction details. Residual flow forces, friction, and required seating load remain; balanced does not mean force-free.'
    },
    reduced: {
      name: 'Reduced-capacity',
      purpose: 'Use a smaller rated Cv within a suitable body.',
      how: 'A smaller effective port or restricted cage reduces capacity. This can move normal operation out of a very low-travel region when a valve is oversized.',
      tradeoff:
        'Recheck maximum required flow, pressure/temperature ratings, noise, shutoff, and minimum controllable flow. Body size alone is insufficient.'
    },
    cavitation: {
      name: 'Anti-cavitation',
      purpose: 'Manage liquid pressure reduction and vapor-bubble collapse.',
      how: 'Multistage trims can distribute pressure reduction rather than concentrating it at one restriction. The design must fit liquid properties, pressure conditions, and service cleanliness.',
      tradeoff:
        'Small passages can be vulnerable to plugging. Anti-cavitation trim does not make downstream flashing disappear if downstream pressure remains below vapor pressure.'
    },
    noise: {
      name: 'Noise attenuation',
      purpose: 'Reduce aerodynamic noise in gas, vapor, or steam service.',
      how: 'Multiple flow passages and staged pressure reduction can control jet formation and energy dissipation. Fisher Whisper Trim and WhisperFlo are example product families.',
      tradeoff:
        'A noise-reduction cage and an anti-cavitation trim solve different service problems. Correct gas sizing and acoustic evaluation still matter.'
    },
    seats: {
      name: 'Seats & materials',
      purpose: 'Meet shutoff, temperature, erosion, and compatibility requirements.',
      how: 'Metal and soft-seat constructions offer different service capabilities. Hard-facing and material choices can improve wear resistance in an appropriate application.',
      tradeoff:
        'Leakage class specifies performance under defined test conditions. It is not a promise of bubble-tight service in every process condition, or permission to use a control valve as personnel isolation.'
    }
  };
  const cases = {
    packing: {
      name: 'Case 01 · Stair-step travel',
      question: 'Command keeps moving. Travel stays flat, then jumps. What mechanism best fits?',
      answer: 'packing',
      explanation:
        'This simulation uses static breakaway friction and lower sliding friction. The pressure proxy keeps changing while the stem sticks, then the plug slips.',
      alternatives:
        'Trim binding, actuator seal friction, deposits, or alignment can look similar. Packing is a candidate, not a diagnosis from the trend alone.',
      next: 'Compare command, physical travel, and actuator pressure. Look for consistent breakaway behavior and compare a signature with an appropriate baseline.'
    },
    backlash: {
      name: 'Case 02 · Reversal delay',
      question: 'Travel is smooth in one direction but pauses after every reversal. What fits best?',
      answer: 'backlash',
      explanation:
        'The simulated drive takes up clearance before the closure member reverses. There is no stick–slip jump once the new branch engages.',
      alternatives:
        'Friction can also produce direction-dependent travel. Actuator-side feedback may hide a shaft or coupling problem.',
      next: 'Compare upstream feedback with actual downstream movement and inspect the drive train during an authorized inspection.'
    },
    air: {
      name: 'Case 03 · Travel falls short',
      question:
        'After a large command step, pressure approaches its supply limit and travel stays below target. What fits?',
      answer: 'air',
      explanation:
        'The model has restricted air delivery and an insufficient supply-pressure ceiling. The positioner requests more force but cannot obtain it.',
      alternatives:
        'High process load, an undersized actuator, leakage, or mechanical binding can also prevent full travel. A saturation symptom is not specific to the regulator.',
      next: 'Compare supply and output pressures during movement, required force, and actual loading. Verify restrictions and leakage without assuming a static supply reading proves capacity.'
    },
    oversized: {
      name: 'Case 04 · Low-travel operation',
      question: 'Travel tracks command, but normal flow occurs near the seat. What is the strongest design concern?',
      answer: 'oversized',
      explanation:
        'This example uses a rated Cv of 400 instead of 80. A narrow, low-travel region supplies substantial flow, reducing useful operating travel.',
      alternatives:
        'High available pressure drop or a different selected characteristic can also place operation at low travel. Confirm actual trim and process conditions.',
      next: 'Evaluate required Cv across operating cases and installed gain. Reduced-capacity trim is one possible solution after checking maximum-flow requirements.'
    },
    tuning: {
      name: 'Case 05 · Travel oscillates',
      question:
        'The travel setpoint is steady after the step, yet actual travel and air pressure oscillate. What fits?',
      answer: 'tuning',
      explanation:
        'Excessive feedback gain with limited damping and pneumatic dynamics creates hunting in this reduced-order positioner model.',
      alternatives:
        'Feedback mounting, mechanical friction, changing load, or air problems can also cause cycling. This case isolates tuning; a real trend does not.',
      next: 'Establish whether oscillation originates in the position loop or process loop. Review configuration and mechanical condition before changing tuning.'
    },
    process: {
      name: 'Case 06 · Flow moves on its own',
      question: 'Command, travel, and actuator pressure are steady. Flow still changes. What fits best?',
      answer: 'process',
      explanation:
        'Available process differential pressure changes while actual travel stays fixed. Cv is constant but flow changes because pressure drop changes.',
      alternatives:
        'Fluid properties, measurement faults, pump disturbances, or upstream/downstream process changes can alter a PV without a valve-position fault.',
      next: 'Correlate upstream/downstream pressures and other process measurements. A cycling process variable alone does not prove valve stiction.'
    }
  };
  const answerOptions = [
    ['packing', 'Breakaway friction'],
    ['backlash', 'Mechanical lost motion'],
    ['air', 'Limited pneumatic force'],
    ['oversized', 'Excessive valve capacity'],
    ['tuning', 'Position loop hunting'],
    ['process', 'Process-side disturbance']
  ];
  const glossary = {
    'pp (percentage point)':
      'An absolute change in a percentage. Moving from 50% to 55% travel is a 5 pp change, not a 5% change.',
    'OP / PV / SP':
      'Controller output (what the controller asks the valve for), process variable (the measured result) and setpoint (the target).',
    'Manual / Auto':
      'In Manual a person sets the controller output. In Auto the PID algorithm sets it from the setpoint and measured PV.',
    'Limit cycle':
      'A sustained oscillation generated inside a loop, for example by stiction interacting with integral action. It persists without any outside disturbance.',
    'Step test':
      'A single deliberate change, usually of controller output in Manual, used to measure process gain, delay and time constant.',
    'Cv': 'US-unit flow coefficient: the numerical flow in US gpm for water under the reference definition at 1 psi pressure drop. Operating flow requires the applicable sizing equation and correction factors.',
    'Kv': 'Metric flow coefficient, commonly defined using m³/h of water and 1 bar pressure drop. Do not substitute its numerical value into a Cv equation.',
    'Stiction':
      'Static friction that must be overcome before motion begins; stick–slip results when static resistance exceeds sliding resistance.',
    'Hysteresis':
      'Different output at the same input depending on the direction/history of approach. Specify input, output, loading, and test conditions.',
    'Deadband':
      'An input interval after reversal with no observable output change. Identify which input and output are being measured.',
    'Backlash': 'Mechanical clearance that creates lost motion when direction reverses.',
    'Resolution':
      'The smallest input change that produces a detectable output change under stated conditions; different from measurement display precision.',
    'Inherent characteristic':
      'Travel versus flow capacity with constant valve differential pressure under defined test conditions.',
    'Installed characteristic':
      'Travel versus actual flow in the installed system, where valve differential pressure and process conditions can change.',
    'Equal percentage':
      'Equal increments of travel produce equal percentage changes in Cv within the characteristic’s applicable range.',
    'Valve authority':
      'Here, valve pressure drop divided by total available pressure drop at the stated operating point. Other conventions may use a design condition; always state the definition.',
    'Rangeability':
      'A ratio of maximum to minimum controllable capacity under specified conditions. Installed turndown also depends on the process and assembly.',
    'Positioner': 'A feedback controller that manipulates actuator air to achieve requested valve position.',
    'I/P': 'Current-to-pressure converter. By itself it does not measure valve travel or close a travel-feedback loop.',
    'DVC':
      'Digital valve controller. FIELDVUE is Fisher’s product family; other manufacturers offer digital positioners too.',
    'HART':
      'A communication protocol that can superimpose digital information on a conventional analog current signal in compatible devices.',
    'Bench set':
      'A spring/pressure adjustment established under specified bench conditions. It is not automatically the installed actuator pressure requirement.',
    'Cavitation': 'Vapor bubbles form where liquid pressure becomes low enough, then collapse after pressure recovery.',
    'Flashing': 'Vapor formation persists downstream because pressure remains below the relevant vapor pressure.',
    'Choked flow':
      'A regime where additional reduction of downstream pressure no longer increases flow as an unchoked equation predicts.',
    'Fail action':
      'The intended assembly response to a specified failure, such as loss of air. Loss of electrical signal may have different behavior depending on configuration and accessories.',
    'PID':
      'Proportional–integral–derivative control. Process-loop tuning and positioner-loop tuning address different dynamics.'
  };
  const sources = [
    {
      title: 'Control Valve Handbook, sixth edition',
      url: 'https://www.emerson.com/en/final-control/catalog/products-and-software/valves/control-valves/control-valve-handbook',
      topic: 'Terminology, capacity, installed behavior, actuator and valve selection.'
    },
    {
      title: 'FIELDVUE DVC6200 instruction manual · D103785X012',
      url: 'https://www.emerson.com/is/content/emerson/en/final-control/flow-controls/documents/d103785x012.pdf',
      topic:
        'Position feedback, I/P and relay, configuration, travel/pressure control, tuning and alerts. Verify hardware and revision for an actual device.'
    },
    {
      title: 'Fisher easy-e ET',
      url: 'https://www.emerson.com/en/final-control/products/fisher-et',
      topic: 'A representative balanced, cage-guided globe construction.'
    },
    {
      title: 'Fisher Vee-Ball V150',
      url: 'https://www.emerson.com/en/final-control/products/fisher-v150',
      topic: 'Segmented-ball construction and application-specific options.'
    },
    {
      title: 'Fisher V500 eccentric plug',
      url: 'https://www.emerson.com/en/final-control/products/fisher-v500',
      topic: 'Cammed plug motion and reduced seat contact.'
    },
    {
      title: 'Fisher Cavitrol III',
      url: 'https://www.emerson.com/en/final-control/products/fisher-cavitrol-iii',
      topic: 'Liquid anti-cavitation trim and clean-service limitations.'
    },
    {
      title: 'Fisher Whisper Trim I',
      url: 'https://www.emerson.com/en/final-control/products/fisher-whisper-trim-i',
      topic: 'Aerodynamic noise control for gas, vapor and steam.'
    },
    {
      title: 'Control Valve Flashing',
      url: 'https://www.emerson.com/en/final-control/catalog/products-and-software/valves/control-valves/severe-service-control-valves/valve-flashing',
      topic: 'Persistent vapor formation and erosion considerations.'
    },
    {
      title: 'SAMSON valve signature / EXPERTplus',
      url: 'https://www.samson.de/document/e8389ben.pdf',
      topic: 'Signature analysis, friction and comparison with a reference.'
    },
    {
      title: 'Flowserve Logix',
      url: 'https://www.flowserve.com/products/brands/logix/',
      topic: 'An example of digital positioners beyond Fisher; capabilities vary by device.'
    }
  ];
  sources.push(
    {
      title: 'Honeywell Advanced Process Manager · AP09-600 §8.14.1',
      url: 'https://skoge.folk.ntnu.no/puublications_others/apc-papers/honeywell3000-AP09-600.pdf',
      topic:
        'Manufacturer manual hosted by NTNU: A/B/C term placement, ideal versus interactive forms, action and anti-windup. Lab implements an ideal teaching form.'
    },
    {
      title: 'Skogestad · SIMC model reduction and tuning',
      url: 'https://skoge.folk.ntnu.no/publications/2003/tuningPID/mic-version/mic.pdf',
      topic: 'Primary paper: FOPDT-based PI tuning and desired closed-loop response time.'
    }
  );
  // Lesson metadata, guided activities and role notes. Numbers quoted in guides come from the
  // app's own models at the stated settings; tests/guide.test.cjs re-checks the key values.
  const modules = {
    anatomy: {
      num: '01',
      title: 'Inside the valve',
      question: 'How does a control signal become a moving plug?',
      keyIdea:
        'Air pressure on the actuator makes a force; the spring, process and friction resist it. The plug position — not the signal — sets the flow opening.',
      minutes: 5
    },
    friction: {
      num: '02',
      title: 'Stiction & hysteresis',
      question: 'Why does a valve stick, and what does it look like on a trend?',
      keyIdea:
        'A sticking valve ignores small command changes, then jumps. Backlash, hysteresis and slow response look similar on a trend but have different causes.',
      minutes: 8
    },
    flow: {
      num: '03',
      title: 'Cv & installed flow',
      question: 'If the valve opens 10% more, how much more flow do I get?',
      keyIdea:
        'Travel sets Cv. Flow also depends on the pressure drop the valve actually receives, and in a real system that pressure drop shrinks as the valve opens.',
      minutes: 7
    },
    trim: {
      num: '04',
      title: 'Trims & valve styles',
      question: 'What do the internals change, and what are cavitation and flashing?',
      keyIdea:
        'Body style and trim set capacity, characteristic and shutoff. Cavitation and flashing are pressure events inside the valve, not just noise.',
      minutes: 6
    },
    positioner: {
      num: '05',
      title: 'Positioners & DVCs',
      question: 'What does the positioner actually do?',
      keyIdea:
        'A positioner measures actual travel and adjusts air pressure until travel matches the request — within the limits of the air supply and the mechanics.',
      minutes: 6
    },
    diagnosis: {
      num: '06',
      title: 'Read the symptoms',
      question: 'The loop is cycling. Is it the valve?',
      keyIdea:
        'A cycling trend does not prove stiction. Compare command, actual travel, pressure and flow before deciding what to fix.',
      minutes: 8
    },
    pid: {
      num: '07',
      title: 'PID & step testing',
      question: 'How do I tune a loop, and when will tuning not help?',
      keyIdea:
        'Measure the process with a step test before tuning. Check the valve first: tuning cannot fix a sticking, slow or travel-limited valve.',
      minutes: 10
    }
  };
  // The signal-to-flow chain shown on the home page; each link names the lesson that explains it.
  const chain = [
    ['Controller output', 'The controller asks for a valve position, for example 60%.', 'pid'],
    ['Positioner', 'Compares requested and actual travel, then adjusts the air.', 'positioner'],
    ['Actuator', 'Air pressure × diaphragm area makes force against the spring.', 'anatomy'],
    ['Stem travel', 'Friction, backlash and lag decide whether travel follows.', 'friction'],
    ['Trim & Cv', 'The plug position sets the flow opening, expressed as Cv.', 'trim'],
    ['Flow', 'Cv and the available pressure drop set the actual flow.', 'flow'],
    ['Process variable', 'The process responds, and the controller reacts to it.', 'diagnosis']
  ];
  const roles = [
    {
      id: 'operations',
      name: 'Operations',
      who: 'Board operators, shift leads',
      goal: 'Read valve trends with confidence.',
      path: ['anatomy', 'friction', 'diagnosis'],
      remember: 'Controller output is a request. Check actual valve travel before blaming the controller.'
    },
    {
      id: 'maintenance',
      name: 'Maintenance & instrumentation',
      who: 'Instrument and valve technicians',
      goal: 'Find the real cause before adjusting anything.',
      path: ['anatomy', 'positioner', 'friction', 'diagnosis'],
      remember:
        'Compare command, travel and actuator pressure under similar conditions before changing packing or calibration.'
    },
    {
      id: 'engineering',
      name: 'Process & control engineering',
      who: 'Process, control and reliability engineers',
      goal: 'Size, characterize and tune with the valve in mind.',
      path: ['flow', 'trim', 'pid'],
      remember: 'The controller sees the installed response of valve plus piping, not the inherent trim curve.'
    },
    {
      id: 'management',
      name: 'Management & reliability',
      who: 'Area managers, reliability and project leads',
      goal: 'Know what drives loop performance.',
      path: ['anatomy', 'diagnosis', 'pid'],
      remember:
        'Many loop problems are valve or sizing problems that tuning cannot fix. Ask for evidence before approving a fix.'
    }
  ];
  const essentials = [
    ['Signal ≠ position', 'The controller output is a request. The stem may not get there.'],
    ['Position ≠ flow', 'Flow depends on Cv at that position and on the pressure drop available.'],
    ['A trend is a symptom', 'Cycling can come from the valve, the tuning, or the process. Use several measurements.'],
    ['Tuning cannot fix mechanics', 'Stiction, backlash and travel limits must be repaired, not tuned around.'],
    [
      'Paint is not a datasheet',
      'Brand and color do not tell you construction or fail action. Check the nameplate and records.'
    ]
  ];
  // Per-lesson notes for each audience, in the same order as roles.
  const onTheJob = {
    anatomy: [
      'A controller output is a request, not a position. If a display shows output but not travel, ask whether travel feedback is available.',
      'Confirm fail action from the actuator nameplate and datasheet. Packing, guides and actuator condition all affect how the stem moves.',
      'Required actuator pressure depends on spring range, process force and friction. Check sizing against worst-case shutoff and flowing forces.',
      'A control valve is a mechanical system. Its condition, not just its controller, limits how well a loop can perform.'
    ],
    friction: [
      'A trend that holds flat and then jumps while the output keeps ramping is a classic sticking pattern. Report it rather than asking for retuning.',
      'Compare signatures taken under similar conditions. Tightening packing to stop a leak can raise friction and start cycling.',
      'Stiction plus integral action produces a limit cycle. Detuning slows the cycle but does not remove it.',
      'Sticking valves keep loops cycling, adding variability and wear. They are found by reviewing data and fixed by maintenance, not by tuning.'
    ],
    flow: [
      'The same 10% move gives different flow changes at different openings. Expect the loop to feel more sensitive in some ranges.',
      'A valve that normally runs nearly closed or nearly wide open has little control margin. Flag it for review.',
      'Size for installed gain and authority. An oversized valve does its work in the first few percent of travel, where friction matters most.',
      'Oversized valves are a frequent cause of poor control. A sizing review is a low-cost way to explain chronic problem loops.'
    ],
    trim: [
      'Gravel-like noise or vibration at a liquid valve can indicate cavitation. Note the operating rate and pressures when it happens.',
      'Damage location tells a story: cavitation pits where bubbles collapse; flashing erodes where vapor flows downstream.',
      'Check the minimum internal pressure against vapor pressure for every operating case, not only the design case.',
      'Severe-service trim costs more up front but can prevent repeated trim replacement and unplanned outages.'
    ],
    positioner: [
      'If travel does not match the request, the positioner may be at its air limit or the valve may be loaded beyond what it can correct.',
      'Trend supply, output pressure and travel together. A healthy supply gauge at rest does not prove enough air during a move.',
      'Positioner tuning is an inner loop. Keep it faster than the process loop, but avoid gain that makes it hunt.',
      'Digital positioners can report diagnostics, but only if someone reviews the data and acts on it.'
    ],
    diagnosis: [
      'Before calling it a bad valve, note what changed: rate, feed, pressure, mode. Context helps the diagnosis.',
      'Use several measurements. One trend shape can fit more than one cause.',
      'Where procedures allow, put the loop in Manual briefly: cycling that stops is generated inside the loop (tuning or valve); cycling that continues comes from elsewhere.',
      'Structured diagnosis avoids replacing good parts. Ask for the evidence behind a proposed repair.'
    ],
    pid: [
      'In Manual you own the output; in Auto the controller does. A bumpless switch keeps the output steady at the moment of transfer.',
      'Before a tuning change, confirm the valve moves cleanly in small steps. Tuning cannot fix stiction.',
      'Fit a model from a clean step test and start from SIMC or a similar method. Valve defects corrupt the fit.',
      'Good tuning reduces variability, but only after the valve and measurement are healthy.'
    ]
  };
  // Guided activities: do → look for → why. Step actions live in app.js (guideActions).
  const guides = {
    anatomy: [
      {
        title: 'Follow the air',
        do: 'Move the travel command to 80%.',
        look: 'Actuator pressure rises to 12.6 psi, air force to 252 lbf, and the plug lifts 0.60 in.',
        why: 'Air pressure acting on the diaphragm area makes force. The spring pushes back, so more travel needs more pressure.'
      },
      {
        title: 'Remove the air',
        do: 'Press Remove air.',
        look: 'Pressure falls to zero and the spring drives the plug onto the seat: 0% travel.',
        why: 'This example is air-to-open, spring-to-close, so it fails closed. Other valves fail open or in place: check the datasheet.'
      },
      {
        title: 'Find the packing',
        do: 'Restore air, then select Packing under Inspect a part.',
        look: 'The packing rings surround the stem just below the actuator.',
        why: 'Packing must seal and still let the stem slide. Excess packing friction is a frequent cause of sticking.'
      },
      {
        title: 'Meet the positioner',
        do: 'Select Positioner under Inspect a part.',
        look: 'It compares requested travel with measured travel and adjusts the actuator air.',
        why: 'The signal is a request; actual travel is the result. Lesson 05 shows what happens when they disagree.'
      }
    ],
    friction: [
      {
        title: 'Make small moves',
        do: 'With Stiction selected, press +1% step six times.',
        look: 'Travel holds at 50% for five steps, then jumps to 54.5%, still 1.5 pp short of the command.',
        why: 'Breakaway friction must be overcome before the stem moves. Small corrections are ignored, then the valve jumps.'
      },
      {
        title: 'Sweep and read the signature',
        do: 'Press Run sweep, then view the Response signature.',
        look: 'Travel against command forms a staircase loop instead of following the diagonal.',
        why: 'The loop width shows lost motion plus stick–slip. In a control loop this pattern drives continuous cycling.'
      },
      {
        title: 'Compare backlash',
        do: 'Select Backlash and run the sweep again.',
        look: 'After each reversal travel waits until the command crosses the 6 pp clearance, then follows smoothly with no jumps.',
        why: 'Backlash is clearance in linkages or couplings. It loses motion at reversals but does not stick and slip.'
      },
      {
        title: 'Slow is not sticky',
        do: 'Select Slow response, set Sweep speed (under More settings) to 15 pp/s and run; then repeat at 2 pp/s.',
        look: 'The loop is wide at 15 pp/s and much narrower at 2 pp/s.',
        why: 'Lag depends on speed; friction does not. Testing at two speeds separates the two.'
      }
    ],
    flow: [
      {
        title: 'Open the valve',
        do: 'Move travel from 50% to 75%.',
        look: 'Cv nearly triples (11.3 → 30.1) but flow rises only from 48 to 78 gpm, and valve ΔP falls from 18.1 to 6.7 psi.',
        why: 'More flow means more piping loss, leaving less of the fixed pressure budget across the valve.'
      },
      {
        title: 'Add more piping loss',
        do: 'Raise piping resistance K to 0.015.',
        look: 'At 75% travel flow falls to 39 gpm and the installed curve goes flat above 50%.',
        why: 'When most of the pressure drop is in the piping, opening further adds little flow: the valve has lost authority.'
      },
      {
        title: 'Compare characteristics',
        do: 'Set K back to 0.003, choose Linear, and view Inherent Cv.',
        look: 'Linear Cv rises in equal steps; equal-percentage starts low and climbs steeply.',
        why: 'The characteristic is chosen so the installed response is as even as possible across the operating range.'
      },
      {
        title: 'Oversize the valve',
        do: 'With Linear selected, set rated Cv to 300 and travel to 25%.',
        look: 'Flow is already 89 gpm of a 91 gpm maximum at 25% travel.',
        why: 'An oversized valve controls in a small part of its travel, where friction and resolution matter most.'
      }
    ],
    trim: [
      {
        title: 'Compare valve styles',
        do: 'Select each style and move the travel slider.',
        look: 'A globe plug lifts in a straight line; ball, butterfly and eccentric plugs rotate.',
        why: 'Motion type changes where friction comes from: packing and guides, or shaft bearings, seals and couplings.'
      },
      {
        title: 'Watch cavitation',
        do: 'View the Pressure profile and choose Cavitation.',
        look: 'Pressure dips below the 40 psia vapor line at the restriction, then recovers to 60 psia.',
        why: 'Bubbles form at the low point and collapse as pressure recovers, causing noise, vibration and pitting.'
      },
      {
        title: 'Flashing is different',
        do: 'Choose Flashing.',
        look: 'The outlet stays at 25 psia, below vapor pressure, so vapor continues downstream.',
        why: 'Anti-cavitation trim cannot prevent flashing; outlet conditions decide it. Materials and downstream design matter.'
      },
      {
        title: 'Stage the pressure drop',
        do: 'Choose Staged pressure reduction.',
        look: 'Several smaller drops keep every local minimum above vapor pressure and still reach the 60 psia outlet.',
        why: 'Staging is one way to manage cavitation. Real selection needs the actual service conditions.'
      }
    ],
    positioner: [
      {
        title: 'No feedback',
        do: 'Choose I/P alone, set opposing load to 2 psi, and press Run.',
        look: 'Travel settles near 34% instead of the 50% request while pressure stays at 9 psi.',
        why: 'Without feedback nothing notices the error. An I/P only converts signal to pressure.'
      },
      {
        title: 'Add a positioner',
        do: 'Choose Digital valve controller with the same load and run.',
        look: 'Pressure rises to about 11 psi and travel returns to 50%.',
        why: 'The positioner closes an inner loop on travel and supplies the extra force automatically.'
      },
      {
        title: 'Starve the air',
        do: 'Set supply to 10 psi and request 90% travel.',
        look: 'Pressure stops at the 10 psi supply and travel stalls near 58%; the status warns of the supply limit.',
        why: 'Feedback cannot create force the supply cannot deliver. Check supply and output pressure together.'
      },
      {
        title: 'Too much gain',
        do: 'Restore 22 psi supply, tick Excessive position-loop gain, then press Step to 70%.',
        look: 'Travel hunts between roughly 24% and 100% instead of settling.',
        why: 'An inner loop with too much gain oscillates by itself. Positioner tuning is separate from process tuning.'
      }
    ],
    diagnosis: [
      {
        title: 'Study the evidence',
        do: 'In the Packing case, compare command and actual travel.',
        look: 'Travel holds flat, then jumps, while the command changes smoothly.',
        why: 'That is a stick–slip pattern. Now test the idea against the other traces.'
      },
      {
        title: 'Check the pressure',
        do: 'Switch the view to Pressure.',
        look: 'Pressure keeps changing smoothly while travel holds still.',
        why: 'Force builds until breakaway. In this case the pressure is a command proxy, not a positioner output.'
      },
      {
        title: 'Make a hypothesis',
        do: 'Choose the cause you think fits best.',
        look: 'Feedback says whether it fits; the explanation lists look-alike causes.',
        why: 'A pattern supports a hypothesis. Confirm it with more evidence before acting.'
      },
      {
        title: 'Try another case',
        do: 'Press Next case and repeat: travel, pressure, flow.',
        look: 'Each case changes a different link in the signal-to-flow chain.',
        why: 'Working through all six builds the habit of checking several measurements.'
      }
    ],
    pid: [
      {
        title: 'Run a step test',
        do: 'In Manual, record a steady baseline, then step OP from 50% to 60%.',
        look: 'Measured PV starts moving about 4 s after the step and settles near 60%.',
        why: 'A clean step in Manual shows the process gain, delay and time constant without the controller in the way.'
      },
      {
        title: 'Estimate the model',
        do: 'When PV has settled, press Estimate from record.',
        look: 'Gain ≈ 1.0, time constant ≈ 20 s, delay ≈ 4 s, plus a suggested PI tuning.',
        why: 'These three numbers describe the process well enough to choose a sensible starting tuning.'
      },
      {
        title: 'Apply and test the tuning',
        do: 'Press Use estimate → tuning, switch to Auto, then change SP by 5 pp.',
        look: 'PV settles on the new setpoint smoothly, with little or no overshoot. (Show me restarts at 50% first.)',
        why: 'A model-based starting point gives a predictable response. Fine-tune from there.'
      },
      {
        title: 'Add a sticky valve',
        do: 'Stay in Auto, choose Stiction as the defect, then raise SP by 5 pp.',
        look: 'PV keeps cycling around setpoint, OP becomes a sawtooth, and travel moves in jumps.',
        why: 'Integral action keeps pushing until the valve breaks free, then overshoots. Retuning slows the cycle; fixing the valve stops it.'
      }
    ]
  };
  root.ValveContent = {
    components,
    friction,
    styles,
    trims,
    cases,
    answerOptions,
    glossary,
    sources,
    modules,
    chain,
    roles,
    essentials,
    onTheJob,
    guides
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
