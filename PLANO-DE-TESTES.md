# **Plano de Teste — Shortz-App**

## **1\. Identificação**

- **Projeto:** Shortz-App
- **Versão:** 1.0
- **Grupo:** Gabriel Chiarelli; Gabriel Vinicius Batista; Marcelo Filho; Vinicius Pollnow; Raoni Zardo
- **Data de criação:** 10/03/2026
- **Objetivo:** Garantir que as funcionalidades de cadastro, autenticação, upload e feed funcionem conforme os requisitos de negócio e padrões de segurança, detectando falhas precocemente antes da entrega.

## **2\. Escopo**

### **O que SERÁ testado**

- Cadastro e login de usuários (validação de campos e autenticação).
- Edição de perfil e regras de armazenamento de dados sensíveis.
- Upload de vídeos e verificação de restrições (tamanho, formato e tempo).
- Funcionalidades do feed (priorizado e global) e interações (curtidas e comentários).
- Acessos ao painel administrativo.

## **3\. Estratégia**

### **Níveis de Teste**

- **Unitários:** Funções de validação de dados, hashing de senha, formatação de e-mail e regras de negócio limitadoras de tempo de vídeo.
- **Integração:** Rotas de autenticação (`/register`, `/login`), uploads no multer (`/videos/upload`) e proteção de rotas privadas.

### **Ferramentas que podem ser utilizadas**

- `Vitest`, `Supertest`, `c8/coverage`, `GitHub Actions`

## **4\. Riscos Identificados**

| ID   | Descrição                                | Categoria                   | Prob. | Impacto | Prioridade |
| :--- | :--------------------------------------- | :-------------------------- | :---- | :------ | :--------- |
| R-01 | Senha armazenada em texto plano          | Não-Funcional (Segurança)   | Alta  | Crítico | Crítica    |
| R-02 | Upload de vídeo aceitando .exe           | Funcional/Segurança         | Alta  | Crítico | Crítica    |
| R-03 | Banco indisponível derruba app inteira   | Técnico                     | Média | Alto    | Alta       |
| R-04 | E-mail inválido passa no cadastro        | Funcional                   | Alta  | Alto    | Alta       |
| R-05 | Botão curtir permite cliques múltiplos   | Funcional                   | Alta  | Médio   | Média      |
| R-06 | Rota admin acessível sem login           | Não-Funcional (Segurança)   | Média | Crítico | Crítica    |
| R-07 | Comentário executando HTML/Script (XSS)  | Não-Funcional (Segurança)   | Alta  | Crítico | Crítica    |
| R-08 | Sistema aceita vídeos de 2 minutos       | Funcional/Negócio           | Média | Médio   | Média      |
| R-09 | Feed fallback mostra dados errados       | Funcional                   | Baixa | Alto    | Média      |
| R-10 | Foto de perfil gigante não retorna erro  | Técnico                     | Alta  | Baixo   | Baixa      |
| R-11 | Sessão JWT expira sem refresh token      | Não-Funcional (Usabilidade) | Alta  | Alto    | Alta       |
| R-12 | Username duplicado aceito no cadastro    | Funcional                   | Média | Alto    | Alta       |
| R-13 | Foto de perfil sem redimensionamento     | Técnico / Performance       | Alta  | Médio   | Média      |
| R-14 | Logout não limpa cookies do navegador    | Não-Funcional (Segurança)   | Média | Crítico | Crítica    |
| R-15 | Feed exibe vídeos privados de outros     | Não-Funcional (Privacidade) | Baixa | Crítico | Alta       |
| R-16 | Busca retorna conteúdo já deletado       | Funcional                   | Média | Médio   | Média      |
| R-17 | Like duplicado aceito sem constraint     | Funcional                   | Alta  | Médio   | Média      |
| R-18 | Mesmo vídeo adicionado 2x na playlist    | Funcional                   | Média | Baixo   | Baixa      |
| R-19 | Streaming sem suporte a HTTP Range (206) | Técnico / Performance       | Alta  | Alto    | Alta       |
| R-20 | Visualização conta no hover sem play     | Funcional / Negócio         | Média | Médio   | Média      |
| R-21 | Deleção de usuário deixa dados órfãos    | Não-Funcional (Integridade) | Média | Crítico | Crítica    |

