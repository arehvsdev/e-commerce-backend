const Country = require('../models/country');

const getCountries = async (req, res) => {
  try {
    console.log("Fetching countries from the database...");
    const countries = await Country.find().sort({ name: 1 });
    return res.status(200).json({ success: true, data: countries });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error fetching countries' });
  }
};

const seedCountriesIfNeeded = async () => {
  try {
    const count = await Country.countDocuments();
    if (count === 0) {
      const defaultCountries = [
        { name: 'India', code: 'IN' },
        { name: 'United States', code: 'US' },
        { name: 'United Kingdom', code: 'GB' },
        { name: 'Canada', code: 'CA' },
        { name: 'Australia', code: 'AU' },
        { name: 'Germany', code: 'DE' },
        { name: 'France', code: 'FR' },
        { name: 'Japan', code: 'JP' },
        { name: 'China', code: 'CN' },
        { name: 'United Arab Emirates', code: 'AE' },
        { name: 'Singapore', code: 'SG' },
        { name: 'New Zealand', code: 'NZ' },
        { name: 'South Africa', code: 'ZA' },
        { name: 'Brazil', code: 'BR' },
        { name: 'Russia', code: 'RU' }
      ];
      await Country.insertMany(defaultCountries);
      console.log('Seeded countries database successfully.');
    }
  } catch (error) {
    console.error('Failed to seed countries:', error);
  }
};

module.exports = {
  getCountries,
  seedCountriesIfNeeded,
};
