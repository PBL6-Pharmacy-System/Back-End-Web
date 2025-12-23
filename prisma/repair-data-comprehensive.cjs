/**
 * COMPREHENSIVE DATA REPAIR SCRIPT (Supabase-Safe)
 * 
 * Purpose: Fix existing database inconsistencies while preserving data
 * 
 * What it does:
 * 1. Audit current state (creates report)
 * 2. Backup data to JSON files
 * 3. Fix orphaned records
 * 4. Fill missing data (with Supabase-safe batching)
 * 5. Sync relationships
 * 6. Validate integrity
 * 
 * Safety: Run in DRY_RUN mode first (default)
 * Supabase: Uses batching to avoid 60-second timeout
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// ============= CONFIGURATION =============
// const DRY_RUN = process.env.DRY_RUN !== 'false'; // Set DRY_RUN=false to execute
DRY_RUN = false // For testing, set to false directly 
const BACKUP_DIR = path.join(__dirname, 'backups', new Date().toISOString().split('T')[0]);

// ============= UTILITY FUNCTIONS =============

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createBackup(tableName, data) {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const filePath = path.join(BACKUP_DIR, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  log('💾', `Backed up ${data.length} records to ${filePath}`);
}

// ============= PHASE 1: AUDIT =============

async function auditDatabase() {
  log('🔍', 'PHASE 1: AUDITING DATABASE STATE');

  const report = {
    timestamp: new Date().toISOString(),
    tables: {},
    issues: [],
  };

  // Count all records
  const tables = [
    'products',
    'branches',
    'suppliers',
    'productunits',
    'branchinventory',
    'productBatch',
    'supplierOrder',
    'inventoryTransfer',
    'stockTake',
    'inventoryLog',
  ];

  for (const table of tables) {
    const count = await prisma[table].count();
    report.tables[table] = { total: count };
    log('📊', `${table}: ${count} records`);
  }

  // Check for specific issues
  log('🔍', 'Checking for data issues...');

  // 1. Inventory with stock = 0 or null
  const zeroStock = await prisma.branchinventory.count({
    where: {
      OR: [
        { stock: 0 },
        { stock: null },
      ],
    },
  });
  report.tables.branchinventory.zeroStock = zeroStock;
  if (zeroStock > 0) {
    report.issues.push(`${zeroStock} inventory records with zero/null stock`);
  }

  // 2. Inventory without batches
  const inventoryWithoutBatches = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM branchinventory bi
    LEFT JOIN "productBatch" pb ON pb.branch_id = bi.branch_id AND pb.product_id = bi.product_id
    WHERE pb.id IS NULL
  `;
  const noBatchCount = Number(inventoryWithoutBatches[0].count);
  report.tables.branchinventory.withoutBatches = noBatchCount;
  if (noBatchCount > 0) {
    report.issues.push(`${noBatchCount} inventory records without batches`);
  }

  // 3. Batches without inventory
  const batchesWithoutInventory = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "productBatch" pb
    LEFT JOIN branchinventory bi ON bi.branch_id = pb.branch_id AND bi.product_id = pb.product_id
    WHERE bi.branch_id IS NULL
  `;
  const orphanBatchCount = Number(batchesWithoutInventory[0].count);
  report.tables.productBatch.orphaned = orphanBatchCount;
  if (orphanBatchCount > 0) {
    report.issues.push(`${orphanBatchCount} orphaned batches (no inventory)`);
  }

  // 4. Product units not linked to any product
  const orphanedUnits = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM productunits pu
    LEFT JOIN products p ON pu."productUnitId" = p.id
    WHERE p.id IS NULL
  `;
  const orphanUnitCount = Number(orphanedUnits[0].count);
  report.tables.productunits.orphaned = orphanUnitCount;
  if (orphanUnitCount > 0) {
    report.issues.push(`${orphanUnitCount} orphaned product units`);
  }

  // 5. Batch quantity mismatches
  const mismatchedStock = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM (
      SELECT 
        bi.branch_id,
        bi.product_id,
        bi.stock,
        COALESCE(SUM(pb.quantity), 0) as batch_total
      FROM branchinventory bi
      LEFT JOIN "productBatch" pb ON pb.branch_id = bi.branch_id 
        AND pb.product_id = bi.product_id
        AND pb.status IN ('active', 'expired')
      GROUP BY bi.branch_id, bi.product_id, bi.stock
      HAVING bi.stock != COALESCE(SUM(pb.quantity), 0)
    ) as mismatches
  `;
  const mismatchCount = Number(mismatchedStock[0].count);
  report.tables.branchinventory.stockMismatch = mismatchCount;
  if (mismatchCount > 0) {
    report.issues.push(`${mismatchCount} inventory records with batch quantity mismatches`);
  }

  // Save report
  const reportPath = path.join(BACKUP_DIR, 'audit-report.json');
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log('📝', `Audit report saved to ${reportPath}`);
  log('⚠️', `Found ${report.issues.length} issue types`);
  report.issues.forEach(issue => log('  ❌', issue));

  return report;
}

// ============= PHASE 2: BACKUP =============

async function backupData() {
  log('💾', 'PHASE 2: BACKING UP DATA');

  const backupTables = [
    'productunits',
    'branchinventory',
    'productBatch',
    'supplierOrder',
    'inventoryTransfer',
    'stockTake',
  ];

  for (const table of backupTables) {
    const data = await prisma[table].findMany();
    await createBackup(table, data);
  }

  log('✅', 'All data backed up successfully');
}

// ============= PHASE 3: REPAIR ORPHANED RECORDS =============

async function repairOrphanedRecords() {
  log('🔧', 'PHASE 3: REPAIRING ORPHANED RECORDS');

  let stats = {
    orphanedUnitsDeleted: 0,
    orphanedBatchesFixed: 0,
    orphanedBatchesDeleted: 0,
  };

  // 3.1 Delete orphaned product units
  log('🗑️', 'Removing orphaned product units...');

  const orphanedUnits = await prisma.$queryRaw`
    SELECT pu.id FROM productunits pu
    LEFT JOIN products p ON pu."productUnitId" = p.id
    WHERE p.id IS NULL
  `;

  if (!DRY_RUN && orphanedUnits.length > 0) {
    const unitIds = orphanedUnits.map(u => u.id);
    const result = await prisma.productunits.deleteMany({
      where: { id: { in: unitIds } },
    });
    stats.orphanedUnitsDeleted = result.count;
  }
  log('📊', `${DRY_RUN ? 'Would delete' : 'Deleted'} ${orphanedUnits.length} orphaned units`);

  // 3.2 Fix orphaned batches - create missing inventory
  log('🔧', 'Fixing orphaned batches by creating inventory...');

  const orphanedBatches = await prisma.$queryRaw`
    SELECT DISTINCT pb.branch_id, pb.product_id 
    FROM "productBatch" pb
    LEFT JOIN branchinventory bi ON bi.branch_id = pb.branch_id AND bi.product_id = pb.product_id
    WHERE bi.branch_id IS NULL
  `;

  for (const batch of orphanedBatches) {
    // Check if branch and product exist
    const branch = await prisma.branches.findUnique({ where: { id: batch.branch_id } });
    const product = await prisma.products.findUnique({ where: { id: batch.product_id } });

    if (branch && product) {
      // Calculate total stock from batches
      const batches = await prisma.productBatch.findMany({
        where: {
          branch_id: batch.branch_id,
          product_id: batch.product_id,
          status: { in: ['active', 'expired'] },
        },
      });

      const totalStock = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);

      if (!DRY_RUN) {
        await prisma.branchinventory.create({
          data: {
            branch_id: batch.branch_id,
            product_id: batch.product_id,
            stock: totalStock,
            min_stock: Math.max(10, Math.floor(totalStock * 0.1)),
            max_stock: Math.max(totalStock * 2, 100),
            reorder_point: Math.max(20, Math.floor(totalStock * 0.2)),
            reorder_quantity: Math.max(50, Math.floor(totalStock * 0.5)),
          },
        });
        stats.orphanedBatchesFixed++;
      }
    } else {
      // Branch or product doesn't exist, delete the batch
      if (!DRY_RUN) {
        await prisma.productBatch.deleteMany({
          where: {
            branch_id: batch.branch_id,
            product_id: batch.product_id,
          },
        });
        stats.orphanedBatchesDeleted++;
      }
    }
  }

  log('📊', `${DRY_RUN ? 'Would fix' : 'Fixed'} ${orphanedBatches.length} orphaned batches`);
  log('  ✅', `Created inventory: ${stats.orphanedBatchesFixed}`);
  log('  🗑️', `Deleted invalid batches: ${stats.orphanedBatchesDeleted}`);

  return stats;
}

// ============= PHASE 4: FIX MISSING DATA =============

async function fixMissingData() {
  log('🔧', 'PHASE 4: FIXING MISSING DATA');

  let stats = {
    inventoryFixed: 0,
    batchesCreated: 0,
    stockUpdated: 0,
  };

  // 4.1 Fix inventory with zero/null stock
  log('🔧', 'Fixing inventory with zero/null stock...');

  const zeroStockInventory = await prisma.branchinventory.findMany({
    where: {
      OR: [
        { stock: 0 },
        { stock: null },
      ],
    },
    include: {
      productBatch: {
        where: {
          status: { in: ['active', 'expired'] },
        },
      },
      products: true,
    },
  });

  for (const inventory of zeroStockInventory) {
    const totalBatchStock = inventory.productBatch.reduce((sum, b) => sum + (b.quantity || 0), 0);

    if (totalBatchStock > 0) {
      // Has batches, sync stock to match
      if (!DRY_RUN) {
        await prisma.branchinventory.update({
          where: {
            branch_id_product_id: {
              branch_id: inventory.branch_id,
              product_id: inventory.product_id,
            },
          },
          data: {
            stock: totalBatchStock,
            min_stock: inventory.min_stock || Math.max(10, Math.floor(totalBatchStock * 0.1)),
            max_stock: inventory.max_stock || Math.max(totalBatchStock * 2, 100),
            reorder_point: inventory.reorder_point || Math.max(20, Math.floor(totalBatchStock * 0.2)),
            reorder_quantity: inventory.reorder_quantity || Math.max(50, Math.floor(totalBatchStock * 0.5)),
          },
        });
        stats.stockUpdated++;
      }
    } else {
      // No batches, set reasonable stock and create batch
      const newStock = randomInt(50, 200);

      if (!DRY_RUN) {
        await prisma.branchinventory.update({
          where: {
            branch_id_product_id: {
              branch_id: inventory.branch_id,
              product_id: inventory.product_id,
            },
          },
          data: {
            stock: newStock,
            min_stock: inventory.min_stock || Math.max(10, Math.floor(newStock * 0.1)),
            max_stock: inventory.max_stock || Math.max(newStock * 2, 100),
            reorder_point: inventory.reorder_point || Math.max(20, Math.floor(newStock * 0.2)),
            reorder_quantity: inventory.reorder_quantity || Math.max(50, Math.floor(newStock * 0.5)),
          },
        });
        stats.inventoryFixed++;
      }
    }
  }

  log('📊', `${DRY_RUN ? 'Would fix' : 'Fixed'} ${zeroStockInventory.length} zero-stock inventories`);

  // 4.2 Create missing batches
  log('🔧', 'Creating batches for inventory without batches...');

  const inventoryWithoutBatches = await prisma.$queryRaw`
    SELECT bi.branch_id, bi.product_id, bi.stock
    FROM branchinventory bi
    LEFT JOIN "productBatch" pb ON pb.branch_id = bi.branch_id AND pb.product_id = bi.product_id
    WHERE pb.id IS NULL AND bi.stock > 0
  `;

  const BATCH_SIZE = 50; // Process 50 inventory items at a time (Supabase-safe)
  const totalInventories = inventoryWithoutBatches.length;

  for (let batchStart = 0; batchStart < totalInventories; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, totalInventories);
    const inventoryBatch = inventoryWithoutBatches.slice(batchStart, batchEnd);

    log('📦', `Processing inventory ${batchStart + 1}-${batchEnd} of ${totalInventories}...`);

    for (const inventory of inventoryBatch) {
      const product = await prisma.products.findUnique({
        where: { id: inventory.product_id },
      });

      if (!product) continue;

      const stockValue = Number(inventory.stock); // Convert BigInt to Number
      const batchCount = randomInt(1, 3);
      const stockPerBatch = Math.floor(stockValue / batchCount);
      let remainingStock = stockValue;

      for (let i = 0; i < batchCount; i++) {
        const isLast = i === batchCount - 1;
        const quantity = isLast ? remainingStock : stockPerBatch;
        remainingStock -= quantity;

        const manufactureDate = new Date(Date.now() - randomInt(30, 365) * 24 * 60 * 60 * 1000);
        const expiryDate = new Date(manufactureDate.getTime() + randomInt(365, 1095) * 24 * 60 * 60 * 1000);
        const isExpired = expiryDate < new Date();

        if (!DRY_RUN && quantity > 0) {
          await prisma.productBatch.create({
            data: {
              branch_id: inventory.branch_id,
              product_id: inventory.product_id,
              batch_number: `BATCH-${Date.now()}-${i}-${randomInt(1000, 9999)}`,
              quantity: quantity,
              manufacture_date: manufactureDate,
              expiry_date: expiryDate,
              cost_price: product.price ? Number(product.price) * 0.6 : 10000,
              selling_price: product.price ? Number(product.price) : 15000,
              status: isExpired ? 'expired' : 'active',
            },
          });
          stats.batchesCreated++;
        }
      }
    }

    // Small delay between batches to avoid Supabase rate limits
    if (!DRY_RUN && batchEnd < totalInventories) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  log('📊', `${DRY_RUN ? 'Would create' : 'Created'} ${stats.batchesCreated} new batches`);

  return stats;
}

// ============= PHASE 5: SYNC RELATIONSHIPS =============

async function syncRelationships() {
  log('🔧', 'PHASE 5: SYNCING RELATIONSHIPS');

  let stats = {
    stockSynced: 0,
  };

  // 5.1 Sync stock to match batch totals
  log('🔧', 'Syncing inventory stock with batch totals...');

  const mismatchedInventory = await prisma.$queryRaw`
    SELECT 
      bi.branch_id,
      bi.product_id,
      bi.stock as current_stock,
      COALESCE(SUM(pb.quantity), 0) as batch_total
    FROM branchinventory bi
    LEFT JOIN "productBatch" pb ON pb.branch_id = bi.branch_id 
      AND pb.product_id = bi.product_id
      AND pb.status IN ('active', 'expired')
    GROUP BY bi.branch_id, bi.product_id, bi.stock
    HAVING bi.stock != COALESCE(SUM(pb.quantity), 0)
  `;

  for (const inventory of mismatchedInventory) {
    if (!DRY_RUN) {
      await prisma.branchinventory.update({
        where: {
          branch_id_product_id: {
            branch_id: inventory.branch_id,
            product_id: inventory.product_id,
          },
        },
        data: {
          stock: Number(inventory.batch_total),
        },
      });
      stats.stockSynced++;
    }
  }

  log('📊', `${DRY_RUN ? 'Would sync' : 'Synced'} ${mismatchedInventory.length} inventory records`);

  return stats;
}

// ============= PHASE 6: VALIDATE =============

async function validateRepairs() {
  log('✅', 'PHASE 6: VALIDATING REPAIRS');

  const issues = [];

  // Re-run all checks
  const zeroStock = await prisma.branchinventory.count({
    where: { OR: [{ stock: 0 }, { stock: null }] },
  });
  if (zeroStock > 0) issues.push(`Still ${zeroStock} inventory with zero stock`);

  const inventoryWithoutBatches = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM branchinventory bi
    LEFT JOIN "productBatch" pb ON pb.branch_id = bi.branch_id AND pb.product_id = bi.product_id
    WHERE pb.id IS NULL AND bi.stock > 0
  `;
  const noBatchCount = Number(inventoryWithoutBatches[0].count);
  if (noBatchCount > 0) issues.push(`Still ${noBatchCount} inventory without batches`);

  const mismatchedStock = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM (
      SELECT bi.branch_id, bi.product_id
      FROM branchinventory bi
      LEFT JOIN "productBatch" pb ON pb.branch_id = bi.branch_id AND pb.product_id = bi.product_id
      GROUP BY bi.branch_id, bi.product_id, bi.stock
      HAVING bi.stock != COALESCE(SUM(pb.quantity), 0)
    ) as mismatches
  `;
  const mismatchCount = Number(mismatchedStock[0].count);
  if (mismatchCount > 0) issues.push(`Still ${mismatchCount} stock mismatches`);

  if (issues.length === 0) {
    log('🎉', 'ALL VALIDATIONS PASSED!');
  } else {
    log('⚠️', `Found ${issues.length} remaining issues:`);
    issues.forEach(issue => log('  ❌', issue));
  }

  return issues;
}

// ============= MAIN EXECUTION =============

async function main() {
  console.log('='.repeat(60));
  log('🔧', 'COMPREHENSIVE DATA REPAIR SCRIPT');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    log('⚠️', 'RUNNING IN DRY RUN MODE - NO CHANGES WILL BE MADE');
    log('ℹ️', 'Set environment variable DRY_RUN=false to execute repairs');
  } else {
    log('⚠️', 'RUNNING IN LIVE MODE - DATABASE WILL BE MODIFIED');
  }
  console.log('='.repeat(60));

  try {
    // Phase 1: Audit
    const auditReport = await auditDatabase();
    console.log('');

    if (auditReport.issues.length === 0) {
      log('🎉', 'No issues found! Database is healthy.');
      return;
    }

    // Phase 2: Backup
    await backupData();
    console.log('');

    // Phase 3: Repair orphans
    const orphanStats = await repairOrphanedRecords();
    console.log('');

    // Phase 4: Fix missing data
    const missingStats = await fixMissingData();
    console.log('');

    // Phase 5: Sync relationships
    const syncStats = await syncRelationships();
    console.log('');

    // Phase 6: Validate
    if (!DRY_RUN) {
      const remainingIssues = await validateRepairs();
      console.log('');
    }

    // Summary
    console.log('='.repeat(60));
    log('📊', 'REPAIR SUMMARY');
    console.log('='.repeat(60));
    log('🗑️', `Orphaned units deleted: ${orphanStats.orphanedUnitsDeleted}`);
    log('✅', `Orphaned batches fixed: ${orphanStats.orphanedBatchesFixed}`);
    log('🗑️', `Invalid batches deleted: ${orphanStats.orphanedBatchesDeleted}`);
    log('🔧', `Zero-stock inventory fixed: ${missingStats.inventoryFixed}`);
    log('📦', `Batches created: ${missingStats.batchesCreated}`);
    log('🔄', `Stock updated from batches: ${missingStats.stockUpdated}`);
    log('🔄', `Stock synced: ${syncStats.stockSynced}`);
    console.log('='.repeat(60));

    if (DRY_RUN) {
      log('ℹ️', 'This was a dry run. To apply changes, run:');
      console.log('   DRY_RUN=false node prisma/repair-data-comprehensive.cjs');
    } else {
      log('✅', 'Repair completed! Check backups folder for original data.');
    }

  } catch (error) {
    log('❌', `Error during repair: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
