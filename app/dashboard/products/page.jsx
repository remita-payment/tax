"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Edit, MoreHorizontal, Plus, Search, Trash2, Filter, Calendar, User, FileText, CreditCard, Phone, Mail, Eye, DollarSign } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { PaginationControls } from "@/components/pagination-controls";
import { toast } from "sonner";
import { deleteTaxpayer, getAllTaxRecords } from "@/actions/tax";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function TaxRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    revenue: "all",
    platform: "all",
    year: "",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalTaxpayers: 0,
    avgAmount: 0,
    minAmount: 0,
    maxAmount: 0,
    totalAllIncome: 0,
    totalAllTax: 0,
    avgIncome: 0,
    avgTax: 0,
    revenueDistribution: [],
    platformDistribution: [],
    statusDistribution: [],
  });

  const itemsPerPage = 10;

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Fetch records when filters or pagination changes
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const result = await getAllTaxRecords(
        currentPage,
        itemsPerPage,
        debouncedSearchTerm,
        filters
      );

      if (result.success) {
        setRecords(result.data.records || []);
        setTotalPages(result.data.pagination?.pages || 1);
        setStats(result.data.summary || {
          totalAmount: 0,
          totalTaxpayers: 0,
          avgAmount: 0,
          minAmount: 0,
          maxAmount: 0,
          totalAllIncome: 0,
          totalAllTax: 0,
          avgIncome: 0,
          avgTax: 0,
          revenueDistribution: [],
          platformDistribution: [],
          statusDistribution: [],
        });
      } else {
        toast.error(result.message || "Failed to fetch tax records");
      }
    } catch (error) {
      toast.error("Error fetching tax records", {
        description: "There was an error loading the tax records.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentPage, debouncedSearchTerm, filters]);

  const handleDelete = async (id) => {
    const record = records.find((r) => r._id === id);
    if (!record) return;

    setActionInProgress(id);

    try {
      const result = await deleteTaxpayer(id);
      
      if (result.success) {
        // Remove the deleted record from UI
        setRecords((prev) => prev.filter((r) => r._id !== id));
        
        // Refresh the stats by refetching data
        await fetchRecords();
        
        toast.success(result.data?.message || `${record.name} has been deleted successfully.`);
      } else {
        toast.error(result.message || "Failed to delete taxpayer");
      }
    } catch (error) {
      toast.error("An unexpected error occurred while deleting the taxpayer");
    } finally {
      setActionInProgress(null);
      setRecordToDelete(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      revenue: "all",
      platform: "all",
      year: "",
      minAmount: "",
      maxAmount: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
    setShowFilters(false);
  };

  const getStatusBadge = (record) => {
    if (record.isExpired) {
      return <Badge variant="destructive" className="whitespace-nowrap">Expired</Badge>;
    }
    if (record.daysUntilExpiry <= 30) {
      return <Badge variant="warning" className="whitespace-nowrap">Expiring Soon</Badge>;
    }
    return <Badge variant="success" className="whitespace-nowrap">Active</Badge>;
  };

  const handleRefresh = () => {
    fetchRecords();
    toast.info("Records refreshed");
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Records</h1>
          <p className="text-muted-foreground mt-1">
            Manage taxpayer records, certificates, and tax payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Refresh
          </Button>
          <Button asChild className="gap-2">
            <Link href="/dashboard/products/add">
              <Plus className="h-4 w-4" /> Add New Taxpayer
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Summary - UPDATED to include income stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Taxpayers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTaxpayers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Active: {stats.statusDistribution.find(s => s._id === "active")?.count || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average: {formatCurrency(stats.avgAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(stats.totalAllIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(stats.avgIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(stats.totalAllTax)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(stats.avgTax)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Taxpayer Records</CardTitle>
              <CardDescription>
                View and manage all taxpayer records, certificates, and payments
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search taxpayers..."
                  className="pl-8 w-full md:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md p-6">
                  <SheetHeader>
                    <SheetTitle>Filter Records</SheetTitle>
                    <SheetDescription>
                      Filter taxpayer records by various criteria
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active Only</SelectItem>
                          <SelectItem value="expired">Expired Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Revenue Type</label>
                      <Select value={filters.revenue} onValueChange={(v) => handleFilterChange("revenue", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select revenue type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Revenue Types</SelectItem>
                          <SelectItem value="Presumptive Tax">Presumptive Tax</SelectItem>
                          <SelectItem value="Personal Income Tax">Personal Income Tax</SelectItem>
                          <SelectItem value="Company Income Tax">Company Income Tax</SelectItem>
                          <SelectItem value="Value Added Tax">Value Added Tax</SelectItem>
                          <SelectItem value="Withholding Tax">Withholding Tax</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Platform</label>
                      <Select value={filters.platform} onValueChange={(v) => handleFilterChange("platform", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Platforms</SelectItem>
                          <SelectItem value="REMITA">REMITA</SelectItem>
                          <SelectItem value="Paystack">Paystack</SelectItem>
                          <SelectItem value="Flutterwave">Flutterwave</SelectItem>
                          <SelectItem value="Manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Year</label>
                      <Input
                        type="number"
                        placeholder="e.g., 2024"
                        value={filters.year}
                        onChange={(e) => handleFilterChange("year", e.target.value)}
                        min="2000"
                        max={new Date().getFullYear()}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Min Amount</label>
                        <Input
                          type="number"
                          placeholder="Min ₦"
                          value={filters.minAmount}
                          onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Max Amount</label>
                          <Input
                            type="number"
                            placeholder="Max ₦"
                            value={filters.maxAmount}
                            onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={clearFilters} className="flex-1">
                          Clear Filters
                        </Button>
                        <Button onClick={() => setShowFilters(false)} className="flex-1">
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Quick Status Filter Tabs */}
            <div className="mb-4">
              <Tabs 
                value={filters.status} 
                onValueChange={(v) => handleFilterChange("status", v)}
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-3 md:inline-flex">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="expired">Expired</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S/N</TableHead>
                    <TableHead className="min-w-[180px]">Taxpayer</TableHead>
                    <TableHead className="hidden lg:table-cell">TIN</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden lg:table-cell">Income/Tax</TableHead>
                    <TableHead className="hidden md:table-cell">Revenue Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Expiry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <>
                      {[...Array(5)].map((_, index) => (
                        <TableRow
                          key={`loading-${index}`}
                          className="animate-pulse"
                        >
                          <TableCell>
                            <div className="h-4 bg-gray-200 rounded w-6"></div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-32"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="h-4 bg-gray-200 rounded w-28"></div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="space-y-1">
                              <div className="h-3 bg-gray-200 rounded w-20"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="space-y-1">
                              <div className="h-3 bg-gray-200 rounded w-20"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="h-8 bg-gray-200 rounded w-8 mx-auto"></div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <User className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {debouncedSearchTerm || Object.values(filters).some(v => v !== "all" && v !== "")
                              ? "No taxpayers match your filters."
                              : "No taxpayers found. Add your first taxpayer record."}
                          </p>
                          <Button asChild variant="outline" size="sm" className="mt-2">
                            <Link href="/dashboard/products/add">
                              <Plus className="mr-2 h-4 w-4" /> Add Taxpayer
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record, index) => (
                      <TableRow
                        key={record._id}
                        className={
                          actionInProgress === record._id ? "opacity-60" : ""
                        }
                      >
                        <TableCell className="font-medium">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium">{record.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {record.certificateNo}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell font-mono text-sm">
                          {record.tin}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              <span>{record.phoneNo}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{record.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {record.amountFormatted}
                          <div className="text-xs text-muted-foreground">
                            {record.totalIncome?.length || 0} year{record.totalIncome?.length !== 1 ? 's' : ''}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              <span className="text-sm font-medium text-green-700">
                                {record.totalIncomeFormatted}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-blue-700">
                                {record.totalTaxPaidFormatted}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{record.revenue}</Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record)}
                          {record.daysUntilExpiry > 0 && record.daysUntilExpiry <= 30 && (
                            <div className="text-xs text-amber-600 mt-1">
                              {record.daysUntilExpiry} days left
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">
                            {record.expiryDate ? format(new Date(record.expiryDate), 'dd MMM, yyyy') : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Issued: {record.issueDate ? format(new Date(record.issueDate), 'dd MMM, yyyy') : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={actionInProgress === record._id}
                              >
                                {actionInProgress === record._id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/products/edit/${record._id}`}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (actionInProgress === null) {
                                    setRecordToDelete(record._id);
                                  }
                                }}
                                disabled={actionInProgress !== null}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="mt-4"
            />
          </CardContent>
        </Card>

        <AlertDialog
          open={!!recordToDelete}
          onOpenChange={(open) => {
            if (!open) setRecordToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this taxpayer record? This action cannot
                be undone and will permanently remove all associated data including income and tax history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setRecordToDelete(null)}
                disabled={actionInProgress !== null}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (recordToDelete && actionInProgress === null) {
                    handleDelete(recordToDelete);
                  }
                }}
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={actionInProgress !== null}
              >
                {actionInProgress === recordToDelete ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }