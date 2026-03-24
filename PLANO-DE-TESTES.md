# **Plano de Teste — Shortz-App**

## **1. Identificação**

* **Projeto:** Shortz-App  
* **Versão:** 1.0
* **Grupo:** Gabriel Chiarelli; Gabriel Vinicius Batista; Marcelo Filho; Vinicius Pollnow; Raoni Zardo
* **Data de criação:** 10/03/2026  
* **Objetivo:** Garantir que as funcionalidades de cadastro, autenticação, upload e feed funcionem conforme os requisitos de negócio e padrões de segurança, detectando falhas precocemente antes da entrega.

## **2. Escopo dos Testes**

### **2.1. Em Escopo (O que SERÁ testado)**

* Cadastro e login de usuários (validação de campos e autenticação).  
* Edição de perfil e regras de armazenamento de dados sensíveis.  
* Upload de vídeos e verificação de restrições (tamanho, formato e tempo).  
* Funcionalidades do feed (priorizado e global) e interações (curtidas e comentários).  
* Acessos ao painel administrativo.

### **2.2. Fora de Escopo**

* Testes de carga, estresse e desempenho em larga escala.
* Testes de compatibilidade em múltiplos dispositivos ou navegadores específicos.
* Integrações com serviços de terceiros (redes sociais externas).

## **3. Estratégia de Testes**

Nossa estratégia de testes é fundamentada no conceito de **Shift-Left Testing**, que preconiza a integração das atividades de teste o mais cedo possível no ciclo de desenvolvimento. Isso nos permite identificar e corrigir defeitos de forma proativa, reduzindo custos e tempo de retrabalho. 

A estrutura segue e orienta a proporção dos tipos de teste baseada na **Pirâmide de Testes**:

1. **Testes Unitários:** Constituem a base da pirâmide, focando na validação de unidades mínimas de código, validando funções isoladas como validação de dados, hashing de senhas, formatação de e-mail e regras de negócio limitadoras.
2. **Testes de Integração:** Localizados no meio da pirâmide, garantem a comunicação eficaz entre diferentes módulos. São aplicados nas rotas de autenticação (`/register`, `/login`), middlewares de upload do multer (`/videos/upload`), proteção de rotas privadas e interações com banco de dados.
3. **Testes Black-Box (Sistema/E2E):** No topo da pirâmide, estes testes simulam o comportamento do usuário final sem necessidade de conhecimento do código interno, validando fluxos completos da aplicação através de técnicas de análise sistemática.

### **Ferramentas utilizadas**
* `Vitest` para estruturação e execução de testes automatizados (unitários e de integração). 
* `Supertest` para simular as requisições na API HTTP.
* `c8/coverage` para geração de relatórios de cobertura do código.
* `GitHub Actions` para CI/CD (Integração e automação).

## **4. Análise de Riscos e Mitigação**

A identificação e gestão de riscos são cruciais para priorizar os esforços de teste. Agora, mapeamos exatamente **12 Riscos Críticos (R-01 a R-12)** para que batam perfeitamente (1:1) com nossa modelagem **Black-Box**.

