import { Express } from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Appointment Booking API",
      version: "1.0.0",
      description: "REST API for Appointment Booking System"
    },
    servers: [{ url: "http://localhost:5000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: ["src/routes/*.ts"]
};

export const setupSwagger = (app: Express) => {
  const specs = swaggerJsDoc(options);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));
};
