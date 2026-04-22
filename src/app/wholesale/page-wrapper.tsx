"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { getUserProfile, canAccessWholesale } from "@/lib/wholesale-profile";
import { WholesalerLocked } from "@/components/wholesale/wholesaler-locked";
import WholesalePortal from "./wholesale-portal";
import { motion } from "framer-motion";

export default function WholesalePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      try {
        if (!user) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        const profile = await getUserProfile(user.id);
        const access = canAccessWholesale(profile);
        setHasAccess(access);
      } catch (error) {
        console.error("Error checking wholesale access:", error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-slate-300 border-t-emerald-600 rounded-full"
        />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <WholesalerLocked
        onApplySuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    );
  }

  return <WholesalePortal />;
}
