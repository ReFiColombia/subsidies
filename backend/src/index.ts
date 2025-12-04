import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { isAddress } from 'viem';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all beneficiaries
app.get('/api/beneficiaries', async (req, res) => {
  try {
    const beneficiaries = await prisma.beneficiary.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(beneficiaries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch beneficiaries' });
  }
});

// Get beneficiary by address
app.get('/api/beneficiaries/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { address: address.toLowerCase() }
    });

    if (!beneficiary) {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }

    res.json(beneficiary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch beneficiary' });
  }
});

// Create new beneficiary
app.post('/api/beneficiaries', async (req, res) => {
  try {
    const { address, name, phoneNumber, responsable } = req.body;

    if (!address || !name) {
      return res.status(400).json({ error: 'Address and name are required' });
    }

    if (!isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const beneficiary = await prisma.beneficiary.create({
      data: {
        address: address.toLowerCase(),
        name,
        phoneNumber: phoneNumber || null,
        responsable: responsable || null
      }
    });

    res.status(201).json(beneficiary);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Beneficiary with this address already exists' });
    }
    res.status(500).json({ error: 'Failed to create beneficiary' });
  }
});

// Update beneficiary
app.put('/api/beneficiaries/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { name, phoneNumber, responsable } = req.body;

    if (!isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const beneficiary = await prisma.beneficiary.update({
      where: { address: address.toLowerCase() },
      data: {
        ...(name && { name }),
        phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
        responsable: responsable !== undefined ? responsable : undefined
      }
    });

    res.json(beneficiary);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }
    res.status(500).json({ error: 'Failed to update beneficiary' });
  }
});

// Delete beneficiary
app.delete('/api/beneficiaries/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    await prisma.beneficiary.delete({
      where: { address: address.toLowerCase() }
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }
    res.status(500).json({ error: 'Failed to delete beneficiary' });
  }
});

// Batch get beneficiaries by addresses
app.post('/api/beneficiaries/batch', async (req, res) => {
  try {
    const { addresses } = req.body;

    if (!Array.isArray(addresses)) {
      return res.status(400).json({ error: 'Addresses must be an array' });
    }

    const validAddresses = addresses.filter(addr => isAddress(addr)).map(addr => addr.toLowerCase());

    const beneficiaries = await prisma.beneficiary.findMany({
      where: {
        address: {
          in: validAddresses
        }
      }
    });

    res.json(beneficiaries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch beneficiaries' });
  }
});

// For Vercel serverless deployment
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
