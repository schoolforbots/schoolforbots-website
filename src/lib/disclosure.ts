// Smooth opening and closing for <details data-animate> (the FAQ answers and the
// docs sidebar groups). A <details> snaps open and shut by itself; this script
// takes over the summary's click and eases the height between the closed and
// the open size instead. While it closes, the element carries data-closing, so a
// chevron can turn back at once rather than when the animation ends. Without
// script, or with reduced motion, the element opens and closes as usual.

const DURATION_MS = 300
const EASING = 'cubic-bezier(0.33, 1, 0.68, 1)'

const running = new WeakMap<HTMLDetailsElement, Animation>()

// The element's height with it closed, measured without a paint in between.
function closedHeight(details: HTMLDetailsElement): number {
  const wasOpen = details.open
  details.open = false
  const height = details.getBoundingClientRect().height
  details.open = wasOpen
  return height
}

function openHeight(details: HTMLDetailsElement): number {
  const wasOpen = details.open
  details.open = true
  const height = details.getBoundingClientRect().height
  details.open = wasOpen
  return height
}

function toggle(details: HTMLDetailsElement) {
  // Start from wherever a running animation has got to.
  const from = details.getBoundingClientRect().height
  running.get(details)?.cancel()

  const opening = !details.open || details.hasAttribute('data-closing')
  const to = opening ? openHeight(details) : closedHeight(details)

  details.open = true
  details.toggleAttribute('data-closing', !opening)
  details.style.overflow = 'hidden'

  const animation = details.animate({ height: [`${from}px`, `${to}px`] }, { duration: DURATION_MS, easing: EASING })
  running.set(details, animation)
  animation.onfinish = () => {
    running.delete(details)
    details.style.overflow = ''
    if (!opening) {
      details.open = false
      details.removeAttribute('data-closing')
    }
  }
  animation.oncancel = () => {
    details.style.overflow = ''
  }
}

export function animateDisclosures() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  document.addEventListener('click', (event) => {
    if (reduce.matches || event.defaultPrevented || event.button !== 0) return
    if (!(event.target instanceof Element)) return
    const summary = event.target.closest('summary')
    const details = summary?.parentElement
    if (!(details instanceof HTMLDetailsElement) || !details.hasAttribute('data-animate')) return
    if (summary !== details.querySelector(':scope > summary')) return
    // Links inside the summary keep working.
    if (event.target.closest('a') && summary.contains(event.target.closest('a'))) return
    event.preventDefault()
    toggle(details)
  })
}
