# PULSE FX BOT

Painel web independente para análise técnica Forex com candles reais via Twelve Data.

## Rodar localmente
1. Instale Node.js 20 ou superior.
2. Copie `.env.example` para `.env` e informe sua chave Twelve Data em `TWELVEDATA_API_KEY`.
3. Execute `npm install` e `npm start`.
4. Abra http://localhost:3000.

## Publicar no Render
Serviço Node, diretório de trabalho `pulse-fx-bot`, build `npm install`, start `npm start`. Configure `TWELVEDATA_API_KEY` nas variáveis de ambiente.

## Limites importantes
A pontuação é confluência técnica, não probabilidade de acerto. Não há execução automática em IQ Option/MT4 nem calendário econômico automático nesta versão. O histórico usa SQLite local; no plano gratuito do Render os dados locais podem ser perdidos em reinicializações/redeploys. Não opere apenas com base no sinal.
