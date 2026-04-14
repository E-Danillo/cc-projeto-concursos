/**
 * Configuração do AprovaJá (copie config.example.js e ajuste, ou edite aqui).
 * Supabase: projeto em https://supabase.com — Authentication → Email.
 */
window.AprovaJaConfig = {
  /** URL do projeto (Settings → API) */
  supabaseUrl: 'https://nnffhssrzojtwtiydmye.supabase.co',
  /** chave anon pública (Settings → API). A chave anon é pública por design; use RLS no Supabase. */
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZmZoc3Nyem9qdHd0aXlkbXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxODE0NTMsImV4cCI6MjA5MTc1NzQ1M30.-j5g7hgZD-X23nQ9BfNEkfjr8cyWbY48aNVwNUlg4n4',
  /** Se true e as chaves acima estiverem preenchidas, exige sessão Supabase nas páginas do app */
  protegerPaginasPrivadas: false,
  /** UF padrão para a API pública de concursos (Deno) */
  ufPadrao: 'sp',
};
