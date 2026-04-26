"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../auth/auth-provider";

type AccountType = "retail" | "wholesale_school" | "wholesale_general";

interface WholesaleApplicationFormProps {
  onSuccess?: () => void;
}

export function WholesaleApplicationForm({ onSuccess }: WholesaleApplicationFormProps) {
  const { signup } = useAuth();
  const [step, setStep] = useState<"account-type" | "details" | "confirmation">("account-type");
  const [selectedType, setSelectedType] = useState<"retail" | "wholesale" | null>(null);
  const [wholesaleType, setWholesaleType] = useState<"school" | "business" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    institutionName: "",
    repRole: "",
  });

  const handleAccountTypeSelect = (type: "retail" | "wholesale") => {
    setSelectedType(type);
    if (type === "retail") {
      setStep("details");
    } else {
      setStep("account-type");
    }
  };

  const handleWholesaleTypeSelect = (type: "school" | "business") => {
    setWholesaleType(type);
    setStep("details");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate fields
      if (!formData.name.trim()) throw new Error("Name is required");
      if (!formData.email.trim()) throw new Error("Email is required");
      if (!formData.phone.trim()) throw new Error("Phone is required");
      if (!formData.password) throw new Error("Password is required");

      if (selectedType === "wholesale") {
        if (!formData.institutionName.trim()) throw new Error("Institution/Business name is required");
        if (!formData.repRole.trim()) throw new Error("Your role is required");
      }

      const accountType: AccountType =
        selectedType === "retail"
          ? "retail"
          : wholesaleType === "school"
            ? "wholesale_school"
            : "wholesale_general";

      const result = await signup(
        formData.name,
        formData.email,
        formData.phone,
        formData.password,
        accountType,
        selectedType === "wholesale" ? formData.institutionName : undefined,
        selectedType === "wholesale" ? formData.repRole : undefined
      );

      if (result.ok) {
        if (result.code === "wholesale_pending") {
          setStep("confirmation");
        } else {
          setStep("confirmation");
        }
        onSuccess?.();
      } else {
        throw new Error(result.error || "Sign up failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Account Type Selection
  if (step === "account-type" && selectedType === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto px-6"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-deep-ink mb-2">
            Choose Your Account Type
          </h2>
          <p className="text-muted">
            Select how you'd like to use Canvus
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Retail Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAccountTypeSelect("retail")}
            className="p-8 bg-white border-2 border-light-border rounded-lg text-left hover:border-primary/40 hover:shadow-sm transition-all group"
          >
            <div className="mb-4">
              <div className="inline-block p-3 bg-off-white rounded-lg group-hover:bg-light-border transition-colors">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-deep-ink mb-2">Individual Shopper</h3>
            <p className="text-muted text-sm mb-4">
              Browse and purchase for personal needs. Retail prices apply.
            </p>
            <div className="flex items-center text-primary font-semibold text-sm">
              Get Started <ChevronRight className="w-4 h-4 ml-2" />
            </div>
          </motion.button>

          {/* Wholesale Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAccountTypeSelect("wholesale")}
            className="p-8 bg-white border-2 border-primary rounded-lg text-left shadow-sm hover:shadow-md transition-all group"
          >
            <div className="mb-4">
              <div className="inline-block p-3 bg-primary rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-deep-ink mb-2">Wholesale Account</h3>
            <p className="text-muted text-sm mb-4">
              Schools, institutions & businesses get bulk pricing & MOV benefits.
            </p>
            <div className="flex items-center text-primary font-semibold text-sm">
              Apply Now <ChevronRight className="w-4 h-4 ml-2" />
            </div>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Step 1.5: Wholesale Type Selection
  if (step === "account-type" && selectedType === "wholesale" && wholesaleType === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto px-6"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-deep-ink mb-2">
            What type of wholesale account?
          </h2>
          <p className="text-muted">
            This helps us provide better support
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* School */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleWholesaleTypeSelect("school")}
            className="p-8 bg-white border-2 border-light-border rounded-lg text-left hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div className="text-3xl font-bold text-secondary mb-2">🏫</div>
            <h3 className="text-xl font-bold text-deep-ink mb-2">School/Institution</h3>
            <p className="text-muted text-sm">
              School bursars, canteens, hostels. Credit terms available.
            </p>
          </motion.button>

          {/* Business */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleWholesaleTypeSelect("business")}
            className="p-8 bg-white border-2 border-light-border rounded-lg text-left hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div className="text-3xl font-bold text-secondary mb-2">🏪</div>
            <h3 className="text-xl font-bold text-deep-ink mb-2">Business/Reseller</h3>
            <p className="text-muted text-sm">
              Shop owners, traders, resellers. Exclusive bulk discounts.
            </p>
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            setSelectedType(null);
            setStep("account-type");
          }}
          className="w-full mt-6 py-3 text-muted hover:text-deep-ink font-semibold transition-colors"
        >
          ← Back
        </motion.button>
      </motion.div>
    );
  }

  // Step 2: Form Details
  if (step === "details") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto px-6"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-deep-ink mb-2">
            {selectedType === "retail" ? "Create Your Account" : "Wholesale Application"}
          </h2>
          <p className="text-muted">
            {selectedType === "retail"
              ? "Join Canvus to start shopping"
              : "Tell us about your organization"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-deep-ink mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-deep-ink mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-deep-ink mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+254712345678"
              className="w-full px-4 py-3 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-deep-ink mb-2">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a strong password"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Conditional Fields for Wholesale */}
          {selectedType === "wholesale" && (
            <>
              <div className="border-t border-slate-200 pt-5 mt-5">
                <h3 className="font-semibold text-slate-900 mb-4">
                  {wholesaleType === "school" ? "School Information" : "Business Information"}
                </h3>

                {/* Institution/Business Name */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    {wholesaleType === "school" ? "School Name" : "Business Name"} *
                  </label>
                  <input
                    type="text"
                    name="institutionName"
                    value={formData.institutionName}
                    onChange={handleInputChange}
                    placeholder={
                      wholesaleType === "school"
                        ? "e.g., Meru High School"
                        : "e.g., ABC Trading Center"
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Your Role *
                  </label>
                  <select
                    name="repRole"
                    value={formData.repRole}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, repRole: e.target.value }));
                      setError(null);
                    }}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select your role</option>
                    {wholesaleType === "school" ? (
                      <>
                        <option value="Bursar">Bursar</option>
                        <option value="Finance Officer">Finance Officer</option>
                        <option value="Canteen Manager">Canteen Manager</option>
                        <option value="Procurement Officer">Procurement Officer</option>
                      </>
                    ) : (
                      <>
                        <option value="Owner">Owner</option>
                        <option value="Manager">Manager</option>
                        <option value="Storekeeper">Storekeeper</option>
                        <option value="Buyer">Buyer</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors mt-6"
          >
            {isLoading ? "Processing..." : selectedType === "retail" ? "Create Account" : "Submit Application"}
          </motion.button>

          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            type="button"
            onClick={() => {
              setSelectedType(null);
              setWholesaleType(null);
              setStep("account-type");
            }}
            className="w-full py-3 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
          >
            ← Back
          </motion.button>
        </form>
      </motion.div>
    );
  }

  // Step 3: Confirmation
  if (step === "confirmation") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl mx-auto px-6 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-600" />
        </motion.div>

        {selectedType === "retail" ? (
          <>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Account Created Successfully!
            </h2>
            <p className="text-slate-600 mb-8">
              Check your email to confirm your account. You can then start shopping on Canvus.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Application Submitted Successfully!
            </h2>
            <p className="text-slate-600 mb-4">
              Your application for a Canvus Wholesale account is being reviewed.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
              <p className="text-emerald-900">
                📱 <strong>We will contact you via WhatsApp</strong> at{" "}
                <span className="font-semibold">{formData.phone}</span> to verify your details
                and activate your wholesale account.
              </p>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Expected timeframe: 24-48 hours
            </p>
          </>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setStep("account-type");
            setSelectedType(null);
            setWholesaleType(null);
            setFormData({
              name: "",
              email: "",
              phone: "",
              password: "",
              institutionName: "",
              repRole: "",
            });
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          {selectedType === "retail" ? "Go to Login" : "Back to Home"}
        </motion.button>
      </motion.div>
    );
  }

  return null;
}
