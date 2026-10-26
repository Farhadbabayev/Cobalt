# Cobalt sayt

Webflow-dan export olunmuş sayt. Vercel-də işləyir və Decap CMS admin paneli ilə idarə olunur.

## Struktur

| Qovluq | Nə var |
|---|---|
| `src/pages/*.njk` | Səhifə şablonları ([Nunjucks](https://mozilla.github.io/nunjucks/)), Webflow HTML-i ilə eynidir |
| `src/partials/` | Ortaq hissələr (SEO meta teqləri) |
| `content/projects/*.json` | Layihələr (admin paneldən redaktə olunur) |
| `content/team/*.json` | Komanda üzvləri (admin paneldən redaktə olunur) |
| `public/` | CSS, JS, şəkillər, videolar, admin panel, yüklənən fayllar (`public/uploads`) |
| `api/` | Vercel funksiyaları: kontakt forması və admin panelə giriş (GitHub OAuth) |
| `scripts/build.mjs` | `dist/` qovluğuna statik sayt yığır |

Lokal işə salmaq üçün:

```bash
npm install
npm run dev        # http://localhost:3000
```

## Vercel-ə deploy

1. Vercel → **Add New Project** → bu GitHub reposunu seçin. Framework: **Other**. Build ayarları `vercel.json`-dan avtomatik oxunur.
2. **Settings → Environment Variables** bölməsinə aşağıdakıları əlavə edin:

   | Dəyişən | Nə üçün |
   |---|---|
   | `RESEND_API_KEY` | Kontakt forması. [resend.com](https://resend.com)-da pulsuz hesab açıb API key yaradın |
   | `CONTACT_TO` | Mesajların gələcəyi ünvan, məs. `office@cobalt.az` |
   | `CONTACT_FROM` | Göndərən ünvan, məs. `Cobalt <website@cobalt.az>`. Domen Resend-də təsdiqlənənə qədər bunu boş saxlayın |
   | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Admin panelə giriş (aşağıya baxın) |
   | `SITE_URL` | Əsas domen, susmaya görə `https://cobalt.az` (sitemap və SEO teqləri üçün) |

3. **Settings → Domains** bölməsində `cobalt.az` domenini əlavə edin və DNS qeydlərini Vercel-in göstərdiyi kimi dəyişin.

## Admin panel (`/admin`)

Admin panel [Decap CMS](https://decapcms.org) ilə qurulub. Hər "Publish" bir GitHub commit-i yaradır, Vercel saytı ~1 dəqiqəyə yenidən yığır. Verilənlər bazası və ya ödənişli servis lazım deyil.

Bir dəfəlik quraşdırma:

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**:
   - Homepage URL: `https://cobalt.az`
   - Authorization callback URL: `https://cobalt.az/api/callback`
2. Client ID və Client Secret-i Vercel-də `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` kimi saxlayın və redeploy edin.
3. Saytı redaktə edəcək hər kəsə GitHub reposuna **Write** icazəsi verin. Onlar `https://cobalt.az/admin` ünvanında "Login with GitHub" ilə daxil olurlar.

Admin panel `main` branch-ə yazır (`public/admin/config.yml`).

## Webflow-dan məlumat köçürmə

```bash
# CMS CSV export-unu JSON-a çevirmək (Webflow → CMS → Collection → Export)
node scripts/import-webflow-csv.mjs projects "Cobalt - Projects.csv"
node scripts/import-webflow-csv.mjs team "Cobalt - Team.csv"

# Şəkilləri Webflow CDN-dən public/uploads/webflow/ qovluğuna yükləmək
# (Webflow saytını bağlamazdan ƏVVƏL işə salın)
npm run download-images
```
