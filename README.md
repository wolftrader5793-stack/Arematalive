# AremataLive

Plataforma de leilões ao vivo com lances crescentes, transmissão por celular/computador e comissão planejada de 5%.

## Estado atual

Esta primeira entrega é um **protótipo visual de frontend**. Os produtos e números exibidos são dados ilustrativos. Login, transmissão ao vivo, lances concorrentes, encerramento de leilões e pagamentos ainda não estão conectados e não devem ser usados em operações reais.

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
