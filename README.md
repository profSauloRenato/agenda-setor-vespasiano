# 📅 Agenda Setor Vespasiano (React Native & Supabase/RLS)

Este repositório contém o código-fonte da aplicação mobile **Agenda Setor Vespasiano**, uma solução multiplataforma desenvolvida para gerenciar a agenda de eventos e reuniões de forma segura, escalável e de baixo custo.

O projeto é baseado na stack **React Native/TypeScript** no front-end e **Supabase (PostgreSQL + RLS)** para o Backend as a Service (BaaS), garantindo que a segurança e o controle de acesso sejam impostos diretamente no nível do banco de dados.

## ✨ Destaques de Arquitetura

* **Multiplataforma:** Código único em React Native para Android e iOS.
* **Segurança por Design (RBAC/RLS):** Utilização do **Row Level Security (RLS)** do PostgreSQL, gerenciado pelo Supabase, para aplicar o Princípio do Privilégio Mínimo. Usuários só conseguem visualizar ou interagir com os dados para os quais seus cargos concedem permissão.
* **Baixo Custo:** Utiliza as Free Tiers do Supabase e do Firebase Cloud Messaging (FCM), mantendo o custo de infraestrutura recorrente em zero.
* **Arquitetura Limpa:** Implementação de **CLEAN Architecture com MVVM (Model-View-ViewModel)** e Use Cases para desacoplar a lógica de negócio da camada de interface (React Native).

## 🛠️ Stack Tecnológica

| Componente | Tecnologia | Justificativa Principal |
| :--- | :--- | :--- |
| **Front-end (Mobile)** | React Native, TypeScript | Multiplataforma, aproveitamento de expertise. |
| **Backend as a Service (BaaS)** | Supabase (PostgreSQL) | Custo Zero, RLS robusto para RBAC Avançado. |
| **Linguagem** | JavaScript + TypeScript | Tipagem estática para projetos escaláveis e segura. |
| **Notificações Push** | Firebase Cloud Messaging (FCM) | Serviço gratuito e escalável para alertas e mensagens. |
| **Arquitetura** | CLEAN Architecture + MVVM | Separação de responsabilidades e testabilidade. |

## 🚀 Roadmap de Desenvolvimento (Visão Geral)

O desenvolvimento está dividido em fases, com foco inicial na segurança e na estrutura da base de dados.

| Fase | Foco Principal | Esforço Estimado |
| :--- | :--- | :--- |
| **Fase 1** | Configuração e Autenticação (Setup Básico e RLS Inicial) | 3 Semanas |
| **Fase 2** | Painel Administrativo e RBAC Core (CRUD Master Data e RLS Admin) | 4 Semanas |
| **Fase 3** | Agenda, RSVP e Lógica de Lembretes (Visualização Segura e Infra de Push) | 4 Semanas |
| **Fase 4** | Módulo de Envio de Mensagens Seguras (Segmentação e Validação Backend) | 3 Semanas |
| **Fase 5** | Testes Críticos de Segurança (RBAC/RLS), Refino e Publicação | 4 Semanas |

---
