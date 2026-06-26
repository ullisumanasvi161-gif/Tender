import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  mandatory: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'completed', 'na'], default: 'pending' },
  uploadedDocUrl: { type: String, default: '' },
  uploadedDocName: { type: String, default: '' },
});

const checklistSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  projectType: { type: String, required: true },
  clientName: { type: String, required: true },
  tenderValue: { type: Number, required: true },
  tenderCategory: { type: String, required: true },
  submissionDeadline: { type: Date, required: true },
  location: { type: String, required: true },
  specialRequirements: { type: String },
  scopeOfWork: { type: String },
  eligibilityCriteria: { type: String },
  additionalNotes: { type: String },
  
  // Sections
  technicalSection: [checklistItemSchema],
  commercialSection: [checklistItemSchema],
  financialSection: [checklistItemSchema],
  complianceSection: [checklistItemSchema],
  
  // Risk & Readiness
  complianceScore: { type: Number, default: 0 }, // Score from 0 to 100
  readinessLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  missingDocumentsAlerts: [String],
  aiRecommendations: [String],
  
  // Metadata & Feedback
  rating: { type: Number, default: 0, min: 0, max: 5 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const Checklist = mongoose.model('Checklist', checklistSchema);
export default Checklist;
