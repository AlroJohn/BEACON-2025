import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'full';
    
    // Check if user wants simple email-only template
    if (type === 'simple') {
      const simpleHeaders = ['email'];
      const simpleSampleRows = [
        ['member1@tml.org'],
        ['member2@maritime.com'],
        ['member3@shipping.ph'],
        ['admin@example.com']
      ];
      
      const csvContent = [
        simpleHeaders.join(','),
        ...simpleSampleRows.map(row => row.join(','))
      ].join('\n');
      
      const bom = '\uFEFF';
      const csvWithBom = bom + csvContent;
      
      return new Response(csvWithBom, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="tml-members-simple-template.csv"',
          'Cache-Control': 'no-cache',
        },
      });
    }
    
    // Define the CSV template headers matching TmlMembers schema (full template)
    const headers = [
      'firstName',
      'lastName', 
      'middleName',
      'email',
      'mobileNumber',
      'landline',
      'jobTitle',
      'companyName'
    ];

    // Sample data rows to help users understand the format
    const sampleRows = [
      [
        'Juan',
        'Dela Cruz',
        'Santos',
        'juan.delacruz@tml.org',
        '+63 917 123 4567',
        '(02) 123-4567',
        'Maritime Officer',
        'The Maritime League'
      ],
      [
        'Maria',
        'Santos',
        'Garcia',
        'maria.santos@shipping.ph',
        '+63 928 987 6543',
        '',
        'Shipping Manager',
        'Philippine Shipping Lines'
      ],
      [
        '',
        '',
        '',
        'roberto.cruz@maritime.gov.ph',
        '',
        '',
        '',
        ''
      ],
      [
        '',
        '',
        '',
        'simple@email.com',
        '',
        '',
        '',
        ''
      ]
    ];

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => 
        row.map(cell => {
          // Escape cells that contain commas, quotes, or newlines
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');

    // Add BOM for proper Excel UTF-8 handling
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    return new Response(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="tml-members-template.csv"',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}

// Also provide a POST endpoint for custom template generation
export async function POST() {
  try {
    // Define headers with descriptions for TML schema
    const templateData = {
      headers: [
        'firstName',
        'lastName', 
        'middleName',
        'email',
        'mobileNumber',
        'landline',
        'jobTitle',
        'companyName'
      ],
      descriptions: [
        'First name (optional)',
        'Last name (optional)',
        'Middle name (optional)',
        'Email address (required, must be unique)',
        'Mobile phone number (optional)',
        'Landline phone number (optional)',
        'Job title/position (optional)',
        'Company or organization name (optional)'
      ]
    };

    return NextResponse.json({
      success: true,
      template: templateData,
      instructions: [
        'Download the CSV template using the GET endpoint',
        'Fill in your TML member data following the sample format',
        'ONLY EMAIL IS REQUIRED - all other columns are optional',
        'You can upload a CSV with just an email column if needed',
        'Email addresses must be unique across all TML members',
        'Maximum file size: 5MB, Maximum rows: 1000',
        'Upload the completed CSV file using the bulk upload feature'
      ]
    });

  } catch (error) {
    console.error('Error providing template info:', error);
    return NextResponse.json(
      { error: 'Failed to provide template information' },
      { status: 500 }
    );
  }
}