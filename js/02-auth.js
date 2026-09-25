function traduzErroAuth(codigo){
  const mapa = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-not-found': 'Não existe conta com esse e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'Não foi possível validar. Se sua conta foi criada com Google, use o botão acima; caso contrário, redefina a senha.',
    'auth/operation-not-allowed': 'Este método de login está desativado no Firebase. Ative o provedor correspondente no Console.',
    'auth/user-disabled': 'Esta conta foi desativada no Firebase. Verifique o Console ou fale com o administrador.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente de novo.',
    'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/popup-closed-by-user': 'Janela do Google fechada antes de concluir.',
    'auth/cancelled-popup-request': 'Login com Google cancelado.',
    'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Tente novamente para continuar por redirecionamento.',
    'auth/unauthorized-domain': 'Este endereço não está autorizado no Firebase. Adicione o domínio em Authentication → Settings → Authorized domains.'
  };
  return mapa[codigo] || 'Não foi possível entrar. Tente novamente.';
}

// ================= modo login x cadastro =================
let modoAuth = 'login'; // 'login' | 'cadastro'
function setModoAuth(modo){
  modoAuth = modo;
  const titulo = document.getElementById('loginTitulo');
  const desc = document.getElementById('loginDescricao');
  const btn = document.getElementById('btnLoginSubmit');
  const linkAlt = document.getElementById('linkAlternarAuth');
  const campoConfirmar = document.getElementById('campoConfirmarSenha');
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginError').style.color = '';
  if(modo === 'cadastro'){
    titulo.textContent = '🔐 Criar conta';
    desc.textContent = 'Crie sua conta para começar a usar o Controle Financeiro.';
    btn.textContent = 'Criar conta';
    linkAlt.textContent = 'Já tenho conta — entrar';
    campoConfirmar.classList.remove('hidden');
    document.getElementById('confirmarSenha').required = true;
  } else {
    titulo.textContent = '🔐 Entrar';
    desc.textContent = 'Acesse sua conta para ver seus dados financeiros.';
    btn.textContent = 'Entrar';
    linkAlt.textContent = 'Ainda não tenho conta — criar conta';
    campoConfirmar.classList.add('hidden');
    document.getElementById('confirmarSenha').required = false;
  }
}
document.getElementById('linkAlternarAuth').addEventListener('click', ()=>{
  setModoAuth(modoAuth === 'login' ? 'cadastro' : 'login');
});

document.getElementById('loginForm').addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const confirmar = document.getElementById('confirmarSenha').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('btnLoginSubmit');
  errEl.style.color = '';
  errEl.textContent = '';

  if(!email || !senha){
    errEl.textContent = 'Informe e-mail e senha para continuar.';
    return;
  }
  if(modoAuth === 'cadastro'){
    if(!confirmar){
      errEl.textContent = 'Confirme sua senha para criar a conta.';
      return;
    }
    if(senha.length < 6){
      errEl.textContent = 'A senha precisa ter pelo menos 6 caracteres.';
      return;
    }
    if(senha !== confirmar){
      errEl.textContent = 'As senhas não conferem.';
      return;
    }
  }

  btn.disabled = true; btn.textContent = modoAuth === 'cadastro' ? 'Criando conta...' : 'Entrando...';
  try{
    if(modoAuth === 'cadastro'){
      await auth.createUserWithEmailAndPassword(email, senha);
    } else {
      await auth.signInWithEmailAndPassword(email, senha);
    }
  }catch(e){
    errEl.textContent = traduzErroAuth(e.code);
  }finally{
    btn.disabled = false; btn.textContent = modoAuth === 'cadastro' ? 'Criar conta' : 'Entrar';
  }
});

document.getElementById('btnEsqueciSenha').addEventListener('click', async ()=>{
  const email = document.getElementById('loginEmail').value.trim();
  const errEl = document.getElementById('loginError');
  if(!email){ errEl.textContent = 'Digite seu e-mail acima primeiro.'; return; }
  try{
    await auth.sendPasswordResetEmail(email);
    errEl.style.color = 'var(--receita-2)';
    errEl.textContent = 'E-mail de redefinição enviado — confira sua caixa de entrada.';
  }catch(e){
    errEl.style.color = '';
    errEl.textContent = traduzErroAuth(e.code);
  }
});

// ================= login com Google =================
const googleProvider = new firebase.auth.GoogleAuthProvider();
const btnLoginGoogle = document.getElementById('btnLoginGoogle');
const textoLoginGoogle = btnLoginGoogle.querySelector('span').textContent;
function estadoLoginGoogle(carregando){
  btnLoginGoogle.disabled = carregando;
  btnLoginGoogle.querySelector('span').textContent = carregando ? 'Conectando ao Google...' : textoLoginGoogle;
}

auth.getRedirectResult().then(resultado=>{
  if(resultado?.user) {
    estadoLoginGoogle(false);
    return;
  }
  estadoLoginGoogle(false);
}).catch(e=>{
  const errEl = document.getElementById('loginError');
  errEl.textContent = traduzErroAuth(e.code);
  estadoLoginGoogle(false);
});

