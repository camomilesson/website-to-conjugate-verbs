# Answer checking modlet

Public functions and `AccentPolicy` are in `index.ts`. Pure string matching has
no React, network, or persistence dependency. Normalise NFC Unicode, surrounding
and repeated whitespace, and Spanish letter case. Strict preserves accents;
relaxed folds acute vowels, ñ → n, and ü → u as explicitly agreed. No fuzzy
spelling, punctuation stripping, or subject/reflexive-pronoun omission.

Match against every accepted alternative. Always display the original answer
forms from the catalogue, even when a folded response is accepted. Empty input
is never correct. Tests include ñ/ü fixtures beyond the starter verb catalogue.
