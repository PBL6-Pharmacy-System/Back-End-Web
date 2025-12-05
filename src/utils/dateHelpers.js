export const parseDateRange = (startDate, endDate, period) => {
  const now = new Date();
  let start, end;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else if (period) {
    end = new Date(now);
    end.setHours(23, 59, 59, 999);

    switch (period) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      
      case 'yesterday':
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;

      case '7days':
      case 'week':
        start = new Date(now);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        break;

      case '30days':
      case 'month':
        start = new Date(now);
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        break;

      case '90days':
      case 'quarter':
        start = new Date(now);
        start.setDate(start.getDate() - 89);
        start.setHours(0, 0, 0, 0);
        break;

      case '365days':
      case 'year':
        start = new Date(now);
        start.setDate(start.getDate() - 364);
        start.setHours(0, 0, 0, 0);
        break;

      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        break;

      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;

      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        break;

      case 'lastYear':
        start = new Date(now.getFullYear() - 1, 0, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear() - 1, 11, 31);
        end.setHours(23, 59, 59, 999);
        break;

      default:
        start = new Date(now);
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
    }
  } else {
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
    start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  }

  return { startDate: start, endDate: end };
};

export const getComparisonPeriod = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const comparisonEnd = new Date(start);
  comparisonEnd.setDate(comparisonEnd.getDate() - 1);
  comparisonEnd.setHours(23, 59, 59, 999);

  const comparisonStart = new Date(comparisonEnd);
  comparisonStart.setDate(comparisonStart.getDate() - daysDiff + 1);
  comparisonStart.setHours(0, 0, 0, 0);

  return {
    startDate: comparisonStart,
    endDate: comparisonEnd,
    daysDiff
  };
};

export const calculateGrowth = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }

  const growth = ((current - previous) / previous) * 100;
  const sign = growth >= 0 ? '+' : '';
  return `${sign}${growth.toFixed(1)}%`;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

export const generateDateArray = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const formatChartDate = (date, daysDiff) => {
  const d = new Date(date);
  
  if (daysDiff <= 7) {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return `${d.getDate()}/${d.getMonth() + 1} (${days[d.getDay()]})`;
  } else if (daysDiff <= 31) {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } else if (daysDiff <= 90) {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } else {
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
  }
};

export const getGroupingInterval = (daysDiff) => {
  if (daysDiff <= 31) {
    return 'day';
  } else if (daysDiff <= 90) {
    return 'week';
  } else {
    return 'month';
  }
};

export const getSQLDateFormat = (interval) => {
  switch (interval) {
    case 'day':
      return 'YYYY-MM-DD';
    case 'week':
      return 'YYYY-WW';
    case 'month':
      return 'YYYY-MM';
    case 'year':
      return 'YYYY';
    default:
      return 'YYYY-MM-DD';
  }
};

export const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Ngày không hợp lệ' };
  }

  if (start > end) {
    return { valid: false, error: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc' };
  }

  if (end > now) {
    return { valid: false, error: 'Ngày kết thúc không được lớn hơn ngày hiện tại' };
  }

  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (daysDiff > 365) {
    return { valid: false, error: 'Khoảng thời gian không được vượt quá 365 ngày' };
  }

  return { valid: true };
};

export const getDaysDifference = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
};
