# Damnatio: Every Thread Has a Price

*Damnatio: Todo Fio Tem um Preço*

A narrative choice game for the browser, painted like a Greek vase. In an imagined Rome that swallowed Greece, three lives are caught in the Threads of Fate:
- **Lívia**, a Vestal losing her faith;
- **Asterion**, the "monster" of the labyrinth;
- **Théron**, a hero the world has forgotten.

Every important choice ties, cuts or tangles a thread, and every gift has a price.

**Chapter 1** (in development). English and Brazilian Portuguese. Desktop browser, mouse and keyboard.

## Running it
Needs Node 24.

```
npm install
npm run dev        # http://localhost:5173  (F2 = debugger)
npm test           # logic tests + validation of all content
npm run build      # dist/, ready to zip for itch.io
```

## Where things are
| Folder | What |
|---|---|
| `src/` | TypeScript (engine, systems, UI) |
| `content/` | the story as data: chapters, characters, strings (en, pt-BR), audio |
| `assets/` | game-ready art and audio |
| `originais/` | the author's source art and audio |
| `tools/` | art and audio pipelines |
| `docs/` | approved scripts and design notes (Portuguese) |
| `GDD.md` | game design document (Portuguese) |

## Credits
**Music**, found on OpenGameArt.org. Thank you to every artist who shares their work:
- "Mystic Journey" by Tausdei (CC-BY 3.0)
- "Soft Mysterious Harp Loop" by VWolfdog (CC-BY 3.0)
- "Walking with Poseidon" by mvrasseli (CC-BY 3.0)
- "Dark Ambience Loop" by Iwan Gabovitch qubodup.net (CC-BY 3.0)
- "Cave Theme" by Brandon75689 (OGA-BY 3.0 / CC0)
- "Evil Temple Ambiance Loop" by Brandon Morris (OGA-BY 3.0 / CC0)
- "Soundscape - Find Nothing" by Ellary (CC-BY 4.0)
- "Medieval: The Old Tower Inn", "The Bard's Tale", "Minstrel Dance" by RandomMind (CC0)
- "Secret Sanctum" by Viktor Kraus (CC-BY 3.0)
- "Underwater Theme" by Cleyton Kauffman (CC0)
- "Breves dies hominis" by Magdalen Kadel (CC0)
- "Epilogue" by tcarisland (CC-BY 4.0)

Links and full license notes: `MAPA-DE-AUDIO.md`.

**Fonts:** Cinzel and Cormorant Garamond (SIL Open Font License).

**Art:** generated with AI image tools and cleaned up with the project's own scripts.
