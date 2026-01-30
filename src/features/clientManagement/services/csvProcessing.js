/**
 * CSV Processing Service
 * Handles parsing and validation of CSV data
 */

export const parseCSVData = (csvData) => {
  // Group by conversation ID to identify unique inquiries
  const conversationMap = {};
  const allMessages = [];

  csvData.forEach((row) => {
    if (row.ConversationId) {
      if (!conversationMap[row.ConversationId]) {
        conversationMap[row.ConversationId] = [];
      }
      conversationMap[row.ConversationId].push(row);
      allMessages.push(row);
    }
  });

  // Inquiries are conversations with at least one tenant message (MessageType = 3)
  const inquiries = Object.values(conversationMap).filter((conversation) => {
    return conversation.some((msg) => msg.MessageType === '3' || msg.MessageType === 3);
  });

  // Calculate validation issues - match aggregateChunkAnalytics format (arrays, not numbers)
  const validationIssues = {
    missingDeficiencyType: [],
    missingCostEstimate: [],
    missingReportStatus: [],
    lowConfidenceScore: [],
    highFrustration: [],
    longConversations: [],
    shortConversations: []
  };

  inquiries.forEach((conversation) => {
    conversation.forEach((msg) => {
      if (!msg.TimeSent || !msg.ConversationId) {
        validationIssues.missingReportStatus.push(`Conversation ${msg.ConversationId}: Missing timestamp`);
      }
    });
  });

  return { inquiries, allMessages, validationIssues };
};
