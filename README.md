# Readers' Realm

Book discovery platform with AO3-inspired filtering — filter by tropes, content warnings, ratings, and more.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Under "Build and deployment", select **GitHub Actions**
4. Create `.github/workflows/deploy.yml` (included below)
5. Push — site will deploy automatically

## Connect Your Custom Domain

1. In GitHub repo **Settings → Pages → Custom domain**, enter your domain (e.g. `readersrealm.io`)
2. At your domain registrar, add DNS records:
   - For apex domain: A records pointing to GitHub's IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - For www: CNAME record pointing to `yourusername.github.io`
3. Check "Enforce HTTPS" in GitHub Pages settings
4. Wait a few minutes for DNS to propagate
