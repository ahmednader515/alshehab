const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    try {
        // Date range for December 13, 2025 (12-13-2025)
        // Start of day: 2025-12-13 00:00:00
        // End of day: 2025-12-13 23:59:59.999
        const startDate = new Date("2025-12-13T00:00:00.000Z");
        const endDate = new Date("2025-12-13T23:59:59.999Z");

        console.log("Searching for users created on December 13, 2025...");
        console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // First, find users to see how many will be deleted
        const usersToDelete = await prisma.user.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                createdAt: true
            }
        });

        console.log(`Found ${usersToDelete.length} user(s) to delete:`);
        usersToDelete.forEach((user, index) => {
            console.log(`${index + 1}. ${user.fullName} (${user.phoneNumber}) - Created: ${user.createdAt.toISOString()}`);
        });

        if (usersToDelete.length === 0) {
            console.log("No users found to delete.");
            return;
        }

        // Delete users (cascade will handle related records)
        const deleteResult = await prisma.user.deleteMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        console.log(`\nSuccessfully deleted ${deleteResult.count} user(s) from the database.`);
        console.log("Note: Related records (purchases, progress, etc.) were also deleted due to cascade rules.");

    } catch (error) {
        console.error("Error deleting users:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

