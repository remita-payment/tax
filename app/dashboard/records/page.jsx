"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  AlertTriangle,
  CreditCard,
  Receipt, // Import Receipt icon for slip
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { getAllRecords } from "@/actions/tax";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function TaxpayersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [taxpayers, setTaxpayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const itemsPerPage = 10;

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Get page from URL
  useEffect(() => {
    const page = searchParams.get("page") || 1;
    setCurrentPage(Number(page));
  }, [searchParams]);

  // Fetch taxpayers - CORRECTED CALL
  useEffect(() => {
    const fetchTaxpayers = async () => {
      try {
        setLoading(true);
        const filters = {
          status: statusFilter !== "all" ? statusFilter : undefined,
        };

        // IMPORTANT: Call the function with correct parameters
        const result = await getAllRecords(
          currentPage, // page
          itemsPerPage, // limit
          debouncedSearchTerm, // search
          filters // filters
        );

        if (result.success) {
          setTaxpayers(result.data.records);
          setTotalPages(result.data.pagination.pages);
        } else {
          toast.error(result.message);
          setTaxpayers([]);
        }
      } catch (error) {
        console.error("Error fetching taxpayers:", error);
        toast.error("Failed to load taxpayer records");
        setTaxpayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxpayers();
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const getStatusBadge = (record) => {
    if (record.isExpired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expired
        </Badge>
      );
    } else if (record.daysUntilExpiry <= 30) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expiring Soon
        </Badge>
      );
    } else {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          Active
        </Badge>
      );
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    router.push(`/dashboard/taxpayers?page=${page}`);
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
    toast.success("Filters have been reset");
  };

  // Fixed skeleton rows
  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, rowIndex) => (
      <TableRow key={`skeleton-${rowIndex}`}>
        <TableCell>
          <Skeleton className="h-4 w-6" />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Badge variant="outline">
            <Skeleton className="h-4 w-20" />
          </Badge>
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-20 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <div className="flex gap-2 justify-end">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  // Handle slip generation/download
  const handleGenerateSlip = (record) => {
    window.open(`/slip/${record._id}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Taxpayers</h1>
          <p className="text-muted-foreground">
            Manage taxpayer records and compliance
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Taxpayer Records</CardTitle>
          <CardDescription>
            Search and filter taxpayer records. Click view to see detailed
            information.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, TIN, certificate number..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>

              {(statusFilter !== "all" || searchTerm) && (
                <Button variant="ghost" onClick={handleResetFilters}>
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  <TableHead>Taxpayer Name</TableHead>
                  <TableHead>TIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  renderSkeletonRows()
                ) : taxpayers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {searchTerm || statusFilter !== "all"
                        ? "No taxpayer records found matching your search criteria."
                        : "No taxpayer records found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  taxpayers.map((record, index) => (
                    <TableRow key={record._id || index}>
                      <TableCell className="font-mono text-sm">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {record.name
                                ?.split(" ")
                                .map((n) => n?.[0] || "")
                                .join("")
                                .toUpperCase() || "NA"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {record.name || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {record.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {record.tin || "N/A"}
                      </TableCell>
                      <TableCell>{getStatusBadge(record)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(record.issueDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(record.expiryDate)}</span>
                          {record.daysUntilExpiry > 0 && !record.isExpired && (
                            <span className="text-xs text-muted-foreground">
                              {record.daysUntilExpiry} days remaining
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Certificate Button */}
                          <Link
                            href={`/taxpayer/${record._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-1"
                            title="View Certificate"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only md:inline">
                              Certificate
                            </span>
                          </Link>
                          
                          {/* Receipt Button */}
                          <Link
                            href={`/receipt/${record._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-1"
                            title="View Receipt"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only md:inline">
                              Receipt
                            </span>
                          </Link>
                          
                          {/* NEW: Slip Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateSlip(record)}
                            className="h-8 px-3 gap-1 cursor-pointer"
                            title="Generate Slip"
                          >
                            <Receipt className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only md:inline">
                              Slip
                            </span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} • {taxpayers.length} records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map(
                    (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}