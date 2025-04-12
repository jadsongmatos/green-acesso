\# green-acesso

Desafio Técnico Backend NodeJS

Este repositório contém o código fonte do **green-acesso**, uma aplicação Next.js que demonstra um desafio técnico focado em backend. Inclui upload de arquivos, processamento de CSV e PDF, autenticação e interação com banco de dados usando tecnologias modernas.

---

## Tabela de Conteúdos

- [Tabela de Conteúdos](#tabela-de-conteúdos)
- [Visão Geral](#visão-geral)
- [Stack Tecnológico](#stack-tecnológico)
- [Funcionalidades](#funcionalidades)
  - [Módulo de Upload (TUS + Uppy)](#módulo-de-upload-tus--uppy)
  - [Processamento de CSV (`/api/p/process/csv`)](#processamento-de-csv-apipprocesscsv)
  - [Processamento de PDF (`/api/p/process/pdf`)](#processamento-de-pdf-apipprocesspdf)
  - [Consulta de Boletos e Relatório (`/api/p/boletos`)](#consulta-de-boletos-e-relatório-apipboletos)
  - [Prisma: Schema e Migrations](#prisma-schema-e-migrations)
  - [Autenticação (NextAuth) *(extra)*](#autenticação-nextauth-extra)
  - [Frontend (React + MUI + Toolpad)](#frontend-react--mui--toolpad)
- [Começando](#começando)
  - [Variáveis de Ambiente](#variáveis-de-ambiente)
  - [Instalação](#instalação)
- [Uso](#uso)
  - [Autenticação](#autenticação)
  - [Dashboard](#dashboard)
  - [Endpoints da API](#endpoints-da-api)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Esquema do Banco de Dados](#esquema-do-banco-de-dados)
- [Motivações Técnicas](#motivações-técnicas)
  - [Por que TUS?](#por-que-tus)
  - [Por que Banco de Dados Neon?](#por-que-banco-de-dados-neon)

---

## Visão Geral

`green-acesso` é uma aplicação desenvolvida como desafio técnico de backend que demonstra:

- **Uploads Resumíveis** via protocolo TUS, integrados com Uppy.
- **Processamento de CSV**: parsing, validação e inserção em massa de registros de `Lote` e `Boleto`.
- **Processamento de PDF**: extração de texto de PDFs para correspondência e divisão de boletos, salvando páginas individuais.
- **Autenticação**: login seguro com NextAuth (Google) e gerenciamento de sessão com Prisma.
- **API**: rotas REST para consulta, filtragem e geração de relatórios de boletos, incluindo geração de PDF.
- **Modelagem de Banco de Dados**: esquema Prisma com PostgreSQL (adapter Neon).

## Stack Tecnológico

- **Next.js** 15 (App Router)
- **React** 19 + TypeScript
- **Prisma** 6 com adapter Neon
- **PostgreSQL** (Neon serverless)
- **Uppy** + **Tus** para uploads
- **PapaParse**, **Zod** para CSV
- **pdfjs-dist**, **pdf-lib** para PDF
- **jsPDF** + **autoTable** para relatórios em PDF
- **Material UI** para componentes de UI
- **NextAuth** para autenticação

## Funcionalidades

### Módulo de Upload (TUS + Uppy)

- **TUS Server:** configurado em `src/pages/api/upload/[[...file]].ts` com `bodyParser: false` e `@tus/file-store`.
- **Uppy (frontend):** componente `Uppy.tsx` + contexto `UppyContext.tsx`:
  - Gerencia estado de arquivos (pending, processing, completed, error).
  - Persiste lista de arquivos em `localStorage`.
  - Ação de `processFile` dispara chamada às rotas de processamento.

### Processamento de CSV (`/api/p/process/csv`)

- **Leitura:** `fs/promises.readFile` do arquivo salvo em `files/{fileId}`.
- **Parsing:** PapaParse com `;` como delimitador, cabeçalho `header: true`.
- **Validação:** Zod valida cada linha (nome, unidade, valor, linha_digitavel).
- **Persistência de lotes:**
  - Cria novo `Lote` para cada `unidade`, trata erro `P2002` para lotes já existentes.
  - Atribui `id_lote` a cada linha.
- **Gravação de boletos:** `prisma.boleto.createMany` com dados validados e slugificação do nome.

### Processamento de PDF (`/api/p/process/pdf`)

- **Leitura:** carrega buffer do arquivo em `files/{fileId}`.
- **Extração de texto:** usa `pdfjs-dist` para ler cada página e extrair texto bruto.
- **Slugify:** converte texto em nome padronizado para busca no banco.
- **Busca de boleto:** `prisma.boleto.findFirst` por `nome_sacado`.
- **Geração de PDF por página:** copia página correspondente e salva em `files/pdf/{boleto.id}.pdf` usando `pdf-lib`.

### Consulta de Boletos e Relatório (`/api/p/boletos`)

- **Filtros opcionais:**
  - `nome` (contém, case-insensitive)
  - `valor_inicial` e `valor_final`
  - `id_lote`
- **Relatório PDF:** se `relatorio=1`, gera PDF com `jsPDF` + `autoTable` e retorna `base64`.

### Prisma: Schema e Migrations

- **Modelos:**
  - `Lote` (id, unidade, ativo, criado_em)
  - `Boleto` (id, nome_sacado, id_lote, valor, linha_digitavel, ativo, criado_em)
- **Migrations:** histórico em `prisma/migrations`, incluindo alteração de `nome` → `unidade` no `Lote`.

### Autenticação (NextAuth) *(extra)*

- **Provedor Google:** configurado em `src/lib/auth.config.ts`.
- **Adapter Prisma:** persistência de usuários e sessões.
- **Middleware:** protege `/dashboard`, redireciona não autenticados para `/auth/signin`.
- **Páginas customizadas:** `src/app/auth/signin/page.tsx` com Toolpad SignInPage.

> **Observação:** o desafio original não exigia autenticação, mas foi implementada como extra para demonstrar controle de acesso.

### Frontend (React + MUI + Toolpad)

- **Dashboard de arquivos:** `src/app/dashboard/page.tsx` utiliza contexto Uppy e componentes `Uppy` e `FilesList`.
- **Design system:** MUI (Material UI) para componentes e temas, Toolpad Core para layout e navegação.

## Começando

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```bash
DATABASE_URL=postgresql://usuario:senha@host:porta/banco
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
AUTH_SECRET=uma_chave_secreta
```

### Instalação

```bash
npm install
npm run dev
```

## Uso

### Autenticação

- Acesse `http://localhost:3000/auth/signin` para fazer login via Google.

### Dashboard

- Após o login, acesse `/dashboard`.
- Faça upload de arquivos CSV ou PDF.
- Clique no ícone de play para processar arquivos (CSV → banco de dados, PDF → extração de páginas).
- Acompanhe o status: `pending`, `processing`, `completed`, `error`.

### Endpoints da API

- **GET** `/api/p/boletos` – Lista boletos, aceita parâmetros de consulta:
  - `?nome=...` (string)
  - `?valor_inicial=...&valor_final=...` (números)
  - `?id_lote=...` (número)
  - `?relatorio=1` (relatório PDF)

- **POST** `/api/p/process/csv` – Processa arquivo CSV enviado por `fileId`.
- **POST** `/api/p/process/pdf` – Processa arquivo PDF enviado por `fileId`.

## Estrutura do Projeto

```
├── prisma/           # Esquema Prisma & migrações
├── src/
│   ├── app/          # Páginas & rotas API do Next.js App Router
│   ├── components/   # Componentes React (Uppy, FilesList, Content)
│   ├── contexts/     # Contexto React para Uppy
│   ├── lib/          # Configurações de Auth & Prisma
│   └── pages/        # Rota API legada do Next.js para upload TUS
└── files/            # Armazenamento de arquivos enviados
```

## Esquema do Banco de Dados

- **Lote**: `id`, `unidade` (único), `ativo`, `criado_em`
- **Boleto**: `id`, `nome_sacado`, `id_lote` → Lote, `valor`, `linha_digitavel`, `ativo`, `criado_em`

## Motivações Técnicas

### Por que TUS?

TUS é um protocolo resiliente para uploads grandes ou instáveis. Foi escolhido por oferecer:

- Suporte a **uploads pausáveis e retomáveis**.
- Compatibilidade com **ambientes distribuídos** e frontends modernos (Uppy).
- Evita problemas comuns de timeouts e falhas de rede durante upload de arquivos grandes.

### Por que Banco de Dados Neon?

Neon foi escolhido por:

- Oferecer um **PostgreSQL serverless e escalável**, com cold-starts rápidos e camada gratuita generosa.
- Ter **integração nativa com Prisma**, facilitando o uso com TypeScript.
- Ser ideal para aplicações modernas com picos de uso e ambientes em nuvem.

