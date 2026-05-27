import asyncHandler from '../utils/asyncHandler.js';
import Property from '../models/Property.js';

// ─── Allowed amenity values (mirrors the schema enum) ────────────────────────
const VALID_AMENITIES = [
  'wifi', 'parking', 'furnished', 'ac', 'gym',
  'pool', 'security', 'lift', 'power_backup', 'garden',
];

const VALID_TYPES = ['apartment', 'house', 'villa', 'studio', 'pg', 'commercial'];

// ─── Helper: build the filter query from request query params ─────────────────
const buildFilterQuery = (query) => {
  const filter = {};

  if (query.city)        filter.city        = { $regex: query.city, $options: 'i' };
  if (query.type)        filter.type        = query.type.toLowerCase();
  if (query.available !== 'all') filter.availability = true; // default show available

  // Price range
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  // Bedrooms
  if (query.bedrooms) filter.bedrooms = { $gte: Number(query.bedrooms) };

  return filter;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new property listing
// @route   POST /api/properties
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const createProperty = asyncHandler(async (req, res) => {
  const {
    title, description, type, price,
    address, bedrooms, bathrooms, amenities,
    images, availability, location,
  } = req.body;

  // ── Required field validation ─────────────────────────────────────────────
  if (!title || !description || !type || !price) {
    res.status(400);
    throw new Error('Title, description, type, and price are required');
  }
  if (!address?.city || !address?.state || !address?.country) {
    res.status(400);
    throw new Error('Address (city, state, country) is required');
  }
  if (bedrooms === undefined || bathrooms === undefined) {
    res.status(400);
    throw new Error('Bedrooms and bathrooms are required');
  }
  if (!VALID_TYPES.includes(type.toLowerCase())) {
    res.status(400);
    throw new Error(`Invalid property type. Valid: ${VALID_TYPES.join(', ')}`);
  }

  // ── Sanitise amenities — ignore unknown values ────────────────────────────
  const cleanAmenities = Array.isArray(amenities)
    ? amenities.filter((a) => VALID_AMENITIES.includes(a))
    : [];

  // Validate location if provided
  let cleanLocation;
  if (location?.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    cleanLocation = { type: 'Point', coordinates: location.coordinates };
  }

  const property = await Property.create({
    title:       title.trim(),
    description: description.trim(),
    type:        type.toLowerCase(),
    price:       Number(price),
    address,
    bedrooms:    Number(bedrooms),
    bathrooms:   Number(bathrooms),
    amenities:   cleanAmenities,
    images:      Array.isArray(images) ? images : [],
    availability: availability !== false,
    owner:       req.user._id,
    ...(cleanLocation && { location: cleanLocation }),
  });

  res.status(201).json({
    success: true,
    message: 'Property listed successfully',
    data: { property },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all properties (with filters & pagination)
// @route   GET /api/properties
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getProperties = asyncHandler(async (req, res) => {
  const filter = buildFilterQuery(req.query);

  // Pagination
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.min(50, Number(req.query.limit) || 12);
  const skip  = (page - 1) * limit;

  // Sort
  const sortMap = {
    'price_asc':  { price:  1 },
    'price_desc': { price: -1 },
    'newest':     { createdAt: -1 },
    'rating':     { rating: -1 },
  };
  const sort = sortMap[req.query.sort] || { createdAt: -1 };

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('owner', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Property.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Properties fetched successfully',
    data: {
      count:      properties.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      properties,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get a single property by ID
// @route   GET /api/properties/:id
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getSingleProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id)
    .populate('owner', 'name avatar email phone')
    .lean();

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
// @desc    Get all properties listed by the logged-in owner
// @route   GET /api/properties/owner/my-properties
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getOwnerProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: 'Your properties fetched successfully',
    data: { count: properties.length, properties },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update a property listing
// @route   PUT /api/properties/:id
// @access  Private (owner of property / admin)
// ─────────────────────────────────────────────────────────────────────────────
const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  // ── Ownership check (admin can bypass) ───────────────────────────────────
  if (
    req.user.role !== 'admin' &&
    property.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized — you do not own this property');
  }

  const allowed = [
    'title', 'description', 'type', 'price', 'address',
    'bedrooms', 'bathrooms', 'amenities', 'images', 'availability',
  ];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      property[field] = req.body[field];
    }
  });

  // Handle location update separately to validate GeoJSON structure
  if (req.body.location?.coordinates && Array.isArray(req.body.location.coordinates) && req.body.location.coordinates.length === 2) {
    property.location = { type: 'Point', coordinates: req.body.location.coordinates };
  }

  const updated = await property.save();

  res.status(200).json({
    success: true,
    message: 'Property updated successfully',
    data: { property: updated },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a property listing
// @route   DELETE /api/properties/:id
// @access  Private (owner of property / admin)
// ─────────────────────────────────────────────────────────────────────────────
const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  if (
    req.user.role !== 'admin' &&
    property.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized — you do not own this property');
  }

  await property.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Property deleted successfully',
    data: {},
  });
});

export {
  createProperty,
  getProperties,
  getSingleProperty,
  getOwnerProperties,
  updateProperty,
  deleteProperty,
};
