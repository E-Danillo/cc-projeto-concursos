/**
 * Modelo de configuração — copie para `js/config.js` e preencha.
 * Comando (Git Bash / macOS/Linux): cp js/config.example.js js/config.js
 *
 * - supabaseUrl / supabaseAnonKey: Project Settings → API no painel Supabase.
 * - protegerPaginasPrivadas: exige login nas rotas privadas (ver auth.js).
 * - permitirConcursosSemLogin: libera concursos/convocações sem sessão.
 * - ufPadrao: estado usado na API de listagem e no dashboard.
 */
window.AprovaJaConfig = {
  supabaseUrl: 'https://xxxx.supabase.co',
  supabaseAnonKey: 'sua-chave-anon',
  protegerPaginasPrivadas: true,
  permitirConcursosSemLogin: true,
  ufPadrao: 'sp',
};
