import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllProducts = async () => {
  return prisma.product.findMany({
    include: {
      category: true,
      supplier: true,
      baseUnit: true,
      productUnits: true,
    },
  });
};

export const getProductById = async (id) => {
  return prisma.product.findUnique({
    where: { id: Number(id) },
    include: {
      category: true,
      supplier: true,
      baseUnit: true,
      productUnits: true,
    },
  });
};

export const createProduct = async (data) => {
  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      manufacturer: data.manufacturer,
      usage: data.usage,
      dosage: data.dosage,
      specification: data.specification,
      brand: data.brand,
      images: data.images ? data.images : undefined,
      category: data.category_id
        ? { connect: { id: Number(data.category_id) } }
        : undefined,
      supplier: data.supplier_id
        ? { connect: { id: Number(data.supplier_id) } }
        : undefined,
      baseUnit: data.base_unit_id
        ? { connect: { id: Number(data.base_unit_id) } }
        : undefined,
    },
  });
};

export const updateProduct = async (id, data) => {
  return prisma.product.update({
    where: { id: Number(id) },
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      manufacturer: data.manufacturer,
      usage: data.usage,
      dosage: data.dosage,
      specification: data.specification,
      brand: data.brand,
      images: data.images ? data.images : undefined,
      category: data.category_id
        ? { connect: { id: Number(data.category_id) } }
        : undefined,
      supplier: data.supplier_id
        ? { connect: { id: Number(data.supplier_id) } }
        : undefined,
      baseUnit: data.base_unit_id
        ? { connect: { id: Number(data.base_unit_id) } }
        : undefined,
    },
  });
};

export const deleteProduct = async (id) => {
  return prisma.product.delete({
    where: { id: Number(id) },
  });
};

export const searchProductsByName = async (keyword) => {
  return prisma.product.findMany({
  where: {
    name: {
      contains: keyword,
      mode: 'insensitive',
    }},
  });
};

export const getProductsByCategory = async (categoryId) => {
  return prisma.product.findMany({
    where: { category_id: Number(categoryId) },
    include: {
      category: true,
      supplier: true,
      baseUnit: true,
      productUnits: true,
    },
  });
};