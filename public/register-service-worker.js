if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        console.log('The Limestone Service Worker registered successfully! Scope:', reg.scope);
      })
      .catch(err => {
        console.error('The Limestone Service Worker registration failed:', err);
      });
  });
}
