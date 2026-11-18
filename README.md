# CÉREBRO META 1.5

Painel web independente para visualizar alertas técnicos enviados pelo TradingView.

## Requisitos
- Node.js 20 ou superior
- Conta TradingView com alertas/webhooks habilitados
- Hospedagem Node.js com armazenamento persistente para o histórico

## Executar localmente
```bash
npm start
```
Defina antes a variável `WEBHOOK_SECRET` com um token aleatório forte. O painel abre em `http://localhost:3000`.

## Rotas
- `GET /api/health`: saúde do serviço
- `GET /api/signals?limit=50`: histórico
- `GET /api/metrics`: distribuição dos alertas CALL/PUT (não é taxa de acerto)
- `POST /webhook/tradingview`: recebe sinais autenticados

## TradingView
1. Abra `cerebro_meta_tradingview.pine` no Pine Editor e adicione ao gráfico.
2. Informe no indicador o mesmo token configurado em `WEBHOOK_SECRET`.
3. Crie alerta com condição **Any alert() function call**.
4. URL do webhook: `https://SEU-DOMINIO/webhook/tradingview`.

Nunca publique o token em repositório público nem o envie em mensagens.

## Limites atuais
Esta versão é um receptor e painel de alertas técnicos. Ainda não integra calendário/notícias econômicas, COT/CFTC, sazonalidade, cotações de terceiros, IQ Option ou execução automática de ordens. O indicador exige confirmação de tendência M1/M5 quando habilitada e confirma os sinais no fechamento do candle do gráfico. Não promete taxa de acerto.

## Gestão de risco manual
O painel inclui uma calculadora de volume estimado a partir do saldo, percentual de risco, stop em pips e valor do pip por lote. O usuário deve informar o valor correto para o par e a moeda da conta. A calculadora não envia ordens e não substitui as especificações do contrato da corretora.

## Dados externos
Cotações e calendário econômico ainda não estão conectados. O painel não simula esses dados; a integração depende da escolha e configuração de provedores e respectivas credenciais.
