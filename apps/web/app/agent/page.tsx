'use client';

import { AgentChat } from '../../components/agent-chat';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft } from 'lucide-react';

export default function AgentPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="mb-4 w-full max-w-2xl">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </Button>
      </div>

      <AgentChat />

      <div className="mt-6 text-xs text-muted-foreground text-center max-w-2xl">
        <p className="mb-2">
          This agent uses OpenAI&apos;s Agents SDK with three specialized
          agents:
        </p>
        <div className="flex flex-wrap gap-2 justify-center text-left">
          <div className="bg-muted px-3 py-2 rounded-md">
            <strong className="text-foreground">Triage Agent</strong>
            <p className="text-xs mt-0.5">Routes questions</p>
          </div>
          <div className="bg-muted px-3 py-2 rounded-md">
            <strong className="text-foreground">History Tutor</strong>
            <p className="text-xs mt-0.5">Historical queries</p>
          </div>
          <div className="bg-muted px-3 py-2 rounded-md">
            <strong className="text-foreground">Math Tutor</strong>
            <p className="text-xs mt-0.5">Math problems</p>
          </div>
        </div>
      </div>
    </div>
  );
}
