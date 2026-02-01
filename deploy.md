# Guia de Deploy - Nexus IPTV

## Problema: 404 em Produção

O erro "Erro ao carregar categorias" com 404 acontece porque a API Route `/api/data/route.ts` não está sendo encontrada.

## Causa Provável

Em produção, você precisa fazer o **build** da aplicação Next.js antes de iniciar com PM2. Diferente do modo desenvolvimento (`next dev`), o modo produção (`next start`) requer que o build seja feito primeiro.

## Solução - Passos para Deploy

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