| ID | Descrição | Categoria | Prob. | Impacto | Prioridade | Estratégia de Mitigação |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| R-01 | Senha armazenada em texto plano | Segurança | Alta | Crítico | Crítica | Testes de integração na camada auth para validar que ela use hash via bcrypt ANTES de salvar no DB. |
| R-02 | Upload de vídeo aceitando .exe | Func/Segurança | Alta | Crítico | Crítica | Análise de Limite e Particionamento no middleware multer para validação de MIME-type e extensão permitidas (MP4/MOV). |
| R-03 | Banco indisponível derruba app inteira | Técnico | Média | Alto | Alta | Testes simulando falha de instanciamento do MySQL e garantindo exception segura (`try/catch`). |
| R-04 | E-mail inválido passa no cadastro | Funcional | Alta | Alto | Alta | Testes unitários utilizando classes inválidas e regex na requisição para bloqueio imediato com HTTP 400. |
| R-05 | Contador de curtidas duplicando | Funcional | Alta | Médio | Média | Teste de estresse simples (Race Condition) acionando requisições em paralelo e verificando contagem única. |
| R-06 | Rota admin acessível sem login | Segurança | Média | Crítico | Crítica | Testes Black-box simulando usuário não-autorizado que tenta alcançar as endpoints de admin (Retorno esperado 401/403). |
| R-07 | Comentário executando Script (XSS) | Segurança | Alta | Crítico | Crítica | Envio de injeção de payload maliciosa simples `<script>alert(1)</script>` para validar eficácia da sanitização EJS/Backend. |
| R-08 | Sistema aceita vídeos > 60 segundos | Negócio | Média | Médio | Média | Aplicação de Análise de Valor-Limite enviando dados de duração no metadata extrapolando a regra (e.g., 61s). |
| R-09 | Feed fallback mostra dados errados | Funcional | Baixa | Alto | Média | Testes integrados para cold start: Usuário recém criado exibindo últimos posts gerais ao invés de tela em branco. |
| R-10 | Erro silencioso em arquivo gigante | Técnico | Alta | Baixo | Baixa | Forçar upload de imagem pesada para perfil e rastrear presença de JSON legível de log erro em vez do server calar. |
| R-11 | Cadastro permite senhas muito curtas | Segurança | Alta | Alto | Alta | Validar via Equivalência recusa de senhas com menos de 8 caracteres exigidos pelo app. |
| R-12 | Vídeo Privado exposto publicamente | Func/Privacidade | Alta | Crítico | Crítica | Aplicar Tabela de Decisão pra impedir exposição cruzada via views a menos que o flag de permissão do DB aprove. |

### **Detalhamento dos Erros (Tópicos de Defeitos Simulados)**

#### **R-1. Senha não guardada com criptografia**

* **Como ocorre:** O servidor salva diretamente do req.body sem aplicar a biblioteca bcrypt.  
```js
  const createUser = async (req, res) => {  
    const { email, password } = req.body;  
    // Falha aqui: Não houve hash da senha antes de salvar  
    const newUser = await User.create({ email, password });  
    res.status(201).json(newUser);  
  };
```

* **O que ele afeta:** Segurança de credenciais dos usuários.  
* **Sua Gravidade:** Crítico  
* **Como reproduzir:** Cadastre um usuário com senha "123456", acesse o MySQL no Workbench e olhe a coluna password na tabela Users.  
* **Impacto:** Vazamento de banco de dados resulta em total exposição das senhas dos usuários.  
* **Categoria:** Não-Funcional (Segurança)  
* **Sistema Referência:** Módulo de Autenticação / Banco de Dados

#### **R-2. Upload com falha aceitando arquivos maliciosos**

* **Como ocorre:** O middleware do multer não filtra o tipo (mimetype) do arquivo submetido.  
```js
  // Sem fileFilter definido  
  const upload = multer({ dest: 'uploads/videos/' });   
  router.post('/upload', upload.single('video'), videoController.create);
```

* **O que ele afeta:** Integridade do Servidor e Segurança de Arquivos.  
* **Sua Gravidade:** Crítico  
* **Como reproduzir:** Acesse a tela de upload de vídeo, selecione um arquivo virus.exe e clique em enviar.  
* **Impacto:** Permite que atacantes façam upload de malwares (RCE) comprometendo o servidor inteiro.  
* **Categoria:** Funcional / Segurança  
* **Sistema Referencia:** Upload de Vídeo (Multer)

#### **R-3. Banco de dados indisponível (Crash sem tratamento)**

* **Como ocorre:** As requisições ao banco não utilizam bloco try/catch para capturar exceções de conexão.  
```js
  const getFeed = async (req, res) => {  
    // Falta o try/catch. Se o banco falhar, o Node vai crashar (Unhandled Promise Rejection) ou causar erro silencioso
    const videos = await Video.findAll();   
    res.render('home', { videos });  
  };
```