### **Detalhamento dos Erros (Tópicos de Defeitos Simulados)**

#### **R-1\. Senha não guardada com criptografia**

- **Como ocorre:** O servidor salva diretamente do req.body sem aplicar a biblioteca bcrypt.

```js
const createUser = async (req, res) => {
	const { email, password } = req.body;
	// Falha aqui: Não houve hash da senha antes de salvar
	const newUser = await User.create({ email, password });
	res.status(201).json(newUser);
};
```

- **O que ele afeta:** Segurança de credenciais dos usuários.
- **Sua Gravidade:** Crítico
- **Como reproduzir:** Cadastre um usuário com senha "123456", acesse o MySQL no Workbench e olhe a coluna password na tabela Users.
- **Impacto:** Vazamento de banco de dados resulta em total exposição das senhas dos usuários.
- **Categoria:** Não-Funcional (Segurança)
- **Sistema Referência:** Módulo de Autenticação / Banco de Dados

#### **R-2\. Upload com falha aceitando arquivos maliciosos**

- **Como ocorre:** O middleware do multer não filtra o tipo (mimetype) do arquivo submetido.

```js
// Sem fileFilter definido
const upload = multer({ dest: 'uploads/videos/' });
router.post('/upload', upload.single('video'), videoController.create);
```

- **O que ele afeta:** Integridade do Servidor e Segurança de Arquivos.
- **Sua Gravidade:** Crítico
- **Como reproduzir:** Acesse a tela de upload de vídeo, selecione um arquivo virus.exe e clique em enviar.
- **Impacto:** Permite que atacantes façam upload de malwares (RCE) comprometendo o servidor inteiro.
- **Categoria:** Funcional / Segurança
- **Sistema Referencia:** Upload de Vídeo (Multer)

#### **R-3\. Banco de dados indisponível (Crash sem tratamento)**

- **Como ocorre:** As requisições ao banco não utilizam bloco try/catch para capturar exceções de conexão.

```js
const getFeed = async (req, res) => {
	// Falta o try/catch. Se o banco falhar, o Node vai crashar (Unhandled Promise Rejection)
	const videos = await Video.findAll();
	res.render('home', { videos });
};
```

- **O que ele afeta:** Disponibilidade do Shortz-App.
- **Sua Gravidade:** Alto
- **Como reproduzir:** Pare o serviço do MySQL localmente e tente dar F5 na página inicial.
- **Impacto:** O servidor desliga em vez de mostrar uma tela de erro "Tente novamente mais tarde", derrubando a navegação para todos.
- **Categoria:** Técnico
- **Sistema Referência:** Conexão Database / Feed Global

#### **R-4\. E-mail inválido cadastrando normalmente**

- **Como ocorre:** A validação confere apenas se a string existe, mas não verifica o formato padrão (@ e domínio).

```js
const { email } = req.body;
if (!email) {
	return res.status(400).send('Email obrigatório');
}
// Falta Regex verificando o formato de email
next();
```

- **O que ele afeta:** Consistência da base e comunicação com o usuário.
- **Sua Gravidade:** Alto
- **Como reproduzir:** Na tela /register, digite "teste123" no campo de e-mail e clique em cadastrar.
- **Impacto:** Usuário cria uma conta mas nunca conseguirá recuperar a senha, e o sistema acumula lixo na base de dados.
- **Categoria:** Funcional
- **Sistema Referência:** Formulário de Cadastro / Validação de Request

#### **R-5\. Contador de curtidas duplicando (Race Condition)**

- **Como ocorre:** Requisições rápidas incrementam o valor local sem travar (lock) a leitura na tabela.

```js
const video = await Video.findByPk(req.params.id);
// Incremento local vulnerável a múltiplas requisições simultâneas
video.likesCount++;
await video.save();
```

- **O que ele afeta:** Veracidade dos dados e estatísticas do vídeo.
- **Sua Gravidade:** Médio
- **Como reproduzir:** Use uma ferramenta como Postman para enviar 10 requisições POST para `/vídeos/1/like` no exato mesmo milissegundo.
- **Impacto:** O vídeo ganha curtidas artificialmente distorcendo o algoritmo de relevância.
- **Categoria:** Funcional
- **Sistema Referência:** Interação de Likes em Vídeos

