/* Caryn Walker — shared behaviour (rides on top of Bootstrap's JS bundle) */
(function(){
  'use strict';

  /* ---- year stamp ---- */
  document.querySelectorAll('[data-year]').forEach(function(el){
    el.textContent = new Date().getFullYear();
  });

  /* ---- reveal on scroll ---- */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold:0.12, rootMargin:'0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  /* ---- booking / enquiry modal ---- */
  var bookingEl = document.getElementById('bookingModal');
  if(bookingEl){
    var titleEl   = bookingEl.querySelector('[data-book-title]');
    var kickerEl  = bookingEl.querySelector('[data-book-kicker]');
    var formEl    = bookingEl.querySelector('form');
    var doneEl    = bookingEl.querySelector('.modal-done');
    var serviceIn = bookingEl.querySelector('[name="service"]');

    // prefill from the trigger button's data-* attributes
    bookingEl.addEventListener('show.bs.modal', function(ev){
      var t = ev.relatedTarget;
      if(formEl){ formEl.classList.remove('d-none'); clearErrors(); }
      if(doneEl){ doneEl.classList.add('d-none'); }
      if(!t) return;
      var kicker  = t.getAttribute('data-kicker');
      var title   = t.getAttribute('data-title');
      var service = t.getAttribute('data-service');
      if(kicker && kickerEl) kickerEl.textContent = kicker;
      if(title && titleEl)   titleEl.textContent  = title;
      if(service && serviceIn) serviceIn.value     = service;
      // highlight matching chip if present
      bookingEl.querySelectorAll('.chip').forEach(function(c){
        c.classList.toggle('sel', service && c.getAttribute('data-val') === service);
      });
    });

    // chip toggles
    bookingEl.querySelectorAll('.chip-group').forEach(function(group){
      group.addEventListener('click', function(e){
        var chip = e.target.closest('.chip'); if(!chip) return;
        if(group.hasAttribute('data-multi')){
          chip.classList.toggle('sel');
        } else {
          group.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('sel'); });
          chip.classList.add('sel');
        }
        var hidden = group.nextElementSibling;
        if(!hidden || hidden.type !== 'hidden'){ hidden = group.parentElement.querySelector('input[type="hidden"]'); }
        if(hidden){
          hidden.value = Array.from(group.querySelectorAll('.chip.sel'))
            .map(function(c){ return c.getAttribute('data-val'); }).join(', ');
        }
      });
    });

    // ---- validation + error helpers ----
    function clearErrors(){
      formEl.querySelectorAll('.is-invalid').forEach(function(el){ el.classList.remove('is-invalid'); });
      formEl.querySelectorAll('.field-error').forEach(function(el){ el.remove(); });
      var box = formEl.querySelector('.form-alert');
      if(box) box.remove();
    }
    function fieldError(name, msg){
      var input = formEl.querySelector('[name="'+name+'"]');
      if(!input) return false;
      input.classList.add('is-invalid');
      var note = document.createElement('p');
      note.className = 'field-error';
      note.textContent = msg;
      input.insertAdjacentElement('afterend', note);
      return true;
    }
    function formAlert(msg){
      var box = document.createElement('div');
      box.className = 'form-alert';
      box.setAttribute('role','alert');
      box.textContent = msg;
      formEl.insertBefore(box, formEl.firstChild);
      // pull it into view — the modal scrolls, and the submit button sits well below
      var scroller = bookingEl.scrollHeight > bookingEl.clientHeight ? bookingEl : bookingEl.querySelector('.modal-body');
      if(scroller){ scroller.scrollTop = 0; }
      return box;
    }
    function validate(){
      var ok = true;
      var nameEl  = formEl.querySelector('[name="name"]');
      var emailEl = formEl.querySelector('[name="email"]');
      if(nameEl && !nameEl.value.trim()){ fieldError('name', 'Please tell Caryn your name.'); ok = false; }
      if(emailEl){
        var v = emailEl.value.trim();
        if(!v){ fieldError('email', 'Please add an email so Caryn can reply.'); ok = false; }
        else if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)){ fieldError('email', 'That email address doesn\u2019t look quite right.'); ok = false; }
      }
      return ok;
    }

    // submit to Formspree, surface errors, only succeed on a real success
    if(formEl){
      formEl.addEventListener('input', function(e){
        if(e.target.classList && e.target.classList.contains('is-invalid')){
          e.target.classList.remove('is-invalid');
          var next = e.target.nextElementSibling;
          if(next && next.classList.contains('field-error')) next.remove();
        }
      });

      formEl.addEventListener('submit', function(e){
        e.preventDefault();
        clearErrors();
        if(!validate()){
          var firstBad = formEl.querySelector('.is-invalid');
          if(firstBad) firstBad.focus();
          return;
        }

        var submitBtn = formEl.querySelector('button[type="submit"]');
        var btnHTML = submitBtn ? submitBtn.innerHTML : '';
        if(submitBtn){ submitBtn.disabled = true; submitBtn.innerHTML = 'Sending\u2026'; }

        fetch(formEl.action, {
          method: 'POST',
          body: new FormData(formEl),
          headers: { 'Accept': 'application/json' }
        })
        .then(function(res){
          return res.json().catch(function(){ return {}; }).then(function(body){
            return { ok: res.ok, status: res.status, body: body };
          });
        })
        .then(function(r){
          if(submitBtn){ submitBtn.disabled = false; submitBtn.innerHTML = btnHTML; }

          if(r.ok){
            formEl.classList.add('d-none');
            if(doneEl){
              doneEl.classList.remove('d-none');
              var who = formEl.querySelector('[name="name"]');
              var nm = who && who.value ? who.value.split(' ')[0] : '';
              var greet = doneEl.querySelector('[data-greet]');
              if(greet) greet.textContent = nm ? ('Thank you, ' + nm + '.') : 'Thank you.';
            }
            return;
          }

          // Formspree returns { errors: [{ field, message, code }] }
          var errors = (r.body && r.body.errors) || [];
          var placed = 0;
          errors.forEach(function(err){
            var f = (err.field || '').toLowerCase();
            if(f && fieldError(f, err.message || 'Please check this field.')) placed++;
          });
          if(!placed){
            var msg = errors.length && errors[0].message
              ? errors[0].message
              : (r.status === 429
                  ? 'Too many messages sent just now — please wait a moment and try again.'
                  : 'Sorry, your message couldn\u2019t be sent. Please try again, or email Caryn directly.');
            formAlert(msg);
          } else {
            formAlert('Please fix the highlighted fields and try again.');
          }
          var firstBad2 = formEl.querySelector('.is-invalid');
          if(firstBad2) firstBad2.focus();
        })
        .catch(function(){
          if(submitBtn){ submitBtn.disabled = false; submitBtn.innerHTML = btnHTML; }
          formAlert('Couldn\u2019t reach the server — please check your connection and try again.');
        });
      });
    }
  }
})();
