console.log('🧪 Test API /categories/tree sau khi xóa description...\n');

const response = await fetch('http://localhost:3000/api/categories/tree');
const result = await response.json();

if (result.success) {
  console.log('✅ API hoạt động thành công!\n');
  console.log('📊 Metadata:', result.meta);
  console.log(`\n🌲 Có ${result.data.length} main categories:\n`);
  
  result.data.forEach(main => {
    console.log(`\n[${main.id}] ${main.name}`);
    console.log(`   → Products: ${main.product_count}`);
    console.log(`   → Subcategories: ${main.children.length}`);
    
    if (main.children.length > 0) {
      main.children.slice(0, 2).forEach(sub => {
        console.log(`      • [${sub.id}] ${sub.name} (${sub.product_count} products, ${sub.children.length} items)`);
      });
      if (main.children.length > 2) {
        console.log(`      ... và ${main.children.length - 2} subcategories khác`);
      }
    }
  });
  
  // Kiểm tra không còn description field
  const hasDescription = result.data.some(cat => 
    'description' in cat || 
    cat.children?.some(sub => 
      'description' in sub || 
      sub.children?.some(item => 'description' in item)
    )
  );
  
  console.log(`\n${hasDescription ? '❌' : '✅'} Trường description đã được xóa hoàn toàn: ${!hasDescription}`);
  
  // Sample category structure
  console.log('\n📋 Sample category structure:');
  console.log(JSON.stringify(result.data[0], null, 2).substring(0, 500) + '...');
  
} else {
  console.error('❌ Lỗi:', result.error);
}
