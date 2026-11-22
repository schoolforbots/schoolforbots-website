// Keeps a glossary term's card (lib/glossary/hast-terms.mjs) clear of the docs
// sidebar and the window's edge. The card is centred over its word; for a word
// near the left of the text column it would slide under the sidebar, and near
// the right it would run off the window. Just before it shows, this measures it
// and sets --term-shift, which the stylesheet adds to the centring. On narrow
// screens the card sits along the bottom of the screen and needs no shift.

const MARGIN = 8

function place(term: HTMLElement) {
  const tip = term.querySelector<HTMLElement>('.term-tip')
  if (!tip || getComputedStyle(tip).position === 'fixed') return
  tip.style.setProperty('--term-shift', '0px')
  const box = tip.getBoundingClientRect()
  const column = term.closest('.sl-markdown-content')?.getBoundingClientRect()
  const left = Math.max(column?.left ?? 0, MARGIN)
  const right = document.documentElement.clientWidth - MARGIN
  let shift = 0
  if (box.left < left) shift = left - box.left
  else if (box.right > right) shift = right - box.right
  tip.style.setProperty('--term-shift', `${Math.round(shift)}px`)
}

export function keepTermCardsInView() {
  const onEnter = (event: Event) => {
    if (!(event.target instanceof Element)) return
    const term = event.target.closest<HTMLElement>('a.term')
    if (term) place(term)
  }
  document.addEventListener('pointerover', onEnter)
  document.addEventListener('focusin', onEnter)
}
