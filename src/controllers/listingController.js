import Listing from "../models/Listing.js";
import mongoose from "mongoose";

// Function to get GridFS bucket
const getBucket = () => {
  const db = mongoose.connection.db;
  return new mongoose.mongo.GridFSBucket(db, {
    bucketName: "images"
  });
};

/** Create listing (TEXT DATA ONLY) */
export const createListing = async (req, res, next) => {
  try {
    // Add the user ID from the authenticated user
    const listingData = {
      ...req.body,
      userRef: req.user.userId
    };
    
    const listing = await Listing.create(listingData);
    return res.status(201).json({
      success: true,
      message: "Listing created successfully",
      listingId: listing._id,
      listing,
    });
  } catch (err) {
    next(err);
  }
};

/** Get all listings */
export const getListings = async (req, res, next) => {
  try {
    let query = {};
    
    // If user is a seller, only show their own listings
    if (req.user && req.user.role === 'seller') {
      query = { userRef: req.user.userId };
    }
    
    const listings = await Listing.find(query).sort({ createdAt: -1 });

    // Add image URLs with safe handling for undefined images
    const listingsWithImages = listings.map(listing => {
      const listingObj = listing.toObject();
      
      // Safely handle images array - use empty array if undefined
      const images = Array.isArray(listingObj.images) ? listingObj.images : [];
      
      // Generate proper image URLs
      const imageUrls = images.map(imgId => {
        // If it's already a URL (from previous uploads), return as is
        if (typeof imgId === 'string' && imgId.startsWith('http')) {
          return imgId;
        }
        // If it's an ObjectId, generate the proper URL
        return `${req.protocol}://${req.get("host")}/api/listings/image/${imgId}`;
      });
      
      return {
        ...listingObj,
        images: imageUrls
      };
    });

    return res.json({
      success: true,
      message: "Listings retrieved successfully",
      listings: listingsWithImages,
    });
  } catch (err) {
    next(err);
  }
};

/** Get single listing */
export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    // Add image URLs with safe handling
    const listingObj = listing.toObject();
    const images = Array.isArray(listingObj.images) ? listingObj.images : [];
    
    // Generate proper image URLs
    const imageUrls = images.map(imgId => {
      // If it's already a URL (from previous uploads), return as is
      if (typeof imgId === 'string' && imgId.startsWith('http')) {
        return imgId;
      }
      // If it's an ObjectId, generate the proper URL
      return `${req.protocol}://${req.get("host")}/api/listings/image/${imgId}`;
    });
    
    const listingWithImages = {
      ...listingObj,
      images: imageUrls
    };

    return res.json({
      success: true,
      message: "Listing retrieved successfully",
      listing: listingWithImages,
    });
  } catch (err) {
    next(err);
  }
};

/** Update listing (TEXT DATA ONLY) */
export const updateListing = async (req, res, next) => {
  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedListing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    return res.json({
      success: true,
      message: "Listing updated successfully",
      listing: updatedListing,
    });
  } catch (err) {
    next(err);
  }
};

/** Delete listing */
export const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }
    
    // Safely handle images array
    const images = Array.isArray(listing.images) ? listing.images : [];
    
    // Delete associated images from GridFS
    if (images.length > 0) {
      const bucket = getBucket();
      for (const imageId of images) {
        try {
          await bucket.delete(new mongoose.Types.ObjectId(imageId));
        } catch (deleteError) {
          console.error(`Error deleting image ${imageId}:`, deleteError);
          // Continue with other images even if one fails
        }
      }
    }
    
    // Delete the listing
    await Listing.findByIdAndDelete(req.params.id);
    
    return res.json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/** Upload images to MongoDB GridFS */
export const uploadImages = async (req, res, next) => {
  try {
    const { listingId } = req.params;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: "listingId is required",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    // Get file IDs from uploaded files
    const fileIds = req.files.map(file => file.id);

    // Update listing with image IDs (not URLs)
    const updatedListing = await Listing.findByIdAndUpdate(
      listingId,
      { $push: { images: { $each: fileIds } } },
      { new: true, runValidators: true }
    );

    if (!updatedListing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    return res.json({
      success: true,
      message: "Images uploaded successfully",
      fileIds: fileIds,
      listing: updatedListing,
    });
  } catch (err) {
    next(err);
  }
};

/** Delete images from MongoDB GridFS */
export const deleteImages = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const { imageIds } = req.body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Image IDs array is required",
      });
    }

    // Delete files from GridFS
    const bucket = getBucket();
    for (const imageId of imageIds) {
      try {
        await bucket.delete(new mongoose.Types.ObjectId(imageId));
      } catch (deleteError) {
        console.error(`Error deleting image ${imageId}:`, deleteError);
        // Continue with other images
      }
    }

    // Remove image references from listing
    const updatedListing = await Listing.findByIdAndUpdate(
      listingId,
      { $pull: { images: { $in: imageIds } } },
      { new: true }
    );

    if (!updatedListing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    return res.json({
      success: true,
      message: "Images deleted successfully",
      listing: updatedListing,
    });
  } catch (err) {
    next(err);
  }
};

/** Get image from MongoDB GridFS */
export const getImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // ✅ NEW VALIDATION: Check if ID is null or invalid
    if (!id || id === 'null' || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        message: "Invalid image ID" 
      });
    }
    
    const bucket = getBucket();
    
    // Find the file to get its content type
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(id) }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }
    
    // Set proper content type header
    res.set('Content-Type', files[0].contentType || 'image/jpeg');
    
    // Stream the image to the response
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(id));
    
    downloadStream.on("data", (chunk) => {
      res.write(chunk);
    });
    
    downloadStream.on("error", (err) => {
      if (!res.headersSent) {
        res.status(404).json({ message: "Image not found" });
      }
    });
    
    downloadStream.on("end", () => {
      res.end();
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ message: "Error fetching image" });
  }
};