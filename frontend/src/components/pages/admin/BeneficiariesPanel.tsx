import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBuiltGraphSDK } from '@/../.graphclient';
import { useQuery } from '@tanstack/react-query';
import { formatUnits, isAddress } from 'viem';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState, useEffect } from 'react';
import { ArrowUpDown, Search, Save, X, Edit, Settings2, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useBeneficiaries, useBeneficiary, useUpdateBeneficiary, useCreateBeneficiary } from '@/hooks/useBeneficiaries';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function BeneficiariesPanel() {
  type beneficiary_fields = 'id' | 'dateAdded' | 'dateRemoved' | 'isActive' | 'totalClaimed';
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<{key: beneficiary_fields; direction: 'asc' | 'desc' } | null>(null);
  const [activeTab, setActiveTab] = useState<'resumen' | 'tabla'>('resumen');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dateRange, setDateRange] = useState<{from: Date | undefined; to: Date | undefined}>({
    from: undefined,
    to: undefined
  });
  // Nuevo filtro de umbral
  const [amountThreshold, setAmountThreshold] = useState<string>('');
  const [amountComparison, setAmountComparison] = useState<'gt' | 'lt'>('gt');

  // Beneficiary management states
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [dialogAddress, setDialogAddress] = useState<string | null>(null);
  const [formData, setFormData] = useState<{name: string; phoneNumber: string; responsable: string}>({
    name: '',
    phoneNumber: '',
    responsable: '',
  });
  const [searchError, setSearchError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    nombre: true,
    direccion: true,
    telefono: true,
    responsable: true,
    activo: true,
    fechaAnadido: true,
    fechaEliminado: true,
    totalReclamado: true,
    acciones: true,
  });

  // Column width state
  const [columnWidths, setColumnWidths] = useState({
    nombre: 150,
    direccion: 130,
    telefono: 120,
    responsable: 120,
    activo: 80,
    fechaAnadido: 120,
    fechaEliminado: 120,
    totalReclamado: 150,
    acciones: 40,
  });

  // Resize state
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const handleResizeStart = (e: React.MouseEvent, column: keyof typeof columnWidths) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(column);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[column]);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingColumn) return;
    const diff = e.clientX - resizeStartX;
    const newWidth = Math.max(40, resizeStartWidth + diff);
    setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }));
  };

  const handleResizeEnd = () => {
    setResizingColumn(null);
  };

  // Add global event listeners for resize
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove as any);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove as any);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingColumn]);

  const { data: selectedBeneficiary } = useBeneficiary(selectedAddress || '');
  const updateBeneficiary = useUpdateBeneficiary();
  const createBeneficiary = useCreateBeneficiary();

  const sdk = getBuiltGraphSDK();
  const result_beneficiaries = useQuery({ queryKey: ['Beneficiaries'], queryFn: () => sdk.Beneficiaries() });
  const { data: data_beneficiaries } = result_beneficiaries;

  // Fetch beneficiary names from API
  const { data: beneficiariesData } = useBeneficiaries();

  // Create a lookup map for beneficiary data by address
  const beneficiaryLookup = useMemo(() => {
    if (!beneficiariesData) return new Map();
    return new Map(beneficiariesData.map(b => [b.address.toLowerCase(), b]));
  }, [beneficiariesData]);

  // Fetch all DailyClaims (up to 1000 for safety)
  const result_dailyClaims = useQuery({ queryKey: ['AllDailyClaims'], queryFn: () => sdk.DailyClaims() });
  const { data: data_dailyClaims } = result_dailyClaims;

  // Calculate most common claim interval in days
  const mostCommonInterval = useMemo(() => {
    if (!data_dailyClaims?.dailyClaims) return null;
    const beneficiaryClaims: Record<string, number[]> = {};
    for (const dailyClaim of data_dailyClaims.dailyClaims) {
      if (!dailyClaim.beneficiaries) continue;
      for (const beneficiary of dailyClaim.beneficiaries) {
        if (!beneficiaryClaims[beneficiary]) beneficiaryClaims[beneficiary] = [];
        beneficiaryClaims[beneficiary].push(Number(dailyClaim.date));
      }
    }
    const intervals: number[] = [];
    for (const dates of Object.values(beneficiaryClaims)) {
      if (dates.length < 2) continue;
      dates.sort((a, b) => a - b);
      const interval = Math.round((dates[dates.length - 1] - dates[0]) / (dates.length - 1) / 86400);
      if (interval > 0) intervals.push(interval);
    }
    if (intervals.length === 0) return null;
    const freq: Record<number, number> = {};
    for (const interval of intervals) {
      freq[interval] = (freq[interval] || 0) + 1;
    }
    return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
  }, [data_dailyClaims?.dailyClaims]);

  const sortedBeneficiaries = useMemo(() => {
    if (!data_beneficiaries?.beneficiaries) return [];
    const sorted = [...data_beneficiaries.beneficiaries];
    if (sortConfig !== null) {
      sorted.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'totalClaimed') {
          aVal = BigInt(aVal || 0);
          bVal = BigInt(bVal || 0);
        }
        if (aVal === bVal) return 0;
        if (sortConfig.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    return sorted;
  }, [data_beneficiaries?.beneficiaries, sortConfig]);

  const filteredBeneficiaries = useMemo(() => {
    if (!sortedBeneficiaries) return [];
    
    return sortedBeneficiaries.filter(beneficiary => {
      // Search filter
      if (searchQuery && !beneficiary.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all') {
        const isActive = beneficiary.isActive;
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'inactive' && isActive) return false;
      }
      
      // Date range filter
      if (dateRange.from || dateRange.to) {
        const addedDate = new Date(beneficiary.dateAdded * 1000);
        if (dateRange.from && addedDate < dateRange.from) return false;
        if (dateRange.to && addedDate > dateRange.to) return false;
      }
      
      // Filtro de umbral de monto reclamado
      if (amountThreshold !== '') {
        const claimed = Number(formatUnits(beneficiary.totalClaimed, 18));
        const threshold = Number(amountThreshold);
        if (amountComparison === 'gt' && !(claimed > threshold)) return false;
        if (amountComparison === 'lt' && !(claimed < threshold)) return false;
      }
      
      return true;
    });
  }, [sortedBeneficiaries, searchQuery, statusFilter, dateRange, amountThreshold, amountComparison]);

  const requestSort = (key: beneficiary_fields) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig?.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  }

  const SortIcon = () => {
    return <ArrowUpDown className='inline ml-1 w-4 h-4 relative top-[0.5px]'/>
  };

  const handleSearch = () => {
    setSearchError('');

    if (!searchAddress.trim()) {
      setSearchError('Por favor ingresa una dirección');
      return;
    }

    if (!isAddress(searchAddress)) {
      setSearchError('Dirección inválida');
      return;
    }

    const normalizedAddress = searchAddress.toLowerCase();
    const beneficiary = beneficiariesData?.find(
      (b) => b.address.toLowerCase() === normalizedAddress
    );

    if (!beneficiary) {
      setSearchError('Beneficiario no encontrado');
      setSelectedAddress(null);
      return;
    }

    setSelectedAddress(beneficiary.address);
    setFormData({
      name: beneficiary.name,
      phoneNumber: beneficiary.phoneNumber || '',
      responsable: beneficiary.responsable || '',
    });
  };

  const handleUpdate = async () => {
    const addressToUpdate = dialogAddress || selectedAddress;
    if (!addressToUpdate || !formData.name.trim()) return;

    try {
      // Check if beneficiary exists in database
      const beneficiaryExists = beneficiaryLookup.has(addressToUpdate.toLowerCase());

      if (beneficiaryExists) {
        // Update existing beneficiary
        await updateBeneficiary.mutateAsync({
          address: addressToUpdate,
          name: formData.name,
          phoneNumber: formData.phoneNumber || null,
          responsable: formData.responsable || null,
        });
        toast({ title: '✓ Beneficiario actualizado exitosamente' });
      } else {
        // Create new beneficiary record
        await createBeneficiary.mutateAsync({
          address: addressToUpdate,
          name: formData.name,
          phoneNumber: formData.phoneNumber || undefined,
          responsable: formData.responsable || undefined,
        });
        toast({ title: '✓ Información del beneficiario agregada exitosamente' });
      }

      // Clear form and close dialog after successful update/create
      setSearchAddress('');
      setSelectedAddress(null);
      setDialogAddress(null);
      setFormData({ name: '', phoneNumber: '', responsable: '' });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating beneficiary:', error);
      toast({ title: 'Error al guardar la información del beneficiario', variant: 'destructive' });
    }
  };

  const handleCancel = () => {
    setSearchAddress('');
    setSelectedAddress(null);
    setDialogAddress(null);
    setFormData({ name: '', phoneNumber: '', responsable: '' });
    setSearchError('');
    setIsDialogOpen(false);
  };

  const handleRowClick = (address: string) => {
    const beneficiary = beneficiaryLookup.get(address.toLowerCase());

    // Always open dialog, even if no database info exists
    setDialogAddress(address);
    setFormData({
      name: beneficiary?.name || '',
      phoneNumber: beneficiary?.phoneNumber || '',
      responsable: beneficiary?.responsable || '',
    });
    setIsDialogOpen(true);
  };

  return (
    <div className='flex flex-col items-center justify-center max-w-[90vw] overflow-auto'>
      <Card className="w-full bg-white shadow-md rounded-xl border border-gray-200 p-0">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b p-6 mb-4">
          <div>
            <CardTitle className="text-lg md:text-xl font-bold text-gray-800">Beneficiarios</CardTitle>
            <CardDescription className="text-sm text-gray-500">Consulta el listado de beneficiarios, su estado y estadísticas de participación.</CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'resumen' | 'tabla')}>
            <TabsList className="bg-gray-100 rounded-xl p-1">
              <TabsTrigger value="resumen" className="tab-button data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-200 data-[state=inactive]:text-gray-700 rounded-lg transition-colors px-4">Resumen</TabsTrigger>
              <TabsTrigger value="tabla" className="tab-button data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-200 data-[state=inactive]:text-gray-700 rounded-lg transition-colors px-4">Tabla</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="md:min-w-[650px] w-full">
            {activeTab === 'resumen' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-0 w-full mb-4 py-6">
                  <div className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 h-full flex flex-col justify-center items-center">
                    <p className="text-gray-500">Beneficiarios activos</p>
                    <p className="font-bold text-lg text-gray-800">
                      {sortedBeneficiaries.filter(b => b.isActive).length}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 h-full flex flex-col justify-center items-center">
                    <p className="text-gray-500">Promedio reclamado por beneficiario</p>
                    <p className="font-bold text-lg text-gray-800">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(
                        sortedBeneficiaries.length > 0
                          ? sortedBeneficiaries.reduce((acc, b) => acc + Number(formatUnits(b.totalClaimed, 18)), 0) / sortedBeneficiaries.length
                          : 0
                      )}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 h-full flex flex-col justify-center items-center">
                    <p className="text-gray-500 mb-1 font-medium">Intervalo de reclamo más común</p>
                    <p className="font-bold text-lg text-gray-800">
                      {mostCommonInterval !== null ? `${mostCommonInterval} días` : 'Cargando...'}
                    </p>
                  </div>
                </div>
                {/* Leaderboard */}
                <div className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 w-full">
                  <p className="text-gray-500 mb-2 font-medium">Top 5 beneficiarios por monto reclamado</p>
                  <ol className="space-y-1">
                    {sortedBeneficiaries
                      .slice()
                      .sort((a, b) => Number(BigInt(b.totalClaimed) - BigInt(a.totalClaimed)))
                      .slice(0, 5)
                      .map((b) => {
                        const beneficiaryData = beneficiaryLookup.get(b.id.toLowerCase());
                        return (
                          <li key={b.id} className="flex justify-between items-center text-gray-800">
                            <span
                              className="text-sm cursor-pointer hover:underline"
                              onClick={() => {
                                navigator.clipboard.writeText(b.id);
                                toast({ title: 'Dirección copiada al portapapeles' });
                              }}
                            >
                              {beneficiaryData?.name || `${String(b.id).slice(0, 7)}...${String(b.id).slice(-5)}`}
                            </span>
                            <span className="font-bold text-sm">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(formatUnits(b.totalClaimed, 18)))}</span>
                          </li>
                        );
                      })}
                  </ol>
                </div>
              </>
            )}
            {activeTab === 'tabla' && (
              <div className="w-full">
                <div className="flex flex-col md:flex-row gap-2 mb-4 w-full">
                  <div className="relative w-full md:w-[240px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar por dirección..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 text-gray-900"
                    />
                  </div>
                  <div className="w-full md:w-[120px]">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Activos</SelectItem>
                        <SelectItem value="inactive">Inactivos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-auto">
                    <DatePicker
                      date={dateRange.from}
                      onSelect={(date: Date | undefined) => setDateRange(prev => ({ ...prev, from: date }))}
                      placeholder="Desde"
                      disabled={{ after: new Date() }}
                      className="w-full"
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <DatePicker
                      date={dateRange.to}
                      onSelect={(date: Date | undefined) => setDateRange(prev => ({ ...prev, to: date }))}
                      placeholder="Hasta"
                      disabled={{ after: new Date() }}
                      className="w-full"
                    />
                  </div>
                  {/* Filtro de umbral de monto reclamado */}
                  <div className="flex w-full md:w-auto gap-2 items-center">
                    <Select value={amountComparison} onValueChange={v => setAmountComparison(v as 'gt' | 'lt')}>
                      <SelectTrigger className="w-full md:w-[110px]">
                        <SelectValue>{amountComparison === 'gt' ? 'Más de' : 'Menos de'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gt">Más de</SelectItem>
                        <SelectItem value="lt">Menos de</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative w-full md:w-[140px]">
                      <Input
                        type="number"
                        min="0"
                        step="10000"
                        placeholder="Monto en COP"
                        value={amountThreshold}
                        onChange={e => setAmountThreshold(e.target.value)}
                        className="w-full text-gray-900"
                      />
                    </div>
                  </div>
                  {/* Column visibility toggle */}
                  <Select value="columns" onValueChange={() => {}}>
                    <SelectTrigger className="w-full md:w-[140px]">
                      <Settings2 className="h-4 w-4 mr-2" />
                      <SelectValue>Columnas</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 space-y-2">
                        {[
                          { key: 'nombre' as const, label: 'Nombre' },
                          { key: 'direccion' as const, label: 'Dirección' },
                          { key: 'telefono' as const, label: 'Teléfono' },
                          { key: 'responsable' as const, label: 'Responsable' },
                          { key: 'activo' as const, label: 'Activo' },
                          { key: 'fechaAnadido' as const, label: 'Fecha añadido' },
                          { key: 'fechaEliminado' as const, label: 'Fecha eliminado' },
                          { key: 'totalReclamado' as const, label: 'Total reclamado' },
                          { key: 'acciones' as const, label: 'Acciones' },
                        ].map(col => (
                          <div key={col.key} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded" onClick={() => toggleColumn(col.key)}>
                            <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center bg-white">
                              {visibleColumns[col.key] && <Check className="h-3 w-3 text-cyan-600" />}
                            </div>
                            <span className="text-sm text-gray-700">{col.label}</span>
                          </div>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 w-full overflow-x-auto overflow-y-auto max-h-[65vh]">
                  <Table className="w-full min-w-[1000px]">
                    <TableHeader className='sticky top-0 bg-white rounded-t-xl z-10'>
                      <TableRow className='border-b border-gray-200'>
                        {visibleColumns.acciones && (
                          <TableHead className='relative' style={{ width: `${columnWidths.acciones}px` }}>
                            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-400 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'acciones')} />
                          </TableHead>
                        )}
                        {visibleColumns.nombre && (
                          <TableHead className='font-bold relative' style={{ width: `${columnWidths.nombre}px` }}>
                            Nombre
                            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-400 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'nombre')} />
                          </TableHead>
                        )}
                        {visibleColumns.direccion && (
                          <TableHead onClick={() => requestSort('id')} className='font-bold cursor-pointer relative' style={{ width: `${columnWidths.direccion}px` }}>
                            Dirección { SortIcon() }
                            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-400 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'direccion')} />
                          </TableHead>
                        )}
                        {visibleColumns.telefono && (
                          <TableHead className='font-bold relative' style={{ width: `${columnWidths.telefono}px` }}>
                            Teléfono
                            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-400 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'telefono')} />
                          </TableHead>
                        )}
                        {visibleColumns.responsable && (
                          <TableHead className='font-bold relative' style={{ width: `${columnWidths.responsable}px` }}>
                            Responsable
                            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-400 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'responsable')} />
                          </TableHead>
                        )}
                        {visibleColumns.activo && (
                          <TableHead onClick={() => requestSort('isActive')} className='font-bold cursor-pointer relative' style={{ width: `${columnWidths.activo}px` }}>
                            Activo { SortIcon() }
                            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-400 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'activo')} />
                          </TableHead>
                        )}
                        {visibleColumns.fechaAnadido && (
                          <TableHead onClick={() => requestSort('dateAdded')} className='font-bold cursor-pointer relative' style={{ width: `${columnWidths.fechaAnadido}px` }}>
                            Fecha añadido { SortIcon() }
                            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-400 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'fechaAnadido')} />
                          </TableHead>
                        )}
                        {visibleColumns.fechaEliminado && (
                          <TableHead onClick={() => requestSort('dateRemoved')} className='font-bold cursor-pointer relative' style={{ width: `${columnWidths.fechaEliminado}px` }}>
                            Fecha eliminado { SortIcon() }
                            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-400 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'fechaEliminado')} />
                          </TableHead>
                        )}
                        {visibleColumns.totalReclamado && (
                          <TableHead onClick={() => requestSort('totalClaimed')} className='text-right font-bold cursor-pointer relative' style={{ width: `${columnWidths.totalReclamado}px` }}>
                            Total Reclamado { SortIcon() }
                            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-400 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'totalReclamado')} />
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody className='text-left'>
                      {filteredBeneficiaries.map((beneficiary) => {
                        const beneficiaryData = beneficiaryLookup.get(beneficiary.id.toLowerCase());
                        return (
                          <TableRow key={beneficiary.id} className='hover:bg-gray-50 transition-colors'>
                            {visibleColumns.acciones && (
                              <TableCell className='whitespace-nowrap p-1' style={{ width: `${columnWidths.acciones}px` }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRowClick(beneficiary.id)}
                                  className="h-6 w-6 p-0 hover:bg-cyan-100 transition-colors"
                                >
                                  <Edit className="h-3 w-3 text-gray-600" />
                                </Button>
                              </TableCell>
                            )}
                            {visibleColumns.nombre && (
                              <TableCell
                                className='font-medium whitespace-nowrap cursor-pointer hover:text-cyan-600 transition-colors'
                                onClick={() => handleRowClick(beneficiary.id)}
                                style={{ width: `${columnWidths.nombre}px` }}
                              >
                                {beneficiaryData?.name || '-'}
                              </TableCell>
                            )}
                            {visibleColumns.direccion && (
                              <TableCell className='cursor-pointer whitespace-nowrap hover:text-cyan-600 transition-colors' onClick={() => {
                                navigator.clipboard.writeText(beneficiary.id);
                                toast({ title: 'Dirección copiada al portapapeles'})
                              }} style={{ width: `${columnWidths.direccion}px` }}>
                                {String(beneficiary.id).slice(0, 7)}...{String(beneficiary.id).slice(-5)}
                              </TableCell>
                            )}
                            {visibleColumns.telefono && (
                              <TableCell className='whitespace-nowrap' style={{ width: `${columnWidths.telefono}px` }}>
                                {beneficiaryData?.phoneNumber || '-'}
                              </TableCell>
                            )}
                            {visibleColumns.responsable && (
                              <TableCell className='whitespace-nowrap' style={{ width: `${columnWidths.responsable}px` }}>
                                {beneficiaryData?.responsable || '-'}
                              </TableCell>
                            )}
                            {visibleColumns.activo && (
                              <TableCell className='whitespace-nowrap' style={{ width: `${columnWidths.activo}px` }}>{beneficiary.isActive ? "Sí" : "No"}</TableCell>
                            )}
                            {visibleColumns.fechaAnadido && (
                              <TableCell className='whitespace-nowrap' style={{ width: `${columnWidths.fechaAnadido}px` }}>{(new Date(beneficiary.dateAdded * 1000)).toLocaleDateString()}</TableCell>
                            )}
                            {visibleColumns.fechaEliminado && (
                              <TableCell className='whitespace-nowrap' style={{ width: `${columnWidths.fechaEliminado}px` }}>{beneficiary.dateRemoved ?
                                (new Date(beneficiary.dateRemoved*1000)).toLocaleDateString()
                              : "-"}</TableCell>
                            )}
                            {visibleColumns.totalReclamado && (
                              <TableCell className='text-right whitespace-nowrap' style={{ width: `${columnWidths.totalReclamado}px` }}>{new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                              }).format(Number(formatUnits(beneficiary.totalClaimed, 18)))}</TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Beneficiary Management Section */}
      <div className="mt-6 w-full space-y-4">
        <Card className="w-full bg-white shadow-md rounded-xl border border-gray-200">
          <CardHeader className="border-b p-6">
            <CardTitle className="text-lg md:text-xl font-bold text-gray-800">Buscar Beneficiario</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Ingresa la dirección del beneficiario para buscar y actualizar su información
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="0x..."
                  value={searchAddress}
                  onChange={(e) => {
                    setSearchAddress(e.target.value);
                    setSearchError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="text-gray-900 border-gray-300"
                />
                {searchError && (
                  <p className="text-sm text-red-500 mt-1">{searchError}</p>
                )}
              </div>
              <Button onClick={handleSearch} disabled={!searchAddress.trim()} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedAddress && selectedBeneficiary && (
          <Card className="w-full bg-white shadow-md rounded-xl border border-gray-200">
            <CardHeader className="border-b p-6">
              <CardTitle className="text-lg md:text-xl font-bold text-gray-800">Editar Beneficiario</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Dirección: {selectedAddress}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nombre completo"
                    className="mt-1 text-gray-900 border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Teléfono</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="Número de teléfono"
                    className="mt-1 text-gray-900 border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="responsable" className="text-sm font-medium text-gray-700">Responsable</Label>
                  <Input
                    id="responsable"
                    value={formData.responsable}
                    onChange={(e) =>
                      setFormData({ ...formData, responsable: e.target.value })
                    }
                    placeholder="Nombre del responsable"
                    className="mt-1 text-gray-900 border-gray-300"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleUpdate}
                    disabled={updateBeneficiary.isPending || !formData.name.trim()}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateBeneficiary.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={updateBeneficiary.isPending}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Editar Beneficiario</DialogTitle>
            <DialogDescription className="text-gray-600">
              {dialogAddress && `Dirección: ${dialogAddress}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dialog-name" className="text-sm font-medium text-gray-700">Nombre</Label>
              <Input
                id="dialog-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre completo"
                className="mt-1 text-gray-900 border-gray-300"
              />
            </div>

            <div>
              <Label htmlFor="dialog-phoneNumber" className="text-sm font-medium text-gray-700">Teléfono</Label>
              <Input
                id="dialog-phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="Número de teléfono"
                className="mt-1 text-gray-900 border-gray-300"
              />
            </div>

            <div>
              <Label htmlFor="dialog-responsable" className="text-sm font-medium text-gray-700">Responsable</Label>
              <Input
                id="dialog-responsable"
                value={formData.responsable}
                onChange={(e) =>
                  setFormData({ ...formData, responsable: e.target.value })
                }
                placeholder="Nombre del responsable"
                className="mt-1 text-gray-900 border-gray-300"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleUpdate}
                disabled={updateBeneficiary.isPending || !formData.name.trim()}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateBeneficiary.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={updateBeneficiary.isPending}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BeneficiariesPanel; 