import asyncHandler from '../utils/asyncHandler.js';
import Property from '../models/Property.js';
import { uploadImages, deleteImage, deleteImages } from '../services/cloudinaryService.js';

// ─── Allowed amenity values (mirrors the schema enum) ────────────────────────
const VALID_AMENITIES = [
  'wifi', 'parking', 'furnished', 'ac', 'gym',
  'pool', 'security', 'lift', 'power_backup', 'garden',
];

const VALID_TYPES = ['apartment', 'house', 'villa', 'studio', 'pg', 'commercial'];

// ─── Helper: build the filter query from request query params ─────────────────
const buildFilterQuery = (query) => {
  const and = [];

  // Keyword search across title/description/location fields
  if (query.q?.trim()) {
    const keyword = query.q.trim();
    and.push({
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { city: { $regex: keyword, $options: 'i' } },
        { 'address.city': { $regex: keyword, $options: 'i' } },
        { 'address.state': { $regex: keyword, $options: 'i' } },
        { 'address.country': { $regex: keyword, $options: 'i' } },
        { 'address.street': { $regex: keyword, $options: 'i' } },
      ],
    });
  }

  if (query.city?.trim()) {
    and.push({ city: { $regex: query.city.trim(), $options: 'i' } });
  }
  if (query.state?.trim()) {
    and.push({ 'address.state': { $regex: query.state.trim(), $options: 'i' } });
  }
  if (query.country?.trim()) {
    and.push({ 'address.country': { $regex: query.country.trim(), $options: 'i' } });
  }

  if (query.type?.trim()) {
    and.push({ type: query.type.toLowerCase() });
  }

  if (query.minPrice || query.maxPrice) {
    const price = {};
    if (query.minPrice) price.$gte = Number(query.minPrice);
    if (query.maxPrice) price.$lte = Number(query.maxPrice);
    and.push({ price });
  }

  if (query.bedrooms) {
    and.push({ bedrooms: { $gte: Number(query.bedrooms) } });
  }
  if (query.bathrooms) {
    and.push({ bathrooms: { $gte: Number(query.bathrooms) } });
  }

  // amenities can be CSV or repeated query key
  if (query.amenities) {
    const amenitiesInput = Array.isArray(query.amenities)
      ? query.amenities
      : String(query.amenities).split(',');
    const amenities = amenitiesInput
      .map((a) => a.trim())
      .filter(Boolean)
      .filter((a) => VALID_AMENITIES.includes(a));

    if (amenities.length) {
      and.push({ amenities: { $all: amenities } });
    }
  }

  // default: available only, unless explicit all
  if (query.availability === 'all') {
    // no-op
  } else if (query.availability === 'false') {
    and.push({ availability: false });
  } else {
    and.push({ availability: true });
  }

  return and.length ? { $and: and } : {};
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new property listing
// @route   POST /api/properties  (multipart/form-data)
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const createProperty = asyncHandler(async (req, res) => {
  const {
    title, description, type, price,
    address, bedrooms, bathrooms, amenities,
    availability, location, cancellationPolicy,
  } = req.body;

  // ── Required field validation ─────────────────────────────────────────────
  if (!title || !description || !type || !price) {
    res.status(400);
    throw new Error('Title, description, type, and price are required');
  }

  // Parse address if sent as JSON string (multipart forms stringify objects)
  let parsedAddress = address;
  if (typeof address === 'string') {
    try { parsedAddress = JSON.parse(address); } catch { /* leave as-is */ }
  }

  if (!parsedAddress?.city || !parsedAddress?.state || !parsedAddress?.country) {
    res.status(400);
    throw new Error('Address (city, state, country) is required');
  }
  if (bedrooms === undefined || bedrooms === null || bedrooms === '') {
    res.status(400);
    throw new Error('Bedrooms and bathrooms are required');
  }
  if (bathrooms === undefined || bathrooms === null || bathrooms === '') {
    res.status(400);
    throw new Error('Bedrooms and bathrooms are required');
  }
  if (!VALID_TYPES.includes(type.toLowerCase())) {
    res.status(400);
    throw new Error(`Invalid property type. Valid: ${VALID_TYPES.join(', ')}`);
  }

  // ── Image validation ──────────────────────────────────────────────────────
  const files = req.files || [];
  if (files.length === 0) {
    res.status(400);
    throw new Error('At least one property image is required');
  }
  if (files.length > 10) {
    res.status(400);
    throw new Error('Maximum 10 images allowed');
  }

  // ── Upload images to Cloudinary ───────────────────────────────────────────
  const uploadedImages = await uploadImages(files);

  // ── Sanitise amenities — ignore unknown values ────────────────────────────
  let parsedAmenities = amenities;
  if (typeof amenities === 'string') {
    try { parsedAmenities = JSON.parse(amenities); } catch { parsedAmenities = []; }
  }
  const cleanAmenities = Array.isArray(parsedAmenities)
    ? parsedAmenities.filter((a) => VALID_AMENITIES.includes(a))
    : [];

  // Validate location if provided
  let cleanLocation;
  let parsedLocation = location;
  if (typeof location === 'string') {
    try { parsedLocation = JSON.parse(location); } catch { /* ignore */ }
  }
  if (parsedLocation?.coordinates && Array.isArray(parsedLocation.coordinates) && parsedLocation.coordinates.length === 2) {
    cleanLocation = { type: 'Point', coordinates: parsedLocation.coordinates };
  }

  const property = await Property.create({
    title:       title.trim(),
    description: description.trim(),
    type:        type.toLowerCase(),
    price:       Number(price),
    address:     parsedAddress,
    bedrooms:    Number(bedrooms),
    bathrooms:   Number(bathrooms),
    amenities:   cleanAmenities,
    images:      uploadedImages,
    availability: availability === 'false' ? false : availability !== false,
    cancellationPolicy: cancellationPolicy || 'moderate',
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
      limit,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
      totalPages: Math.max(1, Math.ceil(total / limit)),
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
// @route   PUT /api/properties/:id  (multipart/form-data)
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

  // ── Parse existing images JSON (images to keep) ───────────────────────────
  let existingImages = [];
  if (req.body.existingImages) {
    try {
      existingImages = JSON.parse(req.body.existingImages);
      if (!Array.isArray(existingImages)) existingImages = [];
    } catch { existingImages = []; }
  }

  // ── Determine which old images were removed → delete from Cloudinary ──────
  const oldPublicIds = (property.images || []).map((img) => img.public_id).filter(Boolean);
  const keepPublicIds = existingImages.map((img) => img.public_id).filter(Boolean);
  const toDeleteIds   = oldPublicIds.filter((pid) => !keepPublicIds.includes(pid));
  if (toDeleteIds.length) {
    await deleteImages(toDeleteIds);
  }

  // ── Upload any new files ──────────────────────────────────────────────────
  const newFiles = req.files || [];
  const totalImages = existingImages.length + newFiles.length;

  if (totalImages > 10) {
    res.status(400);
    throw new Error('Maximum 10 images allowed');
  }

  let newUploads = [];
  if (newFiles.length > 0) {
    newUploads = await uploadImages(newFiles);
  }

  // ── Merge existing + new images ───────────────────────────────────────────
  const mergedImages = [...existingImages, ...newUploads];

  // ── Update allowed text fields ────────────────────────────────────────────
  const allowed = [
    'title', 'description', 'type', 'price', 'address',
    'bedrooms', 'bathrooms', 'amenities', 'availability',
    'cancellationPolicy',
  ];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      let val = req.body[field];
      // Parse JSON-stringified fields from multipart
      if (typeof val === 'string' && (field === 'address' || field === 'amenities')) {
        try { val = JSON.parse(val); } catch { /* leave as string */ }
      }
      if (field === 'price' || field === 'bedrooms' || field === 'bathrooms') {
        val = Number(val);
      }
      if (field === 'availability') {
        val = val === 'false' ? false : val !== false;
      }
      property[field] = val;
    }
  });

  property.images = mergedImages;

  // Handle location update separately to validate GeoJSON structure
  let parsedLocation = req.body.location;
  if (typeof parsedLocation === 'string') {
    try { parsedLocation = JSON.parse(parsedLocation); } catch { parsedLocation = null; }
  }
  if (parsedLocation?.coordinates && Array.isArray(parsedLocation.coordinates) && parsedLocation.coordinates.length === 2) {
    property.location = { type: 'Point', coordinates: parsedLocation.coordinates };
  }

  const updated = await property.save();

  res.status(200).json({
    success: true,
    message: 'Property updated successfully',
    data: { property: updated },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a single image from a property (and from Cloudinary)
// @route   DELETE /api/properties/:id/images/:public_id
// @access  Private (owner of property / admin)
// ─────────────────────────────────────────────────────────────────────────────
const deletePropertyImage = asyncHandler(async (req, res) => {
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

  // Decode the public_id from URL param (slashes are encoded)
  const public_id = decodeURIComponent(req.params.public_id);

  // Remove from property images array
  property.images = property.images.filter((img) => img.public_id !== public_id);
  await property.save();

  // Delete from Cloudinary (fire-and-forget style, but await for reliability)
  await deleteImage(public_id);

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
    data: { images: property.images },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a property listing (and all its Cloudinary images)
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

  // Delete all associated Cloudinary images
  const publicIds = (property.images || []).map((img) => img.public_id).filter(Boolean);
  if (publicIds.length) {
    await deleteImages(publicIds);
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
  deletePropertyImage,
};
