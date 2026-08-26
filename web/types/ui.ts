// * The header tier ladder of the design annex (§13), as a value components can be given.
// * `labelled` is the lg-and-up row, `icon` the md row of icon-only buttons with tooltips, and
// * `bare` the base tier, where the header is glyphs and the build actions live in the mobile
// * action bar. Exactly one tier is on screen at a time, which is what lets two controls at
// * the same tier talk to each other without asking the browser how wide it is.
export type HeaderTier = 'labelled' | 'icon' | 'bare';
