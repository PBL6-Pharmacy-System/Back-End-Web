const { PrismaClient } = require('@prisma/client');

async function testSearch() {
  const prisma = new PrismaClient();
  
  try {
    // Search for products with "sốt" in name
    const products = await prisma.products.findMany({
      where: { 
        OR: [
          { name: { contains: 'sốt', mode: 'insensitive' } },
          { name: { contains: 'cảm', mode: 'insensitive' } },
          { description: { contains: 'sốt', mode: 'insensitive' } },
          { description: { contains: 'cảm', mode: 'insensitive' } }
        ]
      },
      include: {
        productunits: true,
        categories: true
      },
      take: 10
    });
    
    console.log('Found:', products.length, 'products');
    products.forEach(p => console.log(p.id, '|', p.name.substring(0, 60)));
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

testSearch();
