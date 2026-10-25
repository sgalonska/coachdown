# AI notation: open questions (todos)

Context: could a listening AI write Coachdown notation live, and where would it struggle? Parked as todos, no spec change decided. Spec is at 0.2.1.

## Todos

- [ ] **Provenance of markers.** A human `!!` means "the coachee realised something"; an AI `!!` is a guess, but looks identical. The spec only labels generated material per section (`[AI]`, SPEC 8.2), and confidence exists only in parser output. Decide: AI participant tag, inline label, or both.
- [ ] **Insights are recognised late.** The realisation often shows only after pauses or several lines. Live AI either over-marks or edits earlier lines, which conflicts with an append-only log. Decide how a live writer may revise.
- [ ] **`!!` in machine-written text (low priority).** A single `!` stays plain text, and human writers rarely end a line with `!!` by accident, so no notation change is needed. It only matters for ASR or LLM text, which may end lines with emphatic `!!`. Decide whether AI writers are told never to end a line with `!!` unless it is an insight, and whether the parser flags it.
- [ ] **Quotes promise exactness.** `"..."` means the exact words, which ASR cannot guarantee. Decide when an AI may use quotes. Probably no full transcripts; notes stay selective (also the privacy point).
- [ ] **Indentation as "answer to the line above".** Needs judgement on tangents and interruptions; likely the biggest source of wrong links.
- [ ] **Decisions, experiments, reviews.** `=` and `- [ ]` need commitment vs musing; reviews need earlier sessions in context to link to the original experiment.
- [ ] **Coachee questions need an explicit tag** (`M:`), since an unmarked question is read as the coach's. Audio has no punctuation, so this must be explicit every time.
- [ ] **"Writing for AI listeners" guidance.** Possible spec section: tag speakers explicitly, mark only insights the coachee voiced, never write `!!` in running text. Not drafted.

Related roadmap item: "Agent prompt for inferring unmarked attribution".