#### **R-6\. Rota administrativa totalmente exposta**

- **Como ocorre:** O mapeamento das rotas admin foi feito sem middleware de controle de sessão.

```js
// app.use(authMiddleware, adminRoutes); -> O que deveria ser feito
app.use('/admin', adminRoutes); // Como está codificado
```

- **O que ele afeta:** Permissões do sistema e privacidade de dados.
- **Sua Gravidade:** Crítico
- **Como reproduzir:** Abra uma aba anônima (sem estar logado) e digite localhost:3000/admin/users.
- **Impacto:** Visitantes anônimos ganham privilégios para banir perfis e deletar qualquer vídeo do Shortz-App.
- **Categoria:** Não-Funcional (Segurança)
- **Sistema Referência:** Painel Administrativo

#### **R-7\. Injeção de Scripts em comentários**

- **Como ocorre:** Uso equivocado de tags de renderização no frontend (`<%- %>` em vez de `<%= %>`).

```js
  <div class="comment-body">
    <!-- Renderização sem escape de HTML -->
    <% comment.text %>
  </div>
```

- **O que ele afeta:** Segurança do cliente e do frontend (Navegador).
- **Sua Gravidade:** Crítico
- **Como reproduzir:** No campo de comentário de um vídeo, digite
  `<script>alert('Hack')</script>` e poste. Recarregue a página do vídeo.
- **Impacto:** Quando outros usuários abrirem o vídeo, o script roda no computador deles, podendo roubar tokens de sessão.
- **Categoria:** Não-Funcional (Segurança)
- **Sistema Referencia:** Comentários / Engine EJS

#### **R-8\. Vídeos com mais de 1 minuto passando no upload**

- **Como ocorre:** O servidor verifica o "tamanho" do arquivo (bytes), mas ignora a validação do "tempo" de duração do metadado do vídeo.

```js
if (req.file.size > 50000000) {
	return res.status(400).send('Arquivo muito pesado');
}
// Falta a validação: if (videoDuration > 60) return erro;
```

- **O que ele afeta:** Regra de negócio núcleo ("Shorts").
- **Sua Gravidade:** Médio
- **Como reproduzir:** Faça upload de um vídeo de baixa resolução, com `2MB` de tamanho, mas que tenha 3 minutos de duração.
- **Impacto:** Desconfigura o propósito principal do aplicativo (vídeos curtos) prejudicando o fluxo dinâmico do Feed.
- **Categoria:** Funcional / Negócio
- **Sistema Referência:** Regras de Upload de Vídeo

#### **R-9\. Feed Priorizado Vazio gera Fallback incorreto**

- **Como ocorre:** Se o usuário não segue ninguém, o sistema deveria listar o feed Global, mas lista apenas vídeos de si mesmo.

    ```js
    const following = await getFollowing(userId);
    if (following.length === 0) {
    	// Deveria ser Video.findAll() global (ordenado por recente)
    	return await Video.findAll({ where: { userId } });
    }
    ```

- **O que ele afeta:** Descoberta de conteúdo para novos usuários (Cold Start).
- **Sua Gravidade:** Alto
- **Como reproduzir:** Crie um perfil novo. Não siga ninguém e acesse a aba "Home/Feed". Estará totalmente vazia.
- **Impacto:** Alto risco de evasão. Um usuário novo achará que a rede não tem conteúdo e vai desinstalar/abandonar.
- **Categoria:** Funcional
- **Sistema Referência:** Algoritmo do Feed e Home

#### **R-10\. Erro silencioso em Upload de Imagem de Perfil**

- **Como ocorre:** Não há limite definido na instância do Multer e a falha de estourar a memória acontece sem resposta ao cliente.

```js
const uploadProfile = multer({ dest: 'uploads/profiles/' });
// O Multer tenta engolir arquivos de 100MB e ocorre timeout sem JSON de erro.
```