* **O que ele afeta:** Disponibilidade do Shortz-App.  
* **Sua Gravidade:** Alto  
* **Como reproduzir:** Pare o serviço do MySQL localmente e tente dar F5 na página inicial.  
* **Impacto:** O servidor desliga em vez de mostrar uma tela de erro "Tente novamente mais tarde", derrubando a navegação para todos.  
* **Categoria:** Técnico  
* **Sistema Referência:** Conexão Database / Feed Global

#### **R-4. E-mail inválido cadastrando normalmente**

* **Como ocorre:** A validação confere apenas se a string existe, mas não verifica o formato padrão (@ e domínio). 
```js
  const { email } = req.body;  
  if (!email) {  
    return res.status(400).send("Email obrigatório");  
  }  
  // Falta Regex verificando o formato de email  
  next();
```

* **O que ele afeta:** Consistência da base e comunicação com o usuário.  
* **Sua Gravidade:** Alto  
* **Como reproduzir:** Na tela /register, digite "teste123" no campo de e-mail e clique em cadastrar.  
* **Impacto:** Usuário cria uma conta mas nunca conseguirá recuperar a senha, e o sistema acumula lixo na base de dados.  
* **Categoria:** Funcional  
* **Sistema Referência:** Formulário de Cadastro / Validação de Request

#### **R-5. Contador de curtidas duplicando (Race Condition)**

* **Como ocorre:** Requisições rápidas incrementam o valor local sem travar (lock) a leitura na tabela. 
```js 
  const video = await Video.findByPk(req.params.id);  
  // Incremento local vulnerável a múltiplas requisições simultâneas  
  video.likesCount++;   
  await video.save();
```

* **O que ele afeta:** Veracidade dos dados e estatísticas do vídeo.  
* **Sua Gravidade:** Médio  
* **Como reproduzir:** Use uma ferramenta como Postman para enviar 10 requisições POST para `/vídeos/1/like` no exato mesmo milissegundo.  
* **Impacto:** O vídeo ganha curtidas artificialmente distorcendo o algoritmo de relevância.  
* **Categoria:** Funcional  
* **Sistema Referência:** Interação de Likes em Vídeos

#### **R-6. Rota administrativa totalmente exposta**

* **Como ocorre:** O mapeamento das rotas admin foi feito sem middleware de controle de sessão.
```js  
  // app.use(authMiddleware, adminRoutes); -> O que deveria ser feito  
  app.use('/admin', adminRoutes); // Como está codificado
```

* **O que ele afeta:** Permissões do sistema e privacidade de dados.  
* **Sua Gravidade:** Crítico  
* **Como reproduzir:** Abra uma aba anônima (sem estar logado) e digite localhost:3000/admin/users.  
* **Impacto:** Visitantes anônimos ganham privilégios para banir perfis e deletar qualquer vídeo do Shortz-App.  
* **Categoria:** Não-Funcional (Segurança)  
* **Sistema Referência:** Painel Administrativo

#### **R-7. Injeção de Scripts em comentários**

* **Como ocorre:** Uso equivocado de tags de renderização no frontend (`<%- %>` em vez de `<%= %>`). 
```js 
  <div class="comment-body">  
    <!-- Renderização sem escape de HTML -->  
    <% comment.text %>   
  </div>
```

* **O que ele afeta:** Segurança do cliente e do frontend (Navegador).  
* **Sua Gravidade:** Crítico  
* **Como reproduzir:** No campo de comentário de um vídeo, digite `<script>alert('Hack')</script>` e poste. Recarregue a página do vídeo.  
* **Impacto:** Quando outros usuários abrirem o vídeo, o script roda no computador deles, podendo roubar tokens de sessão.  
* **Categoria:** Não-Funcional (Segurança)  
* **Sistema Referencia:** Comentários / Engine EJS

