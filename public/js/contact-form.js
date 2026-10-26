// Sends the contact form to /api/contact and shows Webflow's built-in success / error blocks.
(function () {
  var form = document.getElementById('email-form');
  if (!form) return;
  var wrapper = form.closest('.w-form');
  var done = wrapper.querySelector('.w-form-done');
  var fail = wrapper.querySelector('.w-form-fail');
  var button = form.querySelector('[type="submit"]');

  // Result of a submission made without JavaScript (api/contact.js redirects back with ?sent=1 or ?error=1).
  var query = new URLSearchParams(window.location.search);
  if (query.has('sent')) {
    form.style.display = 'none';
    done.style.display = 'block';
  } else if (query.has('error')) {
    fail.style.display = 'block';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var label = button.value;
    button.disabled = true;
    button.value = button.getAttribute('data-wait') || label;
    fail.style.display = 'none';

    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.style.display = 'none';
        done.style.display = 'block';
      })
      .catch(function () {
        fail.style.display = 'block';
      })
      .finally(function () {
        button.disabled = false;
        button.value = label;
      });
  });
})();
