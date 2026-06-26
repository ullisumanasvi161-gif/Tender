import mongoose from 'mongoose';

const themeSettingSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  selected_theme: {
    type: String,
    enum: ['Dark', 'Light', 'System'],
    default: 'System',
    required: true,
  }
}, {
  timestamps: { createdAt: false, updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const ThemeSetting = mongoose.model('ThemeSetting', themeSettingSchema);
export default ThemeSetting;
