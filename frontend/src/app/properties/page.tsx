"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, DollarSign } from "lucide-react";
import { getProperties } from "@/lib/api";

interface Property {
  id: number;
  title: string;
  address: string;
  city: string;
  state: string;
  price: number | null;
  square_footage: number | null;
  cap_rate: number | null;
  property_type: string;
  status: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProperties() {
      try {
        const data = await getProperties();
        setProperties(data);
      } catch (err) {
        setError("Failed to load properties");
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <p className="text-muted-foreground">Loading properties...</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
        <p className="text-muted-foreground mt-1">
          Manage your commercial real estate inventory
        </p>
      </div>

      {properties.length === 0 ? (
        <p className="text-muted-foreground">No properties found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">
                    {property.title}
                  </CardTitle>
                  <Badge
                    variant={
                      property.status === "available" ? "default" : "secondary"
                    }
                  >
                    {property.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {property.address}, {property.city}, {property.state}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold">
                    {property.price
                      ? `$${property.price.toLocaleString()}`
                      : "Price on request"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {property.square_footage
                      ? `${property.square_footage.toLocaleString()} sqft`
                      : "N/A"}
                  </div>
                  <span>
                    Cap Rate:{" "}
                    {property.cap_rate ? `${property.cap_rate}%` : "N/A"}
                  </span>
                </div>

                <div className="pt-2">
                  <Badge variant="outline">{property.property_type}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
