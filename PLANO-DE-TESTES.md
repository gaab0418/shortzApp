
```markdown
# **Plano de Teste — Shortz-App (21 Cenários Críticos)**

## **1. Identificação**
* **Projeto:** Shortz-App  
* **Versão:** 1.0
* **Grupo:** Gabriel Chiarelli; Gabriel Vinicius Batista; Marcelo Filho; Vinicius Pollnow; Raoni Zardo
* **Data:** 10/03/2026  
* **Objetivo:** Garantir cadastro, autenticação, upload, feed e admin conforme RN/RF da especificação.

## **2. Escopo**
**SERÁ testado:** Cadastro (RN-001), Login (RN-002), Upload vídeo (RN-004), Feed (RN-007), Likes/comentários (RN-006), Admin (RN-012)  
**NÃO será:** Performance, acessibilidade, cross-browser

## **3. Estratégia**
**Unitários:** Validações (email, senha, duração vídeo)  
**Integração:** Rotas `/register`, `/login`, `/videos/upload`, middleware auth  
**Ferramentas:** Vitest, Supertest, GitHub Actions

## **4. Riscos e Cenários (21 Críticos)**

| ID | Descrição | Categoria | Prob. | Impacto | Prioridade |
|----|-----------|-----------|-------|---------|------------|
| R01 | Senha texto plano no MySQL | Segurança | Alta | Crítico | **Crítica** |
| R02 | Upload aceita .exe | Segurança | Alta | Crítico | **Crítica** |
| R03 | Banco offline = crash | Técnico | Média | Alto | **Alta** |
| R04 | Email "teste123" válido | Funcional | Alta | Alto | **Alta** |
| R05 | Likes duplicam (race cond.) | Funcional | Alta | Médio | **Média** |
| R06 | `/admin` sem login | Segurança | Média | Crítico | **Crítica** |
| R07 | XSS em comentários | Segurança | Alta | Crítico | **Crítica** |
| R08 | Vídeo 2min aceito | Negócio | Média | Médio | **Média** |
| R09 | Feed novo user vazio | UX | Baixa | Alto | **Média** |
| R10 | Foto perfil 50MB OK | Técnico | Alta | Baixo | **Baixa** |
| R11 | Sessão expira sem aviso | Usabilidade | Alta | Alto | **Alta** |
| R12 | Username duplicado | Funcional | Média | Alto | **Alta** |
| R13 | Foto 4000x4000 sem resize | Performance | Alta | Médio | **Média** |
| R14 | Logout deixa cookies | Segurança | Média | Crítico | **Crítica** |
| R15 | Feed vaza vídeo privado | Privacidade | Baixa | Crítico | **Alta** |
| R16 | Busca mostra deletados | Funcional | Média | Médio | **Média** |
| R17 | Like duplo aceito | Funcional | Alta | Médio | **Média** |
| R18 | Playlist duplicatas | Funcional | Média | Baixo | **Baixa** |
| R19 | Streaming sem range 206 | Performance | Alta | Alto | **Alta** |
| R20 | Views contam no hover | Negócio | Média | Médio | **Média** |
| R21 | Delete user deixa órfãos | Integridade | Média | Crítico | **Crítica** |

---

### **R01: Senha texto plano**
```js
await User.create({email, password}); // Sem bcrypt.hash()
```
**Reproduzir:** Cadastro → `SELECT password FROM users`  
**Impacto:** Todas senhas vazam em dump SQL  
**Prioridade:** Crítica (RN-011)

### **R02: Upload .exe**
```js
multer({dest:'uploads/'}); // Sem fileFilter
```
**Reproduzir:** `virus.exe` no upload vídeo  
**Impacto:** RCE servidor  
**Prioridade:** Crítica (RN-004)

### **R03: Banco offline crash**
```js
const videos = await Video.findAll(); // Sem try/catch
```
**Reproduzir:** `systemctl stop mysql` → F5 home  
**Impacto:** Node crash 500 todos users  
**Prioridade:** Alta

### **R04: Email inválido**
```js
if(!email) return 400; // "teste123@passa"
```
**Reproduzir:** `/register` email="abc"  
**Impacto:** User sem recovery senha  
**Prioridade:** Alta (RN-001)

### **R05: Likes duplicam**
```js
video.likesCount++; await video.save(); // Race condition
```
**Reproduzir:** 10 POST `/like` simultâneos  
**Impacto:** Métricas falsas  
**Prioridade:** Média (RN-006)

### **R06: Admin público**
```js
app.use('/admin', adminRoutes); // Sem auth
```
**Reproduzir:** `/admin/users` sem login  
**Impacto:** Qualquer um deleta tudo  
**Prioridade:** Crítica (RN-012)

### **R07: XSS comentários**
```ejs
<%- comment.text %> <!-- Executa script -->
```
**Reproduzir:** `<script>alert('XSS')</script>`  
**Impacto:** Rouba cookies visitantes  
**Prioridade:** Crítica (RN-006)

### **R08: Vídeo 2min**
```js
if(file.size > 50MB); // Ignora duração
```
**Reproduzir:** Upload 2min (2MB)  
**Impacto:** Quebra "shorts" conceito  
**Prioridade:** Média (RN-004)

### **R09: Feed novo user vazio**
```js
if(!following) return userVideos; // Errado!
```
**Reproduzir:** User novo → home vazia  
**Impacto:** 90% churn primeiro login  
**Prioridade:** Média (RN-007)

### **R10: Foto 50MB**
```js
multer({dest:'profiles/'}); // Sem limits
```
**Reproduzir:** Foto perfil 50MB  
**Impacto:** Disco cheio  
**Prioridade:** Baixa (RN-003)

### **R11: Sessão expira**
```js
jwt.sign({exp: '1h'}); // Sem refresh
```
**Reproduzir:** Login → 1h30 → curtir  
**Impacto:** UX quebrada  
**Prioridade:** Alta (RN-002)

### **R12: Username duplicado**
```js
await User.create(data); // CHECK tarde
```
**Reproduzir:** 2x mesmo username  
**Impacto:** Perfis colidem  
**Prioridade:** Alta (RN-001)

### **R13: Foto sem resize**
```js
fs.writeFile(dest, buffer); // 4000x4000
```
**Reproduzir:** Foto 5MB → `uploads/profiles/`  
**Impacto:** Performance ruim  
**Prioridade:** Média (RN-003)

### **R14: Logout cookies**
```js
req.session.destroy(); // Sem clearCookie
```
**Reproduzir:** Login→logout→DevTools  
**Impacto:** CSRF risco  
**Prioridade:** Crítica (RF-003)

### **R15: Feed vaza privados**
```js
Video.findAll({userId: following}); // Sem isPublic
```
**Reproduzir:** Vídeo privado no feed  
**Impacto:** Privacidade violada  
**Prioridade:** Alta (RN-007)

### **R16: Busca deletados**
```js
Video.findAll({title: '%query%'}); // Sem deletedAt
```
**Reproduzir:** Delete → busca título  
**Impacto:** Conteúdo fantasma  
**Prioridade:** Média (RN-016)

### **R17: Like duplo**
```js
Like.create({userId, videoId}); // Sem UNIQUE
```
**Reproduzir:** ❤️ 2x rápido  
**Impacto:** Contador inflado  
**Prioridade:** Média (RN-006)

### **R18: Playlist duplicatas**
```js
PlaylistVideo.create({playlistId, videoId});
```
**Reproduzir:** Mesmo vídeo 2x playlist  
**Impacto:** UX confusa  
**Prioridade:** Baixa (RN-008)

### **R19: Streaming sem range**
```js
res.sendFile(videoPath); // Sempre 200
```
**Reproduzir:** Vídeo 50MB → seek 80%  
**Impacto:** Rede ineficiente  
**Prioridade:** Alta (RN-005)

### **R20: Views no hover**
```js
video.views++; // Thumbnail = view
```
**Reproduzir:** Scroll feed sem play  
**Impacto:** Métricas falsas  
**Prioridade:** Média (RN-005)

### **R21: User delete órfãos**
```js
User.destroy({id}); // Sem CASCADE
```
**Reproduzir:** Admin deleta user+videos  
**Impacto:** GBs disco vazados  
**Prioridade:** Crítica (RN-012)

## **5. Recursos**
* **Ambiente:** Node 20+, MySQL, Docker  
* **CI:** GitHub Actions `npm test`

## **6. Critérios**
**Entrada:** Migration OK, build passando  
**Saída:** 70% coverage, 0 falhas Críticas  
**Suspensão:** MySQL offline, build quebrado
