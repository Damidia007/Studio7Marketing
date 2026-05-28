# Dados de Runtime

Esta pasta guarda dados gerados em execucao e nao deve receber informacoes reais no repositorio.

Regras:

- `leads.json` e criado e atualizado localmente pelo servidor.
- `admin-sessions.json` guarda sessoes administrativas ativas.
- `security-blocks.json` guarda bloqueios temporarios persistentes.
- antes de publicar ou versionar, mantenha esse arquivo vazio ou fora do pacote.
- sempre faca backup separado dos leads reais.
