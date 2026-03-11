# **Plano de Teste — Shortz-App**

## **1\. Identificação**

* **Projeto:** Shortz-App  
* **Versão:** 1.0
* **Grupo:** Gabriel Chiarelli; Gabriel Vinicius Batista; Marcelo Filho; Vinicius Pollnow; Raoni Zardo
* **Data de criação:** 10/03/2026  
* **Objetivo:** Garantir que as funcionalidades de cadastro, autenticação, upload e feed funcionem conforme os requisitos de negócio e padrões de segurança, detectando falhas precocemente antes da entrega.

## **2\. Escopo**

### **O que SERÁ testado**

* Cadastro e login de usuários (validação de campos e autenticação).  
* Edição de perfil e regras de armazenamento de dados sensíveis.  
* Upload de vídeos e verificação de restrições (tamanho, formato e tempo).  
* Funcionalidades do feed (priorizado e global) e interações (curtidas e comentários).  
* Acessos ao painel administrativo.

## **3\. Estratégia**

### **Níveis de Teste**

* **Unitários:** Funções de validação de dados, hashing de senha, formatação de e-mail e regras de negócio limitadoras de tempo de vídeo.  
* **Integração:** Rotas de autenticação (`/register`, `/login`), uploads no multer (`/videos/upload`) e proteção de rotas privadas.

### **Ferramentas que podem ser utilizadas**

* `Vitest`, `Supertest`, `c8/coverage`, `GitHub Actions`

## **4\. Riscos Identificados**

| ID | Descrição | Categoria | Prob. | Impacto | Prioridade |
| :---- | :---- | :---- | :---- | :---- | :---- |
| R-01 | Senha armazenada em texto plano | Não-Funcional (Segurança) | Alta | Crítico | Crítica |
| R-02 | Upload de vídeo aceitando .exe | Funcional/Segurança | Alta | Crítico | Crítica |
| R-03 | Banco indisponível derruba app inteira | Técnico | Média | Alto | Alta |
| R-04 | E-mail inválido passa no cadastro | Funcional | Alta | Alto | Alta |
| R-05 | Botão curtir permite cliques múltiplos | Funcional | Alta | Médio | Média |
| R-06 | Rota admin acessível sem login | Não-Funcional (Segurança) | Média | Crítico | Crítica |
| R-07 | Comentário executando HTML/Script (XSS) | Não-Funcional (Segurança) | Alta | Crítico | Crítica |
| R-08 | Sistema aceita vídeos de 2 minutos | Funcional/Negócio | Média | Médio | Média |
| R-09 | Feed fallback mostra dados errados | Funcional | Baixa | Alto | Média |
| R-10 | Foto de perfil gigante não retorna erro | Técnico | Alta | Baixo | Baixa |

### **Detalhamento dos Erros (Tópicos de Defeitos Simulados)**

#### **R-1\. Senha não guardada com criptografia**

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

#### **R-2\. Upload com falha aceitando arquivos maliciosos**

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

#### **R-3\. Banco de dados indisponível (Crash sem tratamento)**

* **Como ocorre:** As requisições ao banco não utilizam bloco try/catch para capturar exceções de conexão.  
```js
  const getFeed = async (req, res) => {  
    // Falta o try/catch. Se o banco falhar, o Node vai crashar (Unhandled Promise Rejection)  
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

#### **R-4\. E-mail inválido cadastrando normalmente**

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

#### **R-5\. Contador de curtidas duplicando (Race Condition)**

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

#### **R-6\. Rota administrativa totalmente exposta**

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

#### **R-7\. Injeção de Scripts em comentários**

* **Como ocorre:** Uso equivocado de tags de renderização no frontend (`<%- %>` em vez de `<%= %>`). 
```js 
  <div class="comment-body">  
    <!-- Renderização sem escape de HTML -->  
    <% comment.text %>   
  </div>
  ```

* **O que ele afeta:** Segurança do cliente e do frontend (Navegador).  
* **Sua Gravidade:** Crítico  
* **Como reproduzir:** No campo de comentário de um vídeo, digite 
`<script>alert('Hack')</script>` e poste. Recarregue a página do vídeo.  
* **Impacto:** Quando outros usuários abrirem o vídeo, o script roda no computador deles, podendo roubar tokens de sessão.  
* **Categoria:** Não-Funcional (Segurança)  
* **Sistema Referencia:** Comentários / Engine EJS

#### **R-8\. Vídeos com mais de 1 minuto passando no upload**

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

#### **R-9\. Feed Priorizado Vazio gera Fallback incorreto**

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

#### **R-10\. Erro silencioso em Upload de Imagem de Perfil**

* **Como ocorre:** Não há limite definido na instância do Multer e a falha de estourar a memória acontece sem resposta ao cliente.  
```js
  const uploadProfile = multer({ dest: 'uploads/profiles/' });   
  // O Multer tenta engolir arquivos de 100MB e ocorre timeout sem JSON de erro.
```
 **O que ele afeta:** Usabilidade e Tráfego de Rede.  
* **Sua Gravidade:** Baixo  
* **Como reproduzir:** Tente atualizar a foto do perfil com uma imagem `.tiff` de `30MB`.  
* **Impacto:** O site ficará carregando até dar timeout, gerando uma experiência confusa. O usuário não sabe se o erro foi da rede dele ou da imagem.  
* **Categoria:** Técnico / Usabilidade  
* **Sistema Referência:** Edição de Perfil

## **5\. Recursos e Ambiente**

* **Ambiente:** Node.js 20+, MySQL local, Vitest + Supertest  
* **Dados de teste:** Mock de usuários em arquivos `.json` e vídeos falsos para validação do multer criados no `tests/fixtures/`.  
* **CI:** GitHub Actions (npm test em cada push)

## **6\. Critérios de Entrada e Saída**

* **Entrada:** Ambiente configurado + migration ok + build passando  
* **Saída:** Cobertura ≥ 70% + zero falhas em riscos Críticos/Altos  
* **Suspensão:** Falha grave no ambiente que impede execução dos testes, como falha de persistência no MySQL de testes.
