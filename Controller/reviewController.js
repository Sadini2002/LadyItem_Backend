import Review from "../model/review.js";

// Get all reviews (for Admin)
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
};

// Get reviews for a specific product (Customer page)
export const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({
      productId: productId,
      status: "Approved",
    }).sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product reviews", error: error.message });
  }
};

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { productId, productName, reviewerName, reviewerEmail, rating, title, comment } = req.body;

    if (!productId || !reviewerName || !title || !comment) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const newReview = new Review({
      productId,
      productName: productName || "Product",
      reviewerName,
      reviewerEmail: reviewerEmail || "",
      rating: Number(rating) || 5,
      title,
      comment,
      status: "Approved",
      isVerified: true,
      date: new Date(),
    });

    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (error) {
    res.status(500).json({ message: "Failed to submit review", error: error.message });
  }
};

// Update review status (Approved / Pending / Hidden)
export const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({ message: "Review status updated", review: updatedReview });
  } catch (error) {
    res.status(500).json({ message: "Failed to update review status", error: error.message });
  }
};

// Post seller response to a review
export const addAdminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { adminReply: reply },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({ message: "Reply added successfully", review: updatedReview });
  } catch (error) {
    res.status(500).json({ message: "Failed to add reply", error: error.message });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReview = await Review.findByIdAndDelete(id);

    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete review", error: error.message });
  }
};
