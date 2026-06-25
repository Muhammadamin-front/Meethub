# MeetHub — Mobile

MeetHub mobil tajribasi ikki bosqichda qurilgan.

## 1. PWA (hozir tayyor ✅)

Ilova "Add to Home Screen" orqali telefonga o'rnatiladi. Hech qanday qo'shimcha
build kerak emas — faqat HTTPS'da deploy qilingan bo'lishi kerak.

- Manifest: [`src/app/manifest.ts`](src/app/manifest.ts) → `/manifest.webmanifest`
- Service worker: [`public/sw.js`](public/sw.js) (offline keshlash)
- Offline sahifa: [`public/offline.html`](public/offline.html)
- Ro'yxatdan o'tkazish: [`src/components/pwa-register.tsx`](src/components/pwa-register.tsx)
  (faqat `production` build'da yoqiladi)

**Sinash:** `npm run build && npm start` → telefon brauzerida ochib, "Add to Home
Screen". iOS'da Safari, Android'da Chrome.

## 2. Capacitor (config tayyor, native loyiha keyin)

Ilova SSR + Server Actions + Clerk ustida ishlagani uchun **statik export
qilinmaydi**. Shu sababli native qobiq jonli saytni WebView'da ochadi
(`server.url`). Konfiguratsiya: [`capacitor.config.ts`](capacitor.config.ts).

### Native ilovani yig'ish bosqichlari

```bash
# 1. Web ilovani deploy qiling (masalan Vercel) va HTTPS URL'ni oling.
# 2. Shu URL'ni env sifatida bering:
export CAP_SERVER_URL="https://<sizning-domeningiz>"

# 3. Native loyihalarni generatsiya qiling:
npx cap add ios
npx cap add android

# 4. Konfiguratsiyani sinxronlang va IDE'da oching:
npx cap sync
npx cap open ios       # Xcode kerak (faqat macOS)
npx cap open android   # Android Studio kerak
```

`ios/` va `android/` papkalari `.gitignore`da — ular lokal generatsiya qilinadi.

### Native push-notification (keyingi qadam)

App Store/Play Store'da to'liq push kerak bo'lsa:

```bash
npm i @capacitor/push-notifications
```

so'ng Firebase (Android) va APNs (iOS) sozlamalarini ulang. Bu Apple Developer
($99/yil) va Google Play ($25 bir martalik) hisoblarini talab qiladi.
