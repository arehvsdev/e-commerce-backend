const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Address = require("../models/address");
const ApiLog = require("../models/apiLog");

const allowedUserFields = [
  "name",
  "email",
  "phone",
  "firstName",
  "lastName",
  "bio"
];

const formatUser = (user) => ({
  id: user._id,
  name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  bio: user.bio || "",
});

const pickUserFields = (body) => {
  const updates = {};

  allowedUserFields.forEach((field) => {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  });

  return updates;
};

const healthCheck = async (req, res) => {
  res.status(200).json({ success: true, data: { message: "Health check successful" } });
};

const createUser = async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const user = await User.create({
      ...pickUserFields(req.body),
      password: req.body.password, // raw password, hashed in pre-save hook
    });

    return res.status(201).json({
      success: true,
      data: { user: formatUser(user) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    return res.status(200).json({ success: true, data: { users } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    Object.assign(user, pickUserFields(req.body));
    await user.save();

    return res.status(200).json({ success: true, data: { user: formatUser(user) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Security check: If deleting an admin, ensure there is at least one other admin remaining.
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Security constraint: Cannot delete the only admin user in the system.",
        });
      }
    }

    await user.deleteOne();

    return res.status(200).json({ success: true, data: { message: "User deleted successfully" } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: { user: formatUser(user) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updates = pickUserFields(req.body);
    delete updates.email;
    delete updates.role;

    // Dynamically build full name from first/last name changes
    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const currentFirstName = updates.firstName !== undefined ? updates.firstName : (user.firstName || "");
      const currentLastName = updates.lastName !== undefined ? updates.lastName : (user.lastName || "");
      updates.name = `${currentFirstName} ${currentLastName}`.trim();
    }

    Object.assign(user, updates);
    await user.save();

    return res.status(200).json({ success: true, data: { user: formatUser(user) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await user.deleteOne();

    return res.status(200).json({ success: true, data: { message: "Profile deleted successfully" } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both old and new passwords are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters long" });
    }
    if (!/[A-Za-z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must contain at least one letter" });
    }
    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must contain at least one number" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect old password" });
    }

    user.password = newPassword; // raw password, hashed in pre-save hook
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProfileAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ user: req.user.id }).populate('country');
    return res.status(200).json({
      success: true,
      data: { address: address || null },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const createProfileAddress = async (req, res) => {
  try {
    const existingAddress = await Address.findOne({ user: req.user.id });
    if (existingAddress) {
      return res.status(400).json({ success: false, message: "Address already exists for this user" });
    }

    let address = await Address.create({
      user: req.user.id,
      country: req.body.country,
      cityState: req.body.cityState,
      postalCode: req.body.postalCode,
    });

    address = await address.populate('country');

    return res.status(201).json({
      success: true,
      data: { address },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateProfileAddress = async (req, res) => {
  try {
    let address = await Address.findOne({ user: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    address.country = req.body.country;
    address.cityState = req.body.cityState;
    address.postalCode = req.body.postalCode;

    await address.save();
    address = await address.populate('country');

    return res.status(200).json({
      success: true,
      data: { address },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getApiLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.method) {
      query.method = req.query.method;
    }
    if (req.query.status) {
      query.statusCode = parseInt(req.query.status);
    }
    if (req.query.search) {
      query.path = { $regex: req.query.search, $options: "i" };
    }

    const logs = await ApiLog.find(query)
      .populate("userId", "firstName lastName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ApiLog.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        page,
        totalPages,
        total,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  healthCheck,
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  deleteProfile,
  changePassword,
  getProfileAddress,
  createProfileAddress,
  updateProfileAddress,
  getApiLogs,
};
