import express from "express";
import {
  getReviews,
  getReviewsByProduct,
  createReview,
  updateReviewStatus,
  addAdminReply,
  deleteReview,
} from "../Controller/reviewController.js";

const reviewRouter = express.Router();

// Public routes
reviewRouter.get("/product/:productId", getReviewsByProduct);
reviewRouter.post("/", createReview);

// Admin routes
reviewRouter.get("/", getReviews);
reviewRouter.put("/:id/status", updateReviewStatus);
reviewRouter.post("/:id/reply", addAdminReply);
reviewRouter.delete("/:id", deleteReview);

export default reviewRouter;
