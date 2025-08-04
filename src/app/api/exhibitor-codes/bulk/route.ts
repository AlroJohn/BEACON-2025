import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schema for bulk code generation
const bulkGenerateSchema = z.object({
  count: z.number()
    .int("Count must be an integer")
    .min(1, "Count must be at least 1")
    .max(1000, "Cannot generate more than 1000 codes at once"),
  isActive: z.boolean().default(false),
});

// Function to generate random 6-character alphanumeric code
function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Function to generate unique codes in batches
async function generateUniqueCodes(count: number): Promise<string[]> {
  const codes: string[] = [];
  const batchSize = 100; // Process in batches to avoid memory issues
  let attempts = 0;
  const maxAttempts = count * 10; // Safety limit to prevent infinite loops

  while (codes.length < count && attempts < maxAttempts) {
    const batch: string[] = [];
    
    // Generate a batch of codes
    for (let i = 0; i < Math.min(batchSize, count - codes.length); i++) {
      let newCode: string;
      let isUnique = false;
      let codeAttempts = 0;
      
      do {
        newCode = generateRandomCode();
        // Check if code already exists in our batch or in database
        isUnique = !batch.includes(newCode) && !codes.includes(newCode);
        
        if (isUnique) {
          // Check database for existing code
          const existingCode = await prisma.exhibitorCodeDistribution.findUnique({
            where: { code: newCode },
          });
          isUnique = !existingCode;
        }
        
        codeAttempts++;
      } while (!isUnique && codeAttempts < 50);
      
      if (isUnique) {
        batch.push(newCode);
      }
      
      attempts++;
    }
    
    codes.push(...batch);
  }

  if (codes.length < count) {
    throw new Error(`Could only generate ${codes.length} unique codes out of ${count} requested. Please try with a smaller number.`);
  }

  return codes;
}

// POST /api/exhibitor-codes/bulk - Generate multiple exhibitor codes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = bulkGenerateSchema.parse(body);

    console.log(`Starting bulk generation of ${validatedData.count} exhibitor codes...`);

    // Generate unique codes
    const uniqueCodes = await generateUniqueCodes(validatedData.count);

    // Prepare data for bulk insertion
    const codeData = uniqueCodes.map(code => ({
      code,
      isActive: validatedData.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Bulk insert codes in batches to avoid database limits
    const batchSize = 100;
    const createdCodes = [];
    
    for (let i = 0; i < codeData.length; i += batchSize) {
      const batch = codeData.slice(i, i + batchSize);
      const batchResult = await prisma.exhibitorCodeDistribution.createMany({
        data: batch,
        skipDuplicates: true, // Skip any duplicates that might occur
      });
      
      console.log(`Created batch ${Math.floor(i / batchSize) + 1}: ${batchResult.count} codes`);
    }

    // Fetch the created codes to return with full data
    const finalCodes = await prisma.exhibitorCodeDistribution.findMany({
      where: {
        code: { in: uniqueCodes }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Successfully created ${finalCodes.length} exhibitor codes`);

    return NextResponse.json({
      success: true,
      data: {
        codes: finalCodes,
        summary: {
          requested: validatedData.count,
          created: finalCodes.length,
          active: validatedData.isActive,
        }
      },
      message: `Successfully generated ${finalCodes.length} exhibitor codes`,
    });

  } catch (error) {
    console.error("Error generating bulk exhibitor codes:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Validation failed", 
          details: error.issues 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate bulk exhibitor codes" 
      },
      { status: 500 }
    );
  }
}

// GET /api/exhibitor-codes/bulk/status - Check bulk generation status (for future progress tracking)
export async function GET(request: NextRequest) {
  try {
    // Get basic statistics about codes
    const stats = await prisma.exhibitorCodeDistribution.groupBy({
      by: ['isActive'],
      _count: {
        id: true,
      },
    });

    const totalCodes = await prisma.exhibitorCodeDistribution.count();
    const usedCodes = await prisma.exhibitorCodeDistribution.count({
      where: {
        userId: { not: null }
      }
    });

    const summary = {
      total: totalCodes,
      used: usedCodes,
      available: totalCodes - usedCodes,
      active: stats.find(s => s.isActive)?._count.id || 0,
      inactive: stats.find(s => !s.isActive)?._count.id || 0,
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });

  } catch (error) {
    console.error("Error fetching bulk generation status:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch status" 
      },
      { status: 500 }
    );
  }
}