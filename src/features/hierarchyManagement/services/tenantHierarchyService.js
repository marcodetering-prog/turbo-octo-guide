/**
 * Tenant Hierarchy Service
 * Groups conversations by phone number and creates detailed tenant profiles
 * Hierarchy: Property → Building → Tenant → Conversations
 */

/**
 * Extract tenant name from conversation messages
 * @param {Array} messages - Messages in conversation
 * @returns {String} Extracted tenant name or null
 */
const extractTenantName = (messages) => {
  // Pattern 1: Explicit salutation (Herr/Frau [FirstName] [LastName])
  // Supports hyphenated names (Marie-Anne) and apostrophes (O'Brien)
  // Only capture up to 2 words (first + last name)
  const salutationPattern = /(Herr|Frau|Mr|Ms|Mme|M\.)\s+([A-Za-zäöüß]+(?:[-'][A-Za-zäöüß]+)*(?:\s+[A-Za-zäöüß]+(?:[-'][A-Za-zäöüß]+)*)?)\s*[,\.]?/i;

  // Pattern 2: "name is John Smith" - only 1-2 words
  // Supports hyphenated names and apostrophes
  const nameIsPattern = /(?:my\s+)?name\s+(?:is\s+)?([A-Za-zäöüß]+(?:[-'][A-Za-zäöüß]+)*(?:\s+[A-Za-zäöüß]+(?:[-'][A-Za-zäöüß]+)*)?)\s*[,\.]?/i;

  for (const msg of messages) {
    if (!msg.Content) continue;
    const content = msg.Content.toString().substring(0, 500); // Limit to first 500 chars

    // Try salutation pattern - most reliable
    const salutationMatch = content.match(salutationPattern);
    if (salutationMatch && salutationMatch[2]) {
      const name = salutationMatch[2].trim();
      // Only accept 1-2 word names, max 30 chars
      const wordCount = name.split(/\s+/).length;
      if (name.length > 2 && name.length <= 30 && wordCount <= 2) {
        return name;
      }
    }

    // Try name pattern - less reliable
    const nameMatch = content.match(nameIsPattern);
    if (nameMatch && nameMatch[1]) {
      const name = nameMatch[1].trim();
      // Only accept 1-2 word names, max 30 chars
      const wordCount = name.split(/\s+/).length;
      if (name.length > 2 && name.length <= 30 && wordCount <= 2) {
        return name;
      }
    }
  }

  return null;
};

/**
 * Extract address from conversation messages
 * @param {Array} messages - Messages in conversation
 * @returns {Object} {street, number, city, fullAddress}
 */
const extractAddress = (messages) => {
  // Pattern: Street name + number, optionally city
  const addressPattern = /([A-Za-zäöüß\s\-\.]+(?:strasse|str\.?|straße|weg|platz|allee|avenue|rue))\s+(\d+[a-z]?)/i;
  const cityPattern = /(?:\d{4,5})\s+([A-Za-zäöüß\s\-]+?)(?:\s|,|$)/i;

  for (const msg of messages) {
    if (!msg.Content) continue;
    const content = msg.Content.toString();

    const addressMatch = content.match(addressPattern);
    if (addressMatch) {
      const street = addressMatch[1].trim();
      const number = addressMatch[2].trim();

      // Try to extract city
      let city = null;
      const cityMatch = content.match(cityPattern);
      if (cityMatch) {
        city = cityMatch[1].trim();
      }

      return {
        street: street,
        number: number,
        city: city,
        fullAddress: `${street} ${number}${city ? ', ' + city : ''}`,
      };
    }
  }

  return {
    street: null,
    number: null,
    city: null,
    fullAddress: null,
  };
};

/**
 * Extract email from conversation messages
 * @param {Array} messages - Messages in conversation
 * @returns {String} Email address or null
 */
const extractEmail = (messages) => {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;

  for (const msg of messages) {
    if (!msg.Content) continue;
    const content = msg.Content.toString();
    const emailMatch = content.match(emailPattern);
    if (emailMatch) {
      return emailMatch[0];
    }
  }

  return null;
};

/**
 * Extract phone number from conversation messages
 * @param {Array} messages - Messages in conversation
 * @returns {String} Phone number or null
 */
