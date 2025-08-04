import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schema for bulk TML code generation
const bulkGenerateSchema = z.object({
  count: z.number()
    .int("Count must be an integer")
    .min(1, "Count must be at least 1")
    .max(1000, "Cannot generate more than 1000 codes at once"),
  isActive: z.boolean().default(false),
});

// Function to generate random 6-character alphanumeric code for TML
function generateRandomTMLCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Function to generate unique TML codes in batches
async function generateUniqueTMLCodes(count: number): Promise<string[]> {
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
        newCode = generateRandomTMLCode();
        // Check if code already exists in our batch or in database
        isUnique = !batch.includes(newCode) && !codes.includes(newCode);
        
        if (isUnique) {
          // Check database for existing code
          const existingCode = await prisma.codeDistribution.findUnique({
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

// POST /api/codes/bulk - Generate multiple TML codes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = bulkGenerateSchema.parse(body);

    console.log(`Starting bulk generation of ${validatedData.count} TML codes...`);

    // Generate unique codes
    const uniqueCodes = await generateUniqueTMLCodes(validatedData.count);

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
      const batchResult = await prisma.codeDistribution.createMany({
        data: batch,
        skipDuplicates: true, // Skip any duplicates that might occur
      });
      
      console.log(`Created batch ${Math.floor(i / batchSize) + 1}: ${batchResult.count} codes`);
    }

    // Fetch the created codes to return with full data
    const finalCodes = await prisma.codeDistribution.findMany({
      where: {
        code: { in: uniqueCodes }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Successfully created ${finalCodes.length} TML codes`);

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
      message: `Successfully generated ${finalCodes.length} TML codes`,
    });

  } catch (error) {
    console.error("Error generating bulk TML codes:", error);

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
        error: error instanceof Error ? error.message : "Failed to generate bulk TML codes" 
      },
      { status: 500 }
    );
  }
}

// GET /api/codes/bulk/status - Check bulk generation status for TML codes
export async function GET(request: NextRequest) {
  try {
    // Get basic statistics about TML codes
    const stats = await prisma.codeDistribution.groupBy({
      by: ['isActive'],
      _count: {
        id: true,
      },
    });

    const totalCodes = await prisma.codeDistribution.count();
    const usedCodes = await prisma.codeDistribution.count({
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
    console.error("Error fetching TML codes bulk generation status:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch status" 
      },
      { status: 500 }
    );
  }
}