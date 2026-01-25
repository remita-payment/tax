"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Calendar, User, CreditCard, Phone, Mail, MapPin, FileText, Banknote, ShieldCheck, RefreshCw, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createTaxpayer } from "@/actions/tax";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";

// Authentication Skeleton Component
const AuthSkeleton = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Skeleton */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                {/* Personal Info Section */}
                <div className="space-y-6">
                  <Skeleton className="h-6 w-40" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>

                {/* Tax Info Section */}
                <div className="space-y-6">
                  <Skeleton className="h-6 w-40" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function AddTaxpayerPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalIncomeEntries, setTotalIncomeEntries] = useState([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
  const [currentIncome, setCurrentIncome] = useState("");
  const [currentTaxPaid, setCurrentTaxPaid] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Show skeleton while checking authentication
  if (status === "loading") {
    return <AuthSkeleton />;
  }

  // Redirect if not authenticated
  if (!session || status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const form = useForm({
    defaultValues: {
      name: "",
      tin: "",
      certificateNo: "",
      phoneNo: "",
      email: "",
      amount: 0,
      sourceOfIncome: "",
      address: "",
      revenue: "Presumptive Tax",
      platform: "REMITA",
      paymentDetails: "Presumptive Tax",
      reference: "",
      idBatch: "",
    },
  });

  // Generate random numbers for reference and ID/Batch
  const generateRandomNumber = (length, startWithZero = false) => {
    const min = startWithZero ? 0 : 1;
    let number = '';
    for (let i = 0; i < length; i++) {
      if (i === 0 && !startWithZero) {
        number += Math.floor(Math.random() * 9) + 1; // 1-9
      } else {
        number += Math.floor(Math.random() * 10); // 0-9
      }
    }
    return number;
  };

  // Generate reference and ID/Batch numbers
  const generateNumbers = () => {
    setIsGenerating(true);
    try {
      const refNum = generateRandomNumber(12, false);
      const batchNum = generateRandomNumber(18, false);
      
      form.setValue("reference", refNum);
      form.setValue("idBatch", batchNum);
      
      toast.success("Reference and ID/Batch numbers generated!");
    } catch (error) {
      toast.error("Failed to generate numbers");
    } finally {
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

  // Add total income entry
  const addTotalIncomeEntry = () => {
    if (!currentYear || !currentIncome || !currentTaxPaid || 
        parseFloat(currentIncome) <= 0 || parseFloat(currentTaxPaid) <= 0) {
      toast.error("Please enter valid year, income, and tax amount");
      return;
    }

    const year = parseInt(currentYear);
    const income = parseFloat(currentIncome);
    const taxPaid = parseFloat(currentTaxPaid);

    if (year < 2000 || year > new Date().getFullYear()) {
      toast.error(`Year must be between 2000 and ${new Date().getFullYear()}`);
      return;
    }

    // Check if year already exists
    if (totalIncomeEntries.some(entry => entry.year === year)) {
      toast.error(`Tax data for year ${year} already exists`);
      return;
    }

    const newEntry = { year, income, taxPaid };
    const updatedEntries = [...totalIncomeEntries, newEntry].sort((a, b) => b.year - a.year);
    
    setTotalIncomeEntries(updatedEntries);
    
    setCurrentYear(new Date().getFullYear().toString());
    setCurrentIncome("");
    setCurrentTaxPaid("");
    
    toast.success(`Added income data for ${year}`);
  };

  // Remove total income entry
  const removeTotalIncomeEntry = (index) => {
    const updatedEntries = totalIncomeEntries.filter((_, i) => i !== index);
    setTotalIncomeEntries(updatedEntries);
    toast.success("Income data removed");
  };

  const onSubmit = async (data) => {
    console.log('Submitting taxpayer data:', data);
    setIsSubmitting(true);
    
    try {
      const taxpayerData = {
        ...data,
        amount: Number(data.amount),
        totalIncome: totalIncomeEntries,
      };

      const result = await createTaxpayer(taxpayerData);

      if (result?.success) {
        toast.success("Taxpayer created successfully!");
        router.push("/dashboard/products");
      } else {
        if (typeof result?.error === 'object') {
          Object.entries(result.error).forEach(([key, value]) => {
            if (value?._errors) {
              form.setError(key, {
                type: "server",
                message: value._errors.join(", "),
              });
            }
          });
          toast.error(result.message || "Failed to create taxpayer");
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format phone input
  const handlePhoneChange = (e, onChange) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = value;
    if (value.startsWith('234') && value.length > 3) {
      formatted = '0' + value.substring(3);
    }
    if (formatted.length > 11) {
      formatted = formatted.substring(0, 11);
    }
    onChange(formatted);
  };

  // Calculate totals
  const totalIncome = totalIncomeEntries.reduce((sum, entry) => sum + entry.income, 0);
  const totalTaxPaid = totalIncomeEntries.reduce((sum, entry) => sum + entry.taxPaid, 0);

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Register New Taxpayer</h1>
          <p className="text-muted-foreground mt-2">
            Complete the form below to register a new taxpayer in the system.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Section */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Taxpayer Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Personal Information Section */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Personal Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                Full Name <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Full Name"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                TIN <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <CreditCard className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    placeholder="1234567890123"
                                    className="h-11 pl-10"
                                    {...field} // Fixed: Added field spread operator
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Tax Identification Number
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phoneNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                Phone <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    placeholder="08012345678"
                                    className="h-11 pl-10"
                                    value={field.value}
                                    onChange={(e) => handlePhoneChange(e, field.onChange)}
                                    maxLength={11}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                Email <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    type="email"
                                    placeholder="email@example.com"
                                    className="h-11 pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              Address <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <Textarea
                                  placeholder="Enter complete residential address"
                                  className="min-h-[100px] pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </section>

                    <Separator />

                    {/* Tax Information Section */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold">Tax Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="certificateNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                Certificate No. <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="CERT-2024-001"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                Amount (₦) <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Banknote className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="h-11 pl-10"
                                    {...field}
                                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="revenue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Revenue Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select revenue type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Presumptive Tax">Presumptive Tax</SelectItem>
                                  <SelectItem value="Personal Income Tax">Personal Income Tax</SelectItem>
                                  <SelectItem value="Company Income Tax">Company Income Tax</SelectItem>
                                  <SelectItem value="Value Added Tax">Value Added Tax</SelectItem>
                                  <SelectItem value="Withholding Tax">Withholding Tax</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="platform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Platform</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select platform" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="REMITA">REMITA</SelectItem>
                                  <SelectItem value="Paystack">Paystack</SelectItem>
                                  <SelectItem value="Flutterwave">Flutterwave</SelectItem>
                                  <SelectItem value="Manual">Manual</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="sourceOfIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              Source of Income <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the primary source of income"
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </section>

                    <Separator />

                    {/* Generated Numbers Section */}
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-purple-600" />
                          <h3 className="text-lg font-semibold">System Generated Numbers</h3>
                        </div>
                        <Button
                          type="button"
                          onClick={generateNumbers}
                          variant="outline"
                          size="sm"
                          disabled={isGenerating || isSubmitting}
                          className="gap-2"
                        >
                          {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          {isGenerating ? "Generating..." : "Generate"}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="reference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reference Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Will be generated automatically"
                                  className="h-11 font-mono"
                                  {...field}
                                  readOnly
                                />
                              </FormControl>
                              <FormDescription>
                                12-digit unique reference
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="idBatch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID/Batch Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Will be generated automatically"
                                  className="h-11 font-mono"
                                  {...field}
                                  readOnly
                                />
                              </FormControl>
                              <FormDescription>
                                18-digit unique identifier
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </section>

                    <Separator />

                    {/* Total Income History Section */}
                    <section className="space-y-6">
                      <h3 className="text-lg font-semibold">Income History</h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <Input
                              type="number"
                              placeholder="Year (e.g., 2024)"
                              value={currentYear}
                              onChange={(e) => setCurrentYear(e.target.value)}
                              min="2000"
                              max={new Date().getFullYear()}
                              className="h-11"
                            />
                          </div>
                          <div>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Income (₦)"
                                value={currentIncome}
                                onChange={(e) => setCurrentIncome(e.target.value)}
                                className="h-11 pl-10"
                              />
                            </div>
                          </div>
                          <div>
                            <div className="relative">
                              <Banknote className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Tax Paid (₦)"
                                value={currentTaxPaid}
                                onChange={(e) => setCurrentTaxPaid(e.target.value)}
                                className="h-11 pl-10"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          type="button"
                          onClick={addTotalIncomeEntry}
                          variant="outline"
                          disabled={isSubmitting}
                          className="w-full h-11"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Income Record
                        </Button>
                        
                        {totalIncomeEntries.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Income History ({totalIncomeEntries.length} years)</span>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="font-medium bg-green-50 text-green-700 border-green-200">
                                  Income: ₦{totalIncome.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                </Badge>
                                <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
                                  Tax: ₦{totalTaxPaid.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {totalIncomeEntries.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                                  <div className="flex items-center gap-4">
                                    <Badge variant="secondary" className="font-mono">
                                      {entry.year}
                                    </Badge>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <DollarSign className="h-3 w-3 text-green-600" />
                                        <span className="font-medium text-green-700">
                                          ₦{entry.income.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Banknote className="h-3 w-3 text-blue-600" />
                                        <span className="text-sm text-blue-700">
                                          Tax: ₦{entry.taxPaid.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTotalIncomeEntry(index)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    disabled={isSubmitting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Form Actions */}
                    <div className="flex justify-between pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/dashboard/products")}
                        disabled={isSubmitting}
                        className="gap-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="gap-2 px-8"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating Taxpayer...
                          </>
                        ) : (
                          <>
                            <User className="h-4 w-4" />
                            Create Taxpayer
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-6">
            {/* Certificate Details Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Calendar className="h-4 w-4" />
                  Certificate Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Issue Date</span>
                    <Badge variant="outline" className="font-normal">
                      {format(new Date(), 'dd MMM, yyyy')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Expiry Date</span>
                    <Badge variant="outline" className="font-normal">
                      {format(new Date(new Date().getFullYear(), 11, 31), 'dd MMM, yyyy')}
                    </Badge>
                  </div>
                </div>
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-blue-800">
                    Certificate automatically expires on December 31st each year.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Form Summary Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Form Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Required Fields</span>
                    <span className="text-sm font-medium">8/8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Income History</span>
                    <span className="text-sm font-medium">{totalIncomeEntries.length} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Income Recorded</span>
                    <span className="text-sm font-medium text-green-700">
                      ₦{totalIncome.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Tax Recorded</span>
                    <span className="text-sm font-medium text-blue-700">
                      ₦{totalTaxPaid.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Quick Tips</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5" />
                      TIN is optional (no validation)
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5" />
                      Use valid Nigerian phone number
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5" />
                      Generate reference numbers before submit
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5" />
                      Enter both income and tax paid for each year
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Default Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Revenue Type</span>
                    <Badge variant="secondary" className="font-normal">
                      Presumptive Tax
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Platform</span>
                    <Badge variant="secondary" className="font-normal">
                      REMITA
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Payment Details</span>
                    <Badge variant="secondary" className="font-normal">
                      Presumptive Tax
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}