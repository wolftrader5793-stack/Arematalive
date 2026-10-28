# AremataLive

Plataforma de leilões ao vivo com lances crescentes, transmissão por celular/computador e comissão planejada de 5%.

## Estado atual

Esta primeira entrega é um **protótipo visual de frontend**. Os produtos e números exibidos são dados ilustrativos. Login, transmissão ao vivo, lances concorrentes, encerramento de leilões e pagamentos ainda não estão conectados e não devem ser usados em operações reais.

## Configuração do Supabase (fundação inicial)

1. Crie ou abra o projeto no [Supabase](https://supabase.com/).
2. No SQL Editor, revise e execute `supabase/migrations/202610280001_initial_schema.sql`.
3. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os valores do projeto.
4. Reinicie o servidor Vite depois de alterar o arquivo de ambiente.

A chave anon/public pode ser usada no navegador com as políticas RLS ativas. **Nunca** use a chave `service_role` no frontend nem a publique no repositório. O schema cria perfis, leilões, histórico de lances e a função transacional `place_bid`, que valida o lance no servidor e bloqueia lances concorrentes no mesmo leilão. A interface atual ainda é uma prévia e não está conectada ao login, à transmissão ou aos pagamentos.

Para conceder papel de vendedor, use um fluxo administrativo confiável; usuários não podem promover a própria conta. A comissão de 5% e o split de pagamentos ainda precisam ser implementados no backend do provedor escolhido.

## Rodar localmente

Requer Node.js instalado.

```bash
npm install
npm run dev
```

Para validar a compilação:

```bash
npm run build
```

## Etapas de implementação

1. **Interface inicial** — página pública, busca, filtros responsivos e estados de demonstração.
2. **Supabase** — autenticação, perfis comprador/vendedor/admin, banco de dados, políticas RLS e eventos em tempo real.
3. **Motor de leilões** — lances validados no servidor, incrementos mínimos, controle de concorrência, horário oficial do servidor, prorrogação configurável e encerramento auditável.
4. **Transmissão ao vivo** — integração com provedor de vídeo que aceite transmissão via celular e computador.
5. **Pagamentos** — selecionar provedor compatível com marketplace, split de comissão de 5%, repasse, reembolsos, conciliação e análise de cadastro.
6. **Segurança e lançamento** — testes automatizados, logs, monitoramento, termos, privacidade, regras de disputa e validação operacional.

## Princípios

- Visitantes podem assistir às lives públicas; cadastro obrigatório para dar lances.
- O servidor é a fonte oficial para preço, validade dos lances e horário de encerramento.
- Nunca confiar em valores de lance calculados apenas no navegador.
- Não armazenar dados de cartão diretamente no aplicativo.
- Não ativar pagamentos reais antes de testar webhooks, reembolsos, conciliação e regras do provedor.
- Manter este repositório separado de qualquer outro projeto.
