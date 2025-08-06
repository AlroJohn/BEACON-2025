import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for CSV row - firstName/lastName now optional
const csvRowSchema = z.object({
  firstName: z.string().max(100, "First name too long").optional().or(z.literal("")),
  lastName: z.string().max(100, "Last name too long").optional().or(z.literal("")),
  middleName: z.string().max(100, "Middle name too long").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  mobileNumber: z.string().max(20, "Mobile number too long").optional().or(z.literal("")),
  landline: z.string().max(20, "Landline too long").optional().or(z.literal("")),
  jobTitle: z.string().max(255, "Job title too long").optional().or(z.literal("")),
  companyName: z.string().max(255, "Company name too long").optional().or(z.literal("")),
});

interface ValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
}

// Robust CSV parser function that handles quoted fields
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // Parse a CSV line handling quoted fields
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add the last field
    result.push(currentField.trim());
    return result;
  };
  
  const headers = parseLine(lines[0]);
  const rows: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    // Allow rows with fewer values than headers (for single column CSVs)
    if (values.length > 0) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }
  
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { error: 'Please upload a CSV file' },
        { status: 400 }
      );
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 5MB allowed.' },
        { status: 400 }
      );
    }

    // Parse CSV
    const buffer = Buffer.from(await file.arrayBuffer());
    const csvContent = buffer.toString('utf-8');
    const csvData = parseCSV(csvContent);
    const errors: ValidationError[] = [];
    const duplicates: string[] = [];

    if (csvData.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or invalid format' },
        { status: 400 }
      );
    }

    if (csvData.length > 1000) {
      return NextResponse.json(
        { error: 'Too many rows. Maximum 1000 records per upload.' },
        { status: 400 }
      );
    }

    // Get existing emails to check for duplicates
    const existingEmails = new Set(
      (await prisma.tmlMembers.findMany({
        select: { email: true }
      })).map(member => member.email.toLowerCase())
    );

    const validMembers: any[] = [];
    const processedEmails = new Set<string>();

    // Validate each row
    for (let i = 0; i < csvData.length; i++) {
      const rowNumber = i + 2; // +2 because CSV starts at row 1 and we skip header
      const row = csvData[i];

      try {
        // Clean up empty strings and convert to undefined
        const cleanedRow = Object.keys(row).reduce((acc, key) => {
          const value = row[key]?.trim();
          acc[key] = value === '' ? undefined : value;
          return acc;
        }, {} as any);

        // Ensure email exists (only required field)
        if (!cleanedRow.email) {
          errors.push({
            row: rowNumber,
            field: 'email',
            value: '',
            error: 'Email is required'
          });
          continue;
        }

        // Validate row with flexible schema
        const validatedRow = csvRowSchema.parse(cleanedRow);

        // Check for duplicate email in existing database
        const emailLower = validatedRow.email.toLowerCase();
        if (existingEmails.has(emailLower)) {
          duplicates.push(validatedRow.email);
          continue;
        }

        // Check for duplicate email in current upload
        if (processedEmails.has(emailLower)) {
          errors.push({
            row: rowNumber,
            field: 'email',
            value: validatedRow.email,
            error: 'Duplicate email in upload file'
          });
          continue;
        }

        processedEmails.add(emailLower);

        // Convert empty strings to null for optional fields - handle missing columns gracefully
        const cleanMember = {
          firstName: validatedRow.firstName || null,
          lastName: validatedRow.lastName || null,
          middleName: validatedRow.middleName || null,
          email: validatedRow.email,
          mobileNumber: validatedRow.mobileNumber || null,
          landline: validatedRow.landline || null,
          jobTitle: validatedRow.jobTitle || null,
          companyName: validatedRow.companyName || null,
          isActive: true,
        };

        validMembers.push(cleanMember);

      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach(issue => {
            errors.push({
              row: rowNumber,
              field: issue.path.join('.'),
              value: String(row[issue.path[0]] || ''),
              error: issue.message
            });
          });
        } else {
          errors.push({
            row: rowNumber,
            field: 'general',
            value: '',
            error: 'Invalid row format'
          });
        }
      }
    }

    // Insert valid members in batches
    let successCount = 0;
    const batchSize = 50;
    
    for (let i = 0; i < validMembers.length; i += batchSize) {
      const batch = validMembers.slice(i, i + batchSize);
      try {
        await prisma.tmlMembers.createMany({
          data: batch,
          skipDuplicates: true, // Just in case
        });
        successCount += batch.length;
      } catch (batchError) {
        console.error('Batch insert error:', batchError);
        // Add individual errors for this batch
        batch.forEach((member, batchIndex) => {
          errors.push({
            row: i + batchIndex + 2,
            field: 'database',
            value: member.email,
            error: 'Database insertion failed'
          });
        });
      }
    }

    const result = {
      totalRows: csvData.length,
      successCount,
      errorCount: errors.length,
      errors: errors.slice(0, 100), // Limit errors shown to first 100
      duplicates: duplicates.slice(0, 50), // Limit duplicates shown to first 50
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}