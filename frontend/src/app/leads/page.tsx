"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLeads } from "@/lib/api";

interface Lead {
  id: number;
  name: string | null;
  email: string | null;
  score: number;
  status: string;
  interested_property_type: string | null;
  interested_city: string | null;
  budget: number | null;
  notes: string | null;
  source: string;
}

function getScoreColor(score: number) {
  if (score >= 75) return "bg-red-500";
  if (score >= 50) return "bg-orange-500";
  if (score >= 26) return "bg-blue-500";
  return "bg-gray-400";
}

function getStatusLabel(score: number) {
  if (score >= 75) return "Fire";
  if (score >= 50) return "Hot";
  if (score >= 26) return "Warm";
  return "Cold";
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLeads() {
      try {
        const data = await getLeads();
        setLeads(data);
      } catch (err) {
        setError("Failed to load leads");
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <p className="text-muted-foreground">Loading leads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage your potential buyers
        </p>
      </div>

      {leads.length === 0 ? (
        <p className="text-muted-foreground">
          No leads yet. Leads will appear here when created.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {lead.name || `Lead #${lead.id}`}
                  </CardTitle>
                  <Badge variant="outline">{getStatusLabel(lead.score)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Lead Score</span>
                    <span className="font-bold">{lead.score}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreColor(lead.score)}`}
                      style={{ width: `${lead.score}%` }}
                    />
                  </div>
                </div>

                <div className="text-sm space-y-1">
                  {lead.interested_property_type && (
                    <p>
                      <span className="text-muted-foreground">Type: </span>
                      {lead.interested_property_type}
                    </p>
                  )}
                  {lead.interested_city && (
                    <p>
                      <span className="text-muted-foreground">City: </span>
                      {lead.interested_city}
                    </p>
                  )}
                  {lead.budget && (
                    <p>
                      <span className="text-muted-foreground">Budget: </span>
                      ${lead.budget.toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Source: {lead.source}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
