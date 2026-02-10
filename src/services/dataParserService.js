/**
 * Data Parser Service
 * Restructures raw CSV data into logical conversation units
 * Supports both legacy format (Content, MessageType, TimeSent, ConversationId)
 * and AILEAN format (Message #, Timestamp, Content, Word Count)
 */

/**
 * Clean AILEAN format by removing metadata section
 * @param {String} csvText - Raw CSV text with potential metadata
 * @returns {String} Cleaned CSV text starting with headers
 */
const cleanAILEANInput = (csvText) => {
  // Find where the actual CSV data starts (look for the header row)
  const lines = csvText.split('\n');
  let csvStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Look for the CSV header row that contains Message #
    if (line.includes('Message #') && (line.includes('Timestamp') || line.includes('Content'))) {
      csvStartIndex = i;
      break;
    }
  }

  // If we found the CSV start, return from there; otherwise return original
  if (csvStartIndex >= 0) {
    return lines.slice(csvStartIndex).join('\n');
  }

  return csvText;
};

/**
 * Detect CSV format by checking column names
 * @param {Array} csvData - Raw CSV rows
 * @returns {String} 'ailean' or 'legacy'
 */
const detectCSVFormat = (csvData) => {
  if (!csvData || csvData.length === 0) return 'legacy';

  const firstRow = csvData[0];
  const headers = Object.keys(firstRow);

  // Check for AILEAN format indicators
  if (headers.some(h => h.includes('Message #')) && headers.some(h => h.includes('Word Count'))) {
    return 'ailean';
  }

  return 'legacy';
};

/**
 * Extract metadata from AILEAN format before cleaning
 * @param {String} csvText - Raw CSV text with metadata
 * @returns {Object} Extracted metadata
 */
const extractAILEANMetadata = (csvText) => {
  const metadata = {
    phoneNumber: null,
    tenantName: null,
    company: null,
    exportDate: null,
    totalMessages: null,
    totalWords: null,
  };

  const lines = csvText.split('\n');

  for (const line of lines) {
    // Stop processing when we reach the actual CSV data
    if (line.includes('Message #')) break;

    // Extract phone number
    if (line.includes('Phone Number:')) {
      const match = line.match(/Phone Number:\s*(.+?)(?:$|[,\s])/);
      if (match) metadata.phoneNumber = match[1].trim();
    }

    // Extract tenant name
    if (line.includes('Tenant Name:')) {
      const match = line.match(/Tenant Name:\s*(.+?)(?:$|[,\s])/);
      if (match) metadata.tenantName = match[1].trim();
    }

    // Extract company
    if (line.includes('Company:')) {
      const match = line.match(/Company:\s*(.+?)(?:$)/);
      if (match) metadata.company = match[1].trim();
    }

    // Extract export date
    if (line.includes('Export Date')) {
      const match = line.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) metadata.exportDate = match[1];
    }

    // Extract total messages
    if (line.includes('Total Messages:')) {
      const match = line.match(/Total Messages:\s*(\d+)/);
      if (match) metadata.totalMessages = parseInt(match[1]);
    }
  }

  return metadata;
};

/**
 * Parse CSV data and structure conversations logically
 * @param {Array} csvData - Raw CSV rows
 * @param {String} rawCSVText - Optional raw CSV text to extract metadata
 * @returns {Object} Structured conversation data with extracted information
 */
/**
 * Parse CSV data and structure conversations logically
 * @param {Array} csvData - Raw CSV rows (legacy support)
 * @param {String} rawCSVText - Raw CSV text to support multi-chat parsing
 * @returns {Object} Structured conversation data with extracted information
 */
export const parseAndStructureData = (csvData, rawCSVText = null) => {
  const format = detectCSVFormat(csvData);

  if (format === 'ailean' && rawCSVText) {
    return parseMultiChatAILEAN(rawCSVText);
  }

  // Fallback for when rawText isn't available but it looks like AILEAN (single chat)
  if (format === 'ailean') {
    return parseAILEANFormat(csvData, {});
  }

  return parseLegacyFormat(csvData);
};

/**
 * Parse raw text containing potentially multiple AILEAN chat exports
 * @param {String} rawText - The full file content
 * @returns {Object} Structured data for all found chats
 */
