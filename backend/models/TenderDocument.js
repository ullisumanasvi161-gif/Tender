import mongoose from 'mongoose';

const tenderDocumentSchema = new mongoose.Schema({
  tender_id: {
    type: String, // String format to support both MongoDB ObjectIds and custom localDb IDs (e.g. c_1782...)
    required: true,
    index: true,
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  file_name: {
    type: String,
    required: true,
  },
  file_path: {
    type: String,
    required: true,
  },
  file_type: {
    type: String,
  },
  file_size: {
    type: Number,
  },
  isSupabase: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

const TenderDocument = mongoose.model('TenderDocument', tenderDocumentSchema);
export default TenderDocument;
