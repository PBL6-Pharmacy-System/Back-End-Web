/**
 * Inventory Log Convention Migration Script
 * 
 * Migrate từ convention cũ (số âm cho xuất kho) sang convention mới (số dương + type)
 * 
 * Usage:
 *   node scripts/migrate-inventory-log-convention.js --dry-run   # Chỉ kiểm tra, không thay đổi
 *   node scripts/migrate-inventory-log-convention.js --execute   # Thực thi migration
 *   node scripts/migrate-inventory-log-convention.js --verify    # Kiểm tra sau migration
 */

import prisma from '../src/config/db.js';

const LEGACY_TYPES = ['OUT', 'sale'];
const TYPE_MAPPING = {
    'OUT': 'EXPORT',
    'sale': 'EXPORT'
};

/**
 * Phân tích dữ liệu hiện tại
 */
async function analyzeCurrentData() {
    console.log('\n📊 ANALYZING CURRENT DATA...\n');

    // Đếm theo type
    const typeStats = await prisma.$queryRaw`
    SELECT 
      type,
      COUNT(*)::int as total,
      SUM(CASE WHEN quantity < 0 THEN 1 ELSE 0 END)::int as negative_qty,
      SUM(CASE WHEN quantity > 0 THEN 1 ELSE 0 END)::int as positive_qty,
      SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END)::int as zero_qty
    FROM "inventoryLog"
    GROUP BY type
    ORDER BY type
  `;

    console.log('Type Statistics:');
    console.table(typeStats);

    // Đếm legacy types
    const legacyCount = await prisma.inventoryLog.count({
        where: {
            type: { in: LEGACY_TYPES }
        }
    });

    // Đếm negative quantities (không phải ADJUSTMENT/STOCK_TAKE)
    const negativeQtyCount = await prisma.inventoryLog.count({
        where: {
            quantity: { lt: 0 },
            type: { notIn: ['ADJUSTMENT', 'STOCK_TAKE'] }
        }
    });

    console.log(`\n📌 Summary:`);
    console.log(`   - Legacy types (OUT, sale): ${legacyCount} records`);
    console.log(`   - Negative quantities (need fix): ${negativeQtyCount} records`);

    return { typeStats, legacyCount, negativeQtyCount };
}

/**
 * Dry run - Kiểm tra những gì sẽ được migrate
 */
async function dryRun() {
    console.log('\n🔍 DRY RUN MODE - No changes will be made\n');

    const analysis = await analyzeCurrentData();

    // Lấy sample records cần migrate
    const samplesToMigrate = await prisma.inventoryLog.findMany({
        where: {
            OR: [
                { type: { in: LEGACY_TYPES } },
                {
                    quantity: { lt: 0 },
                    type: { notIn: ['ADJUSTMENT', 'STOCK_TAKE'] }
                }
            ]
        },
        take: 10,
        orderBy: { id: 'desc' }
    });

    if (samplesToMigrate.length > 0) {
        console.log('\n📋 Sample records that will be migrated:');
        samplesToMigrate.forEach(record => {
            const newType = TYPE_MAPPING[record.type] || record.type;
            const newQty = Math.abs(record.quantity);
            console.log(`   ID: ${record.id} | ${record.type} → ${newType} | qty: ${record.quantity} → ${newQty}`);
        });
    }

    console.log('\n✅ Dry run complete. Run with --execute to apply changes.\n');

    return analysis;
}

/**
 * Thực thi migration
 */
async function executeMigration() {
    console.log('\n🚀 EXECUTING MIGRATION...\n');

    const analysis = await analyzeCurrentData();

    if (analysis.legacyCount === 0 && analysis.negativeQtyCount === 0) {
        console.log('✅ No records need migration. Database is already using new convention.');
        return;
    }

    // Confirm before proceeding
    console.log('\n⚠️  WARNING: This will modify the database.');
    console.log('   Make sure you have a backup before proceeding.\n');

    let migratedCount = 0;

    await prisma.$transaction(async (tx) => {
        // Step 1: Migrate 'OUT' type
        const outResult = await tx.inventoryLog.updateMany({
            where: {
                type: 'OUT',
                quantity: { lt: 0 }
            },
            data: {
                type: 'EXPORT',
                // Note: Prisma doesn't support ABS in updateMany, so we handle this differently
            }
        });
        console.log(`   Migrated ${outResult.count} 'OUT' records to 'EXPORT'`);
        migratedCount += outResult.count;

        // Step 2: Migrate 'sale' type
        const saleResult = await tx.inventoryLog.updateMany({
            where: {
                type: 'sale',
                quantity: { lt: 0 }
            },
            data: {
                type: 'EXPORT'
            }
        });
        console.log(`   Migrated ${saleResult.count} 'sale' records to 'EXPORT'`);
        migratedCount += saleResult.count;

        // Step 3: Fix negative quantities using raw SQL (Prisma doesn't support ABS)
        const absResult = await tx.$executeRaw`
      UPDATE "inventoryLog"
      SET quantity = ABS(quantity)
      WHERE quantity < 0 
        AND type NOT IN ('ADJUSTMENT', 'STOCK_TAKE')
    `;
        console.log(`   Fixed ${absResult} records with negative quantities`);
    });

    console.log(`\n✅ Migration complete. ${migratedCount} records migrated.\n`);

    // Verify after migration
    await verifyMigration();
}

/**
 * Verify migration
 */
async function verifyMigration() {
    console.log('\n🔎 VERIFYING MIGRATION...\n');

    // Check for legacy types
    const legacyCount = await prisma.inventoryLog.count({
        where: {
            type: { in: LEGACY_TYPES }
        }
    });

    // Check for negative quantities (excluding ADJUSTMENT/STOCK_TAKE)
    const negativeQtyCount = await prisma.inventoryLog.count({
        where: {
            quantity: { lt: 0 },
            type: { notIn: ['ADJUSTMENT', 'STOCK_TAKE'] }
        }
    });

    console.log('Verification Results:');
    console.log(`   - Legacy types remaining: ${legacyCount}`);
    console.log(`   - Negative quantities remaining: ${negativeQtyCount}`);

    if (legacyCount === 0 && negativeQtyCount === 0) {
        console.log('\n✅ VERIFICATION PASSED! Database is using new convention.\n');
    } else {
        console.log('\n❌ VERIFICATION FAILED! Some records still need migration.\n');
    }

    // Show current type distribution
    await analyzeCurrentData();
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('   INVENTORY LOG CONVENTION MIGRATION');
    console.log('   From: Negative quantity for exports');
    console.log('   To:   Positive quantity + type indicates direction');
    console.log('═══════════════════════════════════════════════════════════════');

    try {
        if (args.includes('--execute')) {
            await executeMigration();
        } else if (args.includes('--verify')) {
            await verifyMigration();
        } else {
            // Default to dry run
            await dryRun();
        }
    } catch (error) {
        console.error('\n❌ Error during migration:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
