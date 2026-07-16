const bcrypt = require("bcryptjs");
const User = require("../models/user");

const allowedUserFields = [
  "name",
  "email",
  "phone",
  "firstName",
  "lastName",
  "bio",
  "country",
  "cityState",
  "postalCode",
  "taxId"
];

const formatUser = (user) => ({
  id: user._id,
  name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  firstName: user.firstName,
  lastName: user.lastName,
  bio: user.bio,
  country: user.country,
  cityState: user.cityState,
  postalCode: user.postalCode,
  taxId: user.taxId,
  email: user.email,
  phone: user.phone,
  role: user.role,
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

    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({
      ...pickUserFields(req.body),
      password: hashedPassword,
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

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
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
};
