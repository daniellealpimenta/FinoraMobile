<div align="center">

<img src="docs/pila.svg" width="140" alt="Pila, o porquinho do Finora" />

# Finora Mobile

**Quanto dá para gastar até a fatura fechar?**

Versão para celular do [Finora](https://github.com/daniellealpimenta/Finora). Organiza o dinheiro
pelo ciclo da fatura do cartão, não pelo mês do calendário, e responde com um número só: quanto
dá para gastar hoje, já separando os gastos fixos e a meta de guardar.

![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Expo Router](https://img.shields.io/badge/Expo%20Router-telas-000020?logo=expo&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-local-003B57?logo=sqlite&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)
![Tailscale](https://img.shields.io/badge/Tailscale-rede%20privada-242424?logo=tailscale&logoColor=white)
![Pluggy](https://img.shields.io/badge/Open%20Finance-Pluggy-6E3CF5)

<sub>Trabalho AT2-N2 · roda no <b>Expo Go</b> · <a href="https://github.com/daniellealpimenta/FinoraMobile/tags">Todas as versões</a></sub>

</div>

---

## 📱 Dois modos

Escolhidos na primeira tela:

- 🔗 **Conectado ao meu Finora:** os números reais do Finora do computador (Pluggy / Open
  Finance), pela Tailscale. Os dados continuam no computador; o celular só lê e escreve pela API.
- 🧪 **Demonstração:** um mês de exemplo guardado só no celular, num banco SQLite. Funciona sem
  internet e serve para a apresentação.

## ✨ O que ele faz

Nos dois modos:

| | |
|---|---|
| 🔒 **Bloqueio** | Face ID, digital ou código do aparelho, e o olho que esconde os valores |
| 🏠 **Início** | Livre agora, Dá para gastar por dia ou no ciclo, Para onde foi e últimas transações |
| ➕ **Lançar** | Gasto ou entrada em três toques (cartão vai para a fatura, Pix sai da conta) |
| 🧾 **Transações** | Busca, filtro por categoria e troca de categoria, com "aplicar às parecidas" |
| 🐷 **Cofrinhos** | Metas em anel; tocar num cofrinho guarda dinheiro ou ajusta a meta |
| 🎯 **Orçamentos** | Barra por categoria com forma e cor: ● ok, ▲ perto do limite, ■ estourou |
| 🌗 **Tema** | Claro e escuro, seguindo o sistema |

Só no modo conectado:

| | |
|---|---|
| 🔄 **Sincronizar** | Com o banco, e conectar um banco novo pelo Pluggy Connect oficial (`react-native-pluggy-connect`) |
| 🏦 **Contas e bancos** | Saldos e o aviso de banco parado há mais de 10 dias |
| 💜 **Desejos** | O "cabe neste ciclo?" e adicionar pelo link da loja |
| 🃏 **Precisava ou foi vontade?** | O jogo de arrastar as cartas dos gastos do ciclo |
| 🤖 **Pila com IA** | Conversa livre com o modelo local (Ollama) do computador, em streaming |
| 📶 **Sem conexão** | Puxar para atualizar; offline, o app mostra os últimos números que chegaram |

## 🐷 Conheça o Pila

O Pila é o porquinho mascote do Finora, o mesmo do computador. No celular ele aparece na
entrada, nos atalhos, nos estados vazios e no chat. Tem seis humores (`happy`, `neutral`,
`worried`, `sleep`, `shy`, `celebrate`) e é desenhado em SVG com `react-native-svg`: veja
[`src/components/pila.tsx`](src/components/pila.tsx).

Sem o Finora conectado (ou com o Ollama desligado), o Pila responde perguntas prontas com
contas feitas no próprio app ([`src/domain/pila.ts`](src/domain/pila.ts)).

## 🧱 Estrutura

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
docs/           o Pila em SVG
```

## 🚀 Primeiros passos

```bash
npm install
npx expo start
```

Abra o **Expo Go** no celular e leia o QR code do terminal. O celular e o computador precisam
estar na mesma rede para o Expo Go baixar o app.

> [!NOTE]
> No iPhone, o Expo Go não tem acesso ao Face ID e pede o código do aparelho no lugar. O Face ID
> de verdade só aparece num development build (`npx expo run:ios`).

## 🔗 Conectar ao Finora do computador

Precisa do Finora **v0.2.2 ou mais novo** no computador
([baixar](https://github.com/daniellealpimenta/Finora/releases/latest)).

1. Instale a [Tailscale](https://tailscale.com/download) no computador e no celular, com a
   mesma conta, e deixe ligada nos dois.
2. No Finora do computador, abra **Perfil › Celular** e ligue o **acesso pelo celular**. No
   programa, feche e abra de novo para valer.
3. Toque em **Parear um celular**. No app, escolha **Conectar ao meu Finora** e leia o QR, ou
   digite o endereço (`100.x.y.z:8765`) e o código de 6 dígitos, que valem 5 minutos. Também dá
   para entrar com e-mail e senha (e o código de 2 etapas, se tiver).

No modo web do Finora (rodando pelo código), a API usa a porta `8000`:
`FINORA_LISTEN_ALL=1 uv run uvicorn app.main:app --host 0.0.0.0 --port 8000`.

Um gasto anotado no celular fica como lançamento manual até o banco mandar o mesmo gasto: aí o
sync troca um pelo outro e mantém a categoria escolhida.

## 💾 Dados

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

### 🧪 Testes e lint

```bash
npm test            # regras de ciclo, previsão e QR de pareamento (Jest)
npm run typecheck   # TypeScript
npx expo lint       # ESLint
npm run db:generate # nova migração depois de mudar src/db/schema.ts
```

## 🛡️ Segurança

- 📱 O celular recebe um token de aparelho próprio, guardado no armazenamento seguro do sistema
  (Keychain ou Keystore). A senha não fica no aparelho.
- 🔐 Fora do computador, a API do Finora só aceita aparelhos pareados e só pela Tailscale, uma
  rede privada e criptografada (WireGuard). Nada fica exposto na internet.
- 👋 No Finora, em **Perfil › Celular**, aparecem os aparelhos pareados; dá para desconectar
  qualquer um. No app, **Mais › Desconectar este celular** faz o mesmo.
- 🙈 O segredo da Pluggy nunca vem para o celular: o app recebe só um *connect token* temporário.
- 🤖 O Pila com IA usa o modelo do seu computador; nenhuma transação vai para API de terceiros.

## 🗺️ Roadmap

- [x] Modo demonstração com SQLite local e mês de exemplo
- [x] Pareamento com o Finora pela Tailscale (QR, código ou login)
- [x] Lançamentos do celular conciliados no sync
- [x] Pluggy Connect, desejos, jogo "Precisava?" e Pila com IA
- [ ] Development build com Face ID de verdade (EAS)
- [ ] Funcionar fora de casa sem o computador ligado (Finora na nuvem)
