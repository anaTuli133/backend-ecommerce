const User = require('../models/userModel')

// these can never be changed by the user himself
const protectedFields = ['role', 'status', 'password', 'isVerifed']

const userUpdateController = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({ success: false, message: 'User id is required' })
        }
        // a logged-in user can update only his own account
        if (String(req.user._id) !== id) {
            return res.status(403).json({ success: false, message: 'You can update only your own account' })
        }

        const changes = { ...req.body }
        protectedFields.forEach((field) => delete changes[field])

        const updatedUser = await User.findByIdAndUpdate(id, changes, { new: true }).select('-password')
        if (!updatedUser) {
            return res.status(400).json({ success: false, message: 'User not found' })
        }
        return res.status(200).json({ success: true, message: 'Account updated successfully', data: updatedUser })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' })
    }
}

module.exports = { userUpdateController }
