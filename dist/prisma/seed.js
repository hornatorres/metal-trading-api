"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const copper = await prisma.metal.upsert({
        where: { symbol: 'CU' },
        update: {},
        create: { name: 'Copper', symbol: 'CU', unit: 'kg' },
    });
    const aluminium = await prisma.metal.upsert({
        where: { symbol: 'AL' },
        update: {},
        create: { name: 'Aluminium', symbol: 'AL', unit: 'kg' },
    });
    console.log('✅ Metals:', copper.symbol, aluminium.symbol);
    await prisma.inventory.upsert({
        where: { metalId: copper.id },
        update: {},
        create: { metalId: copper.id, totalStock: 50000, reservedStock: 0, availableStock: 50000 },
    });
    await prisma.inventory.upsert({
        where: { metalId: aluminium.id },
        update: {},
        create: { metalId: aluminium.id, totalStock: 100000, reservedStock: 0, availableStock: 100000 },
    });
    console.log('✅ Inventory initialized');
    await prisma.price.createMany({
        data: [
            { metalId: copper.id, buyPrice: 8.50, sellPrice: 8.20, spread: 0.035 },
            { metalId: aluminium.id, buyPrice: 2.40, sellPrice: 2.25, spread: 0.064 },
        ],
        skipDuplicates: true,
    });
    console.log('✅ Prices set');
    const hash = await bcrypt.hash('Demo1234!', 12);
    const user = await prisma.user.upsert({
        where: { email: 'demo@metaltrading.com' },
        update: {},
        create: { email: 'demo@metaltrading.com', passwordHash: hash, status: 'ACTIVE' },
    });
    await prisma.wallet.upsert({
        where: { userId_metalId: { userId: user.id, metalId: '' } },
        update: { balance: 10000 },
        create: { userId: user.id, metalId: null, balance: 10000 },
    });
    console.log('✅ Demo user: demo@metaltrading.com / Demo1234!');
    console.log('🎉 Seed complete');
    console.log('\n📋 Useful IDs:');
    console.log('   Copper  metalId:', copper.id);
    console.log('   Aluminium metalId:', aluminium.id);
    console.log('   Demo userId:', user.id);
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map