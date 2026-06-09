/**
 * Configuração global do AprovaJá (lida pelo auth.js, api.js e perfil-db.js).
 *
 * - Duplique a partir de config.example.js se quiser ignorar este arquivo no Git.
 * - Supabase: crie o projeto em https://supabase.com (Authentication → Email).
 */
window.AprovaJaConfig = {
  /** URL do projeto (Settings → API) */
  supabaseUrl: "https://vqkakbdgeexppvlrvklz.supabase.co",
  /** chave anon pública (Settings → API). A chave anon é pública por design; use RLS no Supabase. */
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa2FrYmRnZWV4cHB2bHJ2a2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NzMyMzAsImV4cCI6MjA5NjU0OTIzMH0.axqMhr3FYHw7k_qD-PkD-_2BVJzBK1bph0aeJDHFveA',
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
