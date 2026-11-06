import type { CategoryId } from "../verb-catalogue/index.ts"
export interface TenseHelp {
  title: string
  meaning: string
  example: string
  formation?: string
}
// Short learning cues, not exhaustive grammar definitions. Examples stay English-only.
export const TENSE_HELP: Record<CategoryId, TenseHelp> = {
  "indicative.present": {
    title: "Present",
    meaning:
      "Current states, habits and general truths. It can also describe scheduled future events.",
    example: "I walk to work every day.",
  },
  "indicative.preterite": {
    title: "Preterite",
    meaning: "A completed action or event in the past, viewed as a whole.",
    example: "Yesterday, I bought bread.",
  },
  "indicative.imperfect": {
    title: "Imperfect",
    meaning:
      "Past habits, descriptions or actions in progress, without focusing on their beginning or end.",
    example: "When I was a child, I walked to school.",
  },
  "indicative.future": {
    title: "Future",
    meaning:
      "Future actions or predictions. It can also express a guess about the present.",
    example: "Tomorrow, we will visit the museum.",
  },
  "indicative.conditional": {
    title: "Conditional",
    meaning:
      "Hypothetical actions or a future viewed from the past. It is also used for polite requests.",
    example: "I would travel more if I had time.",
  },
  "indicative.present-perfect": {
    title: "Present perfect",
    meaning:
      "A past action connected to the present. Its use varies across Spanish-speaking regions.",
    example: "I have already finished my work.",
    formation: "haber in the present indicative + past participle",
  },
  "indicative.pluperfect": {
    title: "Past perfect",
    meaning: "An action completed before another past action.",
    example: "I had eaten before they arrived.",
    formation: "haber in the imperfect indicative + past participle",
  },
  "indicative.future-perfect": {
    title: "Future perfect",
    meaning:
      "An action that will be complete before a future reference point. It can also express a guess about the past.",
    example: "By Friday, I will have finished the project.",
    formation: "haber in the future indicative + past participle",
  },
  "indicative.conditional-perfect": {
    title: "Conditional perfect",
    meaning:
      "An action that would have happened under different circumstances, or a future completion viewed from the past.",
    example: "I would have gone if I had known.",
    formation: "haber in the conditional + past participle",
  },
  "subjunctive.present": {
    title: "Present subjunctive",
    meaning:
      "Present or future wishes, doubts, evaluations and other contexts requiring the subjunctive.",
    example: "I hope that she arrives soon.",
  },
  "subjunctive.imperfect": {
    title: "Imperfect subjunctive",
    meaning:
      "Past-framed wishes or doubts, and hypothetical situations. Both -ra and -se variants are accepted here.",
    example: "If I had more time, I would travel.",
  },
  "subjunctive.present-perfect": {
    title: "Present perfect subjunctive",
    meaning:
      "A completed action connected to the present or future in a context requiring the subjunctive.",
    example: "I am glad that you have arrived.",
    formation: "haber in the present subjunctive + past participle",
  },
  "subjunctive.pluperfect": {
    title: "Past perfect subjunctive",
    meaning:
      "An action before a past reference point in a subjunctive context, including unreal past conditions.",
    example: "If I had known, I would have helped.",
    formation:
      "haber in the imperfect subjunctive + past participle; both -ra and -se variants are accepted",
  },
  "imperative.affirmative": {
    title: "Affirmative imperative",
    meaning:
      "Direct instructions, requests or advice telling someone to do something.",
    example: "Open the window, please.",
  },
  "imperative.negative": {
    title: "Negative imperative",
    meaning:
      "Instructions, requests or advice telling someone not to do something. Include no in your answer.",
    example: "Do not open the window.",
  },
  "progressive.present": {
    title: "Present progressive",
    meaning:
      "An action in progress at the present moment. It does not replace the simple present for every habit or state.",
    example: "I am reading right now.",
    formation:
      "estar in the present indicative + gerund (the Spanish -ando/-iendo form)",
  },
}
