// Enhanced Auto-Period Detection Utilities

/**
 * Extract inquiry start dates from CSV data
 * An inquiry starts with the first tenant message (MessageType = 3) in a conversation
 */
export const extractInquiryStartDates = (csvData) => {
  const conversationMap = {};
  
  // Group messages by ConversationId
  csvData.forEach(row => {
    const convId = row.ConversationId;
    if (!conversationMap[convId]) {
      conversationMap[convId] = [];
    }
    conversationMap[convId].push(row);
  });

  // Find first tenant message for each conversation
  const inquiryStartDates = [];
  
  Object.keys(conversationMap).forEach(convId => {
    const messages = conversationMap[convId].sort((a, b) => 
      new Date(a.TimeSent) - new Date(b.TimeSent)
    );
    
    // Find first tenant message (MessageType = 3)
    const firstTenantMessage = messages.find(msg => msg.MessageType === '3');
    
    if (firstTenantMessage && firstTenantMessage.TimeSent) {
      const startDate = new Date(firstTenantMessage.TimeSent);
      if (!isNaN(startDate.getTime())) {
        inquiryStartDates.push({
          conversationId: convId,
          startDate: startDate,
          messages: messages
        });
      }
    }
  });

  return inquiryStartDates;
};

/**
 * Automatically detect and suggest periods from inquiry start dates
 */
export const detectPeriodsFromData = (csvData) => {
  if (!csvData || csvData.length === 0) return [];

  // Get inquiry start dates
  const inquiries = extractInquiryStartDates(csvData);
  
  if (inquiries.length === 0) return [];

  // Get timestamps of when inquiries started
  const timestamps = inquiries
    .map(inq => inq.startDate)
    .sort((a, b) => a - b);

  const minDate = timestamps[0];
  const maxDate = timestamps[timestamps.length - 1];

  // Calculate date range in days
  const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

  // Suggest period grouping based on data span
  let periods = [];

  if (daysDiff <= 7) {
    // Daily periods for data within a week
    periods = generateDailyPeriods(minDate, maxDate);
  } else if (daysDiff <= 90) {
    // Weekly periods for data within 3 months
    periods = generateWeeklyPeriods(minDate, maxDate);
  } else if (daysDiff <= 365) {
    // Monthly periods for data within a year
    periods = generateMonthlyPeriods(minDate, maxDate);
  } else {
    // Quarterly periods for data over a year
    periods = generateQuarterlyPeriods(minDate, maxDate);
  }

  return periods;
};

/**
 * Generate daily periods
 */
const generateDailyPeriods = (startDate, endDate) => {
  const periods = [];
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const periodEnd = new Date(currentDate);
    periodEnd.setHours(23, 59, 59, 999);

    periods.push({
      name: formatDate(currentDate, 'daily'),
      startDate: new Date(currentDate).toISOString().split('T')[0],
      endDate: new Date(periodEnd).toISOString().split('T')[0]
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return periods;
};

/**
 * Generate weekly periods (Monday to Sunday)
 */
const generateWeeklyPeriods = (startDate, endDate) => {
  const periods = [];
  let currentDate = new Date(startDate);
  
  // Move to start of week (Monday)
  const dayOfWeek = currentDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  currentDate.setDate(currentDate.getDate() + daysToMonday);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const periodEnd = new Date(currentDate);
    periodEnd.setDate(periodEnd.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);

    if (periodEnd >= startDate) {
      periods.push({
        name: `Week of ${formatDate(currentDate, 'weekly')}`,
        startDate: new Date(currentDate).toISOString().split('T')[0],
        endDate: new Date(periodEnd).toISOString().split('T')[0]
      });
    }

    currentDate.setDate(currentDate.getDate() + 7);
  }

  return periods;
};

/**
 * Generate monthly periods
 */
const generateMonthlyPeriods = (startDate, endDate) => {
  const periods = [];
  let currentDate = new Date(startDate);
  
  // Move to start of month
  currentDate.setDate(1);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    periodEnd.setHours(23, 59, 59, 999);

    if (periodEnd >= startDate) {
      periods.push({
        name: formatDate(currentDate, 'monthly'),
        startDate: new Date(currentDate).toISOString().split('T')[0],
        endDate: new Date(periodEnd).toISOString().split('T')[0]
      });
    }

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return periods;
};

/**
 * Generate quarterly periods
 */
const generateQuarterlyPeriods = (startDate, endDate) => {
  const periods = [];
  let currentDate = new Date(startDate);
  
  // Move to start of quarter
  const quarter = Math.floor(currentDate.getMonth() / 3);
  currentDate.setMonth(quarter * 3, 1);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);
    periodEnd.setHours(23, 59, 59, 999);

    if (periodEnd >= startDate) {
      const q = Math.floor(currentDate.getMonth() / 3) + 1;
      periods.push({
        name: `Q${q} ${currentDate.getFullYear()}`,
        startDate: new Date(currentDate).toISOString().split('T')[0],
        endDate: new Date(periodEnd).toISOString().split('T')[0]
      });
    }

    currentDate.setMonth(currentDate.getMonth() + 3);
  }

  return periods;
};

/**
 * Format date for period name
 */
const formatDate = (date, type) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  switch (type) {
    case 'daily':
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    case 'weekly':
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    case 'monthly':
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    default:
      return date.toDateString();
  }
};

