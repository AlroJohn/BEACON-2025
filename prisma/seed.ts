import bcrypt from 'bcryptjs';
import { PrismaClient, EventStatusEnum, ManagerStatus, ActiveStatus, } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// Initialize clients
const prisma = new PrismaClient();

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Helper functions
const toPHDate = (dateString: string): Date => {
    return new Date(`${dateString}+08:00`);
};

const logStep = (message: string) => {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`🛠️  ${message}`);
    console.log(`${'='.repeat(40)}`);
};

const logSuccess = (message: string) => {
    console.log(`✅ ${message}`);
};

const logWarning = (message: string) => {
    console.log(`⚠️  ${message}`);
};

const logError = (message: string, error?: any) => {
    console.error(`❌ ${message}`, error ? error.message : '');
};

// Seed functions
async function seedVisitorEvents() {
    logStep('Seeding Visitor Events');

    const eventDefinitions = [
        {
            eventName: 'EXPO',
            eventStatus: EventStatusEnum.EXHIBITION,
            description: 'BEACON 2025 Main Expo (Hall)',
            dates: [
                toPHDate('2025-09-29T09:00:00'),
                toPHDate('2025-09-30T09:00:00'),
                toPHDate('2025-10-01T09:00:00')
            ],
            dailyStartTime: '09:00',
            dailyEndTime: '18:00'
        },
        {
            eventName: 'CONFERENCE',
            eventStatus: EventStatusEnum.CONFERENCE,
            description: 'International Maritime & Blue-Economy Conference',
            dates: [
                toPHDate('2025-09-29T10:00:00'),
                toPHDate('2025-09-30T10:00:00'),
                toPHDate('2025-10-01T10:00:00')
            ],
            dailyStartTime: '09:00',
            dailyEndTime: '17:00'
        },
        {
            eventName: 'PHILIPPINE IN-WATER SHOW',
            eventStatus: EventStatusEnum.SHOW,
            description: 'Live in-water display of ships & yachts',
            dates: [
                toPHDate('2025-09-29T10:00:00'),
                toPHDate('2025-09-30T10:00:00'),
                toPHDate('2025-10-01T10:00:00')
            ],
            dailyStartTime: '10:00',
            dailyEndTime: '18:00'
        },
        {
            eventName: 'NETWORKING & AWARDS NIGHT',
            eventStatus: EventStatusEnum.SHOW,
            description: 'VIP networking reception and awards gala',
            dates: [
                toPHDate('2025-09-29T10:00:00'),
                toPHDate('2025-09-30T10:00:00'),
                toPHDate('2025-10-01T10:00:00')
            ],
            dailyStartTime: '19:00',
            dailyEndTime: '22:00'
        }
    ];

    for (const event of eventDefinitions) {
        try {
            const existingEvent = await prisma.visitorEvents.findFirst({
                where: { eventName: event.eventName }
            });

            if (existingEvent) {
                logWarning(`Event "${event.eventName}" already exists (ID: ${existingEvent.id})`);
                continue;
            }

            const createdEvent = await prisma.visitorEvents.create({
                data: {
                    eventName: event.eventName,
                    eventStatus: event.eventStatus,
                    description: event.description,
                    eventDates: event.dates,
                    isActive: true,
                    eventStartTime: event.dates[0],
                    eventEndTime: new Date(event.dates[0].setHours(
                        parseInt(event.dailyEndTime.split(':')[0]),
                        parseInt(event.dailyEndTime.split(':')[1])
                    ),

                    )

                }
            });

            logSuccess(`Created event "${createdEvent.eventName}" (ID: ${createdEvent.id})`);
        } catch (error) {
            logError(`Failed to create event "${event.eventName}"`, error);
        }
    }
}

async function createAuthUser(email: string, password: string, metadata: any) {
    try {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: metadata
        });

        if (error) throw error;
        return data.user;
    } catch (error) {
        logError(`Supabase auth creation failed for ${email}`, error);
        return null;
    }
}

async function seedManagerAccounts() {
    logStep('Seeding Manager Accounts');

    const accounts = [
        {
            username: 'superadmin',
            email: 'superadmin@beacon2025.com',
            password: 'superadmin123',
            status: ManagerStatus.SUPERADMIN
        },
        {
            username: 'admin',
            email: 'admin@beacon2025.com',
            password: 'admin123',
            status: ManagerStatus.ADMIN
        },
        {
            username: 'manager',
            email: 'manager@beacon2025.com',
            password: 'manager123',
            status: ManagerStatus.ADMIN
        }
    ];

    const results = [];

    for (const account of accounts) {
        try {
            // Create Supabase auth user
            const authUser = await createAuthUser(account.email, account.password, {
                username: account.username,
                role: account.status
            });

            if (!authUser) continue;

            // Create database record
            const hashedPassword = await bcrypt.hash(account.password, 10);
            const dbUser = await prisma.managerAccount.upsert({
                where: { username: account.username },
                update: {},
                create: {
                    username: account.username,
                    password: hashedPassword,
                    status: account.status,
                    isActive: true
                }
            });

            results.push({
                username: account.username,
                email: account.email,
                password: account.password,
                dbId: dbUser.id,
                authId: authUser.id
            });

            logSuccess(`Created ${account.status} account: ${account.username}`);
        } catch (error) {
            logError(`Failed to create account ${account.username}`, error);
        }
    }

    // Print credentials table
    console.table(results.map(r => ({
        Role: r.username.toUpperCase(),
        Email: r.email,
        Password: r.password,
        'DB ID': r.dbId,
        'Auth ID': r.authId
    })));
}

// async function seedTestCodes() {
//     logStep('Seeding Test TML Codes');

//     const codes = [
//         'TML001', 'TML002', 'TML003',
//         'BEACON001', 'BEACON002',
//         'TEST001', 'TEST002'
//     ];

//     try {
//         const createPromises = codes.map(code =>
//             prisma.codeDistribution.upsert({
//                 where: { code },
//                 update: {},
//                 create: { code, isActive: true }
//             })
//         );

//         await Promise.all(createPromises);
//         logSuccess(`Created ${codes.length} test codes`);
//         console.log('📋 Available test codes:', codes.join(', '));
//     } catch (error) {
//         logError('Failed to create test codes', error);
//     }
// }

async function main() {
    try {
        logStep('Starting BEACON 2025 Database Seeding');

        await seedVisitorEvents();
        await seedManagerAccounts();
        // await seedTestCodes();

        logStep('Seeding Completed Successfully');
    } catch (error) {
        logError('Fatal seeding error', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();