const parseMultiChatAILEAN = (rawText) => {
  // Split the text into blocks based on "Phone Number:" which seems to be the start of the metadata block
  // If "Phone Number:" isn't consistent, we could try splitting by "Message #" but that's inside the CSV part
  // Let's try to identify the start of each new export block.

  // A heuristic: Exports usually start with metadata. "Phone Number:" is a common first field.
  // We'll split by a lookahead pattern or just find indices.

  const chunks = [];
  const lines = rawText.split('\n');
  let currentChunk = [];

  // We look for a signature start line of a new block.
  // AILEAN exports usually start with specific metadata fields.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this line looks like the start of a new block (e.g. metadata header)
    // AND we already have some content in currentChunk (to avoid splitting start)
    // AND the previous line wasn't just a part of the same metadata block
    if ((line.startsWith('Phone Number:') || line.startsWith('Tenant Name:')) &&
      currentChunk.length > 5 && // Ensure we have a substantial chunk before splitting
      !currentChunk[currentChunk.length - 1].includes('Message #')) { // Don't split if we are in the middle of headers

      // Verify this isn't just a random line by peeking ahead or checking context?
      // Simpler: If we see "Phone Number:" and we already have a "Phone Number:" in our current chunk, it's a new block.
      const hasPhoneAlready = currentChunk.some(l => l.startsWith('Phone Number:'));

      if (hasPhoneAlready) {
        chunks.push(currentChunk.join('\n'));
        currentChunk = [];
      }
    }
    currentChunk.push(lines[i]);
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }

  // Now process each chunk
  let allConversations = [];
  let totalMessagesCount = 0;

  chunks.forEach(chunkText => {
    // Extract metadata for this specific chunk
    const metadata = extractAILEANMetadata(chunkText);

    // Clean to get just the CSV part
    const cleanCsv = cleanAILEANInput(chunkText);

    // Parse the cleaned CSV part
    const parsed = Papa.parse(cleanCsv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim()
    });

    if (parsed.data && parsed.data.length > 0) {
      const result = parseAILEANFormat(parsed.data, metadata);
      if (result.conversations.length > 0) {
        allConversations = allConversations.concat(result.conversations);
        totalMessagesCount += result.totalMessages;
      }
    }
  });

  // Sort all conversations by date
  allConversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

  return {
    totalConversations: allConversations.length,
    totalMessages: totalMessagesCount,
    conversations: allConversations,
    datePeriod: {
      from: allConversations.length > 0 ? allConversations[allConversations.length - 1].firstMessageTime : null,
      to: allConversations.length > 0 ? allConversations[0].lastMessageTime : null,
    },
  };
};

/**
 * Parse AILEAN CSV format for a single conversation block
 * @param {Array} csvData - Raw CSV rows in AILEAN format
 * @param {Object} metadata - Extracted metadata from the file
 * @returns {Object} Structured conversation data
 */
const parseAILEANFormat = (csvData, metadata = {}) => {
  // AILEAN format has all messages from a single conversation in one chat export
  // Create a single conversation from all messages
  const conversationId = 'ailean-' + (metadata.phoneNumber || Math.random().toString(36).substr(2, 9));

  // Filter out metadata rows (rows without proper Message # or Timestamp)
  const messageRows = csvData.filter(row => {
    const messageNum = row['Message #'];
    const timestamp = row['Timestamp'];
    // Skip header rows and metadata rows
    return messageNum && messageNum !== 'Message #' && (timestamp || row['Content (First 500 chars)']);
  });

  if (messageRows.length === 0) {
    return {
      totalConversations: 0,
      totalMessages: 0,
      conversations: [],
      datePeriod: { from: null, to: null },
    };
  }

  // Create conversation structure
  const messages = messageRows.map(row => ({
    timestamp: row['Timestamp'] || '',
    type: 'message', // AILEAN format doesn't distinguish message types, so we'll classify by content
    content: row['Content (First 500 chars)'] || '',
    wordCount: row['Word Count'] ? parseInt(row['Word Count']) : 0,
  }));

  // Extract tenant info from messages and metadata
  const allContent = messages.map(m => m.content).join(' ');
  const tenantInfo = extractTenantInfoFromAILEAN(allContent, metadata.phoneNumber || null);

  // Override with metadata if found
  if (metadata.tenantName) tenantInfo.name = metadata.tenantName;
  if (metadata.phoneNumber) tenantInfo.phone = normalizePhoneNumber(metadata.phoneNumber);

  // Extract issue from first substantive message
  const issueDescription = extractIssueDescription({
    Content: messages[0]?.content || 'No description available'
  });

  const conversation = {
    conversationId: conversationId,
    firstMessageTime: messages[0]?.timestamp || '',
    lastMessageTime: messages[messages.length - 1]?.timestamp || '',
    durationHours: calculateDurationHours(
      messages[0]?.timestamp || '',
      messages[messages.length - 1]?.timestamp || ''
    ),
    messageCount: messages.length,
    tenantMessageCount: messages.length,
    supportMessageCount: 0,
    tenant: tenantInfo,
    issue: issueDescription,
    messages: messages.map((msg, idx) => ({
      timestamp: msg.timestamp,
      type: 'message',
      content: cleanMessageContent(msg.content),
    })),
  };

  return {
    totalConversations: 1,
    totalMessages: messages.length,
    conversations: [conversation],
    datePeriod: {
      from: conversation.firstMessageTime,
      to: conversation.lastMessageTime,
    },
  };
};

/**
 * Extract tenant info from AILEAN format content
 * @param {String} allContent - All messages concatenated
 * @param {String} phoneNumber - Extracted phone number
 * @returns {Object} Tenant information
 */
