# Bot Discord — Loja
Bot base em Node.js + discord.js v14, com moderação, tickets, restock, status, modos da loja, PIX e avaliações.

## Requisitos
- Node.js 20+
- Uma aplicação/bot criada no Discord Developer Portal

## Instalação
1. `npm install`
2. Copie `.env.example` para `.env`
3. Preencha `DISCORD_TOKEN`, `CLIENT_ID` e `GUILD_ID`
4. `npm start`

## Comandos
- `/ping`
- `/config`
- `/moderacao`
- `/ticket`
- `/produto`
- `/restock`
- `/loja`
- `/pix`
- `/avaliacao`

O projeto usa armazenamento JSON local em `data/`. Para produção, troque por um banco de dados.
