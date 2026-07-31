import type { Metadata } from "next";
import { ApplicationForm } from "@/components/applications/application-form";
import { createApplication } from "@/actions/applications";
import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = {
  title: "New application",
};

export default function NewApplicationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackLink href="/dashboard/applications">← Applications</BackLink>
        <h1 className="mt-2 font-display-md text-ink tracking-tight">
          New application
        </h1>
      </div>
      <ApplicationForm
        action={createApplication}
        submitLabel="Create"
        cancelHref="/dashboard/applications"
      />
    </div>
  );
}
