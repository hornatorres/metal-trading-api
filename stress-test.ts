// ─────────────────────────────────────────────────────────────────────────────
//  stress-test.ts
//  Simula 50 compras, 50 ventas y 3 retiros físicos contra la API local.
//  Al final imprime un resumen de contabilidad completo.
//
//  Ejecutar con:
//    npx ts-node stress-test.ts
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000/api/v1';

// ── Colores para la terminal ──────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function api(method: string, path: string, body?: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function rand(min: number, max: number, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Contadores globales ───────────────────────────────────────────────────────
const stats = {
  buys:       { ok: 0, fail: 0, totalKg: 0, totalUsd: 0 },
  sells:      { ok: 0, fail: 0, totalKg: 0, totalUsd: 0 },
  withdrawals:{ ok: 0, fail: 0, totalKg: 0 },
  errors:     [] as string[],
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}${C.cyan}═══════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}${C.cyan}   METAL TRADING API — STRESS TEST${C.reset}`);
  console.log(`${C.bold}${C.cyan}   50 compras · 50 ventas · 3 retiros${C.reset}`);
  console.log(`${C.bold}${C.cyan}═══════════════════════════════════════════════════${C.reset}\n`);

  // ── 1. Crear usuario de prueba ──────────────────────────────────────────────
  console.log(`${C.yellow}[SETUP]${C.reset} Creando usuario de stress test...`);
  const email = `stress_${Date.now()}@test.com`;
  const user  = await api('POST', '/users', { email, password: 'Stress1234!' });

  if (!user.id) {
    console.error(`${C.red}✗ No se pudo crear el usuario:${C.reset}`, user);
    process.exit(1);
  }
  const userId = user.id;
  console.log(`${C.green}✓${C.reset} Usuario creado: ${C.dim}${userId}${C.reset}`);

  // ── 2. Obtener metales ──────────────────────────────────────────────────────
  const prices = await api('GET', '/prices');
  const copper    = prices.find((p: any) => p.symbol === 'CU');
  const aluminium = prices.find((p: any) => p.symbol === 'AL');

  if (!copper || !aluminium) {
    console.error(`${C.red}✗ No se encontraron precios. ¿Corriste el seed?${C.reset}`);
    process.exit(1);
  }
  console.log(`${C.green}✓${C.reset} Precios obtenidos — CU: $${copper.buyPrice} | AL: $${aluminium.buyPrice}`);

  // ── 3. Cargar saldo inicial ─────────────────────────────────────────────────
  // Usamos Prisma directo para simular un depósito bancario
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.wallet.updateMany({
    where: { userId, metalId: null },
    data:  { balance: 500_000 },
  });
  await prisma.$disconnect();
  console.log(`${C.green}✓${C.reset} Saldo inicial cargado: $500,000 USD\n`);

  // ── 4. Registro de operaciones para reconciliación ─────────────────────────
  let expectedUsd    = 500_000;
  let expectedCu     = 0;
  let expectedAl     = 0;
  const metals       = [copper, aluminium];
  const pickupCodes: string[] = [];

  // ── 5. 50 COMPRAS ─────────────────────────────────────────────────────────
  console.log(`${C.bold}── 50 COMPRAS ──────────────────────────────────────${C.reset}`);

  for (let i = 1; i <= 50; i++) {
    const metal   = metals[i % 2];  // alternar CU y AL
    const amountKg = rand(1, 20);
    const cost     = parseFloat((amountKg * metal.buyPrice).toFixed(2));

    const res = await api('POST', '/buy', {
      userId,
      metalId: metal.metalId,
      amountKg,
    });

    if (res.success) {
      stats.buys.ok++;
      stats.buys.totalKg  += amountKg;
      stats.buys.totalUsd += res.order.totalUsd;

      // Actualizar expected
      expectedUsd -= res.order.totalUsd;
      if (metal.symbol === 'CU') expectedCu += amountKg;
      else                        expectedAl += amountKg;

      process.stdout.write(`${C.green}✓${C.reset}`);
    } else {
      stats.buys.fail++;
      stats.errors.push(`BUY #${i}: ${res.error?.message ?? JSON.stringify(res)}`);
      process.stdout.write(`${C.red}✗${C.reset}`);
    }

    if (i % 10 === 0) process.stdout.write(` ${i}/50\n`);
    await sleep(50); // pequeña pausa para no saturar
  }

  console.log(`\n${C.green}✓ Compras OK: ${stats.buys.ok}${C.reset}  ${C.red}✗ Fallidas: ${stats.buys.fail}${C.reset}`);
  console.log(`  Total comprado: ${fmt(stats.buys.totalKg)} kg | $${fmt(stats.buys.totalUsd)} USD\n`);

  // ── 6. 50 VENTAS ──────────────────────────────────────────────────────────
  console.log(`${C.bold}── 50 VENTAS ───────────────────────────────────────${C.reset}`);

  for (let i = 1; i <= 50; i++) {
    const metal    = metals[i % 2];
    const maxKg    = metal.symbol === 'CU' ? expectedCu : expectedAl;
    const amountKg = maxKg > 0 ? rand(0.5, Math.min(maxKg * 0.3, 10)) : 0;

    if (amountKg <= 0) {
      // No hay metal para vender, saltamos
      process.stdout.write(`${C.yellow}s${C.reset}`);
      if (i % 10 === 0) process.stdout.write(` ${i}/50\n`);
      continue;
    }

    const res = await api('POST', '/sell', {
      userId,
      metalId: metal.metalId,
      amountKg: parseFloat(amountKg.toFixed(1)),
    });

    if (res.success) {
      stats.sells.ok++;
      stats.sells.totalKg  += res.order.amountKg;
      stats.sells.totalUsd += res.order.totalUsd;

      expectedUsd += res.order.totalUsd;
      if (metal.symbol === 'CU') expectedCu -= res.order.amountKg;
      else                        expectedAl -= res.order.amountKg;

      process.stdout.write(`${C.green}✓${C.reset}`);
    } else {
      stats.sells.fail++;
      stats.errors.push(`SELL #${i}: ${res.error?.message ?? JSON.stringify(res)}`);
      process.stdout.write(`${C.red}✗${C.reset}`);
    }

    if (i % 10 === 0) process.stdout.write(` ${i}/50\n`);
    await sleep(50);
  }

  console.log(`\n${C.green}✓ Ventas OK: ${stats.sells.ok}${C.reset}  ${C.red}✗ Fallidas: ${stats.sells.fail}${C.reset}`);
  console.log(`  Total vendido: ${fmt(stats.sells.totalKg)} kg | $${fmt(stats.sells.totalUsd)} USD\n`);

  // ── 7. 3 RETIROS FÍSICOS ─────────────────────────────────────────────────
  console.log(`${C.bold}── 3 RETIROS FÍSICOS ───────────────────────────────${C.reset}`);

  for (let i = 1; i <= 3; i++) {
    const metal    = i <= 2 ? copper : aluminium;
    const maxKg    = metal.symbol === 'CU' ? expectedCu : expectedAl;
    const amountKg = maxKg >= 1 ? rand(0.5, Math.min(maxKg * 0.2, 5)) : 0;

    if (amountKg <= 0) {
      console.log(`  Retiro #${i}: ${C.yellow}saltado (sin stock suficiente)${C.reset}`);
      continue;
    }

    const res = await api('POST', '/withdrawals', {
      userId,
      metalId: metal.metalId,
      amountKg: parseFloat(amountKg.toFixed(1)),
    });

    if (res.success) {
      stats.withdrawals.ok++;
      stats.withdrawals.totalKg += res.amountKg;
      pickupCodes.push(res.pickupCode);

      if (metal.symbol === 'CU') expectedCu -= res.amountKg;
      else                        expectedAl -= res.amountKg;

      console.log(`  ${C.green}✓${C.reset} Retiro #${i}: ${res.amountKg} kg ${metal.symbol} | código: ${C.bold}${res.pickupCode}${C.reset}`);
    } else {
      stats.withdrawals.fail++;
      stats.errors.push(`WITHDRAWAL #${i}: ${res.error?.message ?? JSON.stringify(res)}`);
      console.log(`  ${C.red}✗${C.reset} Retiro #${i}: ${res.error?.message}`);
    }

    await sleep(100);
  }

  // ── 8. Confirmar los retiros ───────────────────────────────────────────────
  console.log(`\n${C.bold}── CONFIRMANDO RETIROS ─────────────────────────────${C.reset}`);
  for (const code of pickupCodes) {
    const res = await api('PATCH', `/withdrawals/confirm/${code}`);
    console.log(`  ${res.success ? C.green + '✓' : C.red + '✗'}${C.reset} Código ${code}: ${res.status ?? res.error?.message}`);
  }

  // ── 9. Obtener estado final de la DB ──────────────────────────────────────
  const wallets  = await api('GET', `/wallets/${userId}`);
  const ledger   = await api('GET', `/ledger/${userId}?take=100`);
  const inventory = await api('GET', '/inventory');

  const actualUsd = wallets.wallets.find((w: any) => !w.metalId || w.type === 'usd')?.balance ?? 0;
  const actualCu  = wallets.wallets.find((w: any) => w.metal?.symbol === 'CU')?.balance ?? 0;
  const actualAl  = wallets.wallets.find((w: any) => w.metal?.symbol === 'AL')?.balance ?? 0;

  const invCu = inventory.find((i: any) => i.metal.symbol === 'CU');
  const invAl = inventory.find((i: any) => i.metal.symbol === 'AL');

  // ── 10. RESUMEN FINAL ────────────────────────────────────────────────────
  console.log(`\n${C.bold}${C.cyan}═══════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}${C.cyan}   RESUMEN DE CONTABILIDAD${C.reset}`);
  console.log(`${C.bold}${C.cyan}═══════════════════════════════════════════════════${C.reset}\n`);

  console.log(`${C.bold}Operaciones:${C.reset}`);
  console.log(`  Compras    → OK: ${C.green}${stats.buys.ok}${C.reset}  Fallidas: ${stats.buys.fail > 0 ? C.red : C.green}${stats.buys.fail}${C.reset}`);
  console.log(`  Ventas     → OK: ${C.green}${stats.sells.ok}${C.reset}  Fallidas: ${stats.sells.fail > 0 ? C.red : C.green}${stats.sells.fail}${C.reset}`);
  console.log(`  Retiros    → OK: ${C.green}${stats.withdrawals.ok}${C.reset}  Fallidas: ${stats.withdrawals.fail > 0 ? C.red : C.green}${stats.withdrawals.fail}${C.reset}`);
  console.log(`  Ledger     → ${ledger.count} entradas registradas`);

  console.log(`\n${C.bold}Reconciliación de balances:${C.reset}`);

  const usdMatch = Math.abs(actualUsd - expectedUsd) < 0.01;
  const cuMatch  = Math.abs(actualCu  - expectedCu)  < 0.01;
  const alMatch  = Math.abs(actualAl  - expectedAl)  < 0.01;

  console.log(`  USD  → Esperado: $${fmt(expectedUsd)}  Real: $${fmt(actualUsd)}  ${usdMatch ? C.green + '✓ MATCH' : C.red + '✗ MISMATCH'}${C.reset}`);
  console.log(`  CU   → Esperado: ${expectedCu.toFixed(1)} kg  Real: ${Number(actualCu).toFixed(1)} kg  ${cuMatch ? C.green + '✓ MATCH' : C.red + '✗ MISMATCH'}${C.reset}`);
  console.log(`  AL   → Esperado: ${expectedAl.toFixed(1)} kg  Real: ${Number(actualAl).toFixed(1)} kg  ${alMatch ? C.green + '✓ MATCH' : C.red + '✗ MISMATCH'}${C.reset}`);

  console.log(`\n${C.bold}Inventario físico tras operaciones:${C.reset}`);
  console.log(`  CU  → Total: ${invCu?.totalStock} kg | Disponible: ${invCu?.availableStock} kg | Reservado: ${invCu?.reservedStock} kg`);
  console.log(`  AL  → Total: ${invAl?.totalStock} kg | Disponible: ${invAl?.availableStock} kg | Reservado: ${invAl?.reservedStock} kg`);

  if (stats.errors.length > 0) {
    console.log(`\n${C.bold}${C.red}Errores encontrados:${C.reset}`);
    stats.errors.forEach((e) => console.log(`  ${C.red}✗${C.reset} ${e}`));
  }

  const allMatch = usdMatch && cuMatch && alMatch;
  console.log(`\n${C.bold}${allMatch ? C.green + '✅ CONTABILIDAD CUADRA PERFECTAMENTE' : C.red + '❌ HAY DIFERENCIAS EN LA CONTABILIDAD'}${C.reset}\n`);
  console.log(`${C.bold}${C.cyan}═══════════════════════════════════════════════════${C.reset}\n`);
}

main().catch(console.error);
