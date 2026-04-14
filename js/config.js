/**
 * Configuração global do AprovaJá (lida pelo auth.js, api.js e perfil-db.js).
 *
 * - Duplique a partir de config.example.js se quiser ignorar este arquivo no Git.
 * - Supabase: crie o projeto em https://supabase.com (Authentication → Email).
 */
window.AprovaJaConfig = {
  /** URL do projeto (Settings → API) */
  supabaseUrl: 'https://nnffhssrzojtwtiydmye.supabase.co',
  /** chave anon pública (Settings → API). A chave anon é pública por design; use RLS no Supabase. */
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZmZoc3Nyem9qdHd0aXlkbXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxODE0NTMsImV4cCI6MjA5MTc1NzQ1M30.-j5g7hgZD-X23nQ9BfNEkfjr8cyWbY48aNVwNUlg4n4',
  /** Se true e o Supabase estiver configurado, exige login nas páginas privadas (redireciona para login). */
  protegerPaginasPrivadas: true,
  /**
   * Se true (padrão), Concursos e Convocações podem ser abertos sem login.
   * Dashboard (index) e Perfil continuam exigindo conta quando protegerPaginasPrivadas é true.
   */
  permitirConcursosSemLogin: true,
  /** UF padrão para a API pública de concursos (Deno) */
  ufPadrao: 'sp',
};