const extractPhoneFromMessages = (messages) => {
  // Pattern for phone numbers (very flexible to catch any format)
  // Matches: 0764936161, 076 493 6161, 0041764936161, +41764936161, etc.
  const phonePatterns = [
    // Swiss format: +41, 0041, or 0 followed by digits
    /(?:\+41|0041|0)[\s\-\.]?(?:\(0\)[\s\-\.]?)?(?:79|78|77|76|75|74|73|72|71|70|69|68|67|66|65|64|63|62|61|60|59|58|57|56|55|54|53|52|51|50|44|43|42|41|40|39|38|37|36|35|34|33|32|31|30|29|28|27|26|25|24|23|22|21|20|19|18|17|16|15|14|13|12|11|10|9|8|7|6|5|4|3|2|1)[\s\-\.]?(?:\d[\s\-\.]?){5,9}\d/g,
    // Generic phone format: sequences of digits separated by spaces/dashes
    /(?:tel|phone|tel\.?|ph\.?|fax)[\s:]*[\+]?[\d\s\-\.\(\)]{9,20}/gi,
    // Just a long sequence of digits (9-15 digits)
    /(?:^|\s|\D)((?:\+?41|0041|0)[\d\s\-\.]{8,15})/gm,
  ];

  for (const msg of messages) {
    if (!msg.Content) continue;
    const content = msg.Content.toString();

    for (const pattern of phonePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Clean up the phone number - extract digits only
          const digits = match.replace(/\D/g, '');
          // Check if it's long enough to be a phone number (at least 9 digits for Swiss numbers)
          if (digits.length >= 9 && digits.length <= 15) {
            // Normalize to Swiss 0-format
            let normalized = digits;
            if (digits.startsWith('41')) {
              normalized = '0' + digits.substring(2);
            } else if (!normalized.startsWith('0')) {
              normalized = '0' + normalized;
            }
            if (normalized.length >= 9) {
              return normalized;
            }
          }
        }
      }
    }
  }

  return null;
};

/**
 * Group inquiries by tenant name (tenant identifier)
 * @param {Array} inquiries - Array of conversations
 * @returns {Object} {tenantName: [{conversationId, messages, ...}]}
 */
export const groupByTenantName = (inquiries) => {
  const tenantMap = {};

  inquiries.forEach((conversation) => {
    const firstMsg = conversation[0];
    if (!firstMsg) return;

    // Extract tenant name from conversation messages
    let tenantName = extractTenantName(conversation);

    // Fallback if no name found: Use ConversationId as unique identifier
    if (!tenantName) {
      tenantName = firstMsg.ConversationId || 'Unknown Tenant';
    }

    // Normalize tenant name
    tenantName = String(tenantName).trim();

    if (!tenantMap[tenantName]) {
      tenantMap[tenantName] = [];
    }

    tenantMap[tenantName].push(conversation);
  });

  return tenantMap;
};

/**
 * @deprecated Use groupByTenantName instead
 */
export const groupByPhone = (inquiries) => {
  return groupByTenantName(inquiries);
};

/**
 * Create tenant profile from grouped conversations
 * @param {String} tenantIdentifier - Tenant identifier (name, phone, or conversation ID)
 * @param {Array} conversations - All conversations for this tenant
 * @returns {Object} Tenant profile with metadata
 */
export const createTenantProfile = (tenantIdentifier, conversations) => {
  if (!conversations || conversations.length === 0) {
    return null;
  }

  // Flatten all messages for this tenant
  const allMessages = conversations.flat();

  // Sort conversations by timestamp
  const sortedConversations = conversations.map((conv) => {
    const sorted = [...conv].sort(
      (a, b) => new Date(a.TimeSent) - new Date(b.TimeSent)
    );
    return sorted;
  });

  // Extract profile information
  const name = extractTenantName(allMessages) || tenantIdentifier;
  const address = extractAddress(allMessages);
  const email = extractEmail(allMessages);

  // Get conversation IDs
  const conversationIds = conversations.map((conv) => conv[0]?.ConversationId).filter(Boolean);

  // Get date range
  const allDates = allMessages
    .map((msg) => new Date(msg.TimeSent))
    .filter((d) => !isNaN(d.getTime()));

  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : null;
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : null;

  return {
    phoneNumber: tenantIdentifier,
    name: name || 'Unknown Tenant',
    email: email || null,
    address: address.fullAddress || 'Unknown Address',
    street: address.street,
    streetNumber: address.number,
    city: address.city,
    conversationIds: conversationIds,
    conversationCount: conversations.length,
    messageCount: allMessages.length,
    firstContact: minDate?.toISOString().split('T')[0] || null,
    lastContact: maxDate?.toISOString().split('T')[0] || null,
    sortedConversations: sortedConversations,
    allMessages: allMessages,
  };
};

/**
 * Create all tenant profiles from inquiries
 * @param {Array} inquiries - Array of conversations
 * @returns {Array} Array of tenant profiles
 */
export const createAllTenantProfiles = (inquiries) => {
  const tenantMap = groupByTenantName(inquiries);
  const tenantProfiles = [];

  for (const [tenantName, conversations] of Object.entries(tenantMap)) {
    const profile = createTenantProfile(tenantName, conversations);
    if (profile) {
      tenantProfiles.push(profile);
    }
  }

  // Sort by name
  return tenantProfiles.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get tenant profile by tenant name
 * @param {String} tenantName - Tenant name
 * @param {Array} inquiries - Array of all conversations
 * @returns {Object} Tenant profile
 */
export const getTenantProfile = (tenantName, inquiries) => {
  const tenantMap = groupByTenantName(inquiries);
  const conversations = tenantMap[tenantName];

  if (!conversations) return null;

  return createTenantProfile(tenantName, conversations);
};
