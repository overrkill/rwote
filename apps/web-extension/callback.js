// callback.js — OAuth callback handler

(function() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  
  if (code) {
    chrome.runtime.sendMessage({
      type: 'OAUTH_CODE',
      code: code
    }, (response) => {
      if (response && response.ok) {
        document.body.innerHTML = '<p>Sign in complete! You can close this tab.</p>';
      } else {
        document.body.innerHTML = '<p>Error: ' + (response?.error || 'Unknown error') + '</p>';
      }
    });
  } else if (error) {
    chrome.runtime.sendMessage({
      type: 'OAUTH_ERROR',
      error: error,
      error_description: url.searchParams.get('error_description')
    }, () => {
      document.body.innerHTML = '<p>Error: ' + error + '</p>';
    });
  } else {
    document.body.innerHTML = '<p>No authorization code received.</p>';
  }
})();
