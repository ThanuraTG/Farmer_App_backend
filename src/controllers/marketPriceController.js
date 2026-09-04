const marketService = require('../services/market/marketService');
const MarketPrice = require('../models/MarketPrice');
const Crop = require('../models/Crop');
const Notification = require('../models/Notification');
const { PDFParse } = require('pdf-parse');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const mainMarkets = ['Dambulla', 'Nuwara Eliya', 'Meegoda', 'Keppetipola', 'Narahenpita', 'Rathmalana', 'Peliyagoda'];

const getCropName = (crop) => {
  if (!crop) return 'Crop';
  return typeof crop.name === 'object'
    ? String(crop.name.en || crop.name.si || crop.name.ta || 'Crop')
    : String(crop.name || 'Crop');
};

const formatDateLabel = (date) => {
  if (!date) return 'today';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'today';
  return parsedDate.toISOString().split('T')[0];
};

const publishMarketPriceNotification = async ({ cropId, marketLocation, price, date, createdBy, count }) => {
  const crop = cropId ? await Crop.findById(cropId).select('name').lean() : null;
  const cropName = getCropName(crop);
  const dateLabel = formatDateLabel(date);
  const message = count
    ? `${count} market price records were uploaded for ${dateLabel}. Open Market to view the latest prices.`
    : `${cropName} is now Rs. ${Number(price).toFixed(0)} per kg at ${marketLocation || 'the selected market'} (${dateLabel}).`;

  await Notification.create({
    title: count ? 'Daily market prices updated' : `${cropName} market price updated`,
    message,
    type: 'market_price_update',
    audience: 'all',
    targetCrop: cropId || null,
    createdBy
  });
};

const getLatest = async (req, res, next) => {
  try {
    const { cropId, centreId, marketLocation } = req.query;
    if (!cropId) {
      return errorResponse(res, 400, 'cropId query parameter is required');
    }

    const latest = await marketService.getLatestMarketPrice(cropId, centreId, marketLocation);
    return successResponse(res, 200, 'Latest market price retrieved', latest);
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await marketService.getMarketPriceHistory(req.query);
    return successResponse(res, 200, 'Market price history retrieved', history);
  } catch (err) {
    next(err);
  }
};

const getTop = async (req, res, next) => {
  try {
    const prices = await marketService.getTopMarketPrices(req.query.limit);
    return successResponse(res, 200, 'Top market prices retrieved', prices);
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const { cropId, centreId, marketLocation } = req.query;
    if (!cropId) {
      return errorResponse(res, 400, 'cropId query parameter is required');
    }

    const summary = await marketService.getMarketPriceSummary(cropId, centreId, marketLocation);
    return successResponse(res, 200, 'Market price trend summary retrieved', summary);
  } catch (err) {
    next(err);
  }
};

