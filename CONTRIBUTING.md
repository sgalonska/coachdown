# Contributing to Coachdown

> Full specification: https://github.com/sgalonska/coachdown/blob/main/SPEC.md

Coachdown is young and meant to be shaped by people who actually coach — and by people who build tools for them.

## Ways to contribute

- **Try it in a real session** and open an issue about what slowed you down or what you could not express.
- **Propose a change to the specification.** Open an issue first and describe the situation in a session where you needed it. Pull requests to `SPEC.md` should reference that issue.
- **Contribute examples** — fictional only. Never submit real session notes, not even anonymised: context identifies people.
- **Add aliases** for standard sections in your language (spec §6.2).
- **Build tools**: parsers, editor plugins, converters, growth views. Code is MIT-licensed.

## Principles for changes

1. Nothing may be required during a session that a coach cannot type without looking away from the coachee.
2. Unmarked notes stay valid. A change must never make existing documents mean something else within a major version.
3. Prefer one obvious way over several flexible ones.
4. Every new marker needs a real situation that cannot be expressed with existing markers or sections.

## How changes are made

- Specification changes are recorded in [`CHANGELOG.md`](CHANGELOG.md) under the next version.
- Examples, the writing guide and the README are updated in the same pull request as the specification.
- Every document in this repository starts with a note pointing to the full specification. Please keep it when you add a file.

## License of contributions

By contributing you agree that specification and documentation are licensed under CC BY 4.0 and code under MIT.