btnLoginGoogle.addEventListener('click', async ()=>{
  const errEl = document.getElementById('loginError');
  errEl.style.color = '';
  errEl.textContent = '';
  estadoLoginGoogle(true);
  try{
    await Promise.race([
      auth.signInWithPopup(googleProvider),
      new Promise((_, reject)=>setTimeout(()=>reject({code:'auth/popup-blocked'}), 12000))
    ]);
  }catch(e){
    if(e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user'){
      errEl.style.color = 'var(--text-secondary)';
      errEl.textContent = 'Redirecionando para o Google...';
      try{
        await auth.signInWithRedirect(googleProvider);
      }catch(redirectError){
        errEl.style.color = '';
        errEl.textContent = traduzErroAuth(redirectError.code);
        estadoLoginGoogle(false);
      }
      return;
    }
    errEl.textContent = traduzErroAuth(e.code);
    estadoLoginGoogle(false);
  }finally{
    if(auth.currentUser) estadoLoginGoogle(false);
  }
});

async function sairDaConta(){
  if(!confirm('Sair da sua conta?')) return;
  await auth.signOut();
}
function nomePerfil(user){
  return user?.displayName?.trim() || user?.email?.split('@')[0] || 'Usuário';
}
function atualizarPerfilHeader(user){
  const nome = nomePerfil(user);
  const email = user?.email || 'conta';
  const inicial = nome.charAt(0).toUpperCase();
  ['headerProfileName','dropdownProfileName'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=nome; });
  ['headerProfileEmail','dropdownProfileEmail','profileAccountEmail'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=email; });
  ['headerProfileAvatar','dropdownProfileAvatar'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=inicial; });
  const input = document.getElementById('profileName');
  if(input) input.value = user?.displayName || '';
}

function fecharMenuPerfil(){
  document.getElementById('profileDropdown').classList.add('hidden');
  document.getElementById('btnProfileMenu').setAttribute('aria-expanded','false');
}
document.getElementById('btnProfileMenu').addEventListener('click', ()=>{
  const menu = document.getElementById('profileDropdown');
  const aberto = menu.classList.toggle('hidden') === false;
  document.getElementById('btnProfileMenu').setAttribute('aria-expanded', String(aberto));
});
document.addEventListener('click', ev=>{
  if(!ev.target.closest('.profile-menu')) fecharMenuPerfil();
});
document.getElementById('btnEditProfile').addEventListener('click', ()=>{
  fecharMenuPerfil();
  document.getElementById('profileModalMessage').textContent = '';
  document.getElementById('profileModal').classList.add('show');
});
document.getElementById('btnCloseProfile').addEventListener('click', ()=>document.getElementById('profileModal').classList.remove('show'));
document.getElementById('profileModal').addEventListener('click', ev=>{
  if(ev.target.id === 'profileModal') ev.currentTarget.classList.remove('show');
});
document.getElementById('btnProfileConfig').addEventListener('click', ()=>{ fecharMenuPerfil(); switchView('config'); });
document.getElementById('btnProfileTheme').addEventListener('click', ()=>{
  fecharMenuPerfil();
  const atual = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  aplicarTema(atual === 'dark' ? 'light' : 'dark');
});
document.getElementById('btnProfileLogout').addEventListener('click', sairDaConta);
document.getElementById('btnSaveProfile').addEventListener('click', async ()=>{
  if(!currentUser) return;
  const nome = document.getElementById('profileName').value.trim();
  const msg = document.getElementById('profileModalMessage');
  if(!nome){ msg.style.color='var(--despesa-2)'; msg.textContent='Informe um nome.'; return; }
  try{
    await currentUser.updateProfile({displayName:nome});
    atualizarPerfilHeader(currentUser);
    msg.style.color='var(--receita-2)'; msg.textContent='Nome atualizado.';
  }catch(e){ msg.style.color='var(--despesa-2)'; msg.textContent='Não foi possível atualizar o nome.'; }
});
document.getElementById('btnResetPassword').addEventListener('click', async ()=>{
  if(!currentUser?.email) return;
  const msg = document.getElementById('profileModalMessage');
  try{
    await auth.sendPasswordResetEmail(currentUser.email);
    msg.style.color='var(--receita-2)'; msg.textContent='Link de redefinição enviado para seu e-mail.';
  }catch(e){ msg.style.color='var(--despesa-2)'; msg.textContent=traduzErroAuth(e.code); }
});

auth.onAuthStateChanged(async (user)=>{
  const overlay = document.getElementById('loginOverlay');
  if(user){
    currentUser = user;
    atualizarPerfilHeader(user);
    overlay.classList.remove('show');
    await carregarDoFirestore();
    populateFormLists();
    updateConfigLabels();
    renderLancamentosView();
    renderDivida();
    switchView('dashboard');
    await sincronizarAlteracoesPendentes();
    setSyncStatus('ok', 'logado como ' + (user.email || user.displayName || 'usuário') + ' · ' + dados.length + ' lançamento(s)');
    if(typeof verificarLembreteExportacao === 'function') verificarLembreteExportacao();
  } else {
    currentUser = null;
    overlay.classList.add('show');
    setModoAuth('login');
    setSyncStatus('', 'não conectado');
  }
});