// Admin Market CRUD
const adminGetMarketPrices = async (req, res, next) => {
  try {
    const { cropId, centreId, marketLocation, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};
    if (cropId) query.$or = [{ cropId }, { crop_id: cropId }];
    if (centreId) query.economicCentreId = centreId;
    if (marketLocation) query.market_location = { $regex: marketLocation, $options: 'i' };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalItems = await MarketPrice.countDocuments(query);
    const items = await MarketPrice.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('cropId', 'name category')
      .populate('economicCentreId', 'name districtName');

    return successResponse(res, 200, 'Admin market prices retrieved', {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const adminCreateMarketPrice = async (req, res, next) => {
  try {
    const cropId = req.body.cropId || req.body.crop_id;
    const economicCentreId = req.body.economicCentreId || req.body.economic_centre_id;
    const marketLocation = req.body.marketLocation || req.body.market_location || '';
    const date = req.body.date || req.body.price_date;
    const basePrice = req.body.pricePerKg ?? req.body.price_per_kg;
    const rawMin = req.body.minPrice ?? basePrice;
    const rawMax = req.body.maxPrice ?? basePrice;
    const rawAverage = req.body.averagePrice ?? basePrice;
    const numMin = Number(rawMin);
    const numMax = Number(rawMax);
    const numAvg = rawAverage !== undefined ? Number(rawAverage) : Number(((numMin + numMax) / 2).toFixed(2));
    const recordDate = new Date(date);

    if (!cropId || Number.isNaN(recordDate.getTime()) || !Number.isFinite(numMin) || !Number.isFinite(numMax) || !Number.isFinite(numAvg) || numMin < 0 || numMax < numMin) {
      return errorResponse(res, 400, 'Invalid price range: minPrice must be >= 0 and maxPrice must be >= minPrice');
    }

    const price = await MarketPrice.findOneAndUpdate(
      {
        $and: [
          { $or: [{ cropId }, { crop_id: cropId }] },
          { economicCentreId: economicCentreId || null },
          { market_location: marketLocation || '' },
          { date: recordDate }
        ]
      },
      {
        cropId,
        crop_id: cropId,
        economicCentreId: economicCentreId || null,
        market_location: marketLocation || '',
        date: recordDate,
        price_date: recordDate,
        minPrice: numMin,
        maxPrice: numMax,
        averagePrice: numAvg,
        price_per_kg: numAvg,
        unit: req.body.unit || 'kg',
        source: req.body.source || 'admin',
        notes: req.body.notes || '',
        createdBy: req.user._id,
        added_by_user_id: req.user._id
      },
      { upsert: true, new: true, runValidators: true }
    );

    await publishMarketPriceNotification({
      cropId,
      marketLocation,
      price: numAvg,
      date: recordDate,
      createdBy: req.user._id
    });

    return successResponse(res, 201, 'Market price recorded successfully', price);
  } catch (err) {
    next(err);
  }
};

const adminUpdateMarketPrice = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.crop_id && !updates.cropId) updates.cropId = updates.crop_id;
    if (updates.cropId) updates.crop_id = updates.cropId;
    if (updates.price_date && !updates.date) updates.date = updates.price_date;
    if (updates.date) updates.price_date = updates.date;
    if (updates.price_per_kg !== undefined && updates.averagePrice === undefined) {
      updates.averagePrice = updates.price_per_kg;
    }
    if (updates.averagePrice !== undefined) updates.price_per_kg = updates.averagePrice;

    const price = await MarketPrice.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!price) {
      return errorResponse(res, 404, 'Market price record not found');
    }
    await publishMarketPriceNotification({
      cropId: price.cropId || price.crop_id,
      marketLocation: price.market_location,
      price: price.averagePrice || price.price_per_kg,
      date: price.date || price.price_date,
      createdBy: req.user._id
    });
    return successResponse(res, 200, 'Market price record updated', price);
  } catch (err) {
    next(err);
  }
};

const adminDeleteMarketPrice = async (req, res, next) => {
  try {
    const price = await MarketPrice.findByIdAndDelete(req.params.id);
    if (!price) {
      return errorResponse(res, 404, 'Market price record not found');
    }
    return successResponse(res, 200, 'Market price record deleted');
  } catch (err) {
    next(err);
  }
};

const parseCsvRows = (fileBuffer) => {
  const csvString = fileBuffer.toString('utf8');
  const lines = csvString.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length <= 1) {
    const error = new Error('Uploaded CSV file is empty or missing headers');
    error.statusCode = 400;
    throw error;
  }

  const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).reduce((rows, line) => {
    const values = line.split(',').map(value => value.trim().replace(/^"|"$/g, ''));
    if (values.length === headers.length) {
      rows.push(headers.reduce((row, header, index) => ({ ...row, [header]: values[index] }), {}));
    }
    return rows;
  }, []);
};

const toIsoDate = (value) => {
  const parts = value.split(/[./-]/).map(Number);
  if (parts[0] > 1900) return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
  return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
};

