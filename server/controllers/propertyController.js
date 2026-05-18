import asyncHandler from '../utils/asyncHandler.js';
import Property from '../models/Property.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new property listing
// @route   POST /api/properties
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const createProperty = asyncHandler(async (req, res) => {
  // TODO (Day 5): validate input, set owner = req.user._id, save property
  res.status(201).json({
    success: true,
    message: 'createProperty — coming soon',
    data: {},
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all property listings (with filters, pagination)
// @route   GET /api/properties
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getProperties = asyncHandler(async (req, res) => {
  // TODO (Day 5): query params → filter, sort, paginate
  const properties = await Property.find({ availability: true }).lean();

  res.status(200).json({
    success: true,
    message: 'Properties fetched successfully',
    data: { count: properties.length, properties },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get a single property by ID
// @route   GET /api/properties/:id
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getSingleProperty = asyncHandler(async (req, res) => {
  // TODO (Day 5): populate owner, populate reviews
  const property = await Property.findById(req.params.id).lean();

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  res.status(200).json({
    success: true,
    message: 'Property fetched successfully',
    data: { property },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update a property listing
// @route   PUT /api/properties/:id
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const updateProperty = asyncHandler(async (req, res) => {
  // TODO (Day 5): verify ownership, validate, update
  res.status(200).json({
    success: true,
    message: 'updateProperty — coming soon',
    data: {},
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a property listing
// @route   DELETE /api/properties/:id
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const deleteProperty = asyncHandler(async (req, res) => {
  // TODO (Day 5): verify ownership, delete, cascade to bookings/reviews
  res.status(200).json({
    success: true,
    message: 'deleteProperty — coming soon',
    data: {},
  });
});

export {
  createProperty,
  getProperties,
  getSingleProperty,
  updateProperty,
  deleteProperty,
};