- **O que ele afeta:** Usabilidade e Tráfego de Rede.
- **Sua Gravidade:** Baixo
- **Como reproduzir:** Tente atualizar a foto do perfil com uma imagem `.tiff` de `30MB`.
- **Impacto:** O site ficará carregando até dar timeout, gerando uma experiência confusa. O usuário não sabe se o erro foi da rede dele ou da imagem.
- **Categoria:** Técnico / Usabilidade
- **Sistema Referência:** Edição de Perfil

#### **R-11\. Sessão JWT expira sem mecanismo de refresh**

- **Como ocorre:** O token JWT é gerado com expiração fixa de 1 hora e não há implementação de refresh token para renovar a sessão automaticamente.

```js
const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '1h' });
// Não existe endpoint /refresh-token nem lógica de renovação automática
res.json({ token });
```

- **O que ele afeta:** Experiência do usuário durante uso prolongado.
- **Sua Gravidade:** Alto
- **Como reproduzir:** Faça login normalmente, aguarde 1h30 e tente curtir um vídeo ou postar um comentário. A requisição retornará 401 Unauthorized.
- **Impacto:** O usuário é deslogado abruptamente no meio de uma ação, perdendo contexto e gerando frustração. Em sessões longas de navegação, isso se repete constantemente.
- **Categoria:** Não-Funcional (Usabilidade)
- **Sistema Referência:** Módulo de Autenticação / JWT

#### **R-12\. Username duplicado aceito no cadastro**

- **Como ocorre:** O sistema tenta criar o usuário diretamente no banco sem verificar previamente se o username já existe, confiando apenas na constraint do banco que pode gerar erro não tratado.

```js
const registerUser = async (req, res) => {
	const { username, email, password } = req.body;
	// Falta: const exists = await User.findOne({ where: { username } });
	const newUser = await User.create({ username, email, password });
	res.status(201).json(newUser);
};
```

- **O que ele afeta:** Unicidade dos perfis e identificação dos usuários.
- **Sua Gravidade:** Alto
- **Como reproduzir:** Cadastre dois usuários diferentes com o mesmo username (ex: "joao123") em abas separadas quase simultaneamente.
- **Impacto:** Perfis com o mesmo username colidem, causando confusão na busca e nas menções. Se não houver UNIQUE no banco, ambos são criados; se houver, o erro 500 não é tratado graciosamente.
- **Categoria:** Funcional
- **Sistema Referência:** Formulário de Cadastro / Validação de Unicidade

#### **R-13\. Foto de perfil sem redimensionamento automático**

- **Como ocorre:** O servidor salva a imagem de perfil no tamanho original enviado pelo usuário, sem aplicar resize antes de armazenar.

```js
const updateAvatar = async (req, res) => {
	// Salva o buffer direto sem processar com sharp/jimp
	fs.writeFileSync(`uploads/profiles/${req.file.filename}`, req.file.buffer);
	// Imagem de 4000x4000px fica armazenada sem redimensionamento
};
```

- **O que ele afeta:** Performance de carregamento e consumo de disco/banda.
- **Sua Gravidade:** Médio
- **Como reproduzir:** Faça upload de uma foto de perfil com resolução 4000x4000 pixels (~5MB). Verifique no diretório `uploads/profiles/` que o arquivo mantém o tamanho original.
- **Impacto:** Páginas de perfil e listagens de comentários ficam lentas ao carregar avatares gigantes, consumindo banda desnecessária dos usuários.
- **Categoria:** Técnico / Performance
- **Sistema Referência:** Edição de Perfil / Upload de Imagem

#### **R-14\. Logout não limpa cookies do navegador**

- **Como ocorre:** A rota de logout destrói a sessão no servidor mas não envia instrução para o navegador limpar o cookie de sessão.

```js
const logout = (req, res) => {
	req.session.destroy();
	// Falta: res.clearCookie('connect.sid');
	res.redirect('/login');
};
```

- **O que ele afeta:** Segurança de sessão pós-logout.
- **Sua Gravidade:** Crítico
- **Como reproduzir:** Faça login, depois logout. Abra o DevTools (F12) → Application → Cookies e verifique que o cookie `connect.sid` ainda existe no navegador.
- **Impacto:** Um atacante com acesso físico ao computador pode reutilizar o cookie para acessar a sessão. Também abre brecha para ataques CSRF pós-logout.
- **Categoria:** Não-Funcional (Segurança)
- **Sistema Referência:** Módulo de Autenticação / Gerenciamento de Sessão

