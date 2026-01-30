/**
 * Data Parser Service
 * Restructures raw CSV data into logical conversation units
 */

/**
 * Parse CSV data and structure conversations logically
 * @param {Array} csvData - Raw CSV rows
 * @returns {Object} Structured conversation data with extracted information
 */
export const parseAndStructureData = (csvData) => {
  // Step 1: Group messages by ConversationId
  const conversationMap = groupByConversationId(csvData);

  // Step 2: Process each conversation - sort, filter, extract info
  const conversations = Object.entries(conversationMap).map(([conversationId, messages]) => {
    return processConversation(conversationId, messages);
  });

  // Step 3: Sort conversations by first message timestamp
  conversations.sort((a, b) => new Date(a.firstMessageTime) - new Date(b.firstMessageTime));

  return {
    totalConversations: conversations.length,
    totalMessages: csvData.length,
    conversations: conversations,
    datePeriod: {
      from: conversations[0]?.firstMessageTime,
      to: conversations[conversations.length - 1]?.lastMessageTime,
    },
  };
};

/**
 * Group messages by ConversationId
 * @param {Array} csvData - Raw CSV rows
 * @returns {Object} Messages grouped by conversation ID
 */
const groupByConversationId = (csvData) => {
  const grouped = {};

  csvData.forEach((row) => {
    const id = row.ConversationId;
    if (!id) return;

    if (!grouped[id]) {
      grouped[id] = [];
    }
    grouped[id].push(row);
  });

  return grouped;
};

/**
 * Process a single conversation - extract structure and information
 * @param {String} conversationId - Unique conversation identifier
 * @param {Array} messages - All messages in this conversation
 * @returns {Object} Processed conversation with structured data
 */
const processConversation = (conversationId, messages) => {
  // Filter out AI analysis and tool calls, keep only human messages
  const tenantMessages = messages.filter((m) => m.MessageType === '3' || m.MessageType === 3);
  const supportMessages = messages.filter((m) => m.MessageType === '1' || m.MessageType === 1);

  // Sort by timestamp
  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(a.TimeSent) - new Date(b.TimeSent);
  });

  // Extract basic info
  const firstMessage = sortedMessages[0];
  const lastMessage = sortedMessages[sortedMessages.length - 1];

  // Extract tenant information from messages
  const tenantInfo = extractTenantInfo(tenantMessages);

  // Extract issue description
  const issueDescription = extractIssueDescription(tenantMessages);

  return {
    conversationId: conversationId,
    firstMessageTime: firstMessage.TimeSent,
    lastMessageTime: lastMessage.TimeSent,
    durationHours: calculateDurationHours(firstMessage.TimeSent, lastMessage.TimeSent),
    messageCount: messages.length,
    tenantMessageCount: tenantMessages.length,
    supportMessageCount: supportMessages.length,
    tenant: tenantInfo,
    issue: issueDescription,
    messages: sortedMessages.map((msg) => ({
      timestamp: msg.TimeSent,
      type: getMessageTypeName(msg.MessageType),
      content: cleanMessageContent(msg.Content),
    })),
  };
};

/**
 * Extract tenant information from conversation messages
 * @param {Array} messages - Tenant messages only
 * @returns {Object} Extracted tenant information
 */
const extractTenantInfo = (messages) => {
  const info = {
    name: null,
    phone: null,
    email: null,
    address: null,
  };

  const allContent = messages.map((m) => m.Content).join(' ');

  // Extract phone
  const phoneMatch = allContent.match(/\b\d{9,10}\b|\b\+41\d{9}\b|\b0041\d{9}\b/);
  if (phoneMatch) {
    info.phone = normalizePhoneNumber(phoneMatch[0]);
  }

  // Extract email
  const emailMatch = allContent.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    info.email = emailMatch[0];
  }

  // Extract name (after salutation)
  const nameMatch = allContent.match(/(Herr|Frau|Mr|Ms|Mme|M\.)\s+([A-Za-zäöüß]+(?:[-'][A-Za-zäöüß]+)*(?:\s+[A-Za-zäöüß]+(?:[-'][A-Za-zäöüß]+)*)?)/i);
  if (nameMatch && nameMatch[2]) {
    info.name = nameMatch[2].trim();
  }

  // Extract address
  const addressMatch = allContent.match(/([A-Za-zäöüß\s\-\.]+(?:strasse|str\.?|straße|weg|platz))\s+(\d+[a-z]?)/i);
  if (addressMatch) {
    info.address = `${addressMatch[1].trim()} ${addressMatch[2]}`;
  }

  return info;
};

