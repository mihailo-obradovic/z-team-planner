# Brand Description

Reference sample for a fictional project — **Roster**, the community sports-club membership app, one of three tools the fictional **Meridian Sports Association** publishes for its affiliated clubs alongside Fixtures and the public Club Finder. Not a real project; illustrative only. Roster keeps this file because the brand is the Association's and not Roster's: a volunteer moving between the three tools must not notice the seam. A standalone app keeps no such file — its own design system is its whole brand (`references/context-documents.md`). A context document records design intent, not behavior; it is never a contract.

## Voice And Tone

- Voice: plain, warm, volunteer-facing. The reader is a parent who took on the club secretary's job for a season, not an operator. Second person, no jargon, no exclamation marks.
- The Association's words stay the Association's: club, member, season, affiliation. Never "user", "account holder", or "org".
- Tone shifts: an error says what happened and the one thing to do next, never blaming the person ("That email is already on the roster — sign in instead"). Empty states invite the first action instead of apologising. Success is a quiet confirmation — keeping a roster is chores, and celebrating it reads as mockery.

## Visual Language

- Calm and spacious over dense: this is read one-handed on a phone in a clubhouse corridor. Generous line height, few columns, one thing per row.
- The Association palette leads and carries structure and state, never decoration; a club's own colours are content, shown inside the page, never as chrome.
- Rounded and low-contrast in elevation. Motion is functional — state changes and transitions, never entrances.
- Photography of real club life over illustration or sports iconography; never stock action shots of professional athletes.
- Body type never below the platform default: a large share of the membership is over 50.

## UX Principles

- Show state, never hide it — pending verification, a lapsed membership, an unsaved edit are visible where they are acted on.
- One primary action per view. Destructive admin actions confirm, and say what is lost.
- Forgiving over strict: correctable input over formats the volunteer has to guess.
- Organised by capability, never by account type — an admin sees more inside the same screens a member uses, never a parallel admin app.
- Phone width is the design width; the desktop layout is the one that adapts.

## Do / Don't

| Do                                                      | Don't                                                          |
| ------------------------------------------------------- | -------------------------------------------------------------- |
| Use the Association's vocabulary — club, member, season | Rename per screen: directory, organisation, contact            |
| Keep the Association mark in the header of every tool   | Give Roster its own logo or accent so it feels like a product  |
| State the consequence before a removal                  | Lean on an undo that the notification email has already outrun |
| Reuse the shared component look across the three tools  | Restyle a control because this one screen "needs" it           |
| Let a club's colours appear in content                  | Theme the interface per club                                   |

## References

- `<Association brand guide, internal>`: mark, palette, clear space, and the club-colour rule — binding; this file only summarises it.
- `<Fixtures, the sibling tool>`: header, empty-state, and confirmation patterns to reuse verbatim rather than redesign.
- `<any professional-league app>`: the feel to avoid — dark, dense, stat-first; the wrong audience for volunteers.
