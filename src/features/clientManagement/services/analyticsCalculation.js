/**
 * Analytics Calculation Service
 * Computes KPI metrics from inquiry data
 */

export const calculateAnalytics = (inquiries, validationIssues, allMessages = []) => {
  if (inquiries.length === 0) {
    return {
      totalInquiries: 0,
      successRate: 'N/A',
      avgResponseTime: '0s',
      avgResolutionTime: '0 min',
      dataQualityScore: '0%',
      satisfactionRate: '0%',
      frustrationRate: '0%',
      insidePercentage: '0%',
      outsidePercentage: '0%',
      avgConversationLength: 0,
      insideWorkingHours: 0,
      outsideWorkingHours: 0,
      successfulReports: 0,
      failedReports: 0,
      satisfied: 0,
      frustrated: 0,
      neutral: 0,
      totalIssues: 0,
      validationIssues: validationIssues,
      deficiencyData: [],
      costData: [],
      satisfactionData: [],
      hourlyData: [],
      timeWindowData: [],
      successData: []
    };
  }

  // Calculate conversation metrics
  let totalMessages = 0;
  let totalResponseTime = 0;
  let totalResolutionTime = 0;
  let conversationsWithResponseTime = 0;
  let insideWorkingHours = 0;
  let outsideWorkingHours = 0;
  let successCount = 0;
  let failCount = 0;
  let hourlyData = new Array(24).fill(0);

  inquiries.forEach((conversation) => {
    totalMessages += conversation.length;

    const sortedMessages = conversation.sort((a, b) => {
      const dateA = new Date(a.TimeSent).getTime();
      const dateB = new Date(b.TimeSent).getTime();
      return dateA - dateB;
    });

    // Count first message time
    if (sortedMessages[0].TimeSent) {
      const hour = new Date(sortedMessages[0].TimeSent).getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;

      if (hour >= 9 && hour < 17) {
        insideWorkingHours++;
      } else {
        outsideWorkingHours++;
      }
    }

    // Calculate response time (time between first and second message)
    if (sortedMessages.length > 1 && sortedMessages[0].TimeSent && sortedMessages[1].TimeSent) {
      const firstTime = new Date(sortedMessages[0].TimeSent).getTime();
      const secondTime = new Date(sortedMessages[1].TimeSent).getTime();
      const responseTime = Math.round((secondTime - firstTime) / 1000); // in seconds
      totalResponseTime += responseTime;
      conversationsWithResponseTime++;
    }

    // Calculate resolution time (first to last message)
    if (sortedMessages.length > 1 && sortedMessages[0].TimeSent && sortedMessages[sortedMessages.length - 1].TimeSent) {
      const firstTime = new Date(sortedMessages[0].TimeSent).getTime();
      const lastTime = new Date(sortedMessages[sortedMessages.length - 1].TimeSent).getTime();
      const resolutionTime = Math.round((lastTime - firstTime) / (1000 * 60)); // in minutes
      totalResolutionTime += resolutionTime;
    }

    // Count success/failed (assume Status field or count based on presence of resolution)
    if (conversation.some((msg) => msg.Status === 'resolved' || msg.Status === 'closed')) {
      successCount++;
    } else {
      failCount++;
    }
  });

  const avgResponseTime = conversationsWithResponseTime > 0
    ? Math.round(totalResponseTime / conversationsWithResponseTime)
    : 0;
  const avgResolutionTime = inquiries.length > 0
    ? Math.round(totalResolutionTime / inquiries.length)
    : 0;
  const avgConversationLength = inquiries.length > 0
    ? (totalMessages / inquiries.length).toFixed(1)
    : 0;

  const insidePercentage = inquiries.length > 0
    ? Math.round((insideWorkingHours / inquiries.length) * 100)
    : 0;
  const outsidePercentage = inquiries.length > 0
    ? Math.round((outsideWorkingHours / inquiries.length) * 100)
    : 0;

  const successRate = (successCount + failCount) > 0
    ? Math.round((successCount / (successCount + failCount)) * 100)
    : 0;

  // Data quality score - count total issues from validation issues arrays
  const totalIssuesCount = Object.values(validationIssues).reduce((sum, issues) => {
    return sum + (Array.isArray(issues) ? issues.length : 0);
  }, 0);
  const qualityScore = allMessages.length > 0
    ? Math.max(0, 100 - Math.round((totalIssuesCount / allMessages.length) * 100))
    : 100;

  // Calculate satisfaction based on resolution success and quality
  // Satisfied = successful resolutions + good quality
  // Frustrated = failed resolutions or low quality
  // Neutral = inquiries without clear status
  const satisfiedCount = Math.max(0, Math.round((successCount * (qualityScore / 100)) / inquiries.length * inquiries.length));
  const frustratedCount = Math.max(0, Math.round(failCount * 1.5)); // Failed + some quality issues
  const neutralCount = Math.max(0, inquiries.length - satisfiedCount - frustratedCount);

  const satisfactionRate = inquiries.length > 0
    ? Math.round((satisfiedCount / inquiries.length) * 100)
    : 0;
  const frustrationRate = inquiries.length > 0
    ? Math.round((frustratedCount / inquiries.length) * 100)
    : 0;

  return {
    totalInquiries: inquiries.length,
    successRate: successRate > 0 ? `${successRate}%` : 'N/A',
    avgResponseTime: avgResponseTime > 0 ? `${avgResponseTime}s` : '0s',
    avgResolutionTime: avgResolutionTime > 0 ? `${avgResolutionTime} min` : '0 min',
    dataQualityScore: `${qualityScore}%`,
    satisfactionRate: `${satisfactionRate}%`,
    frustrationRate: `${frustrationRate}%`,
    insidePercentage: `${insidePercentage}%`,
    outsidePercentage: `${outsidePercentage}%`,
    avgConversationLength: parseFloat(avgConversationLength),
    insideWorkingHours: insideWorkingHours,
    outsideWorkingHours: outsideWorkingHours,
    successfulReports: successCount,
    failedReports: failCount,
    satisfied: satisfiedCount,
    frustrated: frustratedCount,
    neutral: neutralCount,
    totalIssues: totalIssuesCount,
    validationIssues: validationIssues,
    deficiencyData: [],
    costData: [],
    satisfactionData: [
      { name: 'Satisfied', value: satisfiedCount, color: '#10b981' },
      { name: 'Neutral', value: neutralCount, color: '#f59e0b' },
      { name: 'Frustrated', value: frustratedCount, color: '#ef4444' }
    ],
    hourlyData: hourlyData.map((count, hour) => ({
      hour: `${hour}:00`,
      count: count,
      isWorkingHours: hour >= 9 && hour < 17
    })),
    timeWindowData: [
      { name: 'Working Hours', value: insideWorkingHours },
      { name: 'After Hours', value: outsideWorkingHours }
    ],
    successData: [
      { name: 'Successful', value: successCount },
      { name: 'Failed', value: failCount }
    ]
  };
};
