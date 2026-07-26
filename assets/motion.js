/* ==========================================================================
   Minky Homecare - motion
   anime.js v4 (UMD global `anime`).

   Two pieces of motion, both earned:
     1. Hero entrance  - one rehearsed sequence on load.
     2. Heritage stats - the numbers settle when the navy band arrives.
                         This is the focal moment: interpolating a numeric
                         value is the job CSS cannot do, and those numbers
                         are the heritage claim.

   Deliberately absent: scroll reveals on the feature cards, range tiles and
   credential strip. Reinterpreting every section as a staggered list is
   animation debt, and the cards already answer to hover.

   Failure is always safe. The page is fully visible with no JS at all; the
   `js-motion` class that hides the hero's supporting elements is only ever
   added by an inline script in <head>, and is removed again on a 2.5s
   failsafe if this file or the library never arrives.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var lib = window.anime;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Show the final state and leave. Covers: library blocked, reduced motion.
  function stand_down() {
    root.classList.remove('js-motion');
    var stats = document.querySelectorAll('.stat b[data-count]');
    for (var i = 0; i < stats.length; i++) {
      stats[i].textContent = stats[i].getAttribute('data-count') + (stats[i].getAttribute('data-suffix') || '');
    }
  }

  if (!lib || !lib.animate || reduce) { stand_down(); return; }

  var animate = lib.animate;
  var createTimeline = lib.createTimeline;

  try {
    /* --- 1. Hero entrance -------------------------------------------------
       The h1 is the LCP element, so it moves on transform ONLY - it is
       painted at full opacity from the first frame and never gates the
       largest contentful paint behind a fade. The lead and figure may
       fade, because neither is the LCP candidate. */
    var h1 = document.querySelector('.hero h1');
    var lead = document.querySelector('.hero-lead');
    var figure = document.querySelector('.hero-figure');

    if (h1 && lead && figure && createTimeline) {
      createTimeline({ defaults: { duration: 620, ease: 'out(3)' } })
        .add(h1, { translateY: [14, 0] }, 0)
        .add(figure, { opacity: [0, 1], translateY: [18, 0] }, 60)
        .add(lead, { opacity: [0, 1], translateY: [12, 0] }, 140);
    } else {
      root.classList.remove('js-motion');
    }

    /* --- 2. Focal moment: the heritage numbers settle ---------------------
       Triggered with a native IntersectionObserver rather than a scroll
       library: the trigger is a threshold, not a scroll-linked relationship,
       and `once` semantics are one unobserve() call. anime does the part
       that matters - interpolating the value. */
    var stats = document.querySelectorAll('.stat b[data-count]');

    if (stats.length && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          var el = entries[i].target;
          observer.unobserve(el);
          count_up(el);
        }
      }, { threshold: 0.4 });

      for (var j = 0; j < stats.length; j++) {
        // Only pre-zero a number that is still below the fold. If it is
        // already on screen the observer fires on the next frame and the
        // count starts from 0 anyway - and if the observer somehow never
        // fires, the reader is left with the real figure rather than "0".
        if (stats[j].getBoundingClientRect().top > window.innerHeight) {
          stats[j].textContent = '0' + (stats[j].getAttribute('data-suffix') || '');
        }
        observer.observe(stats[j]);
      }
    } else {
      stand_down();
    }

    function count_up(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (!isFinite(target)) { el.textContent = el.getAttribute('data-count') + suffix; return; }

      var proxy = { value: 0 };
      animate(proxy, {
        value: target,
        duration: 1400,
        ease: 'out(4)',
        onUpdate: function () { el.textContent = Math.round(proxy.value) + suffix; },
        onComplete: function () { el.textContent = target + suffix; }
      });
    }
  } catch (err) {
    // An API or easing mistake must never cost the reader the content.
    stand_down();
  }
})();
