import { z } from "zod";

const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const bothOrNeitherCoords = (data: {
  originCoords?: unknown;
  destCoords?: unknown;
}) => (data.originCoords == null) === (data.destCoords == null);

export const loadCreateSchema = z
  .object({
    originCity: z.string().min(1, "Origin city is required"),
    originState: z.string().min(1, "Origin state is required"),
    destCity: z.string().min(1, "Destination city is required"),
    destState: z.string().min(1, "Destination state is required"),
    originCoords: coordinateSchema,
    destCoords: coordinateSchema,
    cargoType: z.string().min(1, "Cargo type is required"),
    weightKg: z.number().positive("Weight must be positive"),
    budget: z.number().positive("Budget must be positive"),
    pickupDate: z.coerce.date(),
    deliveryDeadline: z.coerce.date(),
    description: z.string().optional(),
  })
  .refine((data) => data.deliveryDeadline > data.pickupDate, {
    message: "Delivery deadline must be after pickup date",
    path: ["deliveryDeadline"],
  });

export const loadUpdateSchema = z
  .object({
    originCity: z.string().min(1).optional(),
    originState: z.string().min(1).optional(),
    destCity: z.string().min(1).optional(),
    destState: z.string().min(1).optional(),
    originCoords: coordinateSchema.optional(),
    destCoords: coordinateSchema.optional(),
    cargoType: z.string().min(1).optional(),
    weightKg: z.number().positive().optional(),
    budget: z.number().positive().optional(),
    pickupDate: z.coerce.date().optional(),
    deliveryDeadline: z.coerce.date().optional(),
    description: z.string().optional(),
    status: z
      .enum(["PENDING", "BOOKED", "IN_TRANSIT", "DELIVERED", "CANCELLED"])
      .optional(),
  })
  .refine(bothOrNeitherCoords, {
    message: "originCoords and destCoords must be provided together",
    path: ["destCoords"],
  });

export const journeyCreateSchema = z.object({
  originCity: z.string().min(1, "Origin city is required"),
  originState: z.string().min(1, "Origin state is required"),
  destCity: z.string().min(1, "Destination city is required"),
  destState: z.string().min(1, "Destination state is required"),
  originCoords: coordinateSchema,
  destCoords: coordinateSchema,
  departureDate: z.coerce.date(),
  availableCapacityKg: z.number().positive("Capacity must be positive"),
  truckType: z.string().min(1, "Truck type is required"),
  askingPricePerKg: z.number().positive("Price must be positive"),
});

export const journeyUpdateSchema = z
  .object({
    originCity: z.string().min(1).optional(),
    originState: z.string().min(1).optional(),
    destCity: z.string().min(1).optional(),
    destState: z.string().min(1).optional(),
    originCoords: coordinateSchema.optional(),
    destCoords: coordinateSchema.optional(),
    departureDate: z.coerce.date().optional(),
    availableCapacityKg: z.number().positive().optional(),
    truckType: z.string().min(1).optional(),
    askingPricePerKg: z.number().positive().optional(),
    status: z
      .enum(["AVAILABLE", "MATCHED", "IN_TRANSIT", "COMPLETED", "CANCELLED"])
      .optional(),
  })
  .refine(bothOrNeitherCoords, {
    message: "originCoords and destCoords must be provided together",
    path: ["destCoords"],
  });
