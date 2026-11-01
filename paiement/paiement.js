// Page de paiement Paddle (Windows, Linux et web). L'app ouvre
// /paiement/?_ptxn=<transaction> (le « Default payment link » de Paddle) ;
// Paddle.js lit lui-même `_ptxn` et ouvre le paiement de cette transaction.
// La page déclare son environnement et son jeton côté client (public) dans
// `data-environment` et `data-token` de cette balise <script>.
(function () {
  var config = document.currentScript.dataset;
  var hasTransaction = new URLSearchParams(location.search).has('_ptxn');

  function show(id) {
    ['waiting', 'completed', 'closed', 'failed', 'no-transaction'].forEach(function (name) {
      document.getElementById(name).hidden = name !== id;
    });
  }

  if (!hasTransaction) {
    show('no-transaction');
    return;
  }
  // Jeton pas encore posé (`live_…` en production, `test_…` en sandbox).
  var prefix = config.environment === 'sandbox' ? 'test_' : 'live_';
  if (config.token.indexOf(prefix) !== 0) {
    show('failed');
    return;
  }

  var script = document.createElement('script');
  script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
  script.onerror = function () { show('failed'); };
  script.onload = function () {
    if (config.environment === 'sandbox') Paddle.Environment.set('sandbox');
    var completed = false;
    Paddle.Initialize({
      token: config.token,
      checkout: { settings: { displayMode: 'overlay', locale: 'fr' } },
      eventCallback: function (event) {
        if (event.name === 'checkout.completed') {
          completed = true;
          show('completed');
        } else if (event.name === 'checkout.closed' && !completed) {
          show('closed');
        } else if (event.name === 'checkout.error') {
          show('failed');
        }
      },
    });
  };
  document.head.appendChild(script);
})();
