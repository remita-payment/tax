"use server";

import { connectMongoose} from "@/lib/db";
import mongoose from "mongoose";
import Taxpayer from '@/model/Tax'
import { revalidatePath } from "next/cache";

export async function createTaxpayer(formData) {
  try {
    // Input validation
    if (!formData || typeof formData !== "object") {
      return {
        success: false,
        error: {
          _form: {
            _errors: ["Invalid form data"],
          },
        },
        message: "Invalid form data",
      };
    }

    // Helper function to generate random numbers
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

    // Safely format phone number
    const formatPhoneNumber = (phone) => {
      if (!phone || typeof phone !== 'string') return '';
      
      try {
        // Remove all whitespace first
        let formatted = phone.replace(/\s+/g, '');
        
        // If empty after removing whitespace, return empty
        if (!formatted) return '';
        
        // Convert +234 or 234 format to 0 format
        if (formatted.startsWith('+234') && formatted.length > 4) {
          formatted = '0' + formatted.substring(4);
        } else if (formatted.startsWith('234') && formatted.length > 3) {
          formatted = '0' + formatted.substring(3);
        }
        
        return formatted;
      } catch (error) {
        console.error("Error formatting phone number:", error);
        return phone; // Return original if formatting fails
      }
    };

    // Safely format expiry date
    const formatExpiryDate = (date) => {
      try {
        const inputDate = new Date(date);
        if (isNaN(inputDate.getTime())) {
          // If invalid date, return end of current year
          const year = new Date().getFullYear();
          return new Date(year, 11, 31);
        }
        const year = inputDate.getFullYear();
        return new Date(year, 11, 31); // December 31st
      } catch (error) {
        // Fallback to current year end
        const year = new Date().getFullYear();
        return new Date(year, 11, 31);
      }
    };

    // Prepare totalIncome array safely
    const prepareTotalIncome = (incomeData) => {
      if (!incomeData || !Array.isArray(incomeData)) {
        return [];
      }
      
      try {
        return incomeData
          .filter(item => item && typeof item === 'object')
          .map(item => ({
            year: Number(item.year) || 0,
            income: parseFloat(Number(item.income || 0).toFixed(2)),
            taxPaid: parseFloat(Number(item.taxPaid || 0).toFixed(2))
          }))
          .filter(item => item.year > 0 && (item.income > 0 || item.taxPaid > 0));
      } catch (error) {
        console.error("Error preparing total income:", error);
        return [];
      }
    };

    // Safely prepare data with proper type conversion
    const data = {
      name: (formData.name || '').toString().trim(),
      tin: (formData.tin || '').toString(),
      certificateNo: (formData.certificateNo || '').toString(),
      issueDate: formData.issueDate ? new Date(formData.issueDate) : new Date(),
      expiryDate: formatExpiryDate(formData.expiryDate || new Date()),
      phoneNo: formatPhoneNumber(formData.phoneNo || ''),
      email: (formData.email || '').toLowerCase().trim(),
      reference: formData.reference || generateRandomNumber(12, false),
      revenue: formData.revenue || 'Presumptive Tax',
      amount: parseFloat(formData.amount || 0),
      platform: formData.platform || 'REMITA',
      paymentDetails: formData.paymentDetails || 'Presumptive Tax',
      idBatch: formData.idBatch || generateRandomNumber(18, false),
      totalIncome: prepareTotalIncome(formData.totalIncome),
      sourceOfIncome: (formData.sourceOfIncome || '').trim(),
      address: (formData.address || '').trim(),
    };

    console.log("Processed data:", data);

    // Validation checks
    const errors = {};

    // Validate phone number (optional - remove if you don't want validation)
    if (data.phoneNo && !/^(0[7-9][01]\d{8})$/.test(data.phoneNo)) {
      errors.phoneNo = {
        _errors: ["Please enter a valid Nigerian phone number starting with 07, 08, or 09"]
      };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      errors.email = {
        _errors: ["Please enter a valid email address"]
      };
    }

    // Validate amount
    if (data.amount <= 0) {
      errors.amount = {
        _errors: ["Amount must be greater than 0"]
      };
    }

    // Validate totalIncome data
    data.totalIncome.forEach((item, index) => {
      const currentYear = new Date().getFullYear();
      if (item.year < 2000 || item.year > currentYear) {
        if (!errors[`totalIncome[${index}].year`]) {
          errors[`totalIncome[${index}].year`] = { _errors: [] };
        }
        errors[`totalIncome[${index}].year`]._errors.push(
          `Year must be between 2000 and ${currentYear}`
        );
      }
      if (item.income < 0) {
        if (!errors[`totalIncome[${index}].income`]) {
          errors[`totalIncome[${index}].income`] = { _errors: [] };
        }
        errors[`totalIncome[${index}].income`]._errors.push("Income cannot be negative");
      }
      if (item.taxPaid < 0) {
        if (!errors[`totalIncome[${index}].taxPaid`]) {
          errors[`totalIncome[${index}].taxPaid`] = { _errors: [] };
        }
        errors[`totalIncome[${index}].taxPaid`]._errors.push("Tax paid cannot be negative");
      }
    });

    // Check for required fields (adjust as needed)
    const requiredFields = [
      { field: 'name', label: 'Full Name' },
      { field: 'certificateNo', label: 'Certificate Number' },
      { field: 'phoneNo', label: 'Phone Number' },
      { field: 'email', label: 'Email' },
      { field: 'sourceOfIncome', label: 'Source of Income' },
      { field: 'address', label: 'Address' },
    ];
    
    requiredFields.forEach(({ field, label }) => {
      if (!data[field] || data[field].toString().trim() === '') {
        errors[field] = {
          _errors: [`${label} is required`]
        };
      }
    });

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
      return {
        success: false,
        error: errors,
        message: "Validation failed"
      };
    }

    // Connect to database (adjust based on your connection method)
    const client = await connectMongoose();

    // Check for duplicate certificate number
    const existingCertificate = await Taxpayer.findOne({ 
      certificateNo: data.certificateNo 
    }).lean();
    
    if (existingCertificate) {
      return {
        success: false,
        error: {
          certificateNo: {
            _errors: ["Certificate number already exists"]
          }
        },
        message: "Certificate number already exists"
      };
    }

    // Ensure unique reference number
    let reference = data.reference;
    let referenceExists = await Taxpayer.findOne({ reference }).lean();
    let referenceCounter = 1;

    while (referenceExists && referenceCounter <= 10) {
      reference = generateRandomNumber(12, false);
      referenceExists = await Taxpayer.findOne({ reference }).lean();
      referenceCounter++;
    }

    if (referenceCounter > 10) {
      return {
        success: false,
        error: {
          _form: {
            _errors: ["Failed to generate unique reference number after 10 attempts"]
          }
        },
        message: "Failed to generate unique reference number"
      };
    }

    // Ensure unique ID/Batch
    let idBatch = data.idBatch;
    let idBatchExists = await Taxpayer.findOne({ idBatch }).lean();
    let idBatchCounter = 1;

    while (idBatchExists && idBatchCounter <= 10) {
      idBatch = generateRandomNumber(18, false);
      idBatchExists = await Taxpayer.findOne({ idBatch }).lean();
      idBatchCounter++;
    }

    if (idBatchCounter > 10) {
      return {
        success: false,
        error: {
          _form: {
            _errors: ["Failed to generate unique ID/Batch number after 10 attempts"]
          }
        },
        message: "Failed to generate unique ID/Batch number"
      };
    }

    // Create taxpayer WITHOUT middleware triggers
    const newTaxpayer = new Taxpayer({
      ...data,
      reference,
      idBatch,
    });

    // Save directly without middleware
    await newTaxpayer.save({ validateBeforeSave: false });

    // Serialize the taxpayer
    const serializedTaxpayer = {
      ...newTaxpayer.toObject(),
      _id: newTaxpayer._id.toString(),
      id: newTaxpayer._id.toString(),
      issueDate: newTaxpayer.issueDate?.toISOString() || new Date().toISOString(),
      expiryDate: newTaxpayer.expiryDate?.toISOString() || new Date(new Date().getFullYear(), 11, 31).toISOString(),
      createdAt: newTaxpayer.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: newTaxpayer.updatedAt?.toISOString() || new Date().toISOString(),
      totalIncome: (newTaxpayer.totalIncome || []).map(item => ({
        year: item.year,
        income: item.income,
        taxPaid: item.taxPaid
      })),
    };

    // Remove any Mongoose-specific properties
    delete serializedTaxpayer.__v;
    delete serializedTaxpayer.$__;
    if (serializedTaxpayer._doc) delete serializedTaxpayer._doc;

    console.log("Taxpayer created successfully:", {
      taxpayerId: serializedTaxpayer._id,
      timestamp: new Date().toISOString()
    });

    // Revalidate paths
    revalidatePath("/dashboard/taxpayers");
    revalidatePath("/taxpayers");

    return {
      success: true,
      data: serializedTaxpayer,
    };
  } catch (error) {
    console.error("Create taxpayer error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = {
          _errors: [error.errors[key].message],
        };
      });

      return {
        success: false,
        error: errors,
        message: "Validation failed",
      };
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let fieldName = field;
      if (field === 'idBatch') fieldName = 'ID/Batch';
      if (field === 'tin') fieldName = 'TIN';
      if (field === 'certificateNo') fieldName = 'Certificate Number';
      
      return {
        success: false,
        error: {
          [field]: {
            _errors: [`${fieldName} already exists`],
          },
        },
        message: "Duplicate entry found",
      };
    }

    // Generic error
    return {
      success: false,
      error: {
        _form: {
          _errors: [error.message || "Failed to create taxpayer"],
        },
      },
      message: error.message || "Failed to create taxpayer",
    };
  }
}
export async function getAllTaxRecords(
  page = 1,
  limit = 10,
  search = "",
  filters = {}
) {
  // FIXED: Remove parentheses
  await connectMongoose();

  const skip = (page - 1) * limit;
  const query = {};

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { tin: { $regex: search, $options: "i" } },
      { certificateNo: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phoneNo: { $regex: search, $options: "i" } },
      { reference: { $regex: search, $options: "i" } },
      { idBatch: { $regex: search, $options: "i" } },
      { sourceOfIncome: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
    ];
  }

  // Apply filters
  if (filters) {
    // Revenue type filter
    if (filters.revenue && filters.revenue !== "all") {
      query.revenue = filters.revenue;
    }

    // Platform filter
    if (filters.platform && filters.platform !== "all") {
      query.platform = filters.platform;
    }

    // Status filter (active/expired)
    if (filters.status && filters.status !== "all") {
      const today = new Date();
      if (filters.status === "active") {
        query.expiryDate = { $gte: today };
      } else if (filters.status === "expired") {
        query.expiryDate = { $lt: today };
      }
    }

    // Amount range filter
    if (filters.minAmount || filters.maxAmount) {
      query.amount = {};
      if (filters.minAmount) {
        query.amount.$gte = parseFloat(filters.minAmount);
      }
      if (filters.maxAmount) {
        query.amount.$lte = parseFloat(filters.maxAmount);
      }
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // End of the day
        query.createdAt.$lte = endDate;
      }
    }

    // Year filter for totalIncome
    if (filters.year) {
      query["totalIncome.year"] = parseInt(filters.year);
    }
  }

  try {
    const [total, taxRecords] = await Promise.all([
      Taxpayer.countDocuments(query),
      Taxpayer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Calculate virtual fields and serialize
    const serializedRecords = taxRecords.map((record) => {
      const today = new Date();
      const expiryDate = new Date(record.expiryDate);
      const isExpired = expiryDate < today;
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      // Calculate totals - UPDATED to include income
      const totalIncomeAmount = record.totalIncome?.reduce((sum, item) => sum + (item.income || 0), 0) || 0;
      const totalTaxPaid = record.totalIncome?.reduce((sum, item) => sum + (item.taxPaid || 0), 0) || 0;

      // Get latest year's data - UPDATED to include income
      const latestYear = record.totalIncome?.length > 0 
        ? Math.max(...record.totalIncome.map(item => item.year))
        : null;
      const latestData = latestYear 
        ? record.totalIncome.find(item => item.year === latestYear)
        : null;
      const latestIncome = latestData?.income || 0;
      const latestTaxPaid = latestData?.taxPaid || 0;

      // Format currency function
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 2
        }).format(amount || 0);
      };

      return {
        ...record,
        _id: record._id.toString(),
        id: record._id.toString(),
        issueDate: record.issueDate?.toISOString(),
        expiryDate: record.expiryDate?.toISOString(),
        createdAt: record.createdAt?.toISOString(),
        updatedAt: record.updatedAt?.toISOString(),
        // Virtual fields
        isExpired,
        daysUntilExpiry: isExpired ? 0 : Math.max(0, daysUntilExpiry),
        isActive: !isExpired,
        totalIncomeAmount, // ADDED: total income
        totalTaxPaid,
        latestYear,
        latestIncome, // ADDED: latest income
        latestTaxPaid,
        // Format currency
        amountFormatted: formatCurrency(record.amount || 0),
        totalIncomeFormatted: formatCurrency(totalIncomeAmount), // ADDED: formatted total income
        totalTaxPaidFormatted: formatCurrency(totalTaxPaid),
        // Serialize totalIncome array - UPDATED to include income
        totalIncome: record.totalIncome?.map(item => ({
          year: item.year,
          income: item.income || 0, // ADDED: income field
          taxPaid: item.taxPaid || 0,
          incomeFormatted: formatCurrency(item.income || 0), // ADDED: formatted income
          taxPaidFormatted: formatCurrency(item.taxPaid || 0)
        })) || [],
      };
    });

    // Get aggregation data for summary statistics
    const aggregationPipeline = [];

    // Add match stage if there are filters
    if (Object.keys(query).length > 0) {
      aggregationPipeline.push({ $match: query });
    }

    aggregationPipeline.push(
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalTaxpayers: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          minAmount: { $min: "$amount" },
          maxAmount: { $max: "$amount" }
        }
      }
    );

    const stats = await Taxpayer.aggregate(aggregationPipeline);
    const summaryStats = stats[0] || {
      totalAmount: 0,
      totalTaxpayers: 0,
      avgAmount: 0,
      minAmount: 0,
      maxAmount: 0
    };

    // Get revenue type distribution
    const revenueStats = await Taxpayer.aggregate([
      ...(Object.keys(query).length > 0 ? [{ $match: query }] : []),
      {
        $group: {
          _id: "$revenue",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get platform distribution
    const platformStats = await Taxpayer.aggregate([
      ...(Object.keys(query).length > 0 ? [{ $match: query }] : []),
      {
        $group: {
          _id: "$platform",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get status distribution (active/expired)
    const statusStats = await Taxpayer.aggregate([
      ...(Object.keys(query).length > 0 ? [{ $match: query }] : []),
      {
        $addFields: {
          isExpired: { $lt: ["$expiryDate", new Date()] }
        }
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$isExpired", true] }, "expired", "active"]
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    // UPDATED: Get total income and tax statistics
    const incomeStatsPipeline = [
      ...(Object.keys(query).length > 0 ? [{ $match: query }] : []),
      {
        $project: {
          totalIncome: {
            $sum: "$totalIncome.income"
          },
          totalTax: {
            $sum: "$totalIncome.taxPaid"
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAllIncome: { $sum: "$totalIncome" },
          totalAllTax: { $sum: "$totalTax" },
          avgIncome: { $avg: "$totalIncome" },
          avgTax: { $avg: "$totalTax" }
        }
      }
    ];

    const incomeStats = await Taxpayer.aggregate(incomeStatsPipeline);
    const incomeSummary = incomeStats[0] || {
      totalAllIncome: 0,
      totalAllTax: 0,
      avgIncome: 0,
      avgTax: 0
    };

    return {
      success: true,
      data: {
        records: serializedRecords,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        summary: {
          totalAmount: summaryStats.totalAmount,
          totalTaxpayers: summaryStats.totalTaxpayers,
          avgAmount: summaryStats.avgAmount,
          minAmount: summaryStats.minAmount,
          maxAmount: summaryStats.maxAmount,
          // ADDED: Income and tax statistics
          totalAllIncome: incomeSummary.totalAllIncome,
          totalAllTax: incomeSummary.totalAllTax,
          avgIncome: incomeSummary.avgIncome,
          avgTax: incomeSummary.avgTax,
          // Existing distributions
          revenueDistribution: revenueStats,
          platformDistribution: platformStats,
          statusDistribution: statusStats,
        },
        filters: {
          applied: filters,
          available: {
            revenueTypes: await Taxpayer.distinct("revenue"),
            platforms: await Taxpayer.distinct("platform"),
            years: Array.from({ length: new Date().getFullYear() - 2000 + 1 }, 
              (_, i) => new Date().getFullYear() - i)
          }
        }
      }
    };
  } catch (error) {
    console.error("Error in getAllTaxRecords:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to fetch tax records"
    };
  }
}

export async function getAllRecords(
  page = 1,
  limit = 10,
  search = "",
  filters = {}
) {
  // FIXED: Remove parentheses
  await connectMongoose();

  const skip = (page - 1) * limit;
  const query = {};

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { tin: { $regex: search, $options: "i" } },
      { certificateNo: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phoneNo: { $regex: search, $options: "i" } },
      { reference: { $regex: search, $options: "i" } },
      { idBatch: { $regex: search, $options: "i" } },
      { sourceOfIncome: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
    ];
  }

  // Apply filters
  if (filters) {
    // Revenue type filter
    if (filters.revenue && filters.revenue !== "all") {
      query.revenue = filters.revenue;
    }

    // Platform filter
    if (filters.platform && filters.platform !== "all") {
      query.platform = filters.platform;
    }

    // Status filter (active/expired)
    if (filters.status && filters.status !== "all") {
      const today = new Date();
      if (filters.status === "active") {
        query.expiryDate = { $gte: today };
      } else if (filters.status === "expired") {
        query.expiryDate = { $lt: today };
      }
    }

    // Amount range filter
    if (filters.minAmount || filters.maxAmount) {
      query.amount = {};
      if (filters.minAmount) {
        query.amount.$gte = parseFloat(filters.minAmount);
      }
      if (filters.maxAmount) {
        query.amount.$lte = parseFloat(filters.maxAmount);
      }
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // End of the day
        query.createdAt.$lte = endDate;
      }
    }

    // Year filter for totalIncome
    if (filters.year) {
      query["totalIncome.year"] = parseInt(filters.year);
    }
  }

  try {
    const [total, taxRecords] = await Promise.all([
      Taxpayer.countDocuments(query),
      Taxpayer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Calculate virtual fields and serialize
    const serializedRecords = taxRecords.map((record, index) => {
      const today = new Date();
      const expiryDate = new Date(record.expiryDate);
      const isExpired = expiryDate < today;
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      // Calculate totals - UPDATED to include income
      const totalIncomeAmount = record.totalIncome?.reduce((sum, item) => sum + (item.income || 0), 0) || 0;
      const totalTaxPaid = record.totalIncome?.reduce((sum, item) => sum + (item.taxPaid || 0), 0) || 0;

      // Get latest year's data - UPDATED to include income
      const latestYear = record.totalIncome?.length > 0 
        ? Math.max(...record.totalIncome.map(item => item.year))
        : null;
      const latestData = latestYear 
        ? record.totalIncome.find(item => item.year === latestYear)
        : null;
      const latestIncome = latestData?.income || 0;
      const latestTaxPaid = latestData?.taxPaid || 0;

      // Format currency function
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 2
        }).format(amount || 0);
      };

      return {
        ...record,
        _id: record._id.toString(),
        id: record._id.toString(),
        issueDate: record.issueDate?.toISOString(),
        expiryDate: record.expiryDate?.toISOString(),
        createdAt: record.createdAt?.toISOString(),
        updatedAt: record.updatedAt?.toISOString(),
        // Virtual fields
        isExpired,
        daysUntilExpiry: isExpired ? 0 : Math.max(0, daysUntilExpiry),
        isActive: !isExpired,
        totalIncomeAmount, // ADDED: total income
        totalTaxPaid,
        latestYear,
        latestIncome, // ADDED: latest income
        latestTaxPaid,
        // Format currency
        amountFormatted: formatCurrency(record.amount || 0),
        totalIncomeFormatted: formatCurrency(totalIncomeAmount), // ADDED: formatted total income
        totalTaxPaidFormatted: formatCurrency(totalTaxPaid),
        // Serialize totalIncome array - UPDATED to include income
        totalIncome: record.totalIncome?.map(item => ({
          year: item.year,
          income: item.income || 0, // ADDED: income field
          taxPaid: item.taxPaid || 0,
          incomeFormatted: formatCurrency(item.income || 0), // ADDED: formatted income
          taxPaidFormatted: formatCurrency(item.taxPaid || 0)
        })) || [],
        // Add index for display
        index: (page - 1) * limit + index + 1,
      };
    });

    return {
      success: true,
      data: {
        records: serializedRecords,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        filters: {
          applied: filters,
          available: {
            revenueTypes: await Taxpayer.distinct("revenue"),
            platforms: await Taxpayer.distinct("platform"),
            years: Array.from({ length: new Date().getFullYear() - 2000 + 1 }, 
              (_, i) => new Date().getFullYear() - i)
          }
        }
      }
    };
  } catch (error) {
    console.error("Error in getAllRecords:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to fetch tax records"
    };
  }
}

export async function getRecordById(id) {
  // FIXED: Remove parentheses
  await connectMongoose();

  try {
    const record = await Taxpayer.findById(id).lean();

    if (!record) {
      return {
        success: false,
        message: "Taxpayer record not found",
      };
    }

    console.log("RAW RECORD from DB:", JSON.stringify(record, null, 2));
    console.log("Total Income field:", record.totalIncome);
    console.log("Total Income type:", typeof record.totalIncome);
    console.log("Total Income length:", record.totalIncome?.length);

    // Log each item in totalIncome if it exists
    if (record.totalIncome && Array.isArray(record.totalIncome)) {
      record.totalIncome.forEach((item, index) => {
        console.log(`Item ${index}:`, item);
        console.log(`Item ${index} year:`, item.year);
        console.log(`Item ${index} income:`, item.income);
        console.log(`Item ${index} taxPaid:`, item.taxPaid);
      });
    }

    // Calculate virtual fields
    const today = new Date();
    const expiryDate = new Date(record.expiryDate);
    const isExpired = expiryDate < today;
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    // Calculate totals - add more robust checking
    let totalIncomeAmount = 0;
    let totalTaxPaid = 0;
    let totalIncomeArray = [];

    if (record.totalIncome && Array.isArray(record.totalIncome)) {
      totalIncomeArray = record.totalIncome;
      totalIncomeAmount = totalIncomeArray.reduce((sum, item) => {
        const income = Number(item?.income) || 0;
        console.log(`Adding income ${income} from item:`, item);
        return sum + income;
      }, 0);
      
      totalTaxPaid = totalIncomeArray.reduce((sum, item) => {
        const tax = Number(item?.taxPaid) || 0;
        console.log(`Adding tax ${tax} from item:`, item);
        return sum + tax;
      }, 0);
    }

    console.log("Calculated totalIncomeAmount:", totalIncomeAmount);
    console.log("Calculated totalTaxPaid:", totalTaxPaid);

    // Get latest year's data
    const latestYear = totalIncomeArray.length > 0 
      ? Math.max(...totalIncomeArray.map(item => Number(item.year) || 0))
      : null;
    const latestData = latestYear 
      ? totalIncomeArray.find(item => Number(item.year) === latestYear)
      : null;
    const latestIncome = latestData?.income || 0;
    const latestTaxPaid = latestData?.taxPaid || 0;

    console.log("Latest year:", latestYear);
    console.log("Latest data:", latestData);

    // Format currency function
    const formatCurrency = (amount) => {
      const numAmount = Number(amount) || 0;
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2
      }).format(numAmount);
    };

    const serializedRecord = {
      ...record,
      _id: record._id.toString(),
      id: record._id.toString(),
      issueDate: record.issueDate?.toISOString(),
      expiryDate: record.expiryDate?.toISOString(),
      createdAt: record.createdAt?.toISOString(),
      updatedAt: record.updatedAt?.toISOString(),
      // Virtual fields
      isExpired,
      daysUntilExpiry: isExpired ? 0 : Math.max(0, daysUntilExpiry),
      isActive: !isExpired,
      totalIncomeAmount, // ADDED: total income
      totalTaxPaid,
      latestYear,
      latestIncome, // ADDED: latest income
      latestTaxPaid,
      // Format currency
      amountFormatted: formatCurrency(record.amount || 0),
      totalIncomeFormatted: formatCurrency(totalIncomeAmount), // ADDED: formatted total income
      totalTaxPaidFormatted: formatCurrency(totalTaxPaid),
      // Serialize totalIncome array - UPDATED to include income
      totalIncome: totalIncomeArray.map(item => {
        const year = Number(item.year) || 0;
        const income = Number(item.income) || 0;
        const taxPaid = Number(item.taxPaid) || 0;
        
        console.log(`Processing item - Year: ${year}, Income: ${income}, Tax: ${taxPaid}`);
        
        return {
          year,
          income,
          taxPaid,
          incomeFormatted: formatCurrency(income),
          taxPaidFormatted: formatCurrency(taxPaid)
        };
      }),
    };

    console.log("Serialized totalIncome:", serializedRecord.totalIncome);

    return {
      success: true,
      data: serializedRecord,
    };
  } catch (error) {
    console.error("Error in getRecordById:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to fetch taxpayer record",
    };
  }
}

export async function getTaxpayerById(id) {
  // FIXED: Remove parentheses
  await connectMongoose();

  try {
    const taxpayer = await mongoose
      .model("Taxpayer")
      .findOne({
        _id: id,
      })
      .lean();

    if (!taxpayer) {
      console.log(`Taxpayer ${id} not found`);
      return {
        success: false,
        message: "Taxpayer not found"
      };
    }

    // Calculate virtual fields
    const today = new Date();
    const expiryDate = new Date(taxpayer.expiryDate);
    const isExpired = expiryDate < today;
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    // Calculate totals
    const totalIncomeAmount = taxpayer.totalIncome?.reduce((sum, item) => sum + (item.income || 0), 0) || 0; // ADDED: total income
    const totalTaxPaid = taxpayer.totalIncome?.reduce((sum, item) => sum + (item.taxPaid || 0), 0) || 0;

    // Get latest year's data
    const latestYear = taxpayer.totalIncome?.length > 0 
      ? Math.max(...taxpayer.totalIncome.map(item => item.year))
      : null;
    const latestData = latestYear 
      ? taxpayer.totalIncome.find(item => item.year === latestYear)
      : null;
    const latestIncome = latestData?.income || 0; // ADDED: latest income
    const latestTaxPaid = latestData?.taxPaid || 0;

    // Get all years from totalIncome
    const taxHistoryYears = taxpayer.totalIncome?.map(item => item.year).sort((a, b) => b - a) || [];

    // Format dates - RETURN PLAIN VALUES, NOT OBJECTS WITH METHODS
    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      return {
        iso: d.toISOString(), // This is a string
        formatted: d.toLocaleDateString('en-NG', { // This is a string
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        short: d.toLocaleDateString('en-NG', { // This is a string
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      };
    };

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2
      }).format(amount || 0);
    };

    // Create a plain object without any special MongoDB types
    const plainTaxpayer = JSON.parse(JSON.stringify(taxpayer));

    return {
      success: true,
      data: {
        ...plainTaxpayer,
        _id: plainTaxpayer._id.toString(),
        id: plainTaxpayer._id.toString(),
        // Format dates - these return plain objects
        issueDate: formatDate(plainTaxpayer.issueDate),
        expiryDate: formatDate(plainTaxpayer.expiryDate),
        createdAt: formatDate(plainTaxpayer.createdAt),
        updatedAt: formatDate(plainTaxpayer.updatedAt),
        // Virtual fields - plain values
        isExpired,
        daysUntilExpiry: isExpired ? 0 : Math.max(0, daysUntilExpiry),
        isActive: !isExpired,
        totalIncomeAmount, // ADDED: total income
        totalTaxPaid,
        latestYear,
        latestIncome, // ADDED: latest income
        latestTaxPaid,
        taxHistoryYears,
        // Formatted amounts - strings
        amountFormatted: formatCurrency(plainTaxpayer.amount),
        totalIncomeFormatted: formatCurrency(totalIncomeAmount), // ADDED: formatted total income
        totalTaxPaidFormatted: formatCurrency(totalTaxPaid),
        // Serialize totalIncome with formatted amounts - ensure all values are plain
        totalIncome: (plainTaxpayer.totalIncome || []).map(item => ({
          year: item.year,
          income: item.income || 0, // ADDED: income field
          taxPaid: item.taxPaid || 0,
          incomeFormatted: formatCurrency(item.income || 0), // ADDED: formatted income
          taxPaidFormatted: formatCurrency(item.taxPaid || 0),
          // If _id exists in totalIncome items, convert it to string
          ...(item._id && { _id: item._id.toString() })
        })).sort((a, b) => b.year - a.year), // Sort by year descending
        // Format contact information
        contact: {
          phoneNo: plainTaxpayer.phoneNo,
          email: plainTaxpayer.email,
          address: plainTaxpayer.address
        },
        // Tax information
        taxInfo: {
          tin: plainTaxpayer.tin,
          certificateNo: plainTaxpayer.certificateNo,
          reference: plainTaxpayer.reference,
          idBatch: plainTaxpayer.idBatch,
          revenue: plainTaxpayer.revenue,
          platform: plainTaxpayer.platform,
          paymentDetails: plainTaxpayer.paymentDetails,
          sourceOfIncome: plainTaxpayer.sourceOfIncome
        },
        // Format for form usage (if needed for editing)
        formData: {
          name: plainTaxpayer.name,
          tin: plainTaxpayer.tin,
          certificateNo: plainTaxpayer.certificateNo,
          phoneNo: plainTaxpayer.phoneNo,
          email: plainTaxpayer.email,
          amount: plainTaxpayer.amount,
          sourceOfIncome: plainTaxpayer.sourceOfIncome,
          address: plainTaxpayer.address,
          revenue: plainTaxpayer.revenue,
          platform: plainTaxpayer.platform,
          paymentDetails: plainTaxpayer.paymentDetails,
          reference: plainTaxpayer.reference,
          idBatch: plainTaxpayer.idBatch,
          totalIncome: (plainTaxpayer.totalIncome || []).map(item => ({
            year: item.year,
            income: item.income || 0, // ADDED: income field
            taxPaid: item.taxPaid || 0,
            // Convert any ObjectId to string
            ...(item._id && { _id: item._id.toString() })
          }))
        }
      }
    };
  } catch (error) {
    console.error("Error fetching taxpayer:", error);
    
    // Check if ID is invalid
    if (error.name === 'CastError') {
      return {
        success: false,
        message: "Invalid taxpayer ID"
      };
    }
    
    return {
      success: false,
      message: "Failed to fetch taxpayer details",
      error: error.message
    };
  }
}

export async function updateTaxpayer(id, formData) {
  // FIXED: Remove parentheses
  await connectMongoose();

  try {
    console.log("Updating taxpayer with ID:", id);
    console.log("Form data received:", formData);

    // Validation checks
    const errors = {};

    // Validate required fields
    const requiredFields = [
      { field: 'name', label: 'Full Name' },
      { field: 'tin', label: 'TIN' },
      { field: 'certificateNo', label: 'Certificate Number' },
      { field: 'phoneNo', label: 'Phone Number' },
      { field: 'email', label: 'Email' },
      { field: 'sourceOfIncome', label: 'Source of Income' },
      { field: 'address', label: 'Address' },
    ];

    requiredFields.forEach(({ field, label }) => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors[field] = {
          _errors: [`${label} is required`]
        };
      }
    });

    // Validate Nigerian phone number
    if (formData.phoneNo && !/^(0[7-9][01]\d{8})$/.test(formData.phoneNo)) {
      errors.phoneNo = {
        _errors: ["Please enter a valid Nigerian phone number starting with 07, 08, or 09"]
      };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = {
        _errors: ["Please enter a valid email address"]
      };
    }

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.amount = {
        _errors: ["Amount must be greater than 0"]
      };
    }

    // Validate totalIncome data - UPDATED to include income validation
    if (formData.totalIncome && Array.isArray(formData.totalIncome)) {
      formData.totalIncome.forEach((item, index) => {
        const currentYear = new Date().getFullYear();
        if (item.year < 2000 || item.year > currentYear) {
          if (!errors[`totalIncome[${index}].year`]) {
            errors[`totalIncome[${index}].year`] = { _errors: [] };
          }
          errors[`totalIncome[${index}].year`]._errors.push(
            `Year must be between 2000 and ${currentYear}`
          );
        }
        if (item.income < 0) { // ADDED: validate income
          if (!errors[`totalIncome[${index}].income`]) {
            errors[`totalIncome[${index}].income`] = { _errors: [] };
          }
          errors[`totalIncome[${index}].income`]._errors.push("Income cannot be negative");
        }
        if (item.taxPaid < 0) {
          if (!errors[`totalIncome[${index}].taxPaid`]) {
            errors[`totalIncome[${index}].taxPaid`] = { _errors: [] };
          }
          errors[`totalIncome[${index}].taxPaid`]._errors.push("Tax paid cannot be negative");
        }
      });
    }

    // Validate reference and ID/Batch
    if (formData.reference && !/^[1-9]\d{11}$/.test(formData.reference.toString())) {
      errors.reference = {
        _errors: ["Reference must be 12 digits and not start with 0"]
      };
    }

    if (formData.idBatch && !/^[1-9]\d{17}$/.test(formData.idBatch.toString())) {
      errors.idBatch = {
        _errors: ["ID/Batch must be 18 digits and not start with 0"]
      };
    }

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
      return {
        success: false,
        error: errors,
        message: "Validation failed",
      };
    }

    // Find existing taxpayer
    const existingTaxpayer = await Taxpayer.findById(id);
    if (!existingTaxpayer) {
      return {
        success: false,
        error: {
          _form: {
            _errors: ["Taxpayer not found"],
          },
        },
        message: "Taxpayer not found",
      };
    }

    // Check for duplicate certificate number if changed
    if (formData.certificateNo && formData.certificateNo !== existingTaxpayer.certificateNo) {
      const taxpayerWithSameCertificate = await Taxpayer.findOne({
        certificateNo: formData.certificateNo,
        _id: { $ne: id },
      });
      if (taxpayerWithSameCertificate) {
        return {
          success: false,
          error: {
            certificateNo: {
              _errors: ["Certificate number already exists"],
            },
          },
          message: "Certificate number already exists",
        };
      }
    }

    // Check for duplicate reference if changed
    if (formData.reference && formData.reference !== existingTaxpayer.reference) {
      const taxpayerWithSameReference = await Taxpayer.findOne({
        reference: formData.reference,
        _id: { $ne: id },
      });
      if (taxpayerWithSameReference) {
        return {
          success: false,
          error: {
            reference: {
              _errors: ["Reference number already exists"],
            },
          },
          message: "Reference number already exists",
        };
      }
    }

    // Check for duplicate ID/Batch if changed
    if (formData.idBatch && formData.idBatch !== existingTaxpayer.idBatch) {
      const taxpayerWithSameIdBatch = await Taxpayer.findOne({
        idBatch: formData.idBatch,
        _id: { $ne: id },
      });
      if (taxpayerWithSameIdBatch) {
        return {
          success: false,
          error: {
            idBatch: {
              _errors: ["ID/Batch already exists"],
            },
          },
          message: "ID/Batch already exists",
        };
      }
    }

    // Format phone number to standard Nigerian format
    const formatPhoneNumber = (phone) => {
      if (!phone || typeof phone !== 'string') return phone;
      
      let formatted = phone.replace(/\s+/g, '');
      
      if (formatted.startsWith('+234') && formatted.length > 4) {
        formatted = '0' + formatted.substring(4);
      } else if (formatted.startsWith('234') && formatted.length > 3) {
        formatted = '0' + formatted.substring(3);
      }
      
      return formatted;
    };

    // Prepare update data - UPDATED to include income field
    const updateData = {
      name: formData.name?.trim(),
      tin: formData.tin,
      certificateNo: formData.certificateNo,
      phoneNo: formatPhoneNumber(formData.phoneNo),
      email: formData.email?.toLowerCase().trim(),
      amount: parseFloat(formData.amount.toFixed(2)),
      sourceOfIncome: formData.sourceOfIncome?.trim(),
      address: formData.address?.trim(),
      revenue: formData.revenue || existingTaxpayer.revenue,
      platform: formData.platform || existingTaxpayer.platform,
      paymentDetails: formData.paymentDetails || existingTaxpayer.paymentDetails,
      reference: formData.reference || existingTaxpayer.reference,
      idBatch: formData.idBatch || existingTaxpayer.idBatch,
      totalIncome: formData.totalIncome?.map(item => ({
        year: item.year,
        income: parseFloat((item.income || 0).toFixed(2)), // ADDED: income field
        taxPaid: parseFloat((item.taxPaid || 0).toFixed(2))
      })) || existingTaxpayer.totalIncome,
      updatedAt: new Date(),
    };

    // Only update issueDate and expiryDate if they're provided
    if (formData.issueDate) {
      updateData.issueDate = new Date(formData.issueDate);
    }
    if (formData.expiryDate) {
      const expiry = new Date(formData.expiryDate);
      const year = expiry.getFullYear();
      updateData.expiryDate = new Date(year, 11, 31); // December 31st
    }

    console.log("Update data:", updateData);

    // Update taxpayer
    const updatedTaxpayer = await Taxpayer.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTaxpayer) {
      return {
        success: false,
        error: {
          _form: {
            _errors: ["Failed to update taxpayer"],
          },
        },
        message: "Failed to update taxpayer",
      };
    }

    // Calculate virtual fields for response
    const today = new Date();
    const expiryDate = new Date(updatedTaxpayer.expiryDate);
    const isExpired = expiryDate < today;
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    // Calculate totals - UPDATED to include income
    const totalIncomeAmount = updatedTaxpayer.totalIncome?.reduce((sum, item) => sum + (item.income || 0), 0) || 0;
    const totalTaxPaid = updatedTaxpayer.totalIncome?.reduce((sum, item) => sum + (item.taxPaid || 0), 0) || 0;

    // Get latest year's data - UPDATED to include income
    const latestYear = updatedTaxpayer.totalIncome?.length > 0 
      ? Math.max(...updatedTaxpayer.totalIncome.map(item => item.year))
      : null;
    const latestData = latestYear 
      ? updatedTaxpayer.totalIncome.find(item => item.year === latestYear)
      : null;
    const latestIncome = latestData?.income || 0;
    const latestTaxPaid = latestData?.taxPaid || 0;

    // Format dates for response
    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      return {
        iso: d.toISOString(),
        formatted: d.toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        short: d.toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      };
    };

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2
      }).format(amount || 0);
    };

    // Serialize the response - UPDATED to include income fields
    const serializedTaxpayer = {
      ...updatedTaxpayer.toObject(),
      _id: updatedTaxpayer._id.toString(),
      id: updatedTaxpayer._id.toString(),
      // Format dates
      issueDate: formatDate(updatedTaxpayer.issueDate),
      expiryDate: formatDate(updatedTaxpayer.expiryDate),
      createdAt: formatDate(updatedTaxpayer.createdAt),
      updatedAt: formatDate(updatedTaxpayer.updatedAt),
      // Virtual fields
      isExpired,
      daysUntilExpiry: isExpired ? 0 : Math.max(0, daysUntilExpiry),
      isActive: !isExpired,
      totalIncomeAmount, // ADDED: total income
      totalTaxPaid,
      latestYear,
      latestIncome, // ADDED: latest income
      latestTaxPaid,
      // Formatted amounts
      amountFormatted: formatCurrency(updatedTaxpayer.amount),
      totalIncomeFormatted: formatCurrency(totalIncomeAmount), // ADDED: formatted total income
      totalTaxPaidFormatted: formatCurrency(totalTaxPaid),
      // Serialize totalIncome with formatted amounts - UPDATED to include income
      totalIncome: (updatedTaxpayer.totalIncome || []).map(item => ({
        year: item.year,
        income: item.income || 0, // ADDED: income field
        taxPaid: item.taxPaid || 0,
        incomeFormatted: formatCurrency(item.income || 0), // ADDED: formatted income
        taxPaidFormatted: formatCurrency(item.taxPaid || 0)
      })).sort((a, b) => b.year - a.year),
    };

    // Remove any Mongoose-specific properties
    const cleanSerializedTaxpayer = JSON.parse(
      JSON.stringify(serializedTaxpayer, (key, value) => {
        // Remove Mongoose internals
        if (key === '__v' || key === '$__' || key === '_doc' || key === '$isNew') {
          return undefined;
        }
        // Ensure _id fields are strings
        if (key === '_id' && value && typeof value === 'object' && value.$oid) {
          return value.$oid;
        }
        return value;
      })
    );

    console.log("Cleaned serialized taxpayer response:", cleanSerializedTaxpayer);

    // Revalidate paths
    const pathsToRevalidate = [
      `/dashboard/records/edit/${id}`,
      "/dashboard/records",
      `/dashboard/records/view/${id}`,
    ];

    try {
      await Promise.all(pathsToRevalidate.map((path) => revalidatePath(path)));
    } catch (revalidateError) {
      console.error("Revalidation error:", revalidateError);
      // Don't fail the whole operation if revalidation fails
    }

    return {
      success: true,
      data: cleanSerializedTaxpayer,
      message: "Taxpayer updated successfully",
    };
  } catch (error) {
    console.error("Update taxpayer error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = {
          _errors: [error.errors[key].message],
        };
      });

      return {
        success: false,
        error: errors,
        message: "Validation failed",
      };
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let fieldName = field;
      let errorMessage = "";
      
      switch(field) {
        case 'certificateNo':
          fieldName = 'Certificate Number';
          errorMessage = 'Certificate number already exists';
          break;
        case 'reference':
          fieldName = 'Reference Number';
          errorMessage = 'Reference number already exists';
          break;
        case 'idBatch':
          fieldName = 'ID/Batch';
          errorMessage = 'ID/Batch already exists';
          break;
        default:
          errorMessage = 'Duplicate entry found';
      }
      
      return {
        success: false,
        error: {
          [field]: {
            _errors: [errorMessage]
          }
        },
        message: errorMessage,
      };
    }

    return {
      success: false,
      error: {
        _form: {
          _errors: [error.message || "Failed to update taxpayer"],
        },
      },
      message: error.message || "Failed to update taxpayer",
    };
  }
}

