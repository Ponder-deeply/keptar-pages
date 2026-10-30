// Képtár static copy: lazy Instagram embeds and the artist directory filters.
;(function () {
  'use strict'

  // Instagram embeds: the fallback link stays until the post is scrolled near,
  // then the official blockquote + embed.js replaces it (as IgEmbed does live).
  var EMBED_SCRIPT = 'https://www.instagram.com/embed.js'
  var scriptLoading = false

  function processEmbeds() {
    if (window.instgrm) window.instgrm.Embeds.process()
  }

  function embed(el) {
    var permalink = el.getAttribute('data-ig-permalink')
    if (!permalink) return
    var slot = document.createElement('div')
    // Laid out but invisible (static.css) until the iframe is in, then it replaces the fallback.
    slot.className = 'ig-embed__slot ig-embed__slot--loading'
    var quote = document.createElement('blockquote')
    quote.className = 'instagram-media'
    quote.setAttribute('data-instgrm-permalink', permalink)
    quote.setAttribute('data-instgrm-version', '14')
    slot.appendChild(quote)
    el.appendChild(slot)

    // Keep the fallback until embed.js has put its iframe in, so nothing jumps around.
    var fallback = el.querySelector('.ig-embed__fallback')
    var tries = 0
    var poll = setInterval(function () {
      if (slot.querySelector('iframe')) {
        clearInterval(poll)
        if (fallback) fallback.remove()
        slot.classList.remove('ig-embed__slot--loading')
      } else if (++tries > 40) {
        clearInterval(poll)
        slot.remove()
      }
    }, 250)

    if (window.instgrm) return processEmbeds()
    if (scriptLoading) return
    scriptLoading = true
    var script = document.createElement('script')
    script.src = EMBED_SCRIPT
    script.async = true
    // Embeds added while the script was loading are picked up by this first pass.
    script.onload = processEmbeds
    document.body.appendChild(script)
  }

  var embeds = document.querySelectorAll('[data-ig-permalink]')
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return
          observer.unobserve(entry.target)
          embed(entry.target)
        })
      },
      { rootMargin: '400px 0px' },
    )
    embeds.forEach(function (el) {
      observer.observe(el)
    })
  } else {
    embeds.forEach(embed)
  }

  // Directory filters: text search, medium and region, matched against data attributes.
  var form = document.querySelector('[data-artist-filters]')
  if (!form) return
  var items = document.querySelectorAll('[data-artist]')
  var sections = document.querySelectorAll('[data-artist-section]')
  var empty = document.querySelector('[data-artist-empty]')
  form.hidden = false

  function value(name) {
    var field = form.elements[name]
    return field ? field.value.trim().toLowerCase() : ''
  }

  function applyFilters() {
    var q = value('q')
    var medium = form.elements.medium ? form.elements.medium.value : ''
    var region = form.elements.region ? form.elements.region.value : ''
    var shown = 0
    items.forEach(function (item) {
      var mediums = (item.getAttribute('data-medium') || '').split('|')
      var match =
        (!q || (item.getAttribute('data-search') || '').indexOf(q) !== -1) &&
        (!medium || mediums.indexOf(medium) !== -1) &&
        (!region || item.getAttribute('data-region') === region)
      item.hidden = !match
      if (match) shown++
    })
    sections.forEach(function (section) {
      section.hidden = !section.querySelector('[data-artist]:not([hidden])')
    })
    if (empty) empty.hidden = shown > 0
  }

  form.addEventListener('input', applyFilters)
  form.addEventListener('submit', function (event) {
    event.preventDefault()
  })
})()