#### **R-8. Vídeos com mais de 1 minuto passando no upload**

* **Como ocorre:** O servidor verifica o "tamanho" do arquivo (bytes), mas ignora a validação do "tempo" de duração do metadado do vídeo.  
```js
  if (req.file.size > 50000000) {  
    return res.status(400).send("Arquivo muito pesado");  
  }  
  // Falta a validação: if (videoDuration > 60) return erro;
```

* **O que ele afeta:** Regra de negócio núcleo ("Shorts").  
* **Sua Gravidade:** Médio  
* **Como reproduzir:** Faça upload de um vídeo de baixa resolução, com `2MB` de tamanho, mas que tenha 3 minutos de duração.  
* **Impacto:** Desconfigura o propósito principal do aplicativo (vídeos curtos) prejudicando o fluxo dinâmico do Feed.  
* **Categoria:** Funcional / Negócio  
* **Sistema Referência:** Regras de Upload de Vídeo

#### **R-9. Feed Priorizado Vazio gera Fallback incorreto**

* **Como ocorre:** Se o usuário não segue ninguém, o sistema deveria listar o feed Global, mas lista apenas vídeos de si mesmo.  
```js
  const following = await getFollowing(userId);  
  if (following.length === 0) {  
    // Deveria ser Video.findAll() global (ordenado por recente)  
    return await Video.findAll({ where: { userId } });  
  }
```

* **O que ele afeta:** Descoberta de conteúdo para novos usuários (Cold Start).  
* **Sua Gravidade:** Alto  
* **Como reproduzir:** Crie um perfil novo. Não siga ninguém e acesse a aba "Home/Feed". Estará totalmente vazia.  
* **Impacto:** Alto risco de evasão. Um usuário novo achará que a rede não tem conteúdo e vai desinstalar/abandonar.  
* **Categoria:** Funcional  
* **Sistema Referência:** Algoritmo do Feed e Home

#### **R-10. Erro silencioso em Upload de Imagem de Perfil**

* **Como ocorre:** Não há limite definido na instância do Multer e a falha de estourar a memória acontece sem resposta ao cliente.  
```js
  const uploadProfile = multer({ dest: 'uploads/profiles/' });   
  // O Multer tenta engolir arquivos de 100MB e ocorre timeout sem JSON de erro.
```

* **O que ele afeta:** Usabilidade e Tráfego de Rede.  
* **Sua Gravidade:** Baixo  
* **Como reproduzir:** Tente atualizar a foto do perfil com uma imagem `.tiff` de `30MB`.  
* **Impacto:** O site ficará carregando até dar timeout, gerando uma experiência confusa. O usuário não sabe se o erro foi da rede dele ou da imagem.  
* **Categoria:** Técnico / Usabilidade  
* **Sistema Referência:** Edição de Perfil

#### **R-11. Cadastro permite senhas muito curtas**
* **Como ocorre:** A rota de `/register` não impõe limite mínimo de 8 caracteres no corpo da requisição.
```js
  if (!password) return res.status(400).send("Senha vazia");  
  // Faltou validação: if (password.length < 8) return erro;
  const hash = await bcrypt.hash(password, 10);
```
* **O que ele afeta:** Segurança de Força Bruta contra a conta.
* **Sua Gravidade:** Alto
* **Como reproduzir:** Tente cadastrar usando a senha "123".  
* **Impacto:** Contas vulneráveis a ataques de dicionário ou brute-force.
* **Categoria:** Funcional / Segurança
* **Sistema Referência:** Validação de Registro