export async function deleteTaxpayer(id) {
  // FIXED: Remove parentheses
  await connectMongoose();

  try {
    const taxpayer = await Taxpayer.findById(id);
    if (!taxpayer) {
      return { 
        success: false, 
        message: "Taxpayer not found" 
      };
    }

    // Store taxpayer data for audit log before deletion
    const taxpayerData = {
      name: taxpayer.name,
      tin: taxpayer.tin,
      certificateNo: taxpayer.certificateNo,
      email: taxpayer.email,
      phoneNo: taxpayer.phoneNo,
      reference: taxpayer.reference,
      idBatch: taxpayer.idBatch,
      totalTaxPaid: taxpayer.totalIncome?.reduce((sum, item) => sum + (item.taxPaid || 0), 0) || 0,
      yearsOfHistory: taxpayer.totalIncome?.length || 0,
    };

    console.log("Deleting taxpayer:", taxpayerData);

    // Delete the taxpayer from database
    const result = await Taxpayer.findByIdAndDelete(id);

    if (!result) {
      return { 
        success: false, 
        message: "Failed to delete taxpayer" 
      };
    }

    // Revalidate paths
    const pathsToRevalidate = [
      "/dashboard/records",
      `/dashboard/records/edit/${id}`,
      `/dashboard/records/view/${id}`,
    ];

    try {
      await Promise.all(pathsToRevalidate.map((path) => revalidatePath(path)));
    } catch (revalidateError) {
      console.error("Revalidation error:", revalidateError);
      // Don't fail the whole operation if revalidation fails
    }

    // Log deletion for audit purposes
    console.log(`Taxpayer deleted: ${taxpayerData.name} (TIN: ${taxpayerData.tin})`, {
      deletedAt: new Date().toISOString(),
      deletedData: taxpayerData
    });

    return { 
      success: true,
      data: {
        deletedTaxpayer: taxpayerData,
        message: `${taxpayerData.name} has been successfully deleted`
      }
    };
  } catch (error) {
    console.error("Delete taxpayer error:", error);

    // Handle CastError for invalid ObjectId
    if (error.name === 'CastError') {
      return {
        success: false,
        message: "Invalid taxpayer ID format"
      };
    }

    // Handle database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseError') {
      return {
        success: false,
        message: "Database connection error. Please try again."
      };
    }

    return {
      success: false,
      message: error.message || "Failed to delete taxpayer",
      error: error.message
    };
  }
}

export async function getProducts(
  page = 1,
  limit = 10,
  search = "",
  category = ""
) {
  // FIXED: Remove parentheses
  await connectMongoose();

  const skip = (page - 1) * limit;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { "category.name": { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    query.category = category;
  }

  const total = await Products.countDocuments(query);

  const products = await Products.find(query)
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Serialize the products with proper error handling
  const serializedProducts = products.map((product) => {
    const serialized = {
      ...product,
      _id: product._id.toString(),
      category: product.category
        ? {
            ...product.category,
            _id: product.category._id.toString(),
          }
        : null,
      // Safely handle createdAt and updatedAt
      createdAt: product.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
      purchasePrice: product.purchasePrice || 0,
      // Handle images if they exist in the product
      images:
        product.images?.map((img) => ({
          ...img,
          data: img.data?.toString("base64") || "",
          _id: img._id?.toString() || "",
        })) || [],
      defaultImage: product.defaultImage
        ? {
            ...product.defaultImage,
            data: product.defaultImage.data?.toString("base64") || "",
            _id: product.defaultImage._id?.toString() || "",
          }
        : null,
    };

    // Remove any Mongoose-specific properties
    delete serialized.__v;
    delete serialized.$__;
    delete serialized._doc;

    return serialized;
  });

  return {
    products: serializedProducts,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    },
  };
}

