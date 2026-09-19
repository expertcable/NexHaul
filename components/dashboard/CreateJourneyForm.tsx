"use client";

import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, Navigation, Truck, Calendar, DollarSign, MapPin, Trash2 } from "lucide-react";

export function CreateJourneyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Indian logistics trucker route defaults
  const [originCity, setOriginCity] = useState("Kochi");
  const [originState, setOriginState] = useState("KL");
  const [destCity, setDestCity] = useState("Trivandrum");
  const [destState, setDestState] = useState("KL");
  const [dropPoints, setDropPoints] = useState<string[]>(["Kollam", "Alappuzha"]);
  const [newDropPoint, setNewDropPoint] = useState("");
  const [departureDate, setDepartureDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [availableCapacityKg, setAvailableCapacityKg] = useState("12000");
  const [truckType, setTruckType] = useState("Ice Truck / Refrigerated");
  const [price, setPrice] = useState("18000");

  const handleAddDropPoint = () => {
    if (newDropPoint.trim() && !dropPoints.includes(newDropPoint.trim())) {
      setDropPoints([...dropPoints, newDropPoint.trim()]);
      setNewDropPoint("");
    }
  };

  const handleRemoveDropPoint = (index: number) => {
    setDropPoints(dropPoints.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // PostGIS Indian spatial coordinates
      const originLat = 9.9312;
      const originLng = 76.2673;
      const destLat = 8.5241;
      const destLng = 76.9366;

      const formattedDate = new Date(departureDate || Date.now()).toISOString();
      const numPrice = parseFloat(price) || 18000;
      const numCap = parseFloat(availableCapacityKg) || 12000;

      const payload = {
        originCity,
        originState,
        destCity,
        destState,
        dropPoints,
        originCoords: { lat: originLat, lng: originLng },
        destCoords: { lat: destLat, lng: destLng },
        originLat,
        originLng,
        destLat,
        destLng,
        departureDate: formattedDate,
        availableCapacityKg: numCap,
        truckType,
        price: numPrice,
        askingPricePerKg: numCap > 0 ? parseFloat((numPrice / numCap).toFixed(2)) : 15.0,
      };

      const liveParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : searchParams;
      const url = "/api/journeys";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error: ${res.statusText}`);
      }

      setIsOpen(false);
      setOriginCity("");
      setOriginState("");
      setDestCity("");
      setDestState("");
      setDropPoints([]);
      setAvailableCapacityKg("");
      setPrice("");

      router.refresh();
    } catch (err: any) {
      console.error("Failed to post journey:", err);
      setError(err.message || "An unexpected error occurred while posting route");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-xl my-auto rounded-2xl border border-white/[0.08] bg-[#0E131F] p-7 text-white shadow-2xl shadow-black/40">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/15 p-2.5 text-cyan-400 border border-cyan-500/30 shadow-sm">
              <Navigation className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Post Trucker Route (Journey)</h3>
              <p className="text-xs text-zinc-400">Publish active capacity, set manual pricing & intermediate drop points</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-9 w-9 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="originCity" className="text-xs font-semibold text-slate-300">Departure City</Label>
              <Input
                id="originCity"
                required
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                placeholder="e.g. Kochi"
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl text-sm px-4 shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originState" className="text-xs font-semibold text-slate-300">State Code</Label>
              <Input
                id="originState"
                required
                maxLength={4}
                value={originState}
                onChange={(e) => setOriginState(e.target.value.toUpperCase())}
                placeholder="KL"
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl font-mono text-center uppercase text-sm shadow-inner"
              />
            </div>
          </div>

          {/* Dynamic Drop Points / Waypoints Section */}
          <div className="rounded-xl bg-[#07090E] border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Intermediate Drop Points / Waypoints
              </Label>
              <span className="text-[11px] text-slate-400">Stops along the route</span>
            </div>

            <div className="flex gap-2">
              <Input
                value={newDropPoint}
                onChange={(e) => setNewDropPoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddDropPoint();
                  }
                }}
                placeholder="Add stop (e.g. Kollam, Alappuzha)"
                className="bg-[#0E131F] border-white/10 text-white focus:ring-cyan-500 h-10 rounded-xl text-sm px-3 shadow-inner"
              />
              <Button
                type="button"
                onClick={handleAddDropPoint}
                className="h-10 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Stop
              </Button>
            </div>

            {dropPoints.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {dropPoints.map((pt, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
                  >
                    <span>{pt}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDropPoint(idx)}
                      className="text-cyan-400 hover:text-white p-0.5 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="destCity" className="text-xs font-semibold text-slate-300">Final Destination City</Label>
              <Input
                id="destCity"
                required
                value={destCity}
                onChange={(e) => setDestCity(e.target.value)}
                placeholder="e.g. Trivandrum"
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl text-sm px-4 shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destState" className="text-xs font-semibold text-slate-300">State Code</Label>
              <Input
                id="destState"
                required
                maxLength={4}
                value={destState}
                onChange={(e) => setDestState(e.target.value.toUpperCase())}
                placeholder="KL"
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl font-mono text-center uppercase text-sm shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="truckType" className="text-xs font-semibold text-slate-300">Truck / Vehicle Type</Label>
              <select
                id="truckType"
                value={truckType}
                onChange={(e) => setTruckType(e.target.value)}
                className="w-full bg-[#07090E] border border-white/10 text-white focus:ring-2 focus:ring-cyan-500 h-11 rounded-xl text-sm px-3 shadow-inner outline-none transition-all cursor-pointer"
              >
                <option value="Ice Truck / Refrigerated">Ice Truck / Refrigerated</option>
                <option value="Dry Van">Dry Van</option>
                <option value="Flatbed">Flatbed</option>
                <option value="Container">Container</option>
                <option value="16-Wheel Heavy Trailer (32 MT)">16-Wheel Heavy Trailer (32 MT)</option>
                <option value="Liquid Tanker">Liquid Tanker</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-cyan-400" /> Set Route Price (₹ INR)
              </Label>
              <Input
                id="price"
                type="number"
                min="500"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="18000"
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl font-mono text-sm px-4 shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="departureDate" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" /> Departure Date
              </Label>
              <Input
                id="departureDate"
                type="date"
                required
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl text-sm px-4 shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availableCapacityKg" className="text-xs font-semibold text-slate-300">Available Capacity (KG)</Label>
              <Input
                id="availableCapacityKg"
                type="number"
                min="1"
                required
                value={availableCapacityKg}
                onChange={(e) => setAvailableCapacityKg(e.target.value)}
                placeholder="12000"
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl font-mono text-sm px-4 shadow-inner"
              />
            </div>
          </div>

          {error && <p className="text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="border-white/10 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl h-11 px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-7 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-semibold shadow-lg shadow-cyan-500/20 text-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing Route...
                </>
              ) : (
                "Publish Trucker Route"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 border border-white/[0.08] transition-all flex items-center justify-center gap-2 flex-shrink-0 hover:scale-[1.02] active:scale-[0.98] w-full"
      >
        <Plus className="h-4 w-4 text-white" />
        Post Your Route
      </Button>

      {isOpen && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}
