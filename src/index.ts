interface ConjugationSet {
  yo: string[]
  tú: string[]
  "él/ella/usted": string[]
  nosotros: string[]
  vosotros: string[]
  "ellos/ellas/ustedes": string[]
}

interface ImperativeConjugationSet {
  tú: string[]
  usted: string[]
  nosotros: string[]
  vosotros: string[]
  ustedes: string[]
}

interface Indicativo {
  presente: ConjugationSet
  preterito: ConjugationSet
  imperfecto: ConjugationSet
  futuro: ConjugationSet
  condicional: ConjugationSet
}

interface Perfecto {
  presente: ConjugationSet
  preterito: ConjugationSet
  pasado: ConjugationSet
  futuro: ConjugationSet
  condicional: ConjugationSet
}

interface Progresivo {
  presente: ConjugationSet
  preterito: ConjugationSet
  imperfecto: ConjugationSet
  futuro: ConjugationSet
  condicional: ConjugationSet
}

interface Subjuntivo {
  presente: ConjugationSet
  imperfecto: ConjugationSet
  imperfecto2: ConjugationSet
  futuro: ConjugationSet
}

interface PerfectoSubjuntivo {
  presente: ConjugationSet
  pasado: ConjugationSet
  futuro: ConjugationSet
}

interface Imperativo {
  afirmativo: ImperativeConjugationSet
  negativo: ImperativeConjugationSet
}

interface Verb {
  verbo: string
  indicativo: Indicativo
  perfecto: Perfecto
  progresivo: Progresivo
  subjuntivo: Subjuntivo
  perfecto_subjuntivo: PerfectoSubjuntivo
  imperativo: Imperativo
}