export async function getAllProducts(
  page = 1,
  limit = 10,
  search = "",
  category = ""
) {
  // FIXED: Remove parentheses
  await connectMongoose();

  const skip = (page - 1) * limit;
  const query = {};

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { "category.name": { $regex: search, $options: "i" } },
    ];
  }

  // Category filter - fixed to properly handle category filtering
  if (category && category !== "all") {
    query.category = category; // This assumes category is stored as ObjectId in products
  }

  try {
    const [total, products] = await Promise.all([
      Products.countDocuments(query),
      Products.find(query)
        .populate({
          path: "category",
          select: "name _id",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Simplified serialization
    const serializedProducts = products.map((product) => ({
      ...product,
      _id: product._id.toString(),
      category: product.category
        ? {
            _id: product.category._id.toString(),
            name: product.category.name,
          }
        : null,
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
      images:
        product.images?.map((img) => ({
          ...img,
          _id: img._id?.toString(),
        })) || [],
    }));

    return {
      products: serializedProducts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    };
  } catch (error) {
    console.error("Error in getProducts:", error);
    throw error;
  }
}

export async function updateProduct(id, formData) {
  // FIXED: Remove parentheses
  await connectMongoose();

  try {
    console.log("Updating product with ID:", id);
    console.log("Form data received:", formData);

    // Generate slug from product name if name is being updated
    const generateSlug = (name) => {
      if (!name) return "";
      return name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    };

    // Manual validation checks
    const errors = {};

    // Validate required fields
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = {
        _errors: ["Product name must be at least 2 characters"],
      };
    }

    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = {
        _errors: ["Description must be at least 10 characters"],
      };
    }

    // Validate prices
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      errors.price = {
        _errors: ["Price must be a positive number"],
      };
    }

    const purchasePrice = parseFloat(formData.purchasePrice);
    if (isNaN(purchasePrice) || purchasePrice <= 0) {
      errors.purchasePrice = {
        _errors: ["Purchase price must be a positive number"],
      };
    }

    let discountedPrice = null;
    if (formData.discountedPrice && formData.discountedPrice !== "") {
      discountedPrice = parseFloat(formData.discountedPrice);
      if (isNaN(discountedPrice) || discountedPrice < 0) {
        errors.discountedPrice = {
          _errors: ["Discounted price must be a non-negative number"],
        };
      }
    }

    // Validate stock
    const stock = parseInt(formData.stock, 10);
    if (isNaN(stock) || stock < 0) {
      errors.stock = {
        _errors: ["Stock must be a non-negative integer"],
      };
    }

    // Validate images - convert to proper object structure for MongoDB
    let images = [];
    if (Array.isArray(formData.images)) {
      images = formData.images
        .map((img, index) => {
          if (typeof img === "string") {
            // If it's already a string URL, create an object
            return {
              url: img,
              alt: `Product image ${index + 1}`,
              isPrimary: false,
            };
          } else if (typeof img === "object" && img.url) {
            // If it's already an object, ensure it has all required fields
            return {
              url: img.url || "",
              alt: img.alt || `Product image ${index + 1}`,
              isPrimary: img.isPrimary || false,
            };
          }
          return null;
        })
        .filter((img) => img !== null && img.url && img.url.trim() !== "");
    }

    if (images.length > 10) {
      errors.images = {
        _errors: ["Cannot have more than 10 images"],
      };
    }

    // Validate defaultImage - convert to proper object structure
    let defaultImage = null;
    if (formData.defaultImage) {
      if (typeof formData.defaultImage === "string") {
        // Find the corresponding image object
        const defaultImg = images.find(
          (img) => img.url === formData.defaultImage
        );
        if (defaultImg) {
          defaultImage = {
            url: defaultImg.url,
            alt: defaultImg.alt || "Default product image",
          };
        }
      } else if (
        typeof formData.defaultImage === "object" &&
        formData.defaultImage.url
      ) {
        defaultImage = {
          url: formData.defaultImage.url,
          alt: formData.defaultImage.alt || "Default product image",
        };
      }

      if (defaultImage && !images.some((img) => img.url === defaultImage.url)) {
        errors.defaultImage = {
          _errors: ["Default image must be one of the product images"],
        };
      }
    }

    // Validate category
    if (!formData.category) {
      errors.category = {
        _errors: ["Category is required"],
      };
    }

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
      return {
        success: false,
        error: errors,
        message: "Validation failed",
      };
    }

    // Price comparisons
    if (purchasePrice > price) {
      return {
        success: false,
        error: {
          purchasePrice: {
            _errors: ["Purchase price cannot be greater than selling price"],
          },
        },
        message: "Purchase price cannot be greater than selling price",
      };
    }

    if (discountedPrice !== null && discountedPrice > price) {
      return {
        success: false,
        error: {
          discountedPrice: {
            _errors: ["Discounted price cannot be greater than regular price"],
          },
        },
        message: "Discounted price cannot be greater than regular price",
      };
    }

    // Find existing product
    const existingProduct = await Products.findById(id);
    if (!existingProduct) {
      return {
        success: false,
        error: {
          _form: {
            _errors: ["Product not found"],
          },
        },
        message: "Product not found",
      };
    }

    // Validate category exists
    const category = await Category.findById(formData.category);
    if (!category) {
      return {
        success: false,
        error: {
          category: {
            _errors: ["Selected category does not exist"],
          },
        },
        message: "Selected category does not exist",
      };
    }

    // Validate name uniqueness if changed
    if (formData.name && formData.name !== existingProduct.name) {
      const productWithSameName = await Products.findOne({
        name: { $regex: new RegExp(`^${formData.name}$`, "i") },
        _id: { $ne: id },
      });
      if (productWithSameName) {
        return {
          success: false,
          error: {
            name: {
              _errors: ["Product with this name already exists"],
            },
          },
          message: "Product with this name already exists",
        };
      }
    }

    // Handle slug uniqueness if changed
    let finalSlug = formData.slug || generateSlug(formData.name);
    if (finalSlug && finalSlug !== existingProduct.slug) {
      let slugExists = await Products.findOne({
        slug: finalSlug,
        _id: { $ne: id },
      });

      let slugCounter = 1;
      while (slugExists) {
        finalSlug = `${generateSlug(formData.name)}-${slugCounter}`;
        slugExists = await Products.findOne({
          slug: finalSlug,
          _id: { $ne: id },
        });
        slugCounter++;
      }
    }

    // Prepare update fields - ensure images are in the correct object format
    const updateFields = {
      name: formData.name,
      slug: finalSlug,
      description: formData.description,
      price: parseFloat(price.toFixed(2)),
      purchasePrice: parseFloat(purchasePrice.toFixed(2)),
      discountedPrice:
        discountedPrice !== null
          ? parseFloat(discountedPrice.toFixed(2))
          : null,
      stock,
      isActive:
        formData.isActive !== undefined
          ? formData.isActive
          : existingProduct.isActive,
      features: Array.isArray(formData.features)
        ? formData.features
        : existingProduct.features,
      images: images, // This should now be an array of objects
      defaultImage: defaultImage, // This should be an object with url and alt
      category: new mongoose.Types.ObjectId(formData.category),
      updatedAt: new Date(),
    };

    console.log("Update fields:", updateFields);

    // Update product
    const updatedProduct = await Products.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      {
        new: true,
        runValidators: true,
      }
    ).populate("category", "name status");

    if (!updatedProduct) {
      return {
        success: false,
        error: {
          _form: {
            _errors: ["Failed to update product"],
          },
        },
        message: "Failed to update product",
      };
    }
    // Serialize the response properly - ensure all _id fields are converted to strings
    const serializedProduct = {
      _id: updatedProduct._id.toString(),
      id: updatedProduct._id.toString(),
      name: updatedProduct.name,
      slug: updatedProduct.slug,
      description: updatedProduct.description,
      price: updatedProduct.price,
      purchasePrice: updatedProduct.purchasePrice || 0,
      discountedPrice: updatedProduct.discountedPrice || null,
      // Properly serialize images array
      images:
        updatedProduct.images?.map((img) => ({
          url: img.url || "",
          alt: img.alt || "",
          isPrimary: img.isPrimary || false,
          // Convert _id to string if it exists
          _id: img._id ? img._id.toString() : undefined,
          id: img._id ? img._id.toString() : undefined,
        })) || [],
      // Properly serialize defaultImage
      defaultImage: updatedProduct.defaultImage
        ? {
            url: updatedProduct.defaultImage.url || "",
            alt: updatedProduct.defaultImage.alt || "",
            // Convert _id to string if it exists
            _id: updatedProduct.defaultImage._id
              ? updatedProduct.defaultImage._id.toString()
              : undefined,
            id: updatedProduct.defaultImage._id
              ? updatedProduct.defaultImage._id.toString()
              : undefined,
          }
        : null,
      stock: updatedProduct.stock || 0,
      isActive: updatedProduct.isActive ?? true,
      features: updatedProduct.features || [],
      category: updatedProduct.category
        ? {
            _id: updatedProduct.category._id.toString(),
            name: updatedProduct.category.name,
            status: updatedProduct.category.status,
          }
        : null,
      createdAt: updatedProduct.createdAt
        ? updatedProduct.createdAt.toISOString()
        : new Date().toISOString(),
      updatedAt: updatedProduct.updatedAt
        ? updatedProduct.updatedAt.toISOString()
        : new Date().toISOString(),
    };

    // Remove any Mongoose-specific properties that might cause circular references
    const cleanSerializedProduct = JSON.parse(
      JSON.stringify(serializedProduct, (key, value) => {
        // Remove any properties that might contain Mongoose internals
        if (
          key === "__v" ||
          key === "$__" ||
          key === "_doc" ||
          key === "$isNew"
        ) {
          return undefined;
        }
        return value;
      })
    );

    console.log("Cleaned serialized product response:", cleanSerializedProduct);

    // Revalidate paths
    const pathsToRevalidate = [
      `/dashboard/products/edit/${id}`,
      "/dashboard/products",
      `/products/${existingProduct.slug}`,
      "/products",
    ];

    if (finalSlug && finalSlug !== existingProduct.slug) {
      pathsToRevalidate.push(`/products/${finalSlug}`);
    }

    try {
      await Promise.all(pathsToRevalidate.map((path) => revalidatePath(path)));
    } catch (revalidateError) {
      console.error("Revalidation error:", revalidateError);
      // Don't fail the whole operation if revalidation fails
    }

    return {
      success: true,
      data: serializedProduct,
      message: "Product updated successfully",
    };
  } catch (error) {
    console.error("Update product error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = {
          _errors: [error.errors[key].message],
        };
      });

      return {
        success: false,
        error: errors,
        message: "Validation failed",
      };
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return {
        success: false,
        error: {
          [field]: {
            _errors: [`${field} already exists`],
          },
        },
        message: "Duplicate entry found",
      };
    }

    return {
      success: false,
      error: {
        _form: {
          _errors: [error.message || "Failed to update product"],
        },
      },
      message: error.message || "Failed to update product",
    };
  }
}

