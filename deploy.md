# Guia de Deploy - Nexus IPTV

## ✅ SOLUÇÃO: HTTP vs HTTPS

### O Problema Descoberto

O servidor Xtream **requer HTTPS** mas o usuário estava salvando a URL com **HTTP**.

**Exemplo:**
- ❌ Salvo (não funciona): `http://hetsdb.zip`
- ✅ Correto (funciona): `https://hetsdb.zip`

### Solução Implementada

1. **Detecção Automática no Login:**
   - Se você digitar `http://` e retornar 404
   - O sistema **automaticamente tenta com https://**
   - Se funcionar, salva com HTTPS
   - Mostra mensagem: "✅ Servidor detectado com HTTPS! URL corrigida automaticamente."

2. **Logs Detalhados:**
   - Todos os passos da requisição são logados
   - Protocolo, hostname, porta, headers
   - Tempo de resposta
   - Redirecionamentos
   - Erros específicos

### Como Usar

#### No Login:
1. Digite a URL (pode ser HTTP ou HTTPS)
2. O sistema testa automaticamente
3. Corrige para HTTPS se necessário
4. Salva a versão que funciona

#### URLs Aceitas:
```
✅ https://hetsdb.zip
✅ http://hetsdb.zip (será convertido automaticamente)
✅ https://servidor.com:8080
✅ http://servidor.com:25461 (será convertido se necessário)
```

### Verificar Logs em Produção

Após fazer deploy, os logs vão mostrar:

```bash
pm2 logs nexus-iptv
```

**Logs no Login:**
```
[Login] Original DNS: http://hetsdb.zip
[Login] Testing connection to: http://hetsdb.zip/player_api.php?...
[Login] Response status: 404 Not Found
[Login] Got 404 with HTTP, trying HTTPS automatically...
[Login] Retrying with HTTPS: https://hetsdb.zip/player_api.php?...
[Login] HTTPS response status: 200 OK
[Login] ✅ HTTPS worked! Updating DNS to use HTTPS
[Login] ✅ Validation passed! Saving credentials with DNS: https://hetsdb.zip
```

**Logs na API:**
```
[API] ========== REQUEST START ==========
[API] Original DNS from cookie: https://hetsdb.zip
[API] Protocol detection: { usesHttps: true, usesHttp: false }
[API] Final URL (with protocol): https://hetsdb.zip/player_api.php?...
[API] URL protocol: https:
[API] URL hostname: hetsdb.zip
[API] URL port: default
[API] Starting fetch...
[API] ========== RESPONSE RECEIVED ==========
[API] Response time: 342ms
[API] Response status: 200 OK
[API] Response URL (after redirects): https://hetsdb.zip/player_api.php?...
[API] Response redirected: false
[API] ========== SUCCESS ==========
[API] Data type: array[25]
```

---

## Problema Anterior: 404 em Produção (API Routes)

### No servidor (via SSH):

```bash
# 1. Entre no diretório do projeto
cd /var/www/nexus-iptv

# 2. Instale as dependências (se ainda não instalou)
npm install

# 3. Faça o build da aplicação (ESSENCIAL!)
npm run build

# 4. Reinicie o PM2
pm2 restart nexus-iptv

# 5. Verifique os logs
pm2 logs nexus-iptv
```

### Verificações Importantes:

1. **Confirme que o build foi feito:**
   ```bash
   ls -la /var/www/nexus-iptv/.next
   ```
   Você deve ver uma pasta `.next` com conteúdo.

2. **Verifique se a aplicação está rodando:**
   ```bash
   pm2 status
   ```

3. **Verifique os logs de erro:**
   ```bash
   tail -f /var/logs/nexus-iptv/pm2-error.log
   ```

### Script Automatizado de Deploy

Você pode criar este script para facilitar:

```bash
#!/bin/bash
# deploy.sh

cd /var/www/nexus-iptv
git pull origin main
npm install
npm run build
pm2 restart nexus-iptv
pm2 save
echo "Deploy concluído!"
```

Torne-o executável:
```bash
chmod +x deploy.sh
```

## Outras Verificações

### 1. Confirme que o arquivo de rota existe:
```bash
ls -la /var/www/nexus-iptv/app/api/data/route.ts
```

### 2. Verifique se há erro de CORS ou proxy reverso:
Se você estiver usando Nginx na frente do Next.js, verifique se a configuração está correta:

```nginx
location / {
    proxy_pass http://localhost:3005;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### 3. Verifique as variáveis de ambiente:
Confirme que `NODE_ENV=production` está definida no PM2:
```bash
pm2 env nexus-iptv
```

## Checklist Completo

- [ ] `npm install` executado
- [ ] `npm run build` executado com sucesso
- [ ] Pasta `.next` existe e não está vazia
- [ ] PM2 reiniciado: `pm2 restart nexus-iptv`
- [ ] Logs verificados: sem erros de build
- [ ] Porta 3005 acessível
- [ ] Cookies de sessão sendo enviados corretamente

## Comando Rápido para Resolver

```bash
cd /var/www/nexus-iptv && npm install && npm run build && pm2 restart nexus-iptv && pm2 logs nexus-iptv --lines 50
```

Este comando fará tudo de uma vez e mostrará os logs para você verificar.