#### **R-15\. Feed exibe vídeos privados de outros usuários**

- **Como ocorre:** A query do feed busca todos os vídeos dos usuários seguidos sem filtrar pelo campo `isPublic`.

```js
const getFeed = async (req, res) => {
	const following = await getFollowing(req.user.id);
	// Falta: where: { userId: following, isPublic: true }
	const videos = await Video.findAll({ where: { userId: following } });
	res.render('feed', { videos });
};
```

- **O que ele afeta:** Privacidade dos criadores de conteúdo.
- **Sua Gravidade:** Crítico
- **Como reproduzir:** Crie um vídeo marcado como privado. Peça para outro usuário que te segue acessar o feed e verifique que o vídeo privado aparece normalmente.
- **Impacto:** Vídeos que o criador marcou como privados (rascunhos, conteúdo pessoal) ficam expostos no feed de seus seguidores, violando a expectativa de privacidade.
- **Categoria:** Não-Funcional (Privacidade)
- **Sistema Referência:** Algoritmo do Feed / Query de Vídeos

#### **R-16\. Busca retorna conteúdo já deletado**

- **Como ocorre:** A query de busca por título não filtra registros com soft-delete (campo `deletedAt` preenchido).

```js
const searchVideos = async (req, res) => {
	const { query } = req.query;
	// Falta: where: { title: { [Op.like]: `%${query}%` }, deletedAt: null }
	const results = await Video.findAll({
		where: { title: { [Op.like]: `%${query}%` } }
	});
	res.json(results);
};
```

- **O que ele afeta:** Consistência dos resultados de busca.
- **Sua Gravidade:** Médio
- **Como reproduzir:** Publique um vídeo, depois delete-o. Use a busca pelo título do vídeo deletado e verifique que ele ainda aparece nos resultados.
- **Impacto:** Usuários encontram vídeos "fantasmas" nos resultados de busca que ao clicar retornam erro 404, degradando a confiança na plataforma.
- **Categoria:** Funcional
- **Sistema Referência:** Motor de Busca / Query de Vídeos

#### **R-17\. Like duplicado aceito sem constraint UNIQUE**

- **Como ocorre:** A tabela de likes não possui constraint UNIQUE na combinação (userId, videoId), permitindo múltiplos registros de curtida.

```js
const likeVideo = async (req, res) => {
	// Falta verificação: const existing = await Like.findOne({ where: { userId, videoId } });
	await Like.create({ userId: req.user.id, videoId: req.params.id });
	res.json({ success: true });
};
```

- **O que ele afeta:** Integridade das métricas de engajamento.
- **Sua Gravidade:** Médio
- **Como reproduzir:** Clique no botão de curtir duas vezes rapidamente em um vídeo. Verifique na tabela `likes` que foram criados dois registros para o mesmo par (userId, videoId).
- **Impacto:** Contadores de likes ficam inflados artificialmente, distorcendo o ranqueamento de vídeos no feed e a percepção de popularidade.
- **Categoria:** Funcional
- **Sistema Referência:** Interação de Likes / Modelo de Dados

#### **R-18\. Mesmo vídeo adicionado múltiplas vezes na playlist**

- **Como ocorre:** A rota de adicionar vídeo à playlist não verifica se o vídeo já existe naquela playlist antes de inserir.

```js
const addToPlaylist = async (req, res) => {
	const { playlistId, videoId } = req.body;
	// Falta: const exists = await PlaylistVideo.findOne({ where: { playlistId, videoId } });
	await PlaylistVideo.create({ playlistId, videoId });
	res.json({ success: true });
};
```

- **O que ele afeta:** Experiência do usuário na organização de playlists.
- **Sua Gravidade:** Baixo
- **Como reproduzir:** Adicione o mesmo vídeo à mesma playlist duas vezes. Abra a playlist e observe que o vídeo aparece duplicado na listagem.
- **Impacto:** Playlists ficam com itens duplicados, gerando confusão visual e contagem incorreta de vídeos na playlist.
- **Categoria:** Funcional
- **Sistema Referência:** Módulo de Playlists

