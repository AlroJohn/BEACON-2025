import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { parse } from 'csv-parse/sync';
import { tmlMemberSchema, exhibitorMemberSchema, TML_MEMBER_COLUMNS, EXHIBITOR_MEMBER_COLUMNS } from "@/types/members";

const prisma = new PrismaClient();

// Validation schema for bulk upload request
const bulkUploadSchema = z.object({
  memberType: z.enum(['tml', 'exhibitor']),
  overwriteExisting: z.boolean().default(false),
});

// Helper function to map CSV columns to our schema fields
function mapCsvColumns(csvData: any[], columnMapping: Record<string, string[]>): any[] {
  if (!csvData || csvData.length === 0) return [];

  const headers = Object.keys(csvData[0]);
  const fieldMapping: Record<string, string> = {};

  // Create reverse mapping from CSV headers to our field names
  Object.entries(columnMapping).forEach(([fieldName, possibleColumns]) => {
    const matchedHeader = headers.find(header => 
      possibleColumns.some(col => 
        col.toLowerCase() === header.toLowerCase().trim()
      )
    );
    if (matchedHeader) {
      fieldMapping[matchedHeader] = fieldName;
    }
  });

  // Transform the data using the mapping
  return csvData.map(row => {
    const mappedRow: any = {};
    Object.entries(row).forEach(([header, value]) => {
      const fieldName = fieldMapping[header];
      if (fieldName && value !== null && value !== undefined && value !== '') {
        // Handle special field types
        if (fieldName === 'tags' || fieldName === 'participationTypes') {
          // Convert comma-separated strings to arrays
          mappedRow[fieldName] = typeof value === 'string' 
            ? value.split(',').map(v => v.trim()).filter(Boolean)
            : [];
        } else if (fieldName === 'isActive') {
          // Convert to boolean
          mappedRow[fieldName] = ['true', '1', 'yes', 'active'].includes(
            String(value).toLowerCase()
          );
        } else {
          mappedRow[fieldName] = typeof value === 'string' ? value.trim() : value;
        }
      }
    });
    return mappedRow;
  });
}

// Helper function to validate and process member data
async function validateAndProcessMembers(
  rawData: any[], 
  memberType: 'tml' | 'exhibitor',
  overwriteExisting: boolean
) {
  const results = {
    totalRows: rawData.length,
    successfulImports: 0,
    skippedRows: 0,
    errors: [] as Array<{ row: number; email?: string; error: string; }>,
    duplicateEmails: [] as string[],
    validMembers: [] as any[],
  };

  const schema = memberType === 'tml' ? tmlMemberSchema : exhibitorMemberSchema;
  const seenEmails = new Set<string>();

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const rowNumber = i + 1;

    try {
      // Check for required email field
      if (!row.email) {
        results.errors.push({
          row: rowNumber,
          error: 'Email is required'
        });
        results.skippedRows++;
        continue;
      }

      // Check for duplicate emails in the same upload
      if (seenEmails.has(row.email.toLowerCase())) {
        results.duplicateEmails.push(row.email);
        results.skippedRows++;
        continue;
      }

      // Check if email already exists in database
      const existingMember = memberType === 'tml' 
        ? await prisma.tmlMembers.findUnique({ where: { email: row.email } })
        : await prisma.exhibitorMembers.findUnique({ where: { email: row.email } });

      if (existingMember && !overwriteExisting) {
        results.duplicateEmails.push(row.email);
        results.skippedRows++;
        continue;
      }

      // Validate data against schema
      const validatedData = schema.parse(row);
      
      seenEmails.add(row.email.toLowerCase());
      results.validMembers.push({
        ...validatedData,
        isUpdate: !!existingMember,
        existingId: existingMember?.id,
      });
      
    } catch (error) {
      results.errors.push({
        row: rowNumber,
        email: row.email,
        error: error instanceof z.ZodError 
          ? error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
          : 'Validation failed'
      });
      results.skippedRows++;
    }
  }

  return results;
}

