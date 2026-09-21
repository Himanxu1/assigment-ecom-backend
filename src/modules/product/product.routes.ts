import { Router } from "express";

import { authenticate, requireApprovedVendor } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as productController from "./product.controller.js";
import { createProductSchema, updateProductSchema } from "./product.schema.js";

export const productRoutes = Router();

productRoutes.use(authenticate, requireApprovedVendor);

productRoutes.get("/", productController.listOwnProducts);
productRoutes.post("/", validate(createProductSchema), productController.createProduct);
productRoutes.patch("/:id", validate(updateProductSchema), productController.updateProduct);
productRoutes.delete("/:id", productController.deleteProduct);
