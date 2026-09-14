import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Users,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  ArrowRight,
  Calendar,
  FileText,
  UserPlus,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge, severityTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  useActivityFeed,
  useAllAssessments,
  useClinicalStats,
  usePatients,
} from "@/features/clinical/clinicalStore";
import {
  assessmentScore,
  assessmentSeverity,
  formatDate,
  formatDateTime,
} from "@/features/clinical/derive";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · NeuroPharm Assist" },
      {
        name: "description",
        content:
          "Clinical overview: active caseload, DN4 assessments, severe cases, and upcoming follow-ups.",
      },
      { property: "og:title", content: "Clinical Dashboard · NeuroPharm Assist" },
      {
        property: "og:description",
        content: "Pharmacist workflow overview for neuropathic pain management.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const ACTIVITY_ICON = {
  assessment: ClipboardCheck,
  report: FileText,
  patient: UserPlus,
} as const;

const ACTIVITY_TONE = {
  assessment: "bg-success/10 text-success",
  report: "bg-primary-soft text-primary",
  patient: "bg-info/10 text-info",
} as const;

function DashboardPage() {
  const stats = useClinicalStats();
  const assessments = useAllAssessments();
  const patients = usePatients();
  const activity = useActivityFeed(6);

  const recent = assessments.slice(0, 6);
  const upcoming = patients
    .filter((p) => p.nextFollowUp)
    .sort((a, b) => (a.nextFollowUp ?? "").localeCompare(b.nextFollowUp ?? ""))
    .slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Clinical Research Overview"
        title="Patient Assessments & medication-care activity"
        description={`${stats.totalAssessments} assessments recorded across ${stats.totalPatients} patients.`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/patients">
                <Users className="h-4 w-4" />
                View patients
              </Link>
            </Button>
            <Button asChild>
              <Link to="/assessments/new">
                <ClipboardCheck className="h-4 w-4" />
                New assessment
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active patients"
          value={stats.activePatients}
          icon={Users}
          hint={`${stats.totalPatients} total records`}
          accent="primary"
          delay={0}
        />
        <StatCard
          label="Assessments recorded"
          value={stats.totalAssessments}
          icon={ClipboardCheck}
          hint={`${stats.positiveRate}% DN4-positive`}
          accent="warning"
          delay={0.05}
        />
        <StatCard
          label="Severe cases (DN4 ≥ 7)"
          value={stats.severeCases}
          icon={AlertTriangle}
          hint="Priority intervention"
          accent="critical"
          delay={0.1}
        />
        <StatCard
          label="Follow-ups scheduled"
          value={stats.followUps}
          icon={Calendar}
          hint="Upcoming reviews"
          accent="info"
          delay={0.15}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard
            title="Recent assessments"
            description="Latest DN4 questionnaires across your caseload"
            padded={false}
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/reports">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            }
          >
            {recent.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No assessments recorded yet. Start a new assessment to populate your dashboard.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {recent.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                      {a.patientSnapshot.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to="/patients/$id"
                          params={{ id: a.patientId }}
                          className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {a.patientSnapshot.fullName}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          · {a.patientSnapshot.mrn}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(a.assessmentDate)} · {a.pharmacist}
                      </p>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          DN4
                        </p>
                        <p className="text-lg font-semibold tabular-nums text-foreground">
                          {assessmentScore(a)}
                          <span className="text-xs font-normal text-muted-foreground">/10</span>
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone={severityTone(assessmentSeverity(a))} className="capitalize">
                      {assessmentSeverity(a)}
                    </StatusBadge>
                  </motion.div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Upcoming follow-ups" description="Scheduled patient reviews">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((p) => (
                  <li key={p.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md bg-info/10 text-info">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/patients/$id"
                        params={{ id: p.id }}
                        className="block truncate text-sm font-medium text-foreground hover:text-primary"
                      >
                        {p.firstName} {p.lastName}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDate(p.nextFollowUp)} · {p.primaryDiagnosis}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Activity" description="Most recent clinical events">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-4">
                {activity.map((item) => {
                  const Icon = ACTIVITY_ICON[item.kind] ?? Activity;
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <div
                        className={`flex h-8 w-8 flex-none items-center justify-center rounded-md ${ACTIVITY_TONE[item.kind]}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.detail} · {formatDateTime(item.at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