/**
 * Group CSV data into detected periods based on INQUIRY START DATE
 * Each inquiry (conversation) is assigned to a period based on when it started
 */
export const groupDataByPeriods = (csvData, periods) => {
  const groupedData = {};

  periods.forEach(period => {
    groupedData[period.name] = {
      period: period,
      data: [],
      inquiryCount: 0
    };
  });

  // Get all inquiries with their start dates
  const inquiries = extractInquiryStartDates(csvData);

  // Assign each INQUIRY (not message) to appropriate period
  inquiries.forEach(inquiry => {
    const inquiryStartDate = inquiry.startDate;

    // Find which period this inquiry belongs to
    for (const period of periods) {
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);
      periodEnd.setHours(23, 59, 59, 999);

      if (inquiryStartDate >= periodStart && inquiryStartDate <= periodEnd) {
        // Add ALL messages from this conversation to this period
        groupedData[period.name].data.push(...inquiry.messages);
        groupedData[period.name].inquiryCount++;
        break;
      }
    }
  });

  return groupedData;
};

/**
 * Suggest optimal period grouping based on INQUIRY START DATES
 */
export const suggestPeriodGrouping = (csvData) => {
  if (!csvData || csvData.length === 0) {
    return {
      recommendation: 'custom',
      reason: 'No data to analyze',
      options: []
    };
  }

  // Extract inquiry start dates
  const inquiries = extractInquiryStartDates(csvData);

  if (inquiries.length === 0) {
    return {
      recommendation: 'custom',
      reason: 'No valid inquiries found',
      options: []
    };
  }

  const timestamps = inquiries.map(inq => inq.startDate).sort((a, b) => a - b);
  const minDate = timestamps[0];
  const maxDate = timestamps[timestamps.length - 1];
  const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

  let recommendation = {
    recommendation: 'monthly',
    reason: 'Standard monthly tracking',
    daySpan: daysDiff,
    inquiryCount: inquiries.length,
    options: []
  };

  if (daysDiff <= 7) {
    recommendation.recommendation = 'daily';
    recommendation.reason = `${inquiries.length} inquiries over ${daysDiff} days - daily tracking recommended`;
    recommendation.options = [
      { value: 'daily', label: 'Daily (best fit)', periods: generateDailyPeriods(minDate, maxDate).length },
      { value: 'weekly', label: 'Weekly', periods: 1 },
      { value: 'custom', label: 'Custom dates', periods: '?' }
    ];
  } else if (daysDiff <= 31) {
    recommendation.recommendation = 'weekly';
    recommendation.reason = `${inquiries.length} inquiries over ${daysDiff} days - weekly tracking recommended`;
    recommendation.options = [
      { value: 'weekly', label: 'Weekly (best fit)', periods: generateWeeklyPeriods(minDate, maxDate).length },
      { value: 'daily', label: 'Daily', periods: generateDailyPeriods(minDate, maxDate).length },
      { value: 'monthly', label: 'Monthly', periods: 1 },
      { value: 'custom', label: 'Custom dates', periods: '?' }
    ];
  } else if (daysDiff <= 365) {
    recommendation.recommendation = 'monthly';
    recommendation.reason = `${inquiries.length} inquiries over ${daysDiff} days - monthly tracking recommended`;
    recommendation.options = [
      { value: 'monthly', label: 'Monthly (best fit)', periods: generateMonthlyPeriods(minDate, maxDate).length },
      { value: 'weekly', label: 'Weekly', periods: generateWeeklyPeriods(minDate, maxDate).length },
      { value: 'quarterly', label: 'Quarterly', periods: generateQuarterlyPeriods(minDate, maxDate).length },
      { value: 'custom', label: 'Custom dates', periods: '?' }
    ];
  } else {
    recommendation.recommendation = 'quarterly';
    recommendation.reason = `${inquiries.length} inquiries over ${daysDiff} days - quarterly tracking recommended`;
    recommendation.options = [
      { value: 'quarterly', label: 'Quarterly (best fit)', periods: generateQuarterlyPeriods(minDate, maxDate).length },
      { value: 'monthly', label: 'Monthly', periods: generateMonthlyPeriods(minDate, maxDate).length },
      { value: 'custom', label: 'Custom dates', periods: '?' }
    ];
  }

  recommendation.dateRange = {
    start: minDate.toISOString().split('T')[0],
    end: maxDate.toISOString().split('T')[0]
  };

  return recommendation;
};

/**
 * Generate periods based on selected grouping type using INQUIRY START DATES
 */
export const generatePeriodsForType = (csvData, groupingType) => {
  const inquiries = extractInquiryStartDates(csvData);

  if (inquiries.length === 0) return [];

  const timestamps = inquiries.map(inq => inq.startDate).sort((a, b) => a - b);
  const minDate = timestamps[0];
  const maxDate = timestamps[timestamps.length - 1];

  switch (groupingType) {
    case 'daily':
      return generateDailyPeriods(minDate, maxDate);
    case 'weekly':
      return generateWeeklyPeriods(minDate, maxDate);
    case 'monthly':
      return generateMonthlyPeriods(minDate, maxDate);
    case 'quarterly':
      return generateQuarterlyPeriods(minDate, maxDate);
    default:
      return [];
  }
};
