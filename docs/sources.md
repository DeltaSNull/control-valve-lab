# Primary references and topic mapping

Reviewed during the initial build on 2026-10-09/10. These are references for engineering concepts and equipment examples; this app's schematics, descriptions and model constants are original.

| Reference | Topics |
| --- | --- |
| [Emerson Control Valve Handbook, sixth edition](https://www.emerson.com/en/final-control/catalog/products-and-software/valves/control-valves/control-valve-handbook) | Terminology, characteristics, installed response, actuators, valve/trim selection and sizing limits. |
| [DVC6200 manual D103785X012](https://www.emerson.com/is/content/emerson/en/final-control/flow-controls/documents/d103785x012.pdf) | Travel feedback, digital control, I/P, pneumatic relay, travel/pressure modes, characterization, tuning and alerts. Revision/hardware applicability must be checked for actual equipment. |
| [Fisher easy-e ET](https://www.emerson.com/en/final-control/products/fisher-et) | Balanced, cage-guided globe example. |
| [Fisher Vee-Ball V150](https://www.emerson.com/en/final-control/products/fisher-v150) | Segmented-ball example. |
| [Fisher V500](https://www.emerson.com/en/final-control/products/fisher-v500) | Cammed eccentric-plug example and reduced seat contact. |
| [Fisher Cavitrol III](https://www.emerson.com/en/final-control/products/fisher-cavitrol-iii) | Liquid cavitation control and clean-service application limitations. |
| [Fisher Whisper Trim I](https://www.emerson.com/en/final-control/products/fisher-whisper-trim-i) | Gas/vapor/steam aerodynamic noise attenuation. |
| [Emerson flashing guidance](https://www.emerson.com/en/final-control/catalog/products-and-software/valves/control-valves/severe-service-control-valves/valve-flashing) | Flashing persistence, velocity and erosion. |
| [SAMSON valve signature](https://www.samson.de/document/e8389ben.pdf) | Friction/signature interpretation and reference comparison. |
| [Flowserve Logix](https://www.flowserve.com/products/brands/logix/) | Digital-positioner comparison beyond Fisher. |

Manufacturer-specific capabilities are not generalized to all models, protocols, firmware, diagnostic tiers or options. The app does not reproduce proprietary drawings or vendor software screens.

## PID additions (reviewed 2026-10-10)

- [Honeywell AP09-600, §8.14.1, release 650](https://skoge.folk.ntnu.no/puublications_others/apc-papers/honeywell3000-AP09-600.pdf): manufacturer-authored manual hosted at NTNU, PDF pages 239–248. A/B/C term placement, ideal versus interactive form, reverse/direct action, manual initialization and windup. This app declares an ideal teaching implementation; Honeywell product families differ (for example HC900 A/B labels should not be substituted for APM/Experion A/B/C).
- [Skogestad, Simple analytic rules for model reduction and PID controller tuning](https://skoge.folk.ntnu.no/publications/2003/tuningPID/mic-version/mic.pdf): primary paper, corrected MIC version of the 2003 JPC article; SIMC PI equations 23–24 for a FOPDT model. The recorded-crossing fit and numeric rejection thresholds are app teaching choices, not claims of manufacturer-certified tuning.
