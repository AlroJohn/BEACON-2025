import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Define the CSV template headers matching simplified ExhibitorMembers schema
    const headers = [
      'firstName',
      'lastName', 
      'middleName',
      'email',
      'jobTitle',
      'companyName',
      'mobileNumber',
      'landline'
    ];

    // Sample data rows to help users understand the format
    const sampleRows = [
      [
        'John',
        'Doe',
        'Michael',
        'john.doe@maritime.com',
        'Marine Engineer',
        'Maritime Solutions Inc',
        '+63 912 345 6789',
        '(02) 123-4567'
      ],
      [
        'Jane',
        'Smith',
        '',
        'jane.smith@oceantech.ph',
        'Operations Manager',
        'OceanTech Philippines',
        '+63 998 765 4321',
        ''
      ],
      [
        '',
        '',
        '',
        'contact@shipyard.com',
        '',
        'Philippine Shipyard Corp',
        '',
        '(02) 987-6543'
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
        'Content-Disposition': 'attachment; filename="exhibitor-members-template.csv"',
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
    // Define headers with descriptions for simplified schema
    const templateData = {
      headers: [
        'firstName',
        'lastName', 
        'middleName',
        'email',
        'jobTitle',
        'companyName',
        'mobileNumber',
        'landline'
      ],
      descriptions: [
        'First name (optional)',
        'Last name (optional)',
        'Middle name (optional)',
        'Email address (required, must be unique)',
        'Job title/position (optional)',
        'Company name (optional)',
        'Mobile phone number (optional)',
        'Landline phone number (optional)'
      ]
    };

    return NextResponse.json({
      success: true,
      template: templateData,
      instructions: [
        'Download the CSV template using the GET endpoint',
        'Fill in your member data following the sample format',
        'Required field: email (must be unique)',
        'All other fields are optional',
        'Email addresses must be unique across all members',
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