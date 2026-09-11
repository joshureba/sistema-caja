#!/usr/bin/env bash
# Instala dependencias, inicializa Supabase local y levanta la base de datos.
set -x
cd "C:/Users/programacion/Documents/Herramienta caja chica" || exit 1
[ -f package.json ] || npm init -y >/dev/null
npm pkg set name="sistema-caja" version="0.1.0" type="module" description="Sistema de caja diaria y caja chica"
npm pkg set private=true --json
npm pkg set scripts.dev="vite" scripts.build="tsc -b && vite build" scripts.preview="vite preview" scripts.test="vitest run" scripts.test:watch="vitest" scripts.typecheck="tsc -b"
npm pkg set scripts.db:start="supabase start -x realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor,studio,postgres-meta,mailpit" scripts.db:stop="supabase stop" scripts.db:reset="supabase db reset" scripts.db:status="supabase status" scripts.db:usuarios-locales="node scripts/crear-usuarios-locales.mjs"
npm install --no-audit --no-fund react react-dom react-router@7 @supabase/supabase-js @tanstack/react-query react-hook-form @hookform/resolvers zod recharts date-fns https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz lucide-react clsx || exit 1
npm install --no-audit --no-fund -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node tailwindcss @tailwindcss/vite vitest supabase || exit 1
echo "=== dependencias instaladas ==="
npx supabase init --with-vscode-settings=false --with-intellij-settings=false </dev/null || npx supabase init </dev/null || true
ls -la supabase
sed -i 's/^enable_signup = true/enable_signup = false/' supabase/config.toml
echo "=== iniciando supabase local ==="
npm run db:start
npx supabase status
echo "=== FIN instalar.sh ==="
