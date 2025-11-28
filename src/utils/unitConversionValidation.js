/**
 * Unit Conversion Validation Utilities
 * ✅ FIX ISSUE #7: Validate unit conversion khi order
 * 
 * @module utils/unitConversionValidation
 */

import prisma from '../config/db.js';

/**
 * Validate product unit belongs to product and get conversion details
 * @param {number} productId - Product ID
 * @param {number} unitId - Product Unit ID
 * @returns {Promise<{isValid: boolean, error?: string, unit?: object}>}
 */
export const validateProductUnit = async (productId, unitId) => {
    try {
        const productUnit = await prisma.productunits.findFirst({
            where: {
                id: Number(unitId),
                product_id: Number(productId)
            },
            include: {
                products: {
                    select: {
                        id: true,
                        name: true,
                        base_unit_id: true,
                        unittype: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        if (!productUnit) {
            return {
                isValid: false,
                error: `Đơn vị sản phẩm (ID: ${unitId}) không thuộc sản phẩm (ID: ${productId})`
            };
        }

        return {
            isValid: true,
            unit: {
                id: productUnit.id,
                unit_name: productUnit.unit_name,
                conversion_factor: Number(productUnit.conversion_factor),
                price: Number(productUnit.price),
                product: productUnit.products
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Calculate base quantity from ordered quantity using conversion factor
 * @param {number} orderedQuantity - Quantity ordered in the specified unit
 * @param {number} conversionFactor - Conversion factor to base unit
 * @returns {number} - Quantity in base unit
 */
export const calculateBaseQuantity = (orderedQuantity, conversionFactor) => {
    return Number(orderedQuantity) * Number(conversionFactor);
};

/**
 * Validate order item with unit conversion
 * Ensures:
 * 1. Product exists
 * 2. Unit belongs to product
 * 3. Conversion factor is valid (> 0)
 * 4. Stock is sufficient (in base units)
 * 
 * @param {object} item - Order item
 * @param {number} item.productId - Product ID
 * @param {number} item.unitId - Product Unit ID
 * @param {number} item.quantity - Quantity to order
 * @param {number} [branchId] - Optional branch ID for stock check
 * @returns {Promise<{isValid: boolean, error?: string, details?: object}>}
 */
export const validateOrderItemWithConversion = async (item, branchId = null) => {
    try {
        const { productId, unitId, quantity } = item;

        // 1. Validate product exists
        const product = await prisma.products.findUnique({
            where: { id: Number(productId) },
            include: {
                unittype: true,
                productunits: true
            }
        });

        if (!product) {
            return {
                isValid: false,
                error: `Sản phẩm (ID: ${productId}) không tồn tại`
            };
        }

        // 2. Validate unit belongs to product
        const unitValidation = await validateProductUnit(productId, unitId);
        if (!unitValidation.isValid) {
            return unitValidation;
        }

        const { unit } = unitValidation;

        // 3. Validate conversion factor
        if (!unit.conversion_factor || unit.conversion_factor <= 0) {
            return {
                isValid: false,
                error: `Hệ số quy đổi không hợp lệ cho đơn vị "${unit.unit_name}" (conversion_factor: ${unit.conversion_factor})`
            };
        }

        // 4. Validate quantity
        if (!quantity || Number(quantity) <= 0) {
            return {
                isValid: false,
                error: 'Số lượng phải lớn hơn 0'
            };
        }

        // 5. Calculate base quantity
        const baseQuantity = calculateBaseQuantity(quantity, unit.conversion_factor);

        // 6. Check stock if branchId provided
        if (branchId) {
            const inventory = await prisma.branchinventory.findUnique({
                where: {
                    branch_id_product_id: {
                        branch_id: Number(branchId),
                        product_id: Number(productId)
                    }
                }
            });

            if (!inventory || inventory.stock < baseQuantity) {
                return {
                    isValid: false,
                    error: `Không đủ hàng trong kho. Yêu cầu: ${baseQuantity} ${product.unittype?.name || 'đơn vị'}, Có sẵn: ${inventory?.stock || 0}`,
                    details: {
                        required_base_quantity: baseQuantity,
                        available_stock: inventory?.stock || 0,
                        shortage: baseQuantity - (inventory?.stock || 0)
                    }
                };
            }
        }

        return {
            isValid: true,
            details: {
                product_id: productId,
                product_name: product.name,
                unit_id: unitId,
                unit_name: unit.unit_name,
                ordered_quantity: Number(quantity),
                conversion_factor: unit.conversion_factor,
                base_quantity: baseQuantity,
                base_unit: product.unittype?.name || 'đơn vị',
                unit_price: unit.price,
                subtotal: Number(quantity) * unit.price
            }
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Validate multiple order items with unit conversion
 * @param {Array<object>} items - Array of order items
 * @param {number} [branchId] - Optional branch ID for stock check
 * @returns {Promise<{isValid: boolean, errors?: Array, validatedItems?: Array}>}
 */
export const validateOrderItemsWithConversion = async (items, branchId = null) => {
    const errors = [];
    const validatedItems = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const validation = await validateOrderItemWithConversion(item, branchId);

        if (!validation.isValid) {
            errors.push({
                index: i,
                item,
                error: validation.error,
                details: validation.details
            });
        } else {
            validatedItems.push(validation.details);
        }
    }

    if (errors.length > 0) {
        return {
            isValid: false,
            errors,
            validatedItems
        };
    }

    return {
        isValid: true,
        validatedItems
    };
};

/**
 * Get all units for a product with conversion info
 * @param {number} productId - Product ID
 * @returns {Promise<Array>}
 */
export const getProductUnitsWithConversion = async (productId) => {
    try {
        const product = await prisma.products.findUnique({
            where: { id: Number(productId) },
            include: {
                unittype: true,
                productunits: {
                    orderBy: { conversion_factor: 'asc' }
                }
            }
        });

        if (!product) {
            return [];
        }

        return product.productunits.map(unit => ({
            id: unit.id,
            unit_name: unit.unit_name,
            conversion_factor: Number(unit.conversion_factor),
            price: Number(unit.price),
            base_unit: product.unittype?.name || 'đơn vị',
            description: `1 ${unit.unit_name} = ${unit.conversion_factor} ${product.unittype?.name || 'đơn vị'}`
        }));
    } catch (error) {
        throw error;
    }
};

/**
 * Convert quantity between units
 * @param {number} quantity - Quantity to convert
 * @param {number} fromConversionFactor - Source unit conversion factor
 * @param {number} toConversionFactor - Target unit conversion factor
 * @returns {number} - Converted quantity
 */
export const convertBetweenUnits = (quantity, fromConversionFactor, toConversionFactor) => {
    // First convert to base unit, then to target unit
    const baseQuantity = Number(quantity) * Number(fromConversionFactor);
    return baseQuantity / Number(toConversionFactor);
};
