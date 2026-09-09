# Contact Import Wizard

A comprehensive, multi-step wizard for importing contacts from CSV files with validation, duplicate detection, and error handling.

## Features

### 5-Step Import Process

1. **Upload** - Drag-and-drop or browse to upload CSV files
2. **Field Mapping** - Auto-detect and map CSV columns to contact fields
3. **Validation** - Validate data against schema with detailed error reporting
4. **Duplicate Detection** - Find and review potential duplicates before importing
5. **Import** - Batch insert contacts with progress tracking and error handling

### Key Capabilities

- **Smart Column Detection** - Automatically maps common column names to fields
- **Duplicate Detection** - Detects duplicates by:
  - Exact email match
  - Phone number match (last 10 digits)
  - Fuzzy name matching (85% similarity threshold using Levenshtein distance)
- **Batch Processing** - Efficiently processes large imports in batches of 100
- **Error Handling** - Graceful error handling with detailed row-level error reporting
- **CSV Template** - Downloadable template with sample data and field descriptions
- **Progress Tracking** - Visual step indicator and import progress

## File Structure

```
src/modules/contacts/
├── components/
│   └── import-wizard.tsx          # Main wizard component
├── actions/
│   ├── import-contacts.ts         # Import action with skip/update options
│   └── batch-import.ts            # Optimized batch import action
└── README.md                      # This file

src/lib/import/
├── csv-parser.ts                  # CSV parsing and column mapping
├── duplicate-detector.ts          # Duplicate detection algorithms
├── validators.ts                  # Row validation logic
└── csv-template.ts                # Template generation and download
```

## Usage

### Basic Import Flow

1. User navigates to `/contacts/import`
2. Downloads CSV template (optional)
3. Uploads CSV file
4. Reviews auto-detected field mappings (adjust if needed)
5. Reviews validation results (invalid rows are skipped)
6. Reviews potential duplicates (choose to skip or import each)
7. Confirms import
8. Views import summary (success/failure counts, errors)

### Import Options

The import action supports two modes:

```typescript
// Skip duplicates (default behavior in wizard)
await importContacts(contacts, {
  skipDuplicates: false,
  updateExisting: false,
})

// Update existing contacts
await importContacts(contacts, {
  skipDuplicates: false,
  updateExisting: true,
})
```

### Using Batch Import

For optimized imports with upfront duplicate detection:

```typescript
import { batchImportContacts } from '@/modules/contacts/actions/batch-import'

const result = await batchImportContacts(contacts)
// Result includes: imported, duplicates, failed, errors[]
```

## CSV Format

### Required Fields

- `first_name` - Contact's first name
- `last_name` - Contact's last name

### Optional Fields

- `email` - Email address (recommended for duplicate detection)
- `phone` - Phone number in any format
- `street` - Street address
- `city` - City
- `state` - State or province
- `zip` - ZIP or postal code
- `tags` - Comma-separated tags (e.g., "donor,volunteer")
- `notes` - Additional notes
- `is_donor` - Boolean (true/false, yes/no, 1/0)
- `is_volunteer` - Boolean (true/false, yes/no, 1/0)

### Example CSV

```csv
first_name,last_name,email,phone,city,state,tags,is_donor,is_volunteer
John,Doe,john@example.com,555-123-4567,Springfield,IL,"donor,volunteer",true,true
Jane,Smith,jane@example.com,555-987-6543,Portland,OR,volunteer,false,true
```

## Duplicate Detection Logic

### Email Match (Highest Priority)
- Exact match (case-insensitive, trimmed)
- If email matches, contact is marked as duplicate immediately

### Phone Match
- Normalizes phone numbers (removes non-digits)
- Compares last 10 digits
- Requires exactly 10 digits to match

### Name Match (Fuzzy)
- Calculates Levenshtein distance between full names
- Normalizes names (lowercase, removes special characters)
- Default threshold: 85% similarity
- Example: "Jon Doe" vs "John Doe" = 91% match

### Internal Duplicates

The system also detects duplicates within the import file itself before checking against existing contacts.

## Performance Considerations

- **Batch Size**: 100 contacts per batch
- **Recommended Max**: 10,000 contacts per import
- **File Size Limit**: 10 MB
- **Duplicate Detection**: O(n*m) where n = new contacts, m = existing contacts

### Optimization

The batch import action (`batch-import.ts`) is optimized for large imports:
- Fetches all existing contacts once upfront
- Runs duplicate detection before insertion
- Uses batch inserts for better performance
- Falls back to individual inserts if batch fails

## Error Handling

### Validation Errors

Invalid rows are reported with:
- Row number
- Specific validation errors
- Original contact data

Example error:
```
Row 15: Email must be a valid email address
Row 23: First name is required
```

### Import Errors

Import failures are reported with:
- Row number
- Contact that failed
- Database error message

### Graceful Degradation

- If batch insert fails, falls back to individual inserts
- Continues processing remaining batches even if one fails
- Reports partial success with detailed error list

## Testing

### Manual Testing Checklist

- [ ] Upload valid CSV file
- [ ] Upload invalid file type (should show error)
- [ ] Test auto-column mapping detection
- [ ] Map columns manually
- [ ] Import contacts with validation errors (should skip invalid rows)
- [ ] Import contacts with duplicates (should detect and allow skip/import)
- [ ] Import large file (1000+ contacts)
- [ ] Download CSV template
- [ ] Verify all imported contacts appear in contacts list
- [ ] Check error reporting for failed rows

### Test CSV Files

Create test files with:
1. All valid data
2. Some invalid emails
3. Missing required fields
4. Duplicate emails
5. Similar names (fuzzy match test)
6. Large dataset (1000+ rows)

## Future Enhancements

Potential improvements:
- [ ] Import history/audit log
- [ ] Undo import functionality
- [ ] Import scheduling (background jobs)
- [ ] Excel file support (.xlsx)
- [ ] Field transformation rules (e.g., format phone numbers)
- [ ] Import profiles (saved column mappings)
- [ ] Merge duplicate contacts (instead of just skip/import)
- [ ] Import contact photos/avatars
- [ ] Webhook notifications on import completion
- [ ] Real-time progress updates using WebSockets

## Troubleshooting

### "No organization selected" error
- Ensure user is logged in and has an active organization
- Check that organization cookie is set

### CSV parsing errors
- Verify file is valid CSV format
- Check for proper encoding (UTF-8)
- Ensure headers are on first row

### Batch insert failures
- Check database constraints
- Verify RLS policies allow insert
- Review error logs for specific database errors

### Duplicate detection not working
- Ensure email/phone data is properly formatted
- Check that existing contacts query is working
- Verify archived contacts are excluded

## Related Files

- Page: `/src/app/(dashboard)/contacts/import/page.tsx`
- Components: `/src/modules/contacts/components/`
- Actions: `/src/modules/contacts/actions/`
- Utilities: `/src/lib/import/`
- Schemas: `/src/modules/contacts/schemas/contact.schema.ts`