#### **R-12. Privacidade violada (Vídeo Privado Exposto)**
* **Como ocorre:** A query do banco que resgata vídeos de um perfil não filtra pelo campo `isPrivate`.
```js
  // Resgata tudo do userId, sem ocultar os "private: true" para terceiros
  const userVideos = await Video.findAll({ where: { userId: openProfileId } });
```
* **O que ele afeta:** Privacidade do usuário ativo.
* **Sua Gravidade:** Crítico
* **Como reproduzir:** Usuário "A" posta vídeo Privado. Usuário "B" acessa perfil do User "A" e consegue reproduzir.
* **Impacto:** Constrangimento e quebra severa dos direitos de privacidade.
* **Categoria:** Segurança / Permissões
* **Sistema Referência:** Query de Feed e Consulta de Perfis

## **5. Modelagem de Testes (Técnicas Black-Box)**

Nesta seção, aplicamos as técnicas de modelagem Black-Box exigidas por rubrica para garantir que os limites do sistema e as regras de negócio sejam rigorosamente validados. Cada funcionalidade crítica foi analisada com a técnica mais adequada, conectando diretamente com os 12 Riscos catalogados na seção anterior.

---

### **5.1. Upload de Vídeos — Particionamento de Equivalência e Análise de Valores-Limite**
**Riscos cobertos:** R-02 (arquivo proibido), R-08 (duração > 60s), R-10 (arquivo gigante)

**Regra:** O arquivo do upload deve ser um vídeo no formato MP4 ou MOV, ter duração máxima de 1 minuto (60 segundos) e tamanho entre 1 MB e 50 MB.

| Campo | Classe Válida | Classes Inválidas |
| :--- | :--- | :--- |
| **Duração** | 1 a 60 segundos | < 1 segundo; > 60 segundos |
| **Tamanho** | 1 MB a 50 MB | < 1 MB; > 50 MB |
| **Formato** | .mp4, .mov | .exe, .jpg, .pdf, .txt, .avi |

**Análise de Valores-Limite (Duração):**

| Limite | Valor Mínimo (1s) | Abaixo do Mín. | Valor Máximo (60s) | Acima do Máx. |
| :--- | :--- | :--- | :--- | :--- |
| **Valores Teste** | 1s | 0s | 60s | 61s |

**Análise de Valores-Limite (Tamanho do Arquivo):**

| Limite | Valor Mínimo (1 MB) | Abaixo do Mín. | Valor Máximo (50 MB) | Acima do Máx. |
| :--- | :--- | :--- | :--- | :--- |
| **Valores Teste** | 1 MB | 0.5 MB | 50 MB | 51 MB |

---

### **5.2. Cadastro de Usuário — Particionamento de Equivalência e Valores-Limite**
**Riscos cobertos:** R-04 (e-mail inválido), R-11 (senha curta)

**Regra:** O e-mail deve conter formato válido (`usuario@dominio.com`). A senha deve ter no mínimo 8 caracteres.

| Campo | Classe Válida | Classes Inválidas |
| :--- | :--- | :--- |
| **E-mail** | usuario@dominio.com | "teste123" (sem @); "@dominio.com" (sem user); "user@" (sem domínio) |
| **Senha** | 8 ou mais caracteres (ex: "Abc12345") | "" (vazia); "123" (3 chars); "1234567" (7 chars) |

**Análise de Valores-Limite (Comprimento da Senha):**

| Limite | Abaixo do Mín. | Valor Mínimo (8) | Acima do Mínimo |
| :--- | :--- | :--- | :--- |
| **Valores Teste** | 7 caracteres | 8 caracteres | 9 caracteres |

---

### **5.3. Interação de Curtidas — Particionamento de Equivalência**
**Risco coberto:** R-05 (curtida duplicada / Race Condition)

**Regra:** Cada usuário só pode registrar 1 curtida por vídeo. Clicar novamente deve remover a curtida (toggle/unlike).

