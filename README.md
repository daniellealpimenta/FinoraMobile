# Finora Mobile

**Quanto dá para gastar até a fatura fechar?**

Versão para celular do [Finora](https://github.com/daniellealpimenta/Finora), em React Native com
Expo. O app organiza o dinheiro pelo ciclo da fatura do cartão, não pelo mês do calendário, e
responde com um número só: quanto dá para gastar hoje, já separando os gastos fixos e a meta de
guardar.

Trabalho AT2-N2. Roda no **Expo Go**, em dois modos, escolhidos na primeira tela:

- **Conectado ao meu Finora:** os números reais do Finora do computador (Pluggy / Open Finance),
  pela Tailscale. Os dados continuam no computador.
- **Demonstração:** um mês de exemplo guardado só no celular, que funciona sem internet. Serve
  para a apresentação.

## O que funciona

Nos dois modos:
- **Bloqueio** com Face ID, digital ou código do aparelho, e o olho que esconde os valores
- **Início:** Livre agora, Dá para gastar por dia, Para onde foi e últimas transações
- **Lançar** gasto ou entrada em três toques (cartão vai para a fatura, Pix sai da conta)
- **Transações:** busca, filtro por categoria e troca de categoria (com "aplicar às parecidas")
- **Cofrinhos** com metas em anel; **Orçamentos** com ● ok, ▲ perto do limite e ■ estourou
- **Pila**, o mascote, respondendo com os números do app; tema claro e escuro

Só no modo conectado:
- **Sincronizar com o banco** e **conectar um banco novo** pelo Pluggy Connect oficial
  (`react-native-pluggy-connect`)
- **Contas e bancos** com saldos e o aviso de banco parado
- **Desejos** com o "cabe neste ciclo?" e adicionar por link da loja
- Jogo **"Precisava ou foi vontade?"** (arrastar as cartas)
- **Pila com IA:** conversa livre com o modelo local (Ollama) do computador, em streaming
- Puxar para atualizar; sem conexão, o app mostra os últimos números que chegaram

## Rodar

```bash
npm install
npx expo start
```

Abra o **Expo Go** no celular e leia o QR code do terminal. O celular e o computador precisam
estar na mesma rede para o Expo Go baixar o app.

> No iPhone, o Expo Go não tem acesso ao Face ID e pede o código do aparelho no lugar. O Face ID
> de verdade só aparece num development build (`npx expo run:ios`).

## Conectar ao Finora do computador

1. Instale a [Tailscale](https://tailscale.com/download) no computador e no celular, com a
   mesma conta.
2. No Finora do computador, abra **Perfil › Celular** e ligue o **acesso pelo celular** (no
   programa, feche e abra de novo).
3. Toque em **Parear um celular**. No app, escolha **Conectar ao meu Finora** e leia o QR, ou
   digite o endereço (`100.x.y.z:8765`) e o código de 6 dígitos. Também dá para entrar com
   e-mail e senha.

O celular recebe um token próprio, guardado no armazenamento seguro do sistema (Keychain ou
Keystore). Fora do computador, a API do Finora só aceita aparelhos pareados e só pela
Tailscale. Um gasto anotado no celular fica como lançamento manual até o banco mandar o mesmo
gasto: aí o sync troca um pelo outro e mantém a categoria.

## Dados

**Modo demonstração: expo-sqlite + Drizzle ORM**, o equivalente ao SwiftData no Expo Go:

| SwiftData | Aqui |
|---|---|
| `@Model` | tabelas em `src/db/schema.ts` |
| `ModelContainer` | `openDatabaseSync('finora.db')` em `src/db/client.ts` |
| `@Query` | `useLiveQuery(...)` em `src/state/sources/demo.tsx`: a tela atualiza sozinha |
| `context.insert` | funções em `src/db/repo.ts`, sempre dentro de transação |
| migração | `npm run db:generate` gera `drizzle/`; o app aplica com `useMigrations` |
| `@AppStorage` | `expo-sqlite/kv-store` em `src/state/prefs.ts` |

**Modo conectado:** `src/state/sources/remote.tsx` lê a API do Finora (os mesmos campos da Visão
geral da web, para os números baterem) e guarda a última resposta no kv-store para abrir sem
conexão. As telas não sabem de onde vêm os dados: usam só `useFinance()`.

Dinheiro é sempre tratado em centavos inteiros.

## Estrutura

```
src/
  app/          telas (Expo Router): (tabs)/ Início, Transações, Cofrinhos, Mais;
                bem-vindo, conectar, parear, orcamentos, pila, contas, desejos, precisava
  api/          cliente da API do Finora, tipos e streaming do chat
  components/   Pila, número herói, barra de abas, folhas (lançar, categoria, cofrinho)
  db/           SQLite do modo demo: schema, cliente, escritas e mês de exemplo
  domain/       regras puras: ciclo, previsão, orçamento, respostas do Pila, categorias
  state/        sessão, preferências, fonte de dados (demo ou conectado), folhas e avisos
  theme/        cores e fontes do Finora (MASTER.md)
drizzle/        migrações geradas
```

## Comandos

```bash
npm test            # regras de ciclo, previsão e QR de pareamento (Jest)
npm run typecheck   # TypeScript
npx expo lint       # ESLint
npm run db:generate # nova migração depois de mudar src/db/schema.ts
```
