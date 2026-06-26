import OpenAI from 'openai';

// Initialize OpenAI client if key exists
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    return null;
  }
  return new OpenAI({ apiKey });
};

// Realistic mock checklist generator based on input parameters
const generateMockChecklist = (inputs) => {
  const {
    projectName,
    projectType = 'General',
    clientName,
    tenderValue = 0,
    tenderCategory = 'Civil Works',
    submissionDeadline,
    location,
    specialRequirements = '',
    scopeOfWork = '',
    eligibilityCriteria = '',
    additionalNotes = ''
  } = inputs;

  const type = projectType.toLowerCase();
  
  // Base lists
  let technical = [
    { title: 'Project Schedule / Gantt Chart', description: 'Detailed project timeline detailing milestones and critical paths.', mandatory: true, status: 'pending' },
    { title: 'Method Statement', description: 'Step-by-step description of how the construction works will be executed safely.', mandatory: true, status: 'pending' },
    { title: 'Key Personnel CVs & Experience Certifications', description: 'Resumes and qualifications of Project Manager, Safety Officers, and Site Engineers.', mandatory: true, status: 'pending' },
    { title: 'Equipment Deployment Schedule', description: 'List of machinery and equipment dedicated to the project with registration papers.', mandatory: true, status: 'pending' },
    { title: 'Quality Assurance & Control Plan', description: 'QA/QC manuals and standard operating procedures for material testing.', mandatory: false, status: 'pending' }
  ];

  let commercial = [
    { title: 'Priced Bill of Quantities (BOQ)', description: 'Itemized rates and total bidding price strictly formatted per the tender schedule.', mandatory: true, status: 'pending' },
    { title: 'Vendor & Subcontractor Quotations', description: 'Supporting quotes for major supply items (Steel, Cement, Bitumen, MEP equipment).', mandatory: false, status: 'pending' },
    { title: 'Rate Analysis Sheet', description: 'Detailed breakdown of labor, material, and profit components for each bidding rate.', mandatory: true, status: 'pending' },
    { title: 'Tender Fee Payment Receipt', description: 'Proof of purchase or online transaction details for the tender document.', mandatory: true, status: 'pending' }
  ];

  let financial = [
    { title: 'Earnest Money Deposit (EMD) / Bid Security', description: `Bank Guarantee of approximately 2% of the tender value (${(tenderValue * 0.02).toFixed(2)} Cr) or online payment receipt.`, mandatory: true, status: 'pending' },
    { title: 'Audited Financial Statements (Last 3 Years)', description: 'Balance Sheets, Profit & Loss reports certified by a Chartered Accountant.', mandatory: true, status: 'pending' },
    { title: 'Annual Financial Turnover Certificate', description: `CA certificate proving average turnover meets eligibility requirement (minimum ${(tenderValue * 0.5).toFixed(2)} Cr).`, mandatory: true, status: 'pending' },
    { title: 'Bank Solvency Certificate', description: `Financial soundness letter from a scheduled bank for at least ${(tenderValue * 0.2).toFixed(2)} Cr.`, mandatory: true, status: 'pending' },
    { title: 'Net Worth Certificate', description: 'Statement proving positive net worth certified by CA.', mandatory: false, status: 'pending' }
  ];

  let compliance = [
    { title: 'Company Registration & Incorporation Certificate', description: 'MOA, AOA, and Registration certificate of Avinash Kanaparthi Infra Pvt Ltd.', mandatory: true, status: 'pending' },
    { title: 'GST Registration & Latest Filings', description: 'GSTIN certificate and GSTR-3B filings for the past 6 months.', mandatory: true, status: 'pending' },
    { title: 'EPF & ESIC Registration Certificates', description: 'Proof of statutory social security compliance for staff and labor.', mandatory: true, status: 'pending' },
    { title: 'PAN Card & Income Tax Return (ITR) copies', description: 'Company PAN and verified IT filings for the last 3 assessment years.', mandatory: true, status: 'pending' },
    { title: 'ISO Certifications (9001, 14001, 45001)', description: 'Valid ISO certificates representing Quality, Environment, and Safety systems.', mandatory: false, status: 'pending' }
  ];

  // Tailoring by project types
  if (type.includes('road') || type.includes('highway') || type.includes('pavement')) {
    technical.push(
      { title: 'Traffic Management & Diversion Plan', description: 'Proposed schemes for traffic safety and lane diversion during road laying.', mandatory: true, status: 'pending' },
      { title: 'Soil Investigation & Material Sourcing Report', description: 'Geotechnical surveys and test certificates from gravel/aggregate quarries.', mandatory: true, status: 'pending' },
      { title: 'Bitumen and Aggregate Quality Certificates', description: 'Third-party lab reports confirming material specifications.', mandatory: false, status: 'pending' }
    );
    compliance.push(
      { title: 'National Highways / PWD License Validation', description: 'Class-I / Super Class Contractor registration certificates.', mandatory: true, status: 'pending' }
    );
  } else if (type.includes('bridge') || type.includes('flyover') || type.includes('metro')) {
    technical.push(
      { title: 'Structural Design & GAD drawings approval', description: 'General Arrangement Drawings and design verification reports by expert consultants.', mandatory: true, status: 'pending' },
      { title: 'Piling & Foundation Method Statements', description: 'Execution plan for bored cast-in-situ piles and load testing details.', mandatory: true, status: 'pending' },
      { title: 'Erection & Launching Scheme', description: 'Detailed procedure for girder launching and heavy crane positioning.', mandatory: true, status: 'pending' }
    );
    compliance.push(
      { title: 'Environmental Clearance (EC) documentation', description: 'Tree cutting clearances or NOCs from Pollution Control Boards.', mandatory: true, status: 'pending' }
    );
  } else if (type.includes('water') || type.includes('sewage') || type.includes('irrigation')) {
    technical.push(
      { title: 'Hydraulic Design Calculations', description: 'Flow models, pipe sizing computations, and pump selection details.', mandatory: true, status: 'pending' },
      { title: 'Pipe Sourcing & Inspection Protocol', description: 'Factory acceptance test criteria for DI/MS/HDPE pipes.', mandatory: true, status: 'pending' }
    );
    compliance.push(
      { title: 'Water Resource Board / Irrigation NOC', description: 'Permissions for drawl, pipe crossing, and discharge points.', mandatory: true, status: 'pending' }
    );
  } else if (type.includes('power') || type.includes('electrical') || type.includes('substation')) {
    technical.push(
      { title: 'Single Line Diagrams (SLD) & Equipment Specs', description: 'Electrical layouts, relay configuration, and transformer specs.', mandatory: true, status: 'pending' },
      { title: 'Earthing & Lightning Protection Layouts', description: 'Design calculations showing target grid earth resistance values.', mandatory: true, status: 'pending' }
    );
    compliance.push(
      { title: 'Electrical Inspectorate (CEIG) Authorization License', description: 'Valid Class-A electrical contractor license.', mandatory: true, status: 'pending' }
    );
  } else {
    // General Building / Infra
    technical.push(
      { title: 'Architectural & MEP Drawings', description: 'Approved layout plans, Mechanical, Electrical, and Plumbing schedules.', mandatory: true, status: 'pending' },
      { title: 'Construction Water & Power Sanctions', description: 'Permissions from municipal and power corporations for site utility tie-ins.', mandatory: false, status: 'pending' }
    );
    compliance.push(
      { title: 'Fire Safety NOC & Approvals', description: 'Provisional Fire NOC from Fire & Emergency Services.', mandatory: true, status: 'pending' }
    );
  }

  // Dynamic additions based on special requirements or eligibility
  if (specialRequirements && specialRequirements.length > 5) {
    technical.push({
      title: 'Compliance Report: Special Tender Conditions',
      description: `Specific documents answering: "${specialRequirements.substring(0, 80)}..."`,
      mandatory: true,
      status: 'pending'
    });
  }

  if (eligibilityCriteria && eligibilityCriteria.length > 5) {
    compliance.push({
      title: 'Joint Venture (JV) / Consortium Agreement (If Applicable)',
      description: `Documents validating eligibility specifications: "${eligibilityCriteria.substring(0, 80)}..."`,
      mandatory: false,
      status: 'pending'
    });
  }

  // AI Alerts and Recommendations
  const missingDocumentsAlerts = [
    'Ensure EMD Bank Guarantee format matches Annexure-II exactly.',
    'Work completion certificates must specify "Completed value" rather than "Award value".',
  ];

  if (tenderValue > 5) {
    missingDocumentsAlerts.push('Solvency certificate must be dated within 6 months of bid submission.');
  }
  if (type.includes('road')) {
    missingDocumentsAlerts.push('Check road work experience certificates for minimum asphalt overlay thickness details.');
  }

  const aiRecommendations = [
    `Optimize bid pricing based on competitive margins for ${clientName}. Keep EMD liquid reserves ready at least 10 days before the deadline.`,
    'Initiate procurement quotes from key cement/steel vendors immediately to avoid last-minute price volatility.',
    'Organize key engineers resumes and obtain signed consent letters for site mobilization.'
  ];

  return {
    technicalSection: technical,
    commercialSection: commercial,
    financialSection: financial,
    complianceSection: compliance,
    complianceScore: 78, // Initial compliance score
    readinessLevel: 'Medium',
    missingDocumentsAlerts,
    aiRecommendations
  };
};

