import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load beneficiaries from environment variable or local file
function loadBeneficiaries() {
  // Option 1: Load from environment variable (for production)
  if (process.env.BENEFICIARIES_DATA) {
    try {
      return JSON.parse(process.env.BENEFICIARIES_DATA);
    } catch (error) {
      console.error('Failed to parse BENEFICIARIES_DATA environment variable');
      throw error;
    }
  }

  // Option 2: Load from local file (for development)
  const dataFilePath = join(__dirname, 'beneficiaries.json');
  if (existsSync(dataFilePath)) {
    const fileContent = readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(fileContent);
  }

  throw new Error('No beneficiaries data found. Please set BENEFICIARIES_DATA env var or create beneficiaries.json');
}

async function main() {
  console.log('Starting seed...');

  const beneficiaries = loadBeneficiaries();
  console.log(`Found ${beneficiaries.length} beneficiaries to seed`);

  for (const beneficiary of beneficiaries) {
    await prisma.beneficiary.upsert({
      where: { address: beneficiary.address.toLowerCase() },
      update: {
        name: beneficiary.name,
        responsable: beneficiary.responsable,
        phoneNumber: beneficiary.phoneNumber,
      },
      create: {
        address: beneficiary.address.toLowerCase(),
        name: beneficiary.name,
        responsable: beneficiary.responsable,
        phoneNumber: beneficiary.phoneNumber,
      },
    });
    console.log(`✓ ${beneficiary.name} (${beneficiary.address})`);
  }

  console.log(`\nSeeding completed! Added ${beneficiaries.length} beneficiaries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
