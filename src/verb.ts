export interface ConjugationSet {
  yo: string[]
  tú: string[]
  "él/ella/usted": string[]
  nosotros: string[]
  vosotros: string[]
  "ellos/ellas/ustedes": string[]
}

export interface ImperativeConjugationSet {
  tú: string[]
  usted: string[]
  nosotros: string[]
  vosotros: string[]
  ustedes: string[]
}

export interface Indicativo {
  presente: ConjugationSet
  preterito: ConjugationSet
  imperfecto: ConjugationSet
  futuro: ConjugationSet
  condicional: ConjugationSet
}

export interface Perfecto {
  presente: ConjugationSet
  preterito: ConjugationSet
  pasado: ConjugationSet
  futuro: ConjugationSet
  condicional: ConjugationSet
}

export interface Progresivo {
  presente: ConjugationSet
  preterito: ConjugationSet
  imperfecto: ConjugationSet
  futuro: ConjugationSet
  condicional: ConjugationSet
}

export interface Subjuntivo {
  presente: ConjugationSet
  imperfecto: ConjugationSet
  imperfecto2: ConjugationSet
  futuro: ConjugationSet
}

export interface PerfectoSubjuntivo {
  presente: ConjugationSet
  pasado: ConjugationSet
  futuro: ConjugationSet
}

export interface Imperativo {
  afirmativo: ImperativeConjugationSet
  negativo: ImperativeConjugationSet
}

export interface Verb {
  verbo: string
  meaning?: string
  indicativo: Indicativo
  perfecto: Perfecto
  progresivo: Progresivo
  subjuntivo: Subjuntivo
  perfecto_subjuntivo: PerfectoSubjuntivo
  imperativo: Imperativo
}
