# FrontEndDesafioFast

Frontend Angular para integração com a API DesafioFastBackend (.NET), com autenticação JWT, visualização de dados e operações administrativas de CRUD.

## 1. Visão geral

O projeto possui três áreas principais:

- Workshops
	- Lista de workshops.
	- Detalhe em modal lateral com participantes.
	- Gráfico de pizza de presença (presentes vs ausentes).
	- CRUD para perfil Admin.

- Colaboradores
	- Lista de colaboradores.
	- Detalhe em modal lateral com gráfico de barras de participação em workshops.
	- CRUD para perfil Admin.

- Presenças
	- Lista de presenças com workshop + colaborador + check-in.
	- CRUD para perfil Admin.

## 2. Perfis e permissões

- Admin
	- Pode consultar e gerenciar CRUD de workshops, colaboradores e presenças.

- Reader
	- Pode apenas consultar dados.
	- Não visualiza ações de criação/edição/exclusão.

## 3. Stack técnica

- Angular 21 (standalone components)
- TypeScript
- RxJS
- Angular Router
- Angular HttpClient
- Vitest (testes)

## 4. Pré-requisitos

- Node.js 20+
- npm 10+
- API backend em execução

## 5. Configuração de ambiente

O frontend usa as URLs da API em:

- src/environments/environment.ts

Valor atual:

```ts
export const environment = {
	apiBaseUrl: 'https://localhost:7114'
	apiBaseUrls: ['https://localhost:7114', 'http://localhost:5084']
};
```

Se sua API estiver em outra URL/porta, altere esse valor.

## 6. Como rodar

1. Instalar dependências:

```bash
npm install
```

2. Rodar em modo desenvolvimento:

```bash
npm start
```

3. Acessar no navegador:

```text
http://localhost:4200
```

## 7. Login

Credenciais esperadas (conforme backend):

- Admin
	- usuário: admin
	- senha: admin123

- Reader
	- usuário: reader
	- senha: reader123

Após login, o token JWT é armazenado localmente e anexado automaticamente nas chamadas protegidas.

## 8. Rotas da aplicação

- /login
- /workshops
- /colaboradores
- /presencas

Rotas de dados são protegidas por autenticação.

## 9. Scripts úteis

- Desenvolvimento:

```bash
npm start
```

- Build de produção:

```bash
npm run build -- --watch=false
```

- Testes:

```bash
npm run test -- --watch=false
```

## 10. Detalhes de integração com backend

### 10.1. Autorização

O frontend envia automaticamente:

```http
Authorization: Bearer <token>
```

Se a API retornar 401, o frontend limpa sessão e redireciona para login.

### 10.2. Data/hora (workshops e presenças)

Para evitar deslocamento de fuso horário, os campos datetime-local são enviados em horário local (sem sufixo Z).

No caso de workshop, para compatibilidade com DTOs diferentes no backend, o payload envia:

- data
- dataHora

com o mesmo valor local.

## 11. Estrutura resumida

```text
src/
	app/
		guards/
		interceptors/
		models/
		pages/
			login/
			workshops/
			colaboradores/
			presencas/
		services/
		utils/
	environments/
```

## 12. Troubleshooting

### Erro de CORS

- Garanta que a API permita origem http://localhost:4200.

### Não autentica / 401

- Verifique se o backend está rodando.
- Verifique credenciais.
- Verifique validade/expiração de token.

### Lista não atualiza após CRUD

- Confira no DevTools (Network) se a operação retornou sucesso.
- Confira se houve erro 400/409 com mensagem de validação/regra.

### Horário diferente do digitado

- O frontend já envia horário local.
- Se persistir divergência, verifique conversão no backend (UTC/local) e mapeamento DTO.

## 13. Qualidade

Antes de subir alterações, recomenda-se executar:

```bash
npm run build -- --watch=false
npm run test -- --watch=false
```

## 14. Observação final

Este frontend foi pensado para integração com a API DesafioFastBackend e já contempla fluxo de autenticação, leitura por Reader e gestão administrativa por Admin.