// POST /api/members/bulk-upload - Upload members from CSV/Excel
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const memberTypeParam = formData.get('memberType') as string;
    const overwriteExistingParam = formData.get('overwriteExisting') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate request parameters
    const { memberType, overwriteExisting } = bulkUploadSchema.parse({
      memberType: memberTypeParam,
      overwriteExisting: overwriteExistingParam === 'true',
    });

    // Check file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Please upload CSV or Excel files only." },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();
    
    // Parse CSV data
    let rawData: any[];
    try {
      rawData = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Failed to parse CSV file. Please check the file format." },
        { status: 400 }
      );
    }

    if (!rawData || rawData.length === 0) {
      return NextResponse.json(
        { success: false, error: "No data found in the uploaded file." },
        { status: 400 }
      );
    }

    console.log(`Processing ${rawData.length} rows for ${memberType} members...`);

    // Map CSV columns to our schema fields
    const columnMapping = memberType === 'tml' ? TML_MEMBER_COLUMNS : EXHIBITOR_MEMBER_COLUMNS;
    const mappedData = mapCsvColumns(rawData, columnMapping);

    // Validate and process the data
    const validationResults = await validateAndProcessMembers(
      mappedData,
      memberType,
      overwriteExisting
    );

    // Import valid members to database
    for (const memberData of validationResults.validMembers) {
      try {
        const { isUpdate, existingId, ...cleanData } = memberData;

        if (isUpdate && overwriteExisting) {
          // Update existing member
          if (memberType === 'tml') {
            await prisma.tmlMembers.update({
              where: { id: existingId },
              data: cleanData,
            });
          } else {
            await prisma.exhibitorMembers.update({
              where: { id: existingId },
              data: cleanData,
            });
          }
        } else if (!isUpdate) {
          // Create new member
          if (memberType === 'tml') {
            await prisma.tmlMembers.create({ data: cleanData });
          } else {
            await prisma.exhibitorMembers.create({ data: cleanData });
          }
        }
        
        validationResults.successfulImports++;
      } catch (dbError) {
        console.error(`Database error for member ${memberData.email}:`, dbError);
        validationResults.errors.push({
          row: 0, // We don't have row number here
          email: memberData.email,
          error: 'Database error during import'
        });
        validationResults.skippedRows++;
      }
    }

    // Update final counts
    validationResults.skippedRows = validationResults.totalRows - validationResults.successfulImports;

    const response = {
      success: true,
      data: {
        totalRows: validationResults.totalRows,
        successfulImports: validationResults.successfulImports,
        skippedRows: validationResults.skippedRows,
        errors: validationResults.errors,
        duplicateEmails: validationResults.duplicateEmails,
      },
      message: `Successfully imported ${validationResults.successfulImports} ${memberType} members`,
    };

    console.log(`Bulk upload completed:`, response.data);
    return NextResponse.json(response);

  } catch (error) {
    console.error("Error in bulk upload:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}

// GET /api/members/bulk-upload/template - Download CSV template
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberType = searchParams.get('memberType') as 'tml' | 'exhibitor';

    if (!memberType || !['tml', 'exhibitor'].includes(memberType)) {
      return NextResponse.json(
        { success: false, error: "Invalid member type" },
        { status: 400 }
      );
    }

    // Generate CSV template headers
    const headers = memberType === 'tml' 
      ? [
          'firstName', 'lastName', 'middleName', 'email', 'mobileNumber', 'landline',
          'jobTitle', 'companyName', 'industry', 'companyAddress', 'tmlMemberCode',
          'membershipStatus', 'notes', 'tags', 'isActive'
        ]
      : [
          'firstName', 'lastName', 'middleName', 'email', 'mobileNumber', 'landline',
          'companyName', 'businessRegistrationName', 'companyAddress', 'companyWebsite',
          'industrySector', 'boothSize', 'participationTypes', 'exhibitorCode',
          'membershipStatus', 'notes', 'tags', 'isActive'
        ];

    // Create sample data row
    const sampleData = memberType === 'tml'
      ? [
          'John', 'Doe', 'Middle', 'john.doe@example.com', '+63 912 345 6789', '02-123-4567',
          'Marine Engineer', 'Maritime Corp', 'MARITIME', '123 Harbor St, Manila',
          'TML001', 'ACTIVE', 'Sample member notes', 'vip,premium', 'true'
        ]
      : [
          'Jane', 'Smith', 'Middle', 'jane.smith@company.com', '+63 912 345 6789', '02-123-4567',
          'Ship Tech Ltd', 'Ship Technology Limited Inc', '456 Port Ave, Manila',
          'https://shiptech.com', 'SHIPBUILDING_BOATBUILDING', '3m x 3m',
          'INDOOR_BOOTH,PRODUCT_LAUNCH', 'EX001', 'ACTIVE', 'Sample exhibitor notes',
          'featured,tech', 'true'
        ];

    // Create CSV content
    const csvContent = [
      headers.join(','),
      sampleData.join(','),
      // Add a blank row for user data entry
      headers.map(() => '').join(',')
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${memberType}-members-template.csv"`,
      },
    });

  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate template" },
      { status: 500 }
    );
  }
}