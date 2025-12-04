# Backend Integration Guide

This guide shows how to integrate the beneficiary database API with your frontend.

## Setup

### 1. Start the Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

The API will be running at `http://localhost:3001`

### 2. Configure Frontend

Add to your [frontend/.env](frontend/.env):
```
VITE_API_URL=http://localhost:3001
```

## Usage Examples

### Display Beneficiary Name in Components

Use the `<BeneficiaryName>` component to display names instead of addresses:

```tsx
import { BeneficiaryName } from '@/components/BeneficiaryName';

function MyComponent() {
  const address = "0xf01365c382f29861ec27e2ad332f0b94171f7f93";

  return (
    <div>
      <BeneficiaryName address={address} />
      {/* Displays: Luz Elena (0xf013...f93) */}
    </div>
  );
}
```

### Fetch Single Beneficiary

```tsx
import { useBeneficiary } from '@/hooks/useBeneficiaries';

function BeneficiaryDetails({ address }: { address: string }) {
  const { data, isLoading, error } = useBeneficiary(address);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading beneficiary</div>;

  return (
    <div>
      <h2>{data.name}</h2>
      <p>Address: {data.address}</p>
      <p>Phone: {data.phoneNumber || 'N/A'}</p>
      <p>Responsible: {data.responsable || 'N/A'}</p>
    </div>
  );
}
```

### List All Beneficiaries

```tsx
import { useBeneficiaries } from '@/hooks/useBeneficiaries';

function BeneficiariesList() {
  const { data: beneficiaries, isLoading } = useBeneficiaries();

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {beneficiaries?.map(b => (
        <li key={b.id}>
          {b.name} - {b.address}
          {b.responsable && ` (Responsible: ${b.responsable})`}
        </li>
      ))}
    </ul>
  );
}
```

### Fetch Multiple Beneficiaries

```tsx
import { useBeneficiariesByAddresses } from '@/hooks/useBeneficiaries';

function BatchBeneficiaries({ addresses }: { addresses: string[] }) {
  const { data: beneficiaries } = useBeneficiariesByAddresses(addresses);

  return (
    <div>
      {beneficiaries?.map(b => (
        <div key={b.id}>{b.name}</div>
      ))}
    </div>
  );
}
```

### Create New Beneficiary

```tsx
import { useCreateBeneficiary } from '@/hooks/useBeneficiaries';
import { useState } from 'react';

function AddBeneficiaryForm() {
  const createBeneficiary = useCreateBeneficiary();
  const [formData, setFormData] = useState({
    address: '',
    name: '',
    phoneNumber: '',
    responsable: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBeneficiary.mutateAsync(formData);
      alert('Beneficiary added!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Address"
        value={formData.address}
        onChange={e => setFormData({ ...formData, address: e.target.value })}
      />
      <input
        placeholder="Name"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        placeholder="Phone Number"
        value={formData.phoneNumber}
        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
      />
      <input
        placeholder="Responsible"
        value={formData.responsable}
        onChange={e => setFormData({ ...formData, responsable: e.target.value })}
      />
      <button type="submit">Add Beneficiary</button>
    </form>
  );
}
```

### Update Beneficiary

```tsx
import { useUpdateBeneficiary } from '@/hooks/useBeneficiaries';

function UpdateBeneficiary({ address }: { address: string }) {
  const updateBeneficiary = useUpdateBeneficiary();

  const handleUpdate = async () => {
    try {
      await updateBeneficiary.mutateAsync({
        address,
        name: 'New Name',
        phoneNumber: '+57 300 123 4567'
      });
      alert('Updated!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return <button onClick={handleUpdate}>Update</button>;
}
```

### Delete Beneficiary

```tsx
import { useDeleteBeneficiary } from '@/hooks/useBeneficiaries';

function DeleteBeneficiary({ address }: { address: string }) {
  const deleteBeneficiary = useDeleteBeneficiary();

  const handleDelete = async () => {
    if (confirm('Are you sure?')) {
      try {
        await deleteBeneficiary.mutateAsync(address);
        alert('Deleted!');
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### Helper Function: Get Name by Address

```tsx
import { useBeneficiaries, getBeneficiaryName } from '@/hooks/useBeneficiaries';

function MyComponent() {
  const { data: beneficiaries } = useBeneficiaries();
  const address = "0xf01365c382f29861ec27e2ad332f0b94171f7f93";

  const name = getBeneficiaryName(beneficiaries, address);
  // Returns "Luz Elena" or the address if not found

  return <div>{name}</div>;
}
```

## API Reference

### Endpoints

All endpoints are prefixed with `/api/beneficiaries`

- `GET /api/beneficiaries` - Get all beneficiaries
- `GET /api/beneficiaries/:address` - Get single beneficiary
- `POST /api/beneficiaries` - Create beneficiary
- `PUT /api/beneficiaries/:address` - Update beneficiary
- `DELETE /api/beneficiaries/:address` - Delete beneficiary
- `POST /api/beneficiaries/batch` - Get multiple by addresses

### Data Structure

```typescript
interface Beneficiary {
  id: string;
  address: string;           // Ethereum address (stored lowercase)
  name: string;              // Required
  phoneNumber: string | null; // Optional
  responsable: string | null; // Person in charge (optional)
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
}
```

## Database Management

### View/Edit Database with Prisma Studio

```bash
cd backend
npm run prisma:studio
```

This opens a GUI at `http://localhost:5555` to view and edit the database.

### Reset Database

```bash
cd backend
rm prisma/dev.db
npm run prisma:migrate
npm run seed
```

## Production Deployment

For production, you'll want to:

1. Use PostgreSQL instead of SQLite
2. Update [backend/prisma/schema.prisma](backend/prisma/schema.prisma) datasource to PostgreSQL
3. Set `DATABASE_URL` environment variable to your PostgreSQL connection string
4. Deploy backend to a service like Railway, Render, or Vercel
5. Update `VITE_API_URL` in frontend to point to your deployed backend
