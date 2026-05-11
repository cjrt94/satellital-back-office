/**
 * Webflow Custom Code Snippet — Satellital Patrol
 * -------------------------------------------------
 * Pegar en Webflow > Project Settings > Custom Code > Before </body>
 * envuelto en <script> tags.
 *
 * En Webflow Designer: seleccionar el form > Settings > ID: satellital-form
 */
(function () {
  var API_URL = 'https://satellital-back-office.vercel.app/api/leads';
  var API_KEY = '2bcedeb9859026051ebeff88fb2b5e4f2e74411ce8afe29dff141dd61f801074';
  var HUBSPOT_URL = 'https://api-eu1.hsforms.com/submissions/v3/integration/submit/147474311/bffd9985-bfb7-4bad-ad1c-c3f4fbfd947c';
  var params = new URLSearchParams(window.location.search);
  var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var utmData = {};
  utmKeys.forEach(function (key) {
    var val = params.get(key);
    if (val) utmData[key] = val;
  });
  if (Object.keys(utmData).length > 0) {
    sessionStorage.setItem('utm_data', JSON.stringify(utmData));
  }
  function getStoredUtms() {
    try { return JSON.parse(sessionStorage.getItem('utm_data') || '{}'); }
    catch (e) { return {}; }
  }
  var form = document.getElementById('satellital-form');
  if (!form) return;
  form.addEventListener('submit', function () {
    var email = (form.querySelector('[name="Email"]') || {}).value || '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    var fullName = (form.querySelector('[name="Name"]') || {}).value || '';
    var phone = (form.querySelector('[name="Phone"]') || {}).value || '';
    var company = (form.querySelector('[name="Company"]') || {}).value || '';
    var city = (form.querySelector('[name="City"]') || {}).value || '';
    var message = (form.querySelector('[name="Message"]') || {}).value || '';
    var utms = getStoredUtms();
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({
        fullName: fullName, email: email, phone: phone, company: company,
        city: city, message: message, utm_source: utms.utm_source || '',
        utm_medium: utms.utm_medium || '', utm_campaign: utms.utm_campaign || '',
        utm_term: utms.utm_term || '', utm_content: utms.utm_content || ''
      })
    }).catch(function () {});
    var nameParts = fullName.trim().split(' ');
    var firstname = nameParts.shift() || '';
    var lastname = nameParts.join(' ') || '';
    fetch(HUBSPOT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: [
          { name: 'firstname', value: firstname },
          { name: 'lastname', value: lastname },
          { name: 'email', value: email },
          { name: 'phone', value: phone },
          { name: 'company', value: company },
          { name: 'city', value: city },
          { name: 'message', value: message }
        ],
        context: { pageUri: window.location.href, pageName: document.title }
      })
    }).catch(function () {});
  });
})();