| Estado Atual | Ação do Usuário | Resultado Esperado |
| :--- | :--- | :--- |
| **Usuário NÃO curtiu o vídeo** | Clicar "Like" 1x | Contador incrementa +1 (curtida registrada) |
| **Usuário JÁ curtiu o vídeo** | Clicar "Like" 1x | Contador decrementa -1 (unlike / remoção) |
| **Usuário NÃO curtiu o vídeo** | Clicar "Like" 10x rápido | Contador final deve ser apenas +1 (debounce/lock) |
| **Usuário NÃO está logado** | Clicar "Like" | Ação bloqueada ou redirecionamento para login |

---

### **5.4. Controle de Acesso — Tabela de Decisão**
**Riscos cobertos:** R-06 (admin exposto), R-01 (auth)

**Regra:** O painel `/admin` só deve ser acessível por usuários autenticados E com role "admin". Usuários comuns e visitantes anônimos devem ser barrados.

| Condições \ Ações | R1 | R2 | R3 | R4 |
| :--- | :--- | :--- | :--- | :--- |
| **Usuário está autenticado?** | S | S | N | N |
| **Usuário possui role "admin"?** | S | N | S | N |
| **Ação: Permitir acesso ao `/admin`** | Sim | Não | Não | Não |
| **Ação: Retornar erro 403/redirect** | Não | Sim | Sim | Sim |

---

### **5.5. Sanitização de Comentários (XSS) — Particionamento de Equivalência**
**Risco coberto:** R-07 (injeção de script)

**Regra:** Todo texto inserido em comentários deve ser exibido como texto plano (string), nunca interpretado como HTML ou JavaScript pelo navegador.

| Tipo de Input | Classe | Resultado Esperado |
| :--- | :--- | :--- |
| Texto comum ("Ótimo vídeo!") | Válida | Exibido normalmente no DOM |
| Tag HTML (`<b>negrito</b>`) | Inválida (potencial) | Exibido como texto literal: `<b>negrito</b>` |
| Script malicioso (`<script>alert(1)</script>`) | Inválida (ataque) | Exibido como string pura, sem execução |
| Event handler (`<img onerror=alert(1)>`) | Inválida (ataque) | Tag renderizada como texto, sem disparar evento |
| String vazia ("") | Inválida | Comentário bloqueado ou ignorado pelo form |

---

### **5.6. Visibilidade do Feed — Tabela de Decisão**
**Riscos cobertos:** R-09 (fallback), R-12 (privacidade)

**Regra:** Um vídeo só deve aparecer no feed se: (1) O vídeo for público, OU (2) O vídeo for privado mas o visualizador for o próprio dono.

| Condições (S/N) \ Ações | R1 | R2 | R3 | R4 |
| :--- | :--- | :--- | :--- | :--- |
| **O Vídeo é Público?** | S | S | N | N |
| **O Visualizador é o Dono?** | S | N | S | N |
| **Ação: Exibir Vídeo no Feed** | Sim | Sim | Sim | Não |
| **Ação: Ocultar Vídeo** | Não | Não | Não | Sim |

---

## **6. Casos de Teste Planejados (Manuais)**

Abaixo estão listados os 12 casos de teste (1:1 com cada Risco catalogado), derivados diretamente das modelagens Black-Box da seção anterior.

