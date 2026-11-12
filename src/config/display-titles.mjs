// The large titles set in the heading font: every page title (h1, including the
// hero) and the homepage section titles. The stylesheet (injected by
// starlight/Head.astro), the font subsetting script and the tests all read this
// one selector, so the rule and the cut font cannot drift apart.
export const displayTitleSelector = 'h1, h2[data-display-title]'