/**
 * Extract the main issue description from tenant messages
 * @param {Array} messages - Tenant messages
 * @returns {String} Issue description
 */
const extractIssueDescription = (messages) => {
  if (messages.length === 0) return 'No issue description available';

  // Use first tenant message as issue description
  const firstMessage = messages[0].Content;

  // Clean up the message
  let cleaned = cleanMessageContent(firstMessage);

  // Limit length for readability
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 200) + '...';
  }

  return cleaned;
};

/**
 * Clean message content for display
 * @param {String} content - Raw message content
 * @returns {String} Cleaned content
 */
const cleanMessageContent = (content) => {
  if (!content) return '';

  // Remove JSON tool calls
  if (content.includes('{')) {
    // If it looks like a JSON tool call, extract just the type
    try {
      const jsonMatch = content.match(/"name"\s*:\s*"([^"]+)"/);
      if (jsonMatch) {
        return `[${jsonMatch[1]}]`;
      }
    } catch (e) {
      // Continue if not valid JSON
    }
  }

  // Remove image URLs
  content = content.replace(/https?:\/\/\S+/g, '[image]');

  // Remove excessive whitespace
  content = content.replace(/\s+/g, ' ').trim();

  return content;
};

/**
 * Get human-readable message type name
 * @param {Number|String} type - Message type code
 * @returns {String} Message type name
 */
const getMessageTypeName = (type) => {
  const typeNum = parseInt(type);
  const types = {
    1: 'support',
    3: 'tenant',
    5: 'analysis',
    6: 'image',
  };
  return types[typeNum] || 'unknown';
};

/**
 * Normalize phone numbers to standard format
 * @param {String} phone - Raw phone number
 * @returns {String} Normalized phone number
 */
const normalizePhoneNumber = (phone) => {
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');

  // Handle Swiss format
  if (digits.startsWith('41')) {
    digits = '0' + digits.substring(2);
  }

  // Ensure it starts with 0
  if (!digits.startsWith('0')) {
    digits = '0' + digits;
  }

  return digits;
};

/**
 * Calculate duration between two timestamps
 * @param {String} start - Start timestamp
 * @param {String} end - End timestamp
 * @returns {Number} Duration in hours (rounded to 1 decimal)
 */
const calculateDurationHours = (start, end) => {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const durationMs = endTime - startTime;
  const durationHours = durationMs / (1000 * 60 * 60);
  return Math.round(durationHours * 10) / 10; // Round to 1 decimal place
};

/**
 * Get summary statistics of all conversations
 * @param {Object} parsedData - Output from parseAndStructureData
 * @returns {Object} Summary statistics
 */
export const getDataSummary = (parsedData) => {
  const conversations = parsedData.conversations;

  const stats = {
    totalConversations: conversations.length,
    totalMessages: parsedData.totalMessages,
    averageMessagesPerConversation: (parsedData.totalMessages / conversations.length).toFixed(1),
    averageDurationHours: (conversations.reduce((sum, c) => sum + c.durationHours, 0) / conversations.length).toFixed(1),
    uniqueTenants: new Set(conversations.map((c) => c.tenant.name).filter(Boolean)).size,
    tenantsWithPhone: conversations.filter((c) => c.tenant.phone).length,
    tenantsWithEmail: conversations.filter((c) => c.tenant.email).length,
    tenantsWithAddress: conversations.filter((c) => c.tenant.address).length,
  };

  return stats;
};
