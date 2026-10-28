import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const CAMPUS_LOCATIONS = [
  // Primary Gates & Entrances
  { name: 'South Gate Security Post', isSecurityPost: true },
  { name: 'North Gate Security Post', isSecurityPost: true },
  { name: 'West Gate Security Post', isSecurityPost: true },
  { name: 'Obakekere Campus Security Post', isSecurityPost: true },

  // Schools / Faculties
  { name: 'School of Computing (SOC)', isSecurityPost: true },
  { name: 'School of Engineering and Engineering Technology (SEET)', isSecurityPost: true },
  { name: 'School of Agriculture and Agricultural Technology (SAAT)', isSecurityPost: true },
  { name: 'School of Sciences (SOS)', isSecurityPost: true },
  { name: 'School of Environmental Technology (SET)', isSecurityPost: true },
  { name: 'School of Earth and Mineral Sciences (SEMS)', isSecurityPost: true },
  { name: 'School of Health and Health Technology (SHHT)', isSecurityPost: true },
  { name: 'School of Logistics and Innovation Technology (SLIT)', isSecurityPost: true },
  { name: 'School of Postgraduate Studies (SPGS)', isSecurityPost: true },

  // Lecture Theatres & Auditoriums
  { name: '2,500 Capacity Lecture Theatre (2K5)', isSecurityPost: true },
  { name: '1,000 Capacity Lecture Theatre (Hilltop)', isSecurityPost: true },
  { name: '750 Capacity Lecture Theatre', isSecurityPost: true },
  { name: 'ETF Lecture Theatre', isSecurityPost: true },
  { name: 'Akindeko Hall Lecture Theatre', isSecurityPost: true },

  // Key Facilities
  { name: 'University Central Library Security Post', isSecurityPost: true },
  { name: 'Student Union Building (SUB) Security Post', isSecurityPost: true },
  { name: 'University Health Services Security Post', isSecurityPost: true },
  { name: 'Sports Complex Security Post', isSecurityPost: true },
];

export async function seedLocations(): Promise<void> {
  console.log(`[seed] Seeding ${CAMPUS_LOCATIONS.length} campus locations...`);

  for (const location of CAMPUS_LOCATIONS) {
    await prisma.location.upsert({
      where: { name: location.name },
      update: { isSecurityPost: location.isSecurityPost },
      create: {
        name: location.name,
        isSecurityPost: location.isSecurityPost,
      },
    });
  }

  console.log('[seed] Locations seeded successfully.');
}

async function main(): Promise<void> {
  try {
    await seedLocations();
  } catch (error) {
    console.error('[seed] Failed to seed database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
