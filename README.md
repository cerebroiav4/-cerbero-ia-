# CÉREBRO META FOREX 2.0
Painel Node.js para análise técnica de Forex com dados da Twelve Data.

## Configuração
1. Defina a variável de ambiente TWELVE_DATA_API_KEY no Render.
2. O serviço usa Node.js e inicia com npm start.
3. Health check: /api/health
4. Análise: /api/analyze?symbol=EUR/USD&newsClear=true

## Sinais e limites
- Usa candles M1 e M5 fornecidos pela Twelve Data, EMA 20/50 e RSI 14.
- CALL/PUT só quando M1 e M5 estão alinhados e o usuário confirma manualmente que não há notícia de alto impacto.
- Caso contrário, SEM ENTRADA.
- O painel agenda aviso no marco de 50 segundos antes da próxima virada de minuto. O alerta não garante que o fornecedor atualize dados em tempo real.
- Sem integração com corretora ou execução automática. Sem promessa de taxa de acerto.
- A disponibilidade e limites dependem do plano Twelve Data. Nunca coloque a chave no código ou no GitHub.