// Main generator method
export const generateChecklist = async (inputs) => {
  const openai = getOpenAIClient();

  if (!openai) {
    console.log('OpenAI API Key not configured or placeholder detected. Falling back to intelligent mock generator.');
    return generateMockChecklist(inputs);
  }

  try {
    const {
      projectName,
      projectType,
      clientName,
      tenderValue,
      tenderCategory,
      submissionDeadline,
      location,
      specialRequirements,
      scopeOfWork,
      eligibilityCriteria,
      additionalNotes
    } = inputs;

    const systemPrompt = `You are a professional construction bid manager and tender expert at AVINASH KANAPARTHI INFRA PRIVATE LIMITED.
Analyze the user's tender specifications and generate a highly detailed, comprehensive, enterprise-grade tender preparation checklist.
You MUST output your response in strict JSON format matching the schema below. Do not wrap the JSON in markdown code blocks like \`\`\`json. Output ONLY the JSON.

JSON Schema:
{
  "technicalSection": [
    { "title": "...", "description": "...", "mandatory": true/false }
  ],
  "commercialSection": [
    { "title": "...", "description": "...", "mandatory": true/false }
  ],
  "financialSection": [
    { "title": "...", "description": "...", "mandatory": true/false }
  ],
  "complianceSection": [
    { "title": "...", "description": "...", "mandatory": true/false }
  ],
  "complianceScore": 75,
  "readinessLevel": "Low" | "Medium" | "High",
  "missingDocumentsAlerts": ["alert 1", "alert 2"],
  "aiRecommendations": ["rec 1", "rec 2"]
}

Guidelines for checklist items:
1. Generate items specific to: Project Type (${projectType}), Client (${clientName}), Location (${location}), and Value (${tenderValue} Crores).
2. For Technical Section: Include schedules, drawings, method statements, CVs of key staff, equipment deployments, and QA/QC plans.
3. For Commercial Section: Bill of quantities (BOQ) verification, rate analysis, tender fee receipts, vendor quotes.
4. For Financial Section: Audited statements, EMD (usually ~2% of value, calculate this), solvency certificate (usually ~20-50% of value), net worth certificate.
5. For Compliance Section: Company incorporation certificates, GST, EPF, ESIC, class license registrations, pollution clearance, fire clearance.
6. For Alerts and Recommendations: Outline critical areas of concern based on the Deadlines, Special Requirements (${specialRequirements}), Scope of Work (${scopeOfWork}), and Eligibility (${eligibilityCriteria}).
7. Initial state of complianceScore should be realistic (e.g. 70-80) since files are not yet uploaded.`;

    const userPrompt = `
Generate a tender checklist for:
Project Name: ${projectName}
Project Type: ${projectType}
Client: ${clientName}
Tender Value: INR ${tenderValue} Crores
Category: ${tenderCategory}
Deadline: ${submissionDeadline}
Location: ${location}
Special Requirements: ${specialRequirements}
Scope of Work: ${scopeOfWork}
Eligibility Criteria: ${eligibilityCriteria}
Additional Notes: ${additionalNotes}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
    });

    const resultText = response.choices[0].message.content;
    const parsedData = JSON.parse(resultText);
    
    // Ensure lists have default statuses
    const applyStatus = (list) => {
      if (!list) return [];
      return list.map(item => ({
        ...item,
        status: item.status || 'pending',
        uploadedDocUrl: '',
        uploadedDocName: ''
      }));
    };

    return {
      technicalSection: applyStatus(parsedData.technicalSection),
      commercialSection: applyStatus(parsedData.commercialSection),
      financialSection: applyStatus(parsedData.financialSection),
      complianceSection: applyStatus(parsedData.complianceSection),
      complianceScore: parsedData.complianceScore || 75,
      readinessLevel: parsedData.readinessLevel || 'Medium',
      missingDocumentsAlerts: parsedData.missingDocumentsAlerts || [],
      aiRecommendations: parsedData.aiRecommendations || []
    };
  } catch (error) {
    console.error('Error generating AI checklist, using mock fallback:', error.message);
    return generateMockChecklist(inputs);
  }
};
