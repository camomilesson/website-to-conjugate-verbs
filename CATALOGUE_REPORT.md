# Catalogue release review — catalogue-1

Prepared 5 November 2026. Owner approved and deployed; review is not a native-speaker certification.

100 static verb files cover all 16 supported categories, 94 category/person cells
per verb: **9,400 cells**. See README.md for the supported tense inventory.
Imperfect subjunctive accepts both -ra and -se; reflexive progressive accepts both
pronoun placements; ir/irse commands include their documented alternatives.
Grammatical coverage does not imply every construction is equally natural in context.

## Selection

Common is a curated 25-verb starting set, not a statistical frequency ranking:

hablar, comer, vivir, ser, ir, tener, trabajar, llevar, pasar, llegar, pensar, encontrar, deber, estar, quedar, hacer, decir, poder, querer, saber, ver, dar, poner, venir, salir.

Full catalogue (100):

abrir, acostarse, aprender, ayudar, beber, buscar, caer, caminar, cocinar, comenzar, comer, comprar, comprender, conducir, conocer, conseguir, contar, correr, creer, dar, deber, decidir, decir, dejar, despertarse, disfrutar, dormir, ducharse, empezar, encontrar, entender, entrar, escoger, escribir, escuchar, esperar, estar, estudiar, existir, explicar, ganar, hablar, hacer, ir, irse, jugar, lavarse, leer, levantarse, llamar, llamarse, llegar, llevar, mantener, mirar, morir, necesitar, ocurrir, ofrecer, pagar, parecer, pasar, pedir, pensar, perder, permitir, poder, poner, preferir, preguntar, quedar, quedarse, querer, recibir, recordar, responder, romper, saber, sacar, salir, seguir, sentarse, sentir, ser, servir, subir, tener, terminar, tocar, tomar, trabajar, traer, usar, vender, venir, ver, vestirse, viajar, vivir, volver.

## Provenance and checks

The assistant authored these JSON files during development, as requested. No
third-party dataset, runtime AI, or conjugation generator is needed in production.
Static JSON is canonical. Review covered regular paradigms, stem/spelling changes,
irregular simple forms and future stems, participles/gerunds, derived families,
and ten reflexive verbs. Explicit regression anchors cover these cases, including
vestíos, mantén, condujeron, and yéndome. Review caught and corrected attached-gerund
accent errors. Automated structural checks validate every cell and manifest;
choice tests exercise all 9,400 cells with same-person distractors under three
shuffles. These checks cannot independently prove every Spanish answer correct.
Please flag linguistic corrections during use; edit the affected canonical file,
update the dataset version consistently, and run the catalogue checks.

References for grammatical models, not copied datasets:

- [RAE conjugation appendix](https://www.rae.es/diccionario-estudiante/docs/conjugaciones-verbales.pdf).
- [RAE on irse imperatives](https://www.rae.es/gram%C3%A1tica/docs/%C2%ABiros%C2%BB%20imperativo.pdf).
- [Fundéu: idos/iros](https://www.fundeu.es/recomendacion/idos-mejor-que-iros/).

## Size and loading

The 100 verb files total **403,298 bytes** uncompressed (about 394 KiB), roughly
73 KB when individually gzip-compressed. Formatting and future corrections can
change this slightly. A local filesystem read/JSON parse pass took about 4 ms;
this is a development-machine measurement, not an internet latency claim.
The manifest loads separately; practice fetches the selected verbs in parallel
and validates their version and coverage before starting. All-verbs typing was
confirmed in the browser; choice uses the same full catalogue as its distractor
pool. Errors are surfaced rather than producing missing-answer questions.
The full dataset stays out of the JavaScript bundle. Runtime caches last only
for the page lifetime; no offline installation or persistent data cache is added.
