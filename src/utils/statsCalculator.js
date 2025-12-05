export const calculateTotalRevenue = (orders) => {
  return orders.reduce((sum, order) => {
    return sum + Number(order.final_amount || 0);
  }, 0);
};

export const calculateAverageOrderValue = (orders) => {
  if (orders.length === 0) return 0;
  const totalRevenue = calculateTotalRevenue(orders);
  return totalRevenue / orders.length;
};

export const calculateConversionRate = (totalVisitors, totalOrders) => {
  if (totalVisitors === 0) return 0;
  return (totalOrders / totalVisitors) * 100;
};

export const calculateCancellationRate = (totalOrders, cancelledOrders) => {
  if (totalOrders === 0) return 0;
  return (cancelledOrders / totalOrders) * 100;
};

export const calculateRetentionRate = (returningCustomers, totalCustomers) => {
  if (totalCustomers === 0) return 0;
  return (returningCustomers / totalCustomers) * 100;
};

export const calculateAverageProcessingTime = (orders) => {
  if (orders.length === 0) return 0;

  const processingTimes = orders
    .filter(order => order.updated_at && order.order_date)
    .map(order => {
      const start = new Date(order.order_date);
      const end = new Date(order.updated_at);
      return (end - start) / (1000 * 60 * 60);
    });

  if (processingTimes.length === 0) return 0;

  const total = processingTimes.reduce((sum, time) => sum + time, 0);
  return total / processingTimes.length;
};

export const calculateVoucherUsageRate = (totalVouchers, usedVouchers) => {
  if (totalVouchers === 0) return 0;
  return (usedVouchers / totalVouchers) * 100;
};

export const groupOrdersByStatus = (orders) => {
  const statusCounts = {};
  
  orders.forEach(order => {
    const status = order.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return statusCounts;
};

export const groupOrdersByHour = (orders) => {
  const hourCounts = Array(24).fill(0);
  
  orders.forEach(order => {
    if (order.order_date) {
      const hour = new Date(order.order_date).getHours();
      hourCounts[hour]++;
    }
  });

  return hourCounts.map((count, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    count
  }));
};

export const calculateRatingDistribution = (reviews) => {
  const distribution = {
    '5stars': 0,
    '4stars': 0,
    '3stars': 0,
    '2stars': 0,
    '1star': 0
  };

  reviews.forEach(review => {
    const rating = Number(review.rating);
    if (rating >= 1 && rating <= 5) {
      distribution[`${rating}stars`] = (distribution[`${rating}stars`] || 0) + 1;
    }
  });

  return distribution;
};

export const calculateAverageRating = (reviews) => {
  if (reviews.length === 0) return 0;
  
  const totalRating = reviews.reduce((sum, review) => {
    return sum + Number(review.rating || 0);
  }, 0);

  return totalRating / reviews.length;
};

export const calculateInventoryTurnover = (soldQuantity, averageStock) => {
  if (averageStock === 0) return 0;
  return soldQuantity / averageStock;
};

export const calculateGrossProfitMargin = (revenue, costOfGoodsSold) => {
  if (revenue === 0) return 0;
  return ((revenue - costOfGoodsSold) / revenue) * 100;
};

export const calculateCustomerLifetimeValue = (averageOrderValue, purchaseFrequency, customerLifespan) => {
  return averageOrderValue * purchaseFrequency * customerLifespan;
};

export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

export const calculateMedian = (numbers) => {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
};

export const formatProcessingTime = (hours) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)} phút`;
  } else if (hours < 24) {
    return `${hours.toFixed(1)} giờ`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days} ngày ${remainingHours} giờ`;
  }
};

export const calculatePerformanceScore = ({
  revenue,
  orderCount,
  cancellationRate,
  averageRating
}) => {
  const revenueScore = Math.min((revenue / 100000000) * 25, 25);
  const orderScore = Math.min((orderCount / 100) * 25, 25);
  const cancellationScore = Math.max(25 - cancellationRate * 2.5, 0);
  const ratingScore = (averageRating / 5) * 25;

  const totalScore = revenueScore + orderScore + cancellationScore + ratingScore;

  if (totalScore >= 80) return { score: totalScore, level: 'Xuất sắc' };
  if (totalScore >= 60) return { score: totalScore, level: 'Tốt' };
  if (totalScore >= 40) return { score: totalScore, level: 'Trung bình' };
  return { score: totalScore, level: 'Cần cải thiện' };
};

export const calculateStockHealth = (currentStock, minStock, maxStock) => {
  if (currentStock === 0) return 'OUT_OF_STOCK';
  if (currentStock < minStock) return 'LOW_STOCK';
  if (currentStock > maxStock) return 'OVERSTOCK';
  return 'NORMAL';
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('vi-VN').format(number);
};

export const getTopN = (items, n, sortKey) => {
  return [...items]
    .sort((a, b) => Number(b[sortKey]) - Number(a[sortKey]))
    .slice(0, n);
};

export const getBottomN = (items, n, sortKey) => {
  return [...items]
    .sort((a, b) => Number(a[sortKey]) - Number(b[sortKey]))
    .slice(0, n);
};
