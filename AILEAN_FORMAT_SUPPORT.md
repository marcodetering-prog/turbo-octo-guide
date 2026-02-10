# AILEAN CSV Format Support

## Overview

The data parser now supports both the legacy format and the **AILEAN format** for parsing conversation CSV exports.

## Format Detection

The parser automatically detects which format is being used by checking for:
- **AILEAN Format**: Presence of `"Message #"` and `"Word Count"` columns
- **Legacy Format**: Presence of `"Content"`, `"MessageType"`, `"TimeSent"`, and `"ConversationId"` columns

## AILEAN CSV Format

The AILEAN format consists of:

1. **Metadata Header** (informational, skipped during parsing):
   - Phone Number
   - Tenant Name
   - Company
   - Export Date/Time
   - Total Messages & Words

2. **Conversation Metadata Section** (informational)

3. **Messages Table** with columns:
   - `Message #` - Message number (sequential)
   - `Timestamp` - When the message was sent
   - `Content (First 500 chars)` - Message content (truncated to 500 chars)
   - `Word Count` - Number of words in message

### Example AILEAN CSV Structure

```csv
Message #,Timestamp,Content (First 500 chars),Word Count
1,"1 hour and 38 minutes ago.","Sehr gerne, Herr Erbaş! Es freut mich...",54
2,"Yesterday, 17:33","Avec plaisir! Si vous avez besoin...",50
3,"Yesterday, 11:13","MainAlso! Eyadatahandling...",56
```

## Data Extraction

### Phone Number
- Extracted from message content using pattern: `/\+41\s?\d{1,2}\s?\d{3}\s?\d{2}\s?\d{2}|...|/`
- Normalized to standard format (e.g., `0797453507`)

### Tenant Name
- Extracted using salutation patterns: `Herr`, `Frau`, `Mr`, `Ms`, etc.
- Pattern: `/(Herr|Frau|Mr|Ms|Mme|M\.)\s+([A-Za-zäöüß]+)/i`

### Email
- Standard email pattern matching: `/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/`

### Address
- Swiss street patterns: `strasse`, `straße`, `weg`, `platz`, `ring`
- Extracts street name and number: `([A-Za-zäöüß\s\-\.]+(?:strasse|str\.?|...|ring))\s+(\d+[a-z]?)/i`

## Implementation Details

### Key Functions

1. **`detectCSVFormat(csvData)`**
   - Analyzes column headers to determine format
   - Returns: `'ailean'` or `'legacy'`

2. **`parseAILEANFormat(csvData)`**
   - Filters metadata rows
   - Extracts tenant information
   - Creates single conversation object
   - Returns structured data matching the app's internal format

3. **`extractTenantInfoFromAILEAN(allContent, phoneNumber)`**
   - Specialized extraction for AILEAN content
   - Handles text patterns specific to AILEAN conversations

4. **`normalizePhoneNumber(phone)`** (Enhanced)
   - Now handles Swiss formats with spaces: `+41 79 745 35 07`
   - Converts to standard format: `0797453507`

## Data Structure Output

Both formats produce the same output structure:

```javascript
{
  totalConversations: 1,
  totalMessages: 328,
  conversations: [
    {
      conversationId: "ailean-1704067200000",
      firstMessageTime: "1 hour and 38 minutes ago.",
      lastMessageTime: "Yesterday, 17:33",
      durationHours: 25.5,
      messageCount: 328,
      tenantMessageCount: 328,
      supportMessageCount: 0,
      tenant: {
        name: "Ursula Speich",
        phone: "0797453507",
        email: "ursi.speich@gmail.com",
        address: "Meierwiesenstrasse 54"
      },
      issue: "Sehr gerne, Herr Erbaş! Es freut mich...",
      messages: [
        {
          timestamp: "1 hour and 38 minutes ago.",
          type: "message",
          content: "Sehr gerne, Herr Erbaş! Es freut mich..."
        },
        // ... more messages
      ]
    }
  ],
  datePeriod: {
    from: "1 hour and 38 minutes ago.",
    to: "Yesterday, 17:33"
  }
}
```

## Limitations & Notes

1. **Timestamp Format**: AILEAN timestamps are relative (`"1 hour and 38 minutes ago"`) rather than absolute. Duration calculations may be approximate.

2. **Message Count**: All messages are treated as tenant messages since AILEAN doesn't distinguish message types.

3. **Single Conversation**: Each AILEAN export is treated as a single conversation.

4. **Relative Timestamps**: When calculating duration between timestamps like "1 hour and 38 minutes ago" and "Yesterday, 17:33", the parser attempts a best-effort conversion. For precise duration calculations, absolute timestamps are recommended.

## Usage

No changes needed! Just upload your AILEAN CSV file as you would with legacy format files. The parser will automatically detect and process it correctly.

## Testing

To test with the AILEAN format:
1. Export a conversation from AILEAN admin panel
2. Upload the CSV file to the app
3. Verify that:
   - Tenant information is extracted correctly
   - All messages are displayed
   - Summary statistics show correct message count

## Troubleshooting

**Phone number not extracted?**
- Ensure phone number is in message content
- Check format: should be `+41 79 745 35 07` or similar

**Tenant name not found?**
- Name must follow a salutation: "Herr", "Frau", etc.
- Check message content for these patterns

**No address extracted?**
- Address must include street name + number
- Supported streets: strasse, straße, weg, platz, ring

---

**Last Updated**: February 2025
**Version**: 1.1 (AILEAN Format Support Added)
