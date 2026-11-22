# Finora Mobile

**Quanto dá para gastar até a fatura fechar?**

Versão para celular do [Finora](../Finora), em React Native com Expo. O app organiza o dinheiro
pelo ciclo da fatura do cartão, não pelo mês do calendário, e responde com um número só: quanto
dá para gastar hoje, já separando os gastos fixos e a meta de guardar.

Trabalho AT2-N2. Roda no **Expo Go**, offline, com os dados guardados no próprio celular.

## O que funciona

- **Bloqueio** com Face ID, digital ou código do aparelho, e o olho que esconde os valores
- **Início:** Livre agora (em conta − fatura), Dá para gastar por dia, Para onde foi e últimas transações
- **Lançar** gasto ou entrada em três toques. O cartão vai para a fatura, o Pix sai da conta, e tudo se recalcula na hora
- **Transações:** busca, filtro por categoria e troca de categoria (com "aplicar às parecidas")
- **Cofrinhos:** metas em anel e "guardar", que conta na meta do ciclo
- **Orçamentos** com ● ok, ▲ perto do limite e ■ estourou; o Pila avisa quando um lançamento estoura
- **Pila**, o mascote, respondendo perguntas com os números do app
- Tema claro e escuro, e "Reiniciar dados de exemplo"

No primeiro uso o app grava um mês de exemplo (o "Pluggy Bank" fictício dos prints do Finora),
com as datas montadas em volta de hoje.

## Rodar

```bash
npm install
npx expo start
```

Abra o **Expo Go** no celular e leia o QR code. O celular e o computador precisam estar na mesma rede.

> No iPhone, o Expo Go não tem acesso ao Face ID e pede o código do aparelho no lugar. O Face ID
> de verdade só aparece num development build (`npx expo run:ios`).

## Banco de dados local

**expo-sqlite + Drizzle ORM**, o equivalente ao SwiftData no Expo Go:

| SwiftData | Aqui |
|---|---|
| `@Model` | tabelas em `src/db/schema.ts` |
| `ModelContainer` | `openDatabaseSync('finora.db')` em `src/db/client.ts` |
| `@Query` | `useLiveQuery(...)` em `src/state/finance.tsx`: a tela atualiza sozinha |
| `context.insert` | funções em `src/db/repo.ts`, sempre dentro de transação |
| migração | `npm run db:generate` gera `drizzle/`; o app aplica com `useMigrations` |
| `@AppStorage` | `expo-sqlite/kv-store` em `src/state/prefs.ts` |

Dinheiro é guardado em centavos inteiros.

## Estrutura

```
src/
  app/          telas (Expo Router): (tabs)/ Início, Transações, Cofrinhos, Mais; orcamentos; pila
  components/   Pila, número herói, barra de abas, folhas (lançar, categoria, guardar)
  db/           schema, cliente, escritas (repo) e mês de exemplo (seed)
  domain/       regras puras: ciclo, previsão, orçamento, respostas do Pila
  state/        dados ao vivo, preferências, folhas e avisos
  theme/        cores e fontes do Finora (MASTER.md)
drizzle/        migrações geradas
```

## Comandos

```bash
npm test            # regras de ciclo e previsão (Jest)
npm run typecheck   # TypeScript
npx expo lint       # ESLint
npm run db:generate # nova migração depois de mudar src/db/schema.ts
```
