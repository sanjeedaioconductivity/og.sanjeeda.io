"use client";

import CandidateApplicationForm from "@/app/candidate/component/CandidateApplicationForm";
import CandidateAttendance from "@/app/candidate/component/CandidateAttendance";
import CandidateDashboardHome from "@/app/candidate/component/CandidateDashboardHome";
import MyCourses from "@/app/candidate/component/MyCourses";
import OfferedPrograms from "@/app/candidate/component/OfferedPrograms";
import CandidateProfile from "@/app/candidate/component/CandidateProfile";
import CandidatePageHeader from "@/app/candidate/component/CandidatePageHeader";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTabParam } from "@/lib/portal/useTabParam";
import CandidateShell, {
  CANDIDATE_NAV_LABELS,
  MenuButton,
} from "@/app/candidate/component/CandidateShell";

export default function CandidateDashboardPage() {
  const [active, selectTab, tabReady] = useTabParam(
    "candidateTab",
    CANDIDATE_NAV_LABELS,
    "Dashboard"
  );
  const [profileOpen, setProfileOpen] = useState(false);

  // Profile is a side panel, not a tab — anywhere that used to send "Profile"
  // to selectTab (the chip's menu, the Dashboard's own profile row) opens the
  // panel instead, so it stays a single interception point.
  function handleNav(label: string) {
    if (label === "Profile") {
      setProfileOpen(true);
      return;
    }
    selectTab(label);
  }

  return (
    <CandidateShell active={active} onNav={handleNav}>
      {(openMenu) => (
        <>
          <CandidatePageHeader
            title={active}
            menuSlot={<MenuButton onClick={openMenu} />}
            accountSlot={null}
          />

          {!tabReady ? (
            <div className="grid place-items-center p-16 text-slate-300 dark:text-slate-600">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : active === "Dashboard" ? (
            <CandidateDashboardHome onNav={handleNav} />
          ) : active === "Attendance" ? (
            <CandidateAttendance />
          ) : active === "My Courses" ? (
            <MyCourses />
          ) : active === "Offered Programs" ? (
            <OfferedPrograms />
          ) : (
            <CandidateApplicationForm />
          )}

          {profileOpen && <CandidateProfile onClose={() => setProfileOpen(false)} />}
        </>
      )}
    </CandidateShell>
  );
}