| ID | Título (Risco) | Modelagem (Seção) | Pré-condições | Passos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CT-01** | Senha sem criptografia no BD (R-01) | 5.4 Tabela Decisão | Conta recém criada "testH" | 1. Registrar usuário; 2. Consultar coluna `password` no MySQL | Valor da coluna deve ser hash bcrypt, não texto plano |
| **CT-02** | Upload de arquivo proibido (R-02) | 5.1 Particionamento | Tela upload visível | 1. Selecionar "script.exe"; 2. Enviar via form | Erro 400: "Tipo de arquivo não suportado" |
| **CT-03** | Banco de dados indisponível (R-03) | N/A | MySQL desligado | 1. Acessar a Home `/` | Tela "500: Tente novamente mais tarde" sem crash |
| **CT-04** | E-mail inválido no cadastro (R-04) | 5.2 Particionamento | Tela `/register` | 1. Inserir email "teste123"; 2. Cadastrar | Erro: "Formato de e-mail inválido" |
| **CT-05** | Curtida duplicada / Race (R-05) | 5.3 Particionamento | Logado no feed | 1. Clicar 10x rápido no "Like" de um vídeo | Contador registra apenas +1 curtida |
| **CT-06** | Acesso indevido ao Admin (R-06) | 5.4 Tabela Decisão | Logado como user comum | 1. Acessar `/admin` pela barra de URL | Status HTTP 403 Forbidden |
| **CT-07** | Injeção XSS em comentário (R-07) | 5.5 Particionamento | Vídeo aberto, caixa de comentário | 1. Digitar `<script>alert(1)</script>`; 2. Postar | Texto exibido como string pura, sem executar |
| **CT-08** | Vídeo > 60s aceito (R-08) | 5.1 Valor-Limite | Tela de upload | 1. Selecionar MP4 de 90s; 2. Enviar form | Erro: "Duração máxima permitida: 60s" |
| **CT-09** | Feed vazio para novo usuário (R-09) | 5.6 Tabela Decisão | Conta nova, segue 0 pessoas | 1. Acessar `/home` | Exibe vídeos globais populares (não vazio) |
| **CT-10** | Upload de foto de perfil gigante (R-10) | 5.1 Valor-Limite | Tela editar perfil | 1. Subir imagem .tiff >30MB; 2. Enviar | Erro JSON "Payload Too Large" sem timeout |
| **CT-11** | Senha curta aceita no cadastro (R-11) | 5.2 Valor-Limite | Tela `/register` | 1. Inserir senha "123"; 2. Cadastrar | Erro: "Senha deve ter no mínimo 8 caracteres" |
| **CT-12** | Vídeo privado exposto (R-12) | 5.6 Tabela Decisão | User "A" posta privado; "B" online | 1. "B" acessa perfil de "A" | Vídeo privado de "A" não aparece para "B" |

## **7. Recursos e Ambiente**

* **Ambiente de Teste:** Node.js v20+, MySQL Local Database configurado, Vitest Framework + `Supertest`.
* **Massa de Dados Mock:** Usuários criados localmente em `fixtures` e arquivos limpos MP4 p/ validar Multer de forma simulada.
* **Pipeline / CI:** Integração Contínua com GitHub Actions garantindo a validação (`npm test`) sem bloquear PR`s.

## **8. Critérios de Aceitação**

### **8.1. Critérios de Entrada**
As atividades rigorosas de teste descritas na estratégia só vão iniciar e prosseguir quando cumprirem estas normas:
* Os módulos bases previstos pro MVP estarem desenvolvidos e acessíveis localmente (Banco limpo + Migrations e Seeds em stand-by).
* Execuções brutas manuais não crasharem (Ex: Iniciar a compilação do backend via index.js e exibir `Running at Port 3000`).
* Requisitos e modelos documentados estarem aprovados pela banca de projeto.

### **8.2. Critérios de Saída**
Os testes estarão categoricamente concluídos quando atingirem os pontos chaves de qualidade estipulada pela Pirâmide:
* **Cobertura (Coverage):** Evidenciar via c8 que as validações e testes unitários das principais rotas batem em percentual estipulado (`>= 70%`).
* **Segurança e Regras Férreas:** Zero Falhas nos riscos definidos como **Críticos** e **Altos** (Sanitização e Autenticação).
* **Validação Empírica Exímia:** Passos e Execuções dos 12 Casos de Teste (Black-Box Manuais mapeados em 1:1) gerando 100% de status verde.

### **8.3. Critérios de Suspensão**
Os desenvolvedores e QAs vão isolar e recuar a branch alvo, parando as sequências do plano quando:
* Bloqueios no banco local destruírem a constância (Queries impedindo manipulações centrais de persistência).
* Falhas e Exception nas dependências core (O módulo central do Router/Multer falhando sistematicamente e inviabilizando testes E2E).