#### **R-19\. Streaming de vídeo sem suporte a HTTP Range (206)**

- **Como ocorre:** O endpoint de streaming usa `res.sendFile` que envia o arquivo inteiro com status 200, sem implementar o header `Range` e resposta parcial 206.

```js
const streamVideo = (req, res) => {
	const videoPath = `uploads/videos/${req.params.filename}`;
	// Deveria verificar req.headers.range e responder com 206 Partial Content
	res.sendFile(path.resolve(videoPath));
};
```

- **O que ele afeta:** Eficiência de rede e experiência de reprodução.
- **Sua Gravidade:** Alto
- **Como reproduzir:** Abra um vídeo de 50MB e tente pular para 80% da timeline. Observe no DevTools (aba Network) que o servidor reenvia o arquivo completo em vez de apenas o trecho solicitado.
- **Impacto:** Cada seek no player baixa o vídeo inteiro novamente, consumindo banda excessiva e causando buffering desnecessário, especialmente em conexões lentas.
- **Categoria:** Técnico / Performance
- **Sistema Referência:** Endpoint de Streaming de Vídeo

#### **R-20\. Visualizações contam no hover sem reprodução efetiva**

- **Como ocorre:** O evento de incremento de views é disparado no carregamento da thumbnail ou hover, e não no início efetivo da reprodução do vídeo.

```js
const onVideoLoad = async (videoId) => {
	// Dispara no hover/thumbnail load em vez de no evento 'play' do player
	await Video.increment('views', { where: { id: videoId } });
};
```

- **O que ele afeta:** Veracidade das métricas de visualização.
- **Sua Gravidade:** Médio
- **Como reproduzir:** Faça scroll pelo feed sem clicar em nenhum vídeo. Verifique no banco que os contadores de views dos vídeos que apareceram na tela foram incrementados.
- **Impacto:** Métricas de visualização ficam massivamente infladas, prejudicando a análise de engajamento real e distorcendo o algoritmo de recomendação.
- **Categoria:** Funcional / Negócio
- **Sistema Referência:** Contagem de Views / Algoritmo de Relevância

#### **R-21\. Deleção de usuário deixa dados órfãos no banco**

- **Como ocorre:** Ao deletar um usuário pelo painel admin, apenas o registro na tabela `Users` é removido, sem cascade para vídeos, likes, comentários e arquivos em disco.

```js
const deleteUser = async (req, res) => {
	// Falta: ON DELETE CASCADE ou deleção manual dos relacionamentos
	await User.destroy({ where: { id: req.params.id } });
	// Vídeos, likes, comentários e arquivos do usuário ficam órfãos
	res.json({ success: true });
};
```

- **O que ele afeta:** Integridade referencial do banco e consumo de disco.
- **Sua Gravidade:** Crítico
- **Como reproduzir:** Pelo painel administrativo, delete um usuário que tenha vídeos publicados. Verifique que os vídeos dele ainda existem na tabela `Videos` e os arquivos permanecem em `uploads/videos/`.
- **Impacto:** O banco acumula registros órfãos (vídeos sem dono, likes sem referência) e o disco mantém GBs de arquivos inacessíveis, gerando inconsistência e desperdício de recursos.
- **Categoria:** Não-Funcional (Integridade)
- **Sistema Referência:** Painel Administrativo / Modelo de Dados (CASCADE)

## **5\. Recursos e Ambiente**

- **Ambiente:** Node.js 20+, MySQL local, Vitest + Supertest
- **Dados de teste:** Mock de usuários em arquivos `.json` e vídeos falsos para validação do multer criados.
- **CI:** GitHub Actions (npm test em cada push)

## **6\. Critérios de Entrada e Saída**

- **Entrada:** Ambiente configurado + migration ok + build passando
- **Saída:** Cobertura >= 70% + zero falhas em riscos Críticos/Altos
- **Suspensão:** Falha grave no ambiente que impede execução dos testes, como falha de persistência no MySQL de testes.