const extractTenantInfoFromAILEAN = (allContent, phoneNumber) => {
  const info = {
    name: null,
    phone: phoneNumber,
    email: null,
    address: null,
  };

  // Extract email
  const emailMatch = allContent.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    info.email = emailMatch[0];
  }

  // Extract name (after salutation or in context)
  const nameMatch = allContent.match(/(Herr|Frau|Mr|Ms|Mme|M\.)\s+([A-Za-zäöüß]+(?:[-'][A-Za-zäöüß]+)*(?:\s+[A-Za-zäöüß]+(?:[-'][A-Za-zäöüß]+)*)?)/i);
  if (nameMatch && nameMatch[2]) {
    info.name = nameMatch[2].trim();
  }

  // Extract address
  const addressMatch = allContent.match(/([A-Za-zäöüß\s\-\.]+(?:strasse|str\.?|straße|weg|platz|ring|ring|strasse))\s+(\d+[a-z]?)/i);
  if (addressMatch) {
    info.address = `${addressMatch[1].trim()} ${addressMatch[2]}`;
  }

  return info;
};

/**
 * Parse legacy CSV format
 * @param {Array} csvData - Raw CSV rows in legacy format
 * @returns {Object} Structured conversation data
 */
const parseLegacyFormat = (csvData) => {
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
 * @param {Object|Array} messages - Tenant message(s) - can be single object or array
 * @returns {String} Issue description
 */
const extractIssueDescription = (messages) => {
  let firstMessage = '';

  // Handle both single object and array formats
  if (Array.isArray(messages)) {
    if (messages.length === 0) return 'No issue description available';
    firstMessage = messages[0].Content || messages[0].content || '';
  } else {
    firstMessage = messages.Content || messages.content || '';
  }

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
  if (!phone) return null;

  // Remove all spaces and non-digit characters except +
  let digits = phone.replace(/\s/g, '').replace(/[^\d+]/g, '');

  // Remove + if present
  if (digits.startsWith('+')) {
    digits = digits.substring(1);
  }

  // Handle Swiss format (41 at start means Switzerland)
  if (digits.startsWith('41')) {
    digits = '0' + digits.substring(2);
  }

  // Handle 0041 format
  if (digits.startsWith('0041')) {
    digits = '0' + digits.substring(4);
  }

  // Ensure it starts with 0
  if (!digits.startsWith('0') && digits.length > 0) {
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
  const properties = groupConversationsByProperty(conversations);

  const stats = {
    totalConversations: conversations.length,
    totalMessages: parsedData.totalMessages,
    averageMessagesPerConversation: (parsedData.totalMessages / conversations.length).toFixed(1),
    averageDurationHours: (conversations.reduce((sum, c) => sum + c.durationHours, 0) / conversations.length).toFixed(1),
    uniqueTenants: new Set(conversations.map((c) => c.tenant.name).filter(Boolean)).size,
    uniqueProperties: Object.keys(properties).length,
    tenantsWithPhone: conversations.filter((c) => c.tenant.phone).length,
    tenantsWithEmail: conversations.filter((c) => c.tenant.email).length,
    tenantsWithAddress: conversations.filter((c) => c.tenant.address).length,
  };

  return stats;
};

/**
 * Group conversations by property address
 * @param {Array} conversations - List of conversations
 * @returns {Object} Grouped properties
 */
export const groupConversationsByProperty = (conversations) => {
  const properties = {};

  conversations.forEach(conversation => {
    // strict normalization for address grouping
    const address = conversation.tenant.address
      ? conversation.tenant.address.trim()
      : 'Unknown Property';

    if (!properties[address]) {
      properties[address] = {
        address: address,
        tenantCount: 0,
        conversations: [],
        totalMessages: 0,
        issues: [],
        lastActivity: null,
        tenants: new Set()
      };
    }

    const prop = properties[address];
    prop.conversations.push(conversation);
    prop.totalMessages += conversation.messageCount;
    if (conversation.tenant.name) {
      prop.tenants.add(conversation.tenant.name);
    }

    // Track latest activity
    const convDate = new Date(conversation.lastMessageTime);
    if (!prop.lastActivity || convDate > new Date(prop.lastActivity)) {
      prop.lastActivity = conversation.lastMessageTime;
    }

    // Collect issues
    if (conversation.issue && conversation.issue !== 'No description available') {
      prop.issues.push({
        id: conversation.conversationId,
        description: conversation.issue,
        date: conversation.firstMessageTime
      });
    }
  });

  // Convert Set to count
  Object.values(properties).forEach(prop => {
    prop.tenantCount = prop.tenants.size;
    // We can remove the Set before returning if we don't need the names list, 
    // or keep it if we want to show tenant names per property.
    // Let's keep it as an array for display.
    prop.tenantNames = Array.from(prop.tenants);
    delete prop.tenants;
  });

  return properties;
};

/**
 * Export cleanAILEANInput for use in components
 */
export { cleanAILEANInput };
