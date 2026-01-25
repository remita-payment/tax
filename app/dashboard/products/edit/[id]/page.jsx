"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Plus, Trash2, Calendar, User, Phone, Mail, MapPin, FileText, Banknote, ShieldCheck, DollarSign } from "lucide-react"; // ADDED: DollarSign
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getTaxpayerById, updateTaxpayer } from "@/actions/tax";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditTaxpayerPage({ params }) {
  // Fix: Await params before destructuring
  const { id } = React.use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [taxpayerData, setTaxpayerData] = useState(null);
  const [totalIncomeEntries, setTotalIncomeEntries] = useState([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
  const [currentIncome, setCurrentIncome] = useState(""); // ADDED: income state
  const [currentTaxPaid, setCurrentTaxPaid] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Add total income entry - UPDATED to include income
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
      toast.error(`Income data for year ${year} already exists`);
      return;
    }

    const newEntry = { year, income, taxPaid }; // UPDATED: added income field
    const updatedEntries = [...totalIncomeEntries, newEntry].sort((a, b) => b.year - a.year);
    
    setTotalIncomeEntries(updatedEntries);
    
    setCurrentYear(new Date().getFullYear().toString());
    setCurrentIncome(""); // RESET: income field
    setCurrentTaxPaid("");
    
    toast.success(`Added income data for ${year}`);
  };

  // Remove total income entry
  const removeTotalIncomeEntry = (index) => {
    const updatedEntries = totalIncomeEntries.filter((_, i) => i !== index);
    setTotalIncomeEntries(updatedEntries);
    toast.success("Income data removed");
  };

  // Format TIN input
  const handleTINChange = (e, onChange) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 13);
    onChange(value);
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

  // Fix: Safely process totalIncome data to remove Mongoose objects - UPDATED to include income
  const processTotalIncomeData = (incomeData) => {
    if (!incomeData || !Array.isArray(incomeData)) return [];
    
    return incomeData.map(item => {
      // Create a plain object, removing any Mongoose-specific properties
      const plainItem = {
        year: Number(item.year) || 0,
        income: Number(item.income) || 0, // ADDED: income field
        taxPaid: Number(item.taxPaid) || 0
      };
      
      // Remove any non-serializable properties
      Object.keys(plainItem).forEach(key => {
        if (typeof plainItem[key] === 'object' && plainItem[key] !== null) {
          // Handle Buffer objects or other non-serializable objects
          if (Buffer.isBuffer(plainItem[key])) {
            plainItem[key] = plainItem[key].toString('hex');
          } else if (plainItem[key].toJSON) {
            // Remove objects with toJSON methods
            delete plainItem[key];
          }
        }
      });
      
      return plainItem;
    }).filter(item => item.year > 0 && (item.income > 0 || item.taxPaid > 0)); // UPDATED filter
  };

  // Fetch taxpayer data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching taxpayer data for ID:", id);
        const result = await getTaxpayerById(id);

        console.log("Taxpayer response:", result);

        if (result.success && result.data) {
          // Create a plain object from the data, removing any Mongoose-specific properties
          const plainData = { ...result.data };
          
          // Process totalIncome data to remove Mongoose objects
          const processedTotalIncome = processTotalIncomeData(result.data.totalIncome);
          
          setTaxpayerData(plainData);
          
          // Set total income entries with processed data
          if (processedTotalIncome.length > 0) {
            setTotalIncomeEntries(processedTotalIncome.sort((a, b) => b.year - a.year));
          }

          // Set all form values
          form.reset({
            name: plainData.name || "",
            tin: plainData.tin || "",
            certificateNo: plainData.certificateNo || "",
            phoneNo: plainData.phoneNo || "",
            email: plainData.email || "",
            amount: plainData.amount || 0,
            sourceOfIncome: plainData.sourceOfIncome || "",
            address: plainData.address || "",
            revenue: plainData.revenue || "Presumptive Tax",
            platform: plainData.platform || "REMITA",
            paymentDetails: plainData.paymentDetails || "Presumptive Tax",
            reference: plainData.reference || "",
            idBatch: plainData.idBatch || "",
          });

          console.log("Form reset completed successfully");
        } else {
          toast.error(result.message || "Failed to load taxpayer data");
          router.push("/dashboard/products");
        }
      } catch (error) {
        console.error("Failed to load taxpayer data:", error);
        toast.error("Failed to load taxpayer data");
        router.push("/dashboard/products");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id, form, router]);

 const onSubmit = async (data) => {
  console.log("=== FORM SUBMISSION STARTED ===");
  console.log("Form data received:", data);
  setIsSubmittingForm(true);

  try {
    // Validate required fields
    const requiredFields = ['name', 'tin', 'certificateNo', 'phoneNo', 'email', 'sourceOfIncome', 'address'];
    const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setIsSubmittingForm(false);
      return;
    }

    // Validate Nigerian phone number
    if (!/^(0[7-9][01]\d{8})$/.test(data.phoneNo)) {
      toast.error("Please enter a valid Nigerian phone number starting with 07, 08, or 09");
      setIsSubmittingForm(false);
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast.error("Please enter a valid email address");
      setIsSubmittingForm(false);
      return;
    }

    // Validate amount
    if (data.amount <= 0) {
      toast.error("Amount must be greater than 0");
      setIsSubmittingForm(false);
      return;
    }

    // Validate totalIncome entries - UPDATED to include income validation
    const invalidYears = totalIncomeEntries.filter(entry => 
      entry.year < 2000 || entry.year > new Date().getFullYear()
    );
    if (invalidYears.length > 0) {
      toast.error(`Invalid years found: ${invalidYears.map(e => e.year).join(', ')}. Years must be between 2000 and current year.`);
      setIsSubmittingForm(false);
      return;
    }

    const negativeIncome = totalIncomeEntries.filter(entry => entry.income < 0); // ADDED: validate income
    if (negativeIncome.length > 0) {
      toast.error(`Income cannot be negative for years: ${negativeIncome.map(e => e.year).join(', ')}`);
      setIsSubmittingForm(false);
      return;
    }

    const negativeTax = totalIncomeEntries.filter(entry => entry.taxPaid < 0);
    if (negativeTax.length > 0) {
      toast.error(`Tax paid cannot be negative for years: ${negativeTax.map(e => e.year).join(', ')}`);
      setIsSubmittingForm(false);
      return;
    }

    const taxpayerData = {
      ...data,
      amount: Number(data.amount),
      totalIncome: totalIncomeEntries,
      // Don't send dates - let the server handle them
      // Remove date fields to avoid overriding existing dates
    };

    // Remove any undefined or null fields
    Object.keys(taxpayerData).forEach(key => {
      if (taxpayerData[key] === undefined || taxpayerData[key] === null) {
        delete taxpayerData[key];
      }
    });

    console.log("Final taxpayer data being sent to API:", taxpayerData);

    const result = await updateTaxpayer(id, taxpayerData);
    console.log("API response:", result);

    if (result.success) {
      console.log("Taxpayer update successful");
      toast.success("Taxpayer updated successfully");
      router.push("/dashboard/records");
      router.refresh(); // Refresh the page to show updated data
    } else {
      console.log("Taxpayer update failed:", result);
      // Handle field errors from server action
      if (result.error && typeof result.error === "object") {
        Object.entries(result.error).forEach(([key, value]) => {
          if (value?._errors) {
            form.setError(key, {
              type: "server",
              message: value._errors.join(", "),
            });
          }
        });
      }
      toast.error(result.message || "Failed to update taxpayer");
    }
  } catch (error) {
    console.error("Submission error:", error);
    console.error("Error details:", error.message, error.stack);
    toast.error("An unexpected error occurred");
  } finally {
    setIsSubmittingForm(false);
    console.log("=== FORM SUBMISSION COMPLETED ===");
  }
};

  // Calculate totals - ADDED: total income calculation
  const totalIncome = totalIncomeEntries.reduce((sum, entry) => sum + entry.income, 0);
  const totalTaxPaid = totalIncomeEntries.reduce((sum, entry) => sum + entry.taxPaid, 0);

  // Skeleton Loading Component (remain the same)
  if (isLoading) {
    // ... keep the same skeleton loading component ...
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form Skeleton */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                  {/* Personal Information Section Skeleton */}
                  <div className="space-y-6">
                    <Skeleton className="h-6 w-40" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-11 w-full" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>

                  <Separator />

                  {/* Tax Information Section Skeleton */}
                  <div className="space-y-6">
                    <Skeleton className="h-6 w-40" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-11 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Generated Numbers Section Skeleton */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-11 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Income History Section Skeleton - UPDATED to 3 columns */}
                  <div className="space-y-6">
                    <Skeleton className="h-6 w-32" />
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Skeleton className="h-11" />
                        <Skeleton className="h-11" />
                        <Skeleton className="h-11" />
                      </div>
                      <Skeleton className="h-11 w-full" />
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Form Actions Skeleton */}
                  <div className="flex justify-between pt-6 border-t">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              {/* Certificate Details Skeleton */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Current Data Summary Skeleton */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Tips Skeleton */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Skeleton className="h-3 w-3 rounded-full mt-1.5" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!taxpayerData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-medium">Taxpayer not found</p>
          <Button onClick={() => router.push("/dashboard/records")} className="mt-4">
            Back to Records
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit Taxpayer Record</h1>
          <p className="text-muted-foreground mt-2">
            Update taxpayer information and income history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Section */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Edit Taxpayer Information
                </CardTitle>
                <CardDescription>
                  Update taxpayer details, contact information, and income records
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Personal Information Section (keep the same) */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="John Doe"
                          className="h-11"
                          {...form.register("name")}
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          TIN <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <ShieldCheck className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="1234567890123"
                            className="h-11 pl-10"
                           {...form.register("tin")}
                          />
                        </div>
                        {form.formState.errors.tin && (
                          <p className="text-sm text-red-500">{form.formState.errors.tin.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          Certificate No. <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="CERT-2024-001"
                          className="h-11"
                          {...form.register("certificateNo")}
                        />
                        {form.formState.errors.certificateNo && (
                          <p className="text-sm text-red-500">{form.formState.errors.certificateNo.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          Phone <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="08012345678"
                            className="h-11 pl-10"
                            value={form.watch("phoneNo")}
                            onChange={(e) => handlePhoneChange(e, (value) => form.setValue("phoneNo", value))}
                            maxLength={11}
                          />
                        </div>
                        {form.formState.errors.phoneNo && (
                          <p className="text-sm text-red-500">{form.formState.errors.phoneNo.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            className="h-11 pl-10"
                            {...form.register("email")}
                          />
                        </div>
                        {form.formState.errors.email && (
                          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Address <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Textarea
                          placeholder="Enter complete residential address"
                          className="min-h-[100px] pl-10"
                          {...form.register("address")}
                        />
                      </div>
                      {form.formState.errors.address && (
                        <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
                      )}
                    </div>
                  </section>

                  <Separator />

                  {/* Tax Information Section (keep the same) */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold">Tax Information</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Source of Income <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        placeholder="Describe the primary source of income"
                        className="min-h-[80px]"
                        {...form.register("sourceOfIncome")}
                      />
                      {form.formState.errors.sourceOfIncome && (
                        <p className="text-sm text-red-500">{form.formState.errors.sourceOfIncome.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          Amount (₦) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Banknote className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="h-11 pl-10"
                            {...form.register("amount", { valueAsNumber: true })}
                          />
                        </div>
                        {form.formState.errors.amount && (
                          <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Revenue Type</Label>
                        <Select
                          onValueChange={(value) => form.setValue("revenue", value)}
                          value={form.watch("revenue")}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select revenue type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Presumptive Tax">Presumptive Tax</SelectItem>
                            <SelectItem value="Personal Income Tax">Personal Income Tax</SelectItem>
                            <SelectItem value="Company Income Tax">Company Income Tax</SelectItem>
                            <SelectItem value="Value Added Tax">Value Added Tax</SelectItem>
                            <SelectItem value="Withholding Tax">Withholding Tax</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.revenue && (
                          <p className="text-sm text-red-500">{form.formState.errors.revenue.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Payment Platform</Label>
                        <Select
                          onValueChange={(value) => form.setValue("platform", value)}
                          value={form.watch("platform")}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="REMITA">REMITA</SelectItem>
                            <SelectItem value="Paystack">Paystack</SelectItem>
                            <SelectItem value="Flutterwave">Flutterwave</SelectItem>
                            <SelectItem value="Manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.platform && (
                          <p className="text-sm text-red-500">{form.formState.errors.platform.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Payment Details</Label>
                        <Select
                          onValueChange={(value) => form.setValue("paymentDetails", value)}
                          value={form.watch("paymentDetails")}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select payment details" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Presumptive Tax">Presumptive Tax</SelectItem>
                            <SelectItem value="Tax Assessment">Tax Assessment</SelectItem>
                            <SelectItem value="Tax Clearance">Tax Clearance</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.paymentDetails && (
                          <p className="text-sm text-red-500">{form.formState.errors.paymentDetails.message}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Generated Numbers Section (keep the same) */}
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
                        disabled={isGenerating || isSubmittingForm}
                        className="gap-2"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        {isGenerating ? "Generating..." : "Regenerate"}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Reference Number</Label>
                        <Input
                          placeholder="Will be generated automatically"
                          className="h-11 font-mono"
                          {...form.register("reference")}
                        />
                        <p className="text-xs text-muted-foreground">12-digit unique reference</p>
                        {form.formState.errors.reference && (
                          <p className="text-sm text-red-500">{form.formState.errors.reference.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>ID/Batch Number</Label>
                        <Input
                          placeholder="Will be generated automatically"
                          className="h-11 font-mono"
                          {...form.register("idBatch")}
                        />
                        <p className="text-xs text-muted-foreground">18-digit unique identifier</p>
                        {form.formState.errors.idBatch && (
                          <p className="text-sm text-red-500">{form.formState.errors.idBatch.message}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Total Income History Section - UPDATED to include income field */}
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
                        disabled={isSubmittingForm}
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
                                  disabled={isSubmittingForm}
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
                      disabled={isSubmittingForm}
                      className="gap-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingForm}
                      className="gap-2 px-8"
                    >
                      {isSubmittingForm ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Summary - UPDATED to include income data */}
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
                      {taxpayerData.issueDate?.formatted || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Expiry Date</span>
                    <Badge variant="outline" className="font-normal">
                      {taxpayerData.expiryDate?.formatted || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={taxpayerData.isExpired ? "destructive" : "success"} className="font-normal">
                      {taxpayerData.isExpired ? "Expired" : "Active"}
                    </Badge>
                  </div>
                  {!taxpayerData.isExpired && taxpayerData.daysUntilExpiry > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Days Until Expiry</span>
                      <Badge variant={taxpayerData.daysUntilExpiry <= 30 ? "warning" : "outline"} className="font-normal">
                        {taxpayerData.daysUntilExpiry} days
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Data Summary Card - UPDATED to include income data */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Current Data Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Income Years</span>
                    <span className="text-sm font-medium">{totalIncomeEntries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground text-green-700">Total Income</span>
                    <span className="text-sm font-medium text-green-700">₦{totalIncome.toLocaleString('en-NG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground text-blue-700">Total Tax Paid</span>
                    <span className="text-sm font-medium text-blue-700">₦{totalTaxPaid.toLocaleString('en-NG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Latest Year</span>
                    <span className="text-sm font-medium">
                      {totalIncomeEntries[0]?.year || 'N/A'}
                    </span>
                  </div>
                  {totalIncomeEntries.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Latest Income</span>
                        <span className="text-sm font-medium text-green-700">
                          ₦{totalIncomeEntries[0]?.income?.toLocaleString('en-NG') || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Latest Tax</span>
                        <span className="text-sm font-medium text-blue-700">
                          ₦{totalIncomeEntries[0]?.taxPaid?.toLocaleString('en-NG') || 'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Update Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5" />
                    TIN cannot be changed once set
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5" />
                    Certificate dates are auto-generated
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5" />
                    Regenerate reference numbers if needed
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5" />
                    Add both income and tax for each year
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}