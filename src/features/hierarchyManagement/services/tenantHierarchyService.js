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
  // Pattern 1: Explicit salutation (Herr/Frau [Name])
  const saluationPattern = /(Herr|Frau|Mr|Ms|Mme|M\.)\s+([A-Za-zäöüß\s\-]+?)(?:\s|,|\.)/i;

  // Pattern 2: "Name" or "My name is"
  const nameIsPattern = /(?:my\s+)?name\s+(?:is\s+)?([A-Za-zäöüß\s\-]+?)(?:\s|,|\.|$)/i;

  // Pattern 3: Common signature pattern (at end of messages)
  const signaturePattern = /^([A-Za-zäöüß\s\-]+?)$/;

  for (const msg of messages) {
    if (!msg.Content) continue;
    const content = msg.Content.toString();

    // Try salutation pattern
    const salutationMatch = content.match(saluationPattern);
    if (salutationMatch && salutationMatch[2]) {
      const name = salutationMatch[2].trim();
      if (name.length > 2 && name.length < 50) {
        return name;
      }
    }

    // Try name pattern
    const nameMatch = content.match(nameIsPattern);
    if (nameMatch && nameMatch[1]) {
      const name = nameMatch[1].trim();
      if (name.length > 2 && name.length < 50) {
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
  // Pattern for Swiss phone numbers (flexible format)
  // Matches: 0764936161, 076 493 6161, 0041764936161, +41764936161, etc.
  const phonePattern = /(?:\+41|0041|0)?[\s\-.]?(?:\(0\)[\s\-.]?)?[1-9][\d\s\-.\(\)]{7,12}\d/g;

  for (const msg of messages) {
    if (!msg.Content) continue;
    const content = msg.Content.toString();
    const matches = content.match(phonePattern);

    if (matches) {
      for (const match of matches) {
        // Clean up the phone number - extract digits only
        const digits = match.replace(/\D/g, '');
        // Check if it's long enough to be a phone number (at least 9 digits)
        if (digits.length >= 9) {
          // Normalize to Swiss 0-format
          const normalized = digits.startsWith('41') ? '0' + digits.substring(2) : digits;
          return normalized;
        }
      }
    }
  }

  return null;
};

/**
 * Group inquiries by phone number (tenant identifier)
 * @param {Array} inquiries - Array of conversations
 * @returns {Object} {phoneNumber: [{conversationId, messages, ...}]}
 */
export const groupByPhone = (inquiries) => {
  const phoneMap = {};

  inquiries.forEach((conversation) => {
    const firstMsg = conversation[0];
    if (!firstMsg) return;

    // Try multiple strategies to extract phone number
    let phone = null;

    // Strategy 1: Check CSV columns (multiple possible column names)
    if (firstMsg.reporterContactPhoneNumber) {
      phone = firstMsg.reporterContactPhoneNumber;
    } else if (firstMsg.PhoneNumber) {
      phone = firstMsg.PhoneNumber;
    } else if (firstMsg.phone) {
      phone = firstMsg.phone;
    } else if (firstMsg.Phone) {
      phone = firstMsg.Phone;
    } else if (firstMsg['Reporter Contact Phone Number']) {
      phone = firstMsg['Reporter Contact Phone Number'];
    } else {
      // Strategy 2: Extract phone from messages
      phone = extractPhoneFromMessages(conversation);
    }

    // Fallback if no phone found
    if (!phone) {
      // Use ConversationId as unique identifier
      phone = firstMsg.ConversationId || 'unknown';
    }

    // Normalize phone number
    phone = String(phone).trim();

    if (!phoneMap[phone]) {
      phoneMap[phone] = [];
    }

    phoneMap[phone].push(conversation);
  });

  return phoneMap;
};

/**
 * Create tenant profile from grouped conversations
 * @param {String} phoneNumber - Tenant phone number
 * @param {Array} conversations - All conversations for this tenant
 * @returns {Object} Tenant profile with metadata
 */
export const createTenantProfile = (phoneNumber, conversations) => {
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
  const name = extractTenantName(allMessages);
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
    phoneNumber,
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
  const phoneMap = groupByPhone(inquiries);
  const tenantProfiles = [];

  for (const [phone, conversations] of Object.entries(phoneMap)) {
    const profile = createTenantProfile(phone, conversations);
    if (profile) {
      tenantProfiles.push(profile);
    }
  }

  // Sort by name
  return tenantProfiles.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get tenant profile by phone number
 * @param {String} phoneNumber - Tenant phone number
 * @param {Array} inquiries - Array of all conversations
 * @returns {Object} Tenant profile
 */
export const getTenantProfile = (phoneNumber, inquiries) => {
  const phoneMap = groupByPhone(inquiries);
  const conversations = phoneMap[phoneNumber];

  if (!conversations) return null;

  return createTenantProfile(phoneNumber, conversations);
};
