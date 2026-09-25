// ================= tema claro/escuro =================
function aplicarTema(tema){
  const profileThemeLabel = document.getElementById('profileThemeLabel');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const statusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  const temaValido = tema === 'dark' ? 'dark' : 'light';

  if(temaValido === 'dark'){
    document.documentElement.setAttribute('data-theme','dark');
    if(themeMeta) themeMeta.setAttribute('content', '#171B34');
    if(statusMeta) statusMeta.setAttribute('content', 'black-translucent');
    if(profileThemeLabel) profileThemeLabel.textContent = 'Usar tema claro';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if(themeMeta) themeMeta.setAttribute('content', '#FFFFFF');
    if(statusMeta) statusMeta.setAttribute('content', 'default');
    if(profileThemeLabel) profileThemeLabel.textContent = 'Usar tema escuro';
  }
  safeSetStorage('cf-tema', temaValido);
}

