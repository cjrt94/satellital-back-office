/**
 * Webflow Custom Code Snippet
 * ----------------------------
 * Add this to your Webflow site's custom code (before </body>)
 * wrapped in <script> tags.
 *
 * This script:
 * 1. Captures UTM parameters from the URL on page load
 * 2. Intercepts Webflow form submissions (only forms with data-satellital-form attribute)
 * 3. Sends form data + UTM params to your Firebase Cloud Function endpoint
 *
 * IMPORTANT:
 * - Replace FUNCTION_URL with your deployed Firebase function URL
 * - Replace API_KEY with your LEADS_API_KEY
 * - Add the attribute data-satellital-form to the form(s) you want to capture
 */

(function () {
  var FUNCTION_URL = 'https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/receiveLead';
  var API_KEY = 'YOUR_LEADS_API_KEY';

  // Guard: warn if placeholders are not replaced
  if (FUNCTION_URL.indexOf('YOUR_REGION') !== -1 || API_KEY.indexOf('YOUR_LEADS') !== -1) {
    console.error('[Satellital] FUNCTION_URL or API_KEY not configured. Update the snippet.');
    return;
  }

  // Capture UTM params from URL
  var params = new URLSearchParams(window.location.search);
  var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var utmData = {};
  utmKeys.forEach(function (key) {
    var val = params.get(key);
    if (val) utmData[key] = val;
  });

  // Store UTMs in sessionStorage so they persist across pages
  if (Object.keys(utmData).length > 0) {
    sessionStorage.setItem('utm_data', JSON.stringify(utmData));
  }

  function getStoredUtms() {
    try {
      return JSON.parse(sessionStorage.getItem('utm_data') || '{}');
    } catch (e) {
      return {};
    }
  }

  // Intercept only forms with data-satellital-form attribute
  document.addEventListener('submit', async function (e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    if (!form.hasAttribute('data-satellital-form')) return;

    e.preventDefault();
    e.stopPropagation();

    var email = (form.querySelector('[name="Email"]') || {}).value || '';

    // Client-side email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      var failDiv = form.parentElement && form.parentElement.querySelector('.w-form-fail');
      if (failDiv) failDiv.style.display = 'block';
      return;
    }

    var fullName = (form.querySelector('[name="Name"]') || {}).value || '';
    var phone = (form.querySelector('[name="Phone"]') || {}).value || '';
    var company = (form.querySelector('[name="Company"]') || {}).value || '';
    var city = (form.querySelector('[name="City"]') || {}).value || '';
    var message = (form.querySelector('[name="Message"]') || {}).value || '';

    var utms = getStoredUtms();

    var payload = {
      fullName: fullName,
      email: email,
      phone: phone,
      company: company,
      city: city,
      message: message
    };

    // Merge UTM params
    for (var key in utms) {
      if (utms.hasOwnProperty(key)) {
        payload[key] = utms[key];
      }
    }

    try {
      var res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        var successDiv = form.parentElement && form.parentElement.querySelector('.w-form-done');
        var failDiv2 = form.parentElement && form.parentElement.querySelector('.w-form-fail');
        if (successDiv) successDiv.style.display = 'block';
        if (failDiv2) failDiv2.style.display = 'none';
        form.style.display = 'none';
      } else {
        throw new Error('Request failed');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      var failDiv3 = form.parentElement && form.parentElement.querySelector('.w-form-fail');
      if (failDiv3) failDiv3.style.display = 'block';
    }
  }, true);
})();
