#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Marwat Tech — One-command Supabase setup
# Run this from your terminal (not VS Code terminal):
#   cd "/Users/user/Desktop/Dev Work/My Porjects/MARWATTECHCOMPANY"
#   bash setup.sh
# ═══════════════════════════════════════════════════════════════════════
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Marwat Tech — Supabase Setup${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo ""

# ── 1. Apply database schema ───────────────────────────────────────
echo -e "${YELLOW}[1/2] Applying database schema...${NC}"

PGPASSWORD="CV7000isj.@" /opt/homebrew/opt/libpq/bin/psql \
  -h db.wgcajewvabhyuzteacqx.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f supabase/schema.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Schema applied successfully!${NC}"
else
  echo -e "${RED}❌ Schema failed. Check the output above.${NC}"
  exit 1
fi

echo ""

# ── 2. Seed admin user + default content ───────────────────────────
echo -e "${YELLOW}[2/2] Seeding admin account & default content...${NC}"

node scripts/seed.mjs

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}══════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  Setup complete!${NC}"
  echo -e "${GREEN}══════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  🖥️  Start the dev server:  ${YELLOW}npm run dev${NC}"
  echo -e "  🔑 Admin login:            ${YELLOW}http://localhost:3000/admin/login${NC}"
  echo -e "  👤 Email:                   ${YELLOW}admin@marwattech.com${NC}"
  echo -e "  🔒 Password:                ${YELLOW}MarwatTech2026!${NC}"
  echo ""
  echo -e "  ⚠️  Change the default password after first login."
  echo ""
else
  echo -e "${RED}❌ Seed failed. Check the output above.${NC}"
  exit 1
fi
