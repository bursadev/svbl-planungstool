# tools

`dc2jsx.py` converts the prototype templates in `docs/design-handoff/reference/*.dc.html`
into the generated React views under `web/src/proto/*.view.tsx`:

```
python3 tools/dc2jsx.py "docs/design-handoff/reference/SVBL Planung.dc.html" SvblPlanung out
python3 tools/dc2jsx.py "docs/design-handoff/reference/Einsatzkalender.dc.html" Einsatzkalender out
```

Copy the resulting `*.view.tsx` files into `web/src/proto/` and the `*.css` output into
`web/src/app/globals.css`. The logic class (`web/src/proto/svbl-planung.logic.ts`) is the
prototype's `class Component extends DCLogic`, extracted verbatim.