export async function getProductById(id) {
  // FIXED: Remove parentheses
  await connectMongoose();

  try {
    const product = await mongoose
      .model("Product")
      .findOne({
        _id: id,
      })
      .populate("category", "name _id")
      .lean({ virtuals: true });

    if (!product) {
      console.log(`Product ${id} not found`);
      return null;
    }

    // Convert all Buffer objects to strings in images array
    const images = (product.images || []).map(image => ({
      url: image.url || "",
      alt: image.alt || "",
      isPrimary: image.isPrimary || false,
      // Convert _id Buffer to string if it exists
      _id: image._id ? image._id.toString() : null
    }));

    // Extract just the URL from defaultImage object
    const defaultImageUrl = product.defaultImage?.url || 
                           (images.length > 0 ? images[0].url : null);

    return {
      _id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      purchasePrice: product.purchasePrice || 0,
      discountedPrice: product.discountedPrice || null,
      images: images, // Now with all Buffer objects converted to strings
      defaultImage: defaultImageUrl, // Now just the URL string
      features: product.features || [],
      stock: product.stock || 0,
      isActive: product.isActive ?? true,
      category: product.category
        ? {
            _id: product.category._id.toString(),
            name: product.category.name,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getProductBySlugAndId(slug, productId) {
  // FIXED: Remove parentheses
  await connectMongoose();

  try {
    const product = await mongoose
      .model("Product")
      .findOne({ productId, slug })
      .populate("category", "name _id")
      .lean({ virtuals: true });

    if (!product) {
      console.log(`Product with slug ${slug} and ID ${productId} not found`);
      return null;
    }

    // Convert images into plain objects
    const images = (product.images || []).map((image) => ({
      url: image.url || "",
      alt: image.alt || "",
      isPrimary: !!image.isPrimary,
      _id: image._id ? image._id.toString() : null,
    }));

    // Default image should be a URL string (not object) to match your Zod schema
    const defaultImage = product.defaultImage || (images[0]?.url ?? null);

    return {
      _id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      purchasePrice: product.purchasePrice || 0,
      discountedPrice: product.discountedPrice || null,
      images, // ✅ plain array of objects
      defaultImage, // ✅ plain string URL
      features: product.features || [],
      stock: product.stock || 0,
      isActive: product.isActive ?? true,
      category: product.category
        ? {
            _id: product.category._id.toString(),
            name: product.category.name,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}


export async function deleteProduct(id) {
  // FIXED: Remove parentheses
  await connectMongoose();

  try {
    const product = await Products.findById(id);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Verify Cloudinary configuration
    if (!cloudinary.config().api_key) {
      throw new Error("Cloudinary API key is not configured");
    }

    // Delete images from Cloudinary if they exist
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(async (imageUrl) => {
        try {
          // Extract public_id correctly (remove version number if present)
          const url = new URL(imageUrl);
          const pathParts = url.pathname.split("/");
          const uploadIndex = pathParts.indexOf("upload");

          if (uploadIndex === -1) {
            console.warn("Invalid Cloudinary URL:", imageUrl);
            return;
          }

          // Get parts after 'upload' and remove file extension
          const publicIdParts = pathParts.slice(uploadIndex + 1);
          let publicId = publicIdParts.join("/");

          // Remove version number if present (v123456789)
          if (/^v\d+/.test(publicIdParts[0])) {
            publicId = publicIdParts.slice(1).join("/");
          }

          // Remove file extension
          publicId = publicId.split(".")[0];

          const result = await cloudinary.uploader.destroy(publicId, {
            invalidate: true,
            resource_type: "image",
          });

          if (result.result !== "ok") {
            console.warn("Failed to delete image:", publicId, result);
          }
          return result;
        } catch (err) {
          console.error("Error deleting image:", imageUrl, err);
          return null;
        }
      });

      await Promise.all(deletePromises);
    }

    // Delete the product from database
    await Products.findByIdAndDelete(id);

    // Revalidate paths
    revalidatePath("/dashboard/products");
    revalidatePath(`/products/${product.slug}`);

    return { success: true };
  } catch (error) {
    console.error("Delete product error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete product",
    };
  }
}

export async function getAllProductsGroupedByCategory(
  page = 1,
  limit = 5,
  categoryFilter = "all",
  categoriesOnly = false
) {
  // FIXED: Remove parentheses
  await connectMongoose();

  // If only fetching categories and counts, return early
  if (categoriesOnly) {
    const categories = await getActiveCategories();
    const totalCounts = await getTotalCounts();

    return {
      products: [],
      categories,
      totalCounts,
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
      },
    };
  }

  try {
    const skip = (page - 1) * limit;

    // Build the base query for active products with active categories
    const baseQuery = {
      isActive: true,
    };

    // If filtering by specific category, add category filter
    if (categoryFilter !== "all") {
      // First find the category by slug
      const category = await Category.findOne({
        name: new RegExp(categoryFilter.replace("-", " "), "i"),
        status: "Active",
      }).lean();

      if (category) {
        baseQuery.category = category._id;
      } else {
        // If category not found, return empty results
        return {
          products: [],
          categories: await getActiveCategories(),
          totalCounts: await getTotalCounts(),
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
          },
        };
      }
    }

    // Find products with the query
    const products = await Products.find(baseQuery)
      .populate({
        path: "category",
        select: "name status",
        model: Category,
        match: { status: "Active" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter out products with inactive categories
    const validProducts = products.filter(
      (product) => product.category && product.category.status === "Active"
    );

    // Serialize the data for client-side use - FIXED IMAGE HANDLING
    const serialized = validProducts.map((product) => {
      // Handle defaultImage - extract URL if it's an object
      let defaultImageUrl = "/placeholder.png";
      if (product.defaultImage) {
        if (typeof product.defaultImage === 'string') {
          defaultImageUrl = product.defaultImage;
        } else if (product.defaultImage.url) {
          defaultImageUrl = product.defaultImage.url;
        }
      }

      return {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        discountedPrice: product.discountedPrice || null,
        defaultImage: defaultImageUrl, // Now always a string URL
        category: product.category.name,
        stock: product.stock,
        isNew: product.isNew || false,
        features: product.features || [],
        createdAt: product.createdAt,
        slug: product.slug,
        productId: product.productId,
      };
    });

    // Get total count for the current filter
    const totalCount = await Products.countDocuments(baseQuery);

    // Get categories and total counts
    const categories = await getActiveCategories();
    const totalCounts = await getTotalCounts();

    return {
      products: serialized,
      categories,
      totalCounts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: page * limit < totalCount,
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      products: [],
      categories: [],
      totalCounts: {},
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
      },
    };
  }
}