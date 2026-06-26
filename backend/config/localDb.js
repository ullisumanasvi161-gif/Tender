import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

const ensureDbFile = async () => {
  try {
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      // Create default seed data if file doesn't exist
      const salt = await bcrypt.genSalt(10);
      const adminPasswordHash = await bcrypt.hash('adminpassword', salt);
      const staffPasswordHash = await bcrypt.hash('staffpassword', salt);

      const initialData = {
        users: [
          {
            _id: 'u_admin_default',
            name: 'Avinash Kanaparthi (Admin)',
            email: 'admin@avinashinfra.com',
            password: adminPasswordHash,
            role: 'admin',
            createdAt: new Date().toISOString(),
          },
          {
            _id: 'u_staff_default',
            name: 'Rohan Sharma (Staff)',
            email: 'staff@avinashinfra.com',
            password: staffPasswordHash,
            role: 'staff',
            createdAt: new Date().toISOString(),
          }
        ],
        checklists: [],
        auditLogs: [
          {
            _id: 'log_seed_1',
            userName: 'System',
            userEmail: 'system@avinashinfra.com',
            action: 'SYSTEM_INIT',
            details: 'Local file-based database seeded successfully',
            ipAddress: '127.0.0.1',
            createdAt: new Date().toISOString()
          }
        ],
        themeSettings: []
      };
      await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error establishing local DB file:', error.message);
  }
};

const readData = async () => {
  await ensureDbFile();
  try {
    const content = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed.themeSettings) {
      parsed.themeSettings = [];
    }
    if (!parsed.tenderDocuments) {
      parsed.tenderDocuments = [];
    }
    return parsed;
  } catch (error) {
    console.error('Error reading local DB:', error.message);
    return { users: [], checklists: [], auditLogs: [], themeSettings: [], tenderDocuments: [] };
  }
};

const writeData = async (data) => {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing local DB:', error.message);
  }
};

export const localDb = {
  // --- USER API ---
  async findUserByEmail(email) {
    const data = await readData();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id) {
    const data = await readData();
    return data.users.find(u => u._id === id) || null;
  },

  async createUser(userData) {
    const data = await readData();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = {
      _id: `u_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'staff',
      createdAt: new Date().toISOString(),
    };

    data.users.push(newUser);
    await writeData(data);
    return newUser;
  },

  async getUsers() {
    const data = await readData();
    return data.users.map(({ password, ...u }) => u);
  },

  // --- CHECKLIST API ---
  async getChecklists(query = {}) {
    const data = await readData();
    let result = [...data.checklists];

    if (query.createdBy) {
      result = result.filter(c => c.createdBy === query.createdBy);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      result = result.filter(c => 
        c.projectName.toLowerCase().includes(searchLower) ||
        c.clientName.toLowerCase().includes(searchLower) ||
        c.location.toLowerCase().includes(searchLower)
      );
    }

    if (query.tenderCategory && query.tenderCategory !== 'All') {
      result = result.filter(c => c.tenderCategory === query.tenderCategory);
    }

    if (query.projectType && query.projectType !== 'All') {
      result = result.filter(c => c.projectType === query.projectType);
    }

    if (query.readinessLevel && query.readinessLevel !== 'All') {
      result = result.filter(c => c.readinessLevel === query.readinessLevel);
    }

    // Sort by createdAt desc
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getChecklistById(id) {
    const data = await readData();
    return data.checklists.find(c => c._id === id) || null;
  },

  async createChecklist(checklistData, userId) {
    const data = await readData();
    const newChecklist = {
      _id: `c_${Date.now()}`,
      ...checklistData,
      createdBy: userId,
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add IDs to checklist items
    const mapItems = (items) => {
      if (!items) return [];
      return items.map((item, idx) => ({
        _id: `item_${Date.now()}_${idx}`,
        ...item,
        status: item.status || 'pending',
        uploadedDocName: item.uploadedDocName || '',
        uploadedDocUrl: item.uploadedDocUrl || ''
      }));
    };

    newChecklist.technicalSection = mapItems(newChecklist.technicalSection);
    newChecklist.commercialSection = mapItems(newChecklist.commercialSection);
    newChecklist.financialSection = mapItems(newChecklist.financialSection);
    newChecklist.complianceSection = mapItems(newChecklist.complianceSection);

    data.checklists.push(newChecklist);
    await writeData(data);
    return newChecklist;
  },

  async updateChecklist(id, updateData) {
    const data = await readData();
    const idx = data.checklists.findIndex(c => c._id === id);
    if (idx === -1) return null;

    data.checklists[idx] = {
      ...data.checklists[idx],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await writeData(data);
    return data.checklists[idx];
  },

  async deleteChecklist(id) {
    const data = await readData();
    data.checklists = data.checklists.filter(c => c._id !== id);
    await writeData(data);
    return true;
  },

  // --- AUDIT LOG API ---
  async createAuditLog(logData) {
    const data = await readData();
    const newLog = {
      _id: `log_${Date.now()}`,
      userId: logData.userId || null,
      userName: logData.userName || 'Anonymous',
      userEmail: logData.userEmail || 'N/A',
      action: logData.action,
      details: logData.details,
      ipAddress: logData.ipAddress || '127.0.0.1',
      createdAt: new Date().toISOString()
    };
    data.auditLogs.push(newLog);
    await writeData(data);
    return newLog;
  },

  async getAuditLogs() {
    const data = await readData();
    return data.auditLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // --- THEME SETTINGS API ---
  async getThemeSetting(userId) {
    const data = await readData();
    const setting = data.themeSettings.find(t => t.user_id === userId);
    if (setting) return setting;
    
    // Default setting
    return {
      _id: `theme_${userId}`,
      user_id: userId,
      selected_theme: 'System',
      updated_at: new Date().toISOString()
    };
  },

  async saveThemeSetting(userId, selectedTheme) {
    const data = await readData();
    if (!data.themeSettings) {
      data.themeSettings = [];
    }
    
    const idx = data.themeSettings.findIndex(t => t.user_id === userId);
    const now = new Date().toISOString();
    
    if (idx !== -1) {
      data.themeSettings[idx].selected_theme = selectedTheme;
      data.themeSettings[idx].updated_at = now;
    } else {
      data.themeSettings.push({
        _id: `theme_${Date.now()}`,
        user_id: userId,
        selected_theme: selectedTheme,
        updated_at: now
      });
    }
    
    await writeData(data);
    return this.getThemeSetting(userId);
  },

  // --- TENDER DOCUMENTS API ---
  async getTenderDocuments(query = {}) {
    const data = await readData();
    let result = [...data.tenderDocuments];
    if (query.tender_id) {
      result = result.filter(d => d.tender_id === query.tender_id);
    }
    // Sort by createdAt desc
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getTenderDocumentById(id) {
    const data = await readData();
    return data.tenderDocuments.find(d => d._id === id) || null;
  },

  async createTenderDocument(docData) {
    const data = await readData();
    const newDoc = {
      _id: `doc_${Date.now()}`,
      ...docData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!data.tenderDocuments) {
      data.tenderDocuments = [];
    }
    data.tenderDocuments.push(newDoc);
    await writeData(data);
    return newDoc;
  },

  async deleteTenderDocument(id) {
    const data = await readData();
    if (!data.tenderDocuments) return false;
    const initialLen = data.tenderDocuments.length;
    data.tenderDocuments = data.tenderDocuments.filter(d => d._id !== id);
    if (data.tenderDocuments.length === initialLen) return false;
    await writeData(data);
    return true;
  }
};
