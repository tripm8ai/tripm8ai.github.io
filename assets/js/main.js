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

  /* ---- Waitlist survey ------------------------------------------------- */
  var wlForm = document.getElementById('waitlistForm');
  var wlMsg = document.getElementById('waitlistMsg');

  if (wlForm && wlMsg && window.fetch) {
    var steps = Array.prototype.slice.call(wlForm.querySelectorAll('.wl__step'));
    var crumbs = Array.prototype.slice.call(document.querySelectorAll('#waitlistSteps li'));
    var back = document.getElementById('wlBack');
    var next = document.getElementById('wlNext');
    var stepField = document.getElementById('wl-step');
    var ridField = document.getElementById('wl-rid');
    var email = document.getElementById('wl-email');
    var current = 1;

    // Identifies this response across its three saves. Not a user identifier:
    // it is minted per visit and never reused.
    ridField.value =
      (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : 'r-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);

    var say = function (text, ok) {
      wlMsg.textContent = text;
      wlMsg.className = 'wl__msg ' + (ok ? 'is-ok' : 'is-err');
      wlMsg.hidden = false;
    };

    var show = function (n) {
      current = n;
      steps.forEach(function (el) {
        el.hidden = Number(el.getAttribute('data-step')) !== n;
      });
      crumbs.forEach(function (li, i) {
        li.classList.toggle('is-done', i + 1 < n);
        if (i + 1 === n) li.setAttribute('aria-current', 'step');
        else li.removeAttribute('aria-current');
      });
      back.hidden = n === 1;
      next.innerHTML = n === 3
        ? 'Join the Waitlist <span class="arw">&rarr;</span>'
        : 'Next <span class="arw">&rarr;</span>';
      stepField.value = String(n);
      wlMsg.hidden = true;
    };

    // Only the fields belonging to the step being saved, so a later step never
    // sends blanks that would overwrite earlier answers.
    var payload = function (n) {
      var data = new FormData();
      data.append('response_id', ridField.value);
      data.append('step', String(n));
      var scope = steps[n - 1];
      Array.prototype.forEach.call(scope.querySelectorAll('input'), function (input) {
        if ((input.type === 'radio' || input.type === 'checkbox') && !input.checked) return;
        if (!input.value) return;
        data.append(input.name, input.value);
      });
      return data;
    };

    var save = function (n) {
      return fetch(wlForm.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: payload(n)
      }).then(function (res) {
        return res.json().then(function (body) {
          if (!res.ok || !body.ok) throw new Error(body.error || 'That did not go through.');
          return body;
        });
      });
    };

    steps.forEach(function (el) { el.hidden = true; });
    document.getElementById('waitlistSteps').hidden = false;
    show(1);

    email.addEventListener('input', function () {
      email.removeAttribute('aria-invalid');
      wlMsg.hidden = true;
    });

    back.addEventListener('click', function () {
      if (current > 1) show(current - 1);
    });

    wlForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (current === 3 && (!email.value.trim() || !email.checkValidity())) {
        email.setAttribute('aria-invalid', 'true');
        email.focus();
        say('Please enter a valid email address.', false);
        return;
      }

      var target = current;
      next.disabled = true;

      save(target)
        .then(function (body) {
          next.disabled = false;
          if (body.done) {
            wlForm.classList.add('is-done');
            say(body.message || "You're on the list.", true);
          } else {
            show(target + 1);
          }
        })
        .catch(function (err) {
          next.disabled = false;
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
