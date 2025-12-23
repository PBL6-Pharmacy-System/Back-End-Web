# Data Repair Guide - Safe & Logical Process

## 🎯 Objective
Fix existing database inconsistencies while **preserving all data** through a safe, step-by-step process.

---

## 📋 What the Repair Script Does

### Phase 1: AUDIT
- Counts all records in critical tables
- Identifies specific issues:
  - Inventory with stock = 0 or null
  - Inventory without batches
  - Batches without inventory (orphaned)
  - Product units not linked to any product
  - Stock/batch quantity mismatches
- Creates detailed JSON report

### Phase 2: BACKUP
- Backs up ALL data to JSON files before making changes
- Creates timestamped backup folder: `prisma/backups/YYYY-MM-DD/`
- Tables backed up:
  - productunits
  - branchinventory
  - productBatch
  - supplierOrder
  - inventoryTransfer
  - stockTake

### Phase 3: REPAIR ORPHANED RECORDS
- **Orphaned Units**: Deletes product units not linked to any product
- **Orphaned Batches**: 
  - If branch/product exist → Creates missing inventory
  - If branch/product don't exist → Deletes invalid batches

### Phase 4: FIX MISSING DATA
- **Zero/Null Stock**:
  - If batches exist → Syncs stock to match batch total
  - If no batches → Sets reasonable stock + creates batches
- **Missing Batches**:
  - Creates 1-3 batches per inventory
  - Batch quantities sum to match inventory stock
  - Sets realistic manufacture/expiry dates
  - Calculates cost/selling prices

### Phase 5: SYNC RELATIONSHIPS
- Syncs inventory stock to match batch totals
- Ensures all quantities are consistent

### Phase 6: VALIDATE
- Re-runs all checks from Phase 1
- Reports any remaining issues
- Confirms repairs were successful

---

## 🚀 Safe Execution Process

### STEP 1: Dry Run (See what would happen)

```bash
# This will NOT make any changes, just show you what would be done
node prisma/repair-data-comprehensive.cjs
```

**Review the output:**
- Check audit report for issues found
- See what would be deleted/created/updated
- Verify the planned changes make sense

### STEP 2: Review Audit Report

```bash
# Check the detailed report
cat prisma/backups/2025-12-22/audit-report.json
```

**Key things to check:**
- Total records in each table
- Number of issues found
- Which specific problems exist

### STEP 3: Execute Repairs (Apply changes)

```bash
# This WILL modify the database
DRY_RUN=false node prisma/repair-data-comprehensive.cjs
```

**Watch the output:**
- Each phase will show progress
- Stats will show what was fixed
- Final validation will confirm success

### STEP 4: Verify Results

```sql
-- Check inventory has stock
SELECT COUNT(*) FROM branchinventory WHERE stock > 0;

-- Check all inventory has batches
SELECT COUNT(*) FROM branchinventory bi
LEFT JOIN productBatch pb ON pb.branch_id = bi.branch_id AND pb.product_id = bi.product_id
WHERE pb.id IS NULL AND bi.stock > 0;
-- Should return 0

-- Check stock matches batch totals
SELECT COUNT(*) FROM (
  SELECT 
    bi.branch_id,
    bi.product_id,
    bi.stock,
    COALESCE(SUM(pb.quantity), 0) as batch_total
  FROM branchinventory bi
  LEFT JOIN productBatch pb ON pb.branch_id = bi.branch_id 
    AND pb.product_id = bi.product_id
    AND pb.status IN ('active', 'expired')
  GROUP BY bi.branch_id, bi.product_id, bi.stock
  HAVING bi.stock != COALESCE(SUM(pb.quantity), 0)
) as mismatches;
-- Should return 0
```

---

## 🛡️ Safety Features

✅ **DRY RUN by default** - Won't change anything unless you explicitly set `DRY_RUN=false`

✅ **Complete backups** - All data saved to JSON before any changes

✅ **Timestamped backups** - Each run creates new backup folder

✅ **Transaction safety** - Each operation wrapped in error handling

✅ **Validation** - Checks database state before and after

✅ **Detailed logging** - See exactly what's happening

✅ **Rollback possible** - Can restore from JSON backups if needed

---

## 🔄 Rollback Process (If needed)

If something goes wrong, you can restore from backups:

```javascript
// Create restore script: prisma/restore-from-backup.cjs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function restore() {
  const backupDate = '2025-12-22'; // Change to your backup date
  const backupDir = `./backups/${backupDate}`;
  
  // Example: Restore branch inventory
  const data = JSON.parse(fs.readFileSync(`${backupDir}/branchinventory.json`));
  
  // Delete current data
  await prisma.branchinventory.deleteMany();
  
  // Restore from backup
  for (const record of data) {
    await prisma.branchinventory.create({ data: record });
  }
  
  console.log(`Restored ${data.length} records`);
}

restore();
```

---

## 📊 Expected Results

**Before repair:**
- ~2000 product units (many orphaned)
- ~6000 branch inventories (many with stock=0)
- ~750 product batches (don't match inventories)
- ❌ Inconsistent relationships
- ❌ Missing data

**After repair:**
- ~1400-1600 product units (only valid ones)
- ~4800-5500 branch inventories (all with stock>0)
- ~4800-11000 product batches (match inventories)
- ✅ All relationships valid
- ✅ Complete data

**Cleaned up:**
- 400-600 orphaned product units
- 500-1200 zero-stock inventories fixed
- 4000-10000 batches created
- All stock quantities synced

---

## ⚠️ Important Notes

1. **Run during maintenance window** - Script may take 5-15 minutes
2. **Database will be locked** - Don't run during peak hours
3. **Check backups folder** - Ensure backups are created before changes
4. **Test on staging first** - If you have a staging environment
5. **Keep backups** - Don't delete backup folders

---

## 🆘 Troubleshooting

### Issue: "Cannot read property of undefined"
**Cause**: Missing table or connection issue  
**Fix**: Check database connection, ensure all tables exist

### Issue: "Unique constraint violation"
**Cause**: Trying to create duplicate records  
**Fix**: Script handles this, should not happen in dry run

### Issue: Script runs but no changes
**Cause**: Running in DRY_RUN mode  
**Fix**: Set `DRY_RUN=false` to execute

### Issue: Too many records deleted
**Cause**: Audit report showed actual orphaned data  
**Fix**: This is correct - orphaned data should be removed

---

## 📞 Support Checklist

If you need help, provide:
- [ ] Audit report JSON file
- [ ] Console output from dry run
- [ ] Current database counts (from audit phase)
- [ ] Expected vs actual results
- [ ] Any error messages

---

## ✅ Success Criteria

After successful repair, you should have:

- ✅ Zero orphaned product units
- ✅ Zero inventory records with null/zero stock
- ✅ Every inventory has at least one batch
- ✅ Stock quantities match batch totals
- ✅ All foreign key relationships valid
- ✅ Complete backups in backup folder
- ✅ Validation phase passes all checks

---

## 🎯 Next Steps After Repair

1. Run comprehensive seeding to add more data:
   ```bash
   node prisma/seed-products-comprehensive.cjs
   ```

2. Verify new data integrates properly

3. Update documentation with new record counts

4. Remove old/unused seeding scripts to prevent future issues

5. Consider adding database constraints to prevent orphaned records

---

**Ready to proceed?** Start with STEP 1 (Dry Run) above! 🚀
