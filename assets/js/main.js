/* TripM8 — progressive enhancement only; the page works without JS. */
(function () {
  'use strict';

  /* ---- Footer year -------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---- Header shadow on scroll -------------------------------------- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile menu --------------------------------------------------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('primaryNav');
  if (toggle && header && nav) {
    var setOpen = function (open) {
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    toggle.addEventListener('click', function () {
      setOpen(!header.classList.contains('is-open'));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ---- Active nav link while scrolling ------------------------------- */
  var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---- Waitlist form -------------------------------------------------- */
  var wlForm = document.getElementById('waitlistForm');
  var wlMsg = document.getElementById('waitlistMsg');

  if (wlForm && wlMsg && window.fetch) {
    var email = wlForm.querySelector('#wl-email');

    var say = function (text, ok) {
      wlMsg.textContent = text;
      wlMsg.className = 'wl__msg ' + (ok ? 'is-ok' : 'is-err');
      wlMsg.hidden = false;
    };

    email.addEventListener('input', function () {
      email.removeAttribute('aria-invalid');
      wlMsg.hidden = true;   // don't leave a stale error sitting under the form
    });

    wlForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!email.value.trim() || !email.checkValidity()) {
        email.setAttribute('aria-invalid', 'true');
        email.focus();
        say('Please enter a valid email address.', false);
        return;
      }

      var button = wlForm.querySelector('button[type="submit"]');
      button.disabled = true;
      wlMsg.hidden = true;

      fetch(wlForm.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(wlForm)
      })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (r) {
          if (!r.ok || !r.data.ok) {
            throw new Error((r.data && r.data.error) || 'That did not go through.');
          }
          wlForm.classList.add('is-done');
          say(r.data.message || "You're on the list.", true);
        })
        .catch(function (err) {
          button.disabled = false;
          say(err.message || 'That did not go through. Please try again.', false);
        });
    });
  }

  /* ---- Reveal on scroll ---------------------------------------------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reveals.length) return;

  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry, i) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.style.transitionDelay = Math.min(i * 70, 280) + 'ms';
      el.classList.add('is-in');
      observer.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  reveals.forEach(function (el) { io.observe(el); });
})();
