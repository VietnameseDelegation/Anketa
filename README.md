# Dokumentace k projektu Anketa

Tento projekt je jednoduchá webová aplikace pro hlasování (anketu), která se skládá z React frontendu (Vite) a Node.js/Express backendu.

## 1. URL adresy a API Endpointy

### Lokální vývoj
- **Frontend (Vite):** Typicky běží na `http://localhost:5173`
- **Backend (Express API):** Běží na `http://localhost:5000`

### API Endpointy
Backend poskytuje následující REST API na prefixu `/api`:
- `GET /api/poll` - Vrací aktuální stav ankety, otázku, možnosti a příznak, zda uživatel již hlasoval.
- `POST /api/vote` - Slouží k odeslání hlasu. Očekává JSON tělo: `{ "optionId": "<id>" }`. Nastavuje HTTP cookie `voted=true`.
- `POST /api/reset` - Slouží k resetování ankety (vyžaduje admin token). Očekává JSON tělo: `{ "token": "<admin_token>" }`.
- `GET /api/health` - Health check pro ověření dostupnosti backendu.

## 2. Postup pro reset ankety

Anketu lze resetovat na speciální stránce administrace:
1. Přejděte v prohlížeči na adresu `/admin` (např. `http://localhost:5173/admin` při lokálním vývoji).
2. Do vstupního pole zadejte administrační token (výchozí hodnota je `secret123`).
3. Klikněte na tlačítko **Resetovat hlasování**.
4. Úspěšný reset vynuluje všechny počty hlasů v paměti backendu, vymaže lokální cookie uživatele a přesměruje zpět na anketu.

## 3. Popis konfigurace

Projekt je rozdělen do jedné monorepo struktury (využívá npm workspaces pro `my-api`).

### Backend (my-api)
- API běží v souboru `my-api/index.js`.
- **Port:** Konfigurovatelný pomocí proměnné prostředí `PORT` (výchozí `5000`).
- **Data:** Aktuálně jsou data ankety a otázky uložena přímo v paměti (in-memory `pollData` objekt) v `index.js`. V produkci by bylo vhodné napojit na databázi.
- **Admin token:** V současnosti je tvrdě zakódován ve zdrojovém kódu (`adminToken: "secret123"`). Doporučuje se přesunout jej do `.env` souboru v reálné produkci (např. do `process.env.ADMIN_TOKEN`).

### Frontend (React)
- Využívá Vite. Hlavní komponenta je v `src/components/PollApp.tsx`.
- API endpoint se dynamicky vybírá podle prostředí:
  - Ve vývoji (development) používá absolutní URL: `http://localhost:5000/api`.
  - V produkci používá relativní cestu: `/api` (backend staticky servíruje zkompilovaný frontend).

### Spuštění vývoje
Pro lokální vývoj lze využít sdružený skript v rootu:
```bash
npm install
npm run dev:all
```
*Tento příkaz spustí současně Vite vývojový server i Express backend pomocí balíčku `concurrently`.*

## 4. Postup deploymentu

Projekt obsahuje automatizovanou CI/CD pipeline pomocí **GitHub Actions** napojenou na cloudovou službu **Render**.

### Jak probíhá nasazení:
1. Jakmile dojde k pushnutí nových změn do větve `main` (nebo ke sloučení Pull Requestu), spustí se GitHub Action definovaná v `.github/workflows/deploy.yml`.
2. Akce provede jednoduchý krok: zavolá cURL request na specifikovaný Render Deploy Webhook (`https://api.render.com/deploy/srv-...`).
3. Služba Render následně na svých serverech stáhne aktuální repozitář.
4. Spustí příkazy pro sestavení frontendu (`npm run build`, obsažený v root `package.json`).
5. Backend se následně spouští přes `npm start` (`node my-api/index.js`). Sestavené soubory frontendu ze složky `dist` servíruje přímo Express backend (fallback routa v `index.js`).
