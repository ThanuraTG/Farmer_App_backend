const marketService = require('../services/market/marketService');
const MarketPrice = require('../models/MarketPrice');
const Crop = require('../models/Crop');
const { PDFParse } = require('pdf-parse');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const mainMarkets = ['Dambulla', 'Nuwara Eliya', 'Meegoda', 'Keppetipola', 'Narahenpita', 'Rathmalana', 'Peliyagoda'];

const getLatest = async (req, res, next) => {
  try {
    const { cropId, centreId } = req.query;
    if (!cropId) {
      return errorResponse(res, 400, 'cropId query parameter is required');
    }

    const latest = await marketService.getLatestMarketPrice(cropId, centreId);
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

const getSummary = async (req, res, next) => {
  try {
    const { cropId, centreId } = req.query;
    if (!cropId) {
      return errorResponse(res, 400, 'cropId query parameter is required');
    }

    const summary = await marketService.getMarketPriceSummary(cropId, centreId);
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
    if (cropId) query.cropId = cropId;
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
    const { cropId, economicCentreId, marketLocation, date, minPrice, maxPrice, averagePrice, unit, source, notes } = req.body;

    const numMin = Number(minPrice);
    const numMax = Number(maxPrice);
    const numAvg = averagePrice !== undefined ? Number(averagePrice) : Number(((numMin + numMax) / 2).toFixed(2));

    if (numMin < 0 || numMax < numMin) {
      return errorResponse(res, 400, 'Invalid price range: minPrice must be >= 0 and maxPrice must be >= minPrice');
    }

    const recordDate = new Date(date);

    const price = await MarketPrice.findOneAndUpdate(
      { cropId, economicCentreId: economicCentreId || null, market_location: marketLocation || '', date: recordDate },
      {
        cropId,
        economicCentreId: economicCentreId || null,
        market_location: marketLocation || '',
        date: recordDate,
        minPrice: numMin,
        maxPrice: numMax,
        averagePrice: numAvg,
        unit: unit || 'kg',
        source: source || 'admin',
        notes: notes || '',
        createdBy: req.user._id
      },
      { upsert: true, new: true, runValidators: true }
    );

    return successResponse(res, 201, 'Market price recorded successfully', price);
  } catch (err) {
    next(err);
  }
};

const adminUpdateMarketPrice = async (req, res, next) => {
  try {
    const price = await MarketPrice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!price) {
      return errorResponse(res, 404, 'Market price record not found');
    }
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
    return successResponse(res, 200, `${isPdf ? 'PDF' : 'CSV'} market prices import processed`, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLatest,
  getHistory,
  getSummary,
  adminGetMarketPrices,
  adminCreateMarketPrice,
  adminUpdateMarketPrice,
  adminDeleteMarketPrice,
  adminImportMarketPrices
};