const hablar: Verb = {
  verbo: "hablar",
  indicativo: {
    presente: {
      yo: ["hablo"],
      tú: ["hablas"],
      "él/ella/usted": ["habla"],
      nosotros: ["hablamos"],
      vosotros: ["habláis"],
      "ellos/ellas/ustedes": ["hablan"],
    },
    preterito: {
      yo: ["hablé"],
      tú: ["hablaste"],
      "él/ella/usted": ["habló"],
      nosotros: ["hablamos"],
      vosotros: ["hablasteis"],
      "ellos/ellas/ustedes": ["hablaron"],
    },
    imperfecto: {
      yo: ["hablaba"],
      tú: ["hablabas"],
      "él/ella/usted": ["hablaba"],
      nosotros: ["hablábamos"],
      vosotros: ["hablabais"],
      "ellos/ellas/ustedes": ["hablaban"],
    },
    futuro: {
      yo: ["hablaré"],
      tú: ["hablarás"],
      "él/ella/usted": ["hablará"],
      nosotros: ["hablaremos"],
      vosotros: ["hablaréis"],
      "ellos/ellas/ustedes": ["hablarán"],
    },
    condicional: {
      yo: ["hablaría"],
      tú: ["hablarías"],
      "él/ella/usted": ["hablaría"],
      nosotros: ["hablaríamos"],
      vosotros: ["hablaríais"],
      "ellos/ellas/ustedes": ["hablarían"],
    },
  },
  perfecto: {
    presente: {
      yo: ["he hablado"],
      tú: ["has hablado"],
      "él/ella/usted": ["ha hablado"],
      nosotros: ["hemos hablado"],
      vosotros: ["habéis hablado"],
      "ellos/ellas/ustedes": ["han hablado"],
    },
    preterito: {
      yo: ["hube hablado"],
      tú: ["hubiste hablado"],
      "él/ella/usted": ["hubo hablado"],
      nosotros: ["hubimos hablado"],
      vosotros: ["hubisteis hablado"],
      "ellos/ellas/ustedes": ["hubieron hablado"],
    },
    pasado: {
      yo: ["había hablado"],
      tú: ["habías hablado"],
      "él/ella/usted": ["había hablado"],
      nosotros: ["habíamos hablado"],
      vosotros: ["habíais hablado"],
      "ellos/ellas/ustedes": ["habían hablado"],
    },
    futuro: {
      yo: ["habré hablado"],
      tú: ["habrás hablado"],
      "él/ella/usted": ["habrá hablado"],
      nosotros: ["habremos hablado"],
      vosotros: ["habréis hablado"],
      "ellos/ellas/ustedes": ["habrán hablado"],
    },
    condicional: {
      yo: ["habría hablado"],
      tú: ["habrías hablado"],
      "él/ella/usted": ["habría hablado"],
      nosotros: ["habríamos hablado"],
      vosotros: ["habríais hablado"],
      "ellos/ellas/ustedes": ["habrían hablado"],
    },
  },
  progresivo: {
    presente: {
      yo: ["estoy hablando"],
      tú: ["estás hablando"],
      "él/ella/usted": ["está hablando"],
      nosotros: ["estamos hablando"],
      vosotros: ["estáis hablando"],
      "ellos/ellas/ustedes": ["están hablando"],
    },
    preterito: {
      yo: ["estuve hablando"],
      tú: ["estuviste hablando"],
      "él/ella/usted": ["estuvo hablando"],
      nosotros: ["estuvimos hablando"],
      vosotros: ["estuvisteis hablando"],
      "ellos/ellas/ustedes": ["estuvieron hablando"],
    },
    imperfecto: {
      yo: ["estaba hablando"],
      tú: ["estabas hablando"],
      "él/ella/usted": ["estaba hablando"],
      nosotros: ["estábamos hablando"],
      vosotros: ["estabais hablando"],
      "ellos/ellas/ustedes": ["estaban hablando"],
    },
    futuro: {
      yo: ["estaré hablando"],
      tú: ["estarás hablando"],
      "él/ella/usted": ["estará hablando"],
      nosotros: ["estaremos hablando"],
      vosotros: ["estaréis hablando"],
      "ellos/ellas/ustedes": ["estarán hablando"],
    },
    condicional: {
      yo: ["estaría hablando"],
      tú: ["estarías hablando"],
      "él/ella/usted": ["estaría hablando"],
      nosotros: ["estaríamos hablando"],
      vosotros: ["estaríais hablando"],
      "ellos/ellas/ustedes": ["estarían hablando"],
    },
  },
  subjuntivo: {
    presente: {
      yo: ["hable"],
      tú: ["hables"],
      "él/ella/usted": ["hable"],
      nosotros: ["hablemos"],
      vosotros: ["habléis"],
      "ellos/ellas/ustedes": ["hablen"],
    },
    imperfecto: {
      yo: ["hablara"],
      tú: ["hablaras"],
      "él/ella/usted": ["hablara"],
      nosotros: ["habláramos"],
      vosotros: ["hablarais"],
      "ellos/ellas/ustedes": ["hablaran"],
    },
    imperfecto2: {
      yo: ["hablase"],
      tú: ["hablases"],
      "él/ella/usted": ["hablase"],
      nosotros: ["hablásemos"],
      vosotros: ["hablaseis"],
      "ellos/ellas/ustedes": ["hablasen"],
    },
    futuro: {
      yo: ["hablare"],
      tú: ["hablares"],
      "él/ella/usted": ["hablare"],
      nosotros: ["habláremos"],
      vosotros: ["hablareis"],
      "ellos/ellas/ustedes": ["hablaren"],
    },
  },
  perfecto_subjuntivo: {
    presente: {
      yo: ["haya hablado"],
      tú: ["hayas hablado"],
      "él/ella/usted": ["haya hablado"],
      nosotros: ["hayamos hablado"],
      vosotros: ["hayáis hablado"],
      "ellos/ellas/ustedes": ["hayan hablado"],
    },
    pasado: {
      yo: ["hubiera hablado", "hubiese hablado"],
      tú: ["hubieras hablado", "hubieses hablado"],
      "él/ella/usted": ["hubiera hablado", "hubiese hablado"],
      nosotros: ["hubiéramos hablado", "hubiésemos hablado"],
      vosotros: ["hubierais hablado", "hubieseis hablado"],
      "ellos/ellas/ustedes": ["hubieran hablado", "hubiesen hablado"],
    },
    futuro: {
      yo: ["hubiere hablado"],
      tú: ["hubieres hablado"],
      "él/ella/usted": ["hubiere hablado"],
      nosotros: ["hubiéremos hablado"],
      vosotros: ["hubiereis hablado"],
      "ellos/ellas/ustedes": ["hubieren hablado"],
    },
  },
  imperativo: {
    afirmativo: {
      tú: ["habla"],
      usted: ["hable"],
      nosotros: ["hablemos"],
      vosotros: ["hablad"],
      ustedes: ["hablen"],
    },
    negativo: {
      tú: ["no hables"],
      usted: ["no hable"],
      nosotros: ["no hablemos"],
      vosotros: ["no habléis"],
      ustedes: ["no hablen"],
    },
  },
}

// Example usage
const presentYo = hablar.indicativo.presente.yo[0]

console.log(`Verbo: ${hablar.verbo}`)
console.log(`Presente de indicativo, yo: ${presentYo}`)
console.log(`Futuro perfecto, yo: ${hablar.perfecto.futuro.yo[0]}`)
console.log(`Imperativo afirmativo, tú: ${hablar.imperativo.afirmativo.tú[0]}`)