const parsePdfRows = async (fileBuffer, originalName) => {
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const { text } = await parser.getText();
    const sourceText = `${text}\n${originalName}`;
    const dateMatch = sourceText.match(/\b(20\d{2}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2}[./-]20\d{2})\b/);
    const detectedMarkets = mainMarkets
      .map((name) => ({
        name,
        index: sourceText.search(new RegExp(`\\b${name.replace(' ', '\\s+')}\\b`, 'i'))
      }))
      .filter((market) => market.index >= 0)
      .sort((first, second) => first.index - second.index)
      .map((market) => market.name);

    if (!text.trim()) {
      const error = new Error('The PDF has no readable text. Upload a text-based bulletin PDF, or use OCR before importing a scanned document.');
      error.statusCode = 400;
      throw error;
    }
    if (!dateMatch || detectedMarkets.length === 0) {
      const error = new Error('The PDF must contain a report date and at least one supported market name: Dambulla, Nuwara Eliya, Meegoda, Keppetipola, Narahenpita, Rathmalana, or Peliyagoda.');
      error.statusCode = 400;
      throw error;
    }

    const storedCrops = await Crop.find({ status: 'active' }).select('name').lean();
    const cropNames = storedCrops
      .map((crop) => typeof crop.name === 'object' ? crop.name?.en : crop.name)
      .filter(Boolean)
      .sort((first, second) => second.length - first.length);

    const reportDate = toIsoDate(dateMatch[1]);
    const pipeRows = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map((line) => {
        // Supported PDF table row: Tomato | Dambulla | 2026-09-02 | 250 | 280 | 265 | kg
        const fields = line.split(/\s*[|,\t]\s*/).map(field => field.trim());
        if (fields.length < 6) return null;
        const [cropName, centreName, date, minPrice, maxPrice, averagePrice, unit = 'kg'] = fields;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
        return { cropName, centreName, date, minPrice, maxPrice, averagePrice, unit };
      })
      .filter(Boolean);

    if (pipeRows.length > 0) return pipeRows;

    // HARTI-style reports commonly contain whitespace table rows. Only rows whose
    // crop name exists in this project's crop master are allowed through.
    const detectedRows = text
      .split(/\r?\n/)
      .map(line => line.replace(/\s+/g, ' ').trim())
      .map((line) => {
        const cropName = cropNames.find((name) => line.toLowerCase().includes(name.toLowerCase()));
        if (!cropName) return null;
        const prices = (line.match(/\b\d+(?:[,.]\d{1,2})?\b/g) || [])
          .map(value => Number(value.replace(',', '.')))
          .filter(value => Number.isFinite(value) && value > 0);
        if (prices.length === 0) return null;
        // HARTI bulletin columns can be market prices rather than a min/max/avg
        // range. Normalise the detected values so every saved record is valid.
        // A HARTI row usually ends with one price per market. Pair the last
        // detected values with the market columns so every market is saved.
        const marketPrices = prices.slice(-detectedMarkets.length);
        if (marketPrices.length !== detectedMarkets.length) return null;
        return detectedMarkets.map((centreName, index) => ({
          cropName,
          centreName,
          date: reportDate,
          minPrice: marketPrices[index],
          maxPrice: marketPrices[index],
          averagePrice: marketPrices[index],
          unit: 'kg'
        }));
      })
      .filter(Boolean)
      .flat();

    if (detectedRows.length === 0) {
      const error = new Error('No PDF rows matched the crops saved in your database. Add the crop names first, then upload a text-based price bulletin containing those crop names.');
      error.statusCode = 400;
      throw error;
    }
    return detectedRows;
  } finally {
    await parser.destroy();
  }
};

// CSV and text-based PDF import handler
const adminImportMarketPrices = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'CSV or PDF file upload is required');
    }

    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
    const rows = isPdf ? await parsePdfRows(req.file.buffer, req.file.originalname) : parseCsvRows(req.file.buffer);

    const result = await marketService.importMarketPricesCSV(rows, req.user._id);
    if (result.rowsImported > 0) {
      await publishMarketPriceNotification({
        createdBy: req.user._id,
        count: result.rowsImported
      });
    }
    return successResponse(res, 200, `${isPdf ? 'PDF' : 'CSV'} market prices import processed`, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLatest,
  getHistory,
  getTop,
  getSummary,
  adminGetMarketPrices,
  adminCreateMarketPrice,
  adminUpdateMarketPrice,
  adminDeleteMarketPrice,
  adminImportMarketPrices
};